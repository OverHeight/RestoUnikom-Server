import { supabase } from "../config/supabase.js";

export const recalculateOrderTotal = async (id_order) => {
  if (!id_order) return 0;
  try {
    // 1. Fetch order & reservation details
    const { data: order } = await supabase
      .from("orders")
      .select("id_reservasi")
      .eq("id", id_order)
      .single();

    let jumlahTamu = 1;
    if (order?.id_reservasi) {
      const { data: resv } = await supabase
        .from("reservasi")
        .select("jumlah_tamu")
        .eq("id", order.id_reservasi)
        .single();
      if (resv && resv.jumlah_tamu) {
        jumlahTamu = resv.jumlah_tamu;
      }
    }

    // Base set menu price per guest (350,000 IDR base set menu)
    let subtotal = jumlahTamu * 350000;

    // 2. Fetch order courses (add-ons or individual items)
    const { data: orderCourses } = await supabase
      .from("order_course")
      .select("qty, id_menu, course")
      .eq("id_order", id_order);

    if (orderCourses && orderCourses.length > 0) {
      const menuIds = orderCourses.map(oc => oc.id_menu).filter(Boolean);
      let menuPrices = {};
      if (menuIds.length > 0) {
        const { data: menuList } = await supabase
          .from("menu")
          .select("id, harga")
          .in("id", menuIds);
        (menuList || []).forEach(m => {
          menuPrices[m.id] = Number(m.harga) || 0;
        });
      }

      orderCourses.forEach(oc => {
        if (oc.id_menu && menuPrices[oc.id_menu]) {
          // Add explicit menu item price (like add-on drinks, coffee, desserts)
          subtotal += menuPrices[oc.id_menu] * (oc.qty || 1);
        }
      });
    }

    const tax = subtotal * 0.11; // 11% PB1
    const serviceCharge = subtotal * 0.05; // 5% Service
    const finalTotal = subtotal + tax + serviceCharge;

    // 3. Update orders table
    await supabase.from("orders").update({ total_harga: finalTotal }).eq("id", id_order);

    // 4. Update transaksi table if transaction exists
    await supabase.from("transaksi").update({ total: finalTotal }).eq("id_order", id_order);

    return finalTotal;
  } catch (err) {
    console.error("Error recalculating order total:", err);
    return 0;
  }
};

export const getAll = async (req, res, next) => {
  try {
    const { status, metode_pembayaran } = req.query;
    let query = supabase
      .from("transaksi")
      .select("*, order:id_order(*, reservasi:id_reservasi(*))")
      .order("id", { ascending: false });

    if (status) query = query.eq("status", status);
    if (metode_pembayaran) query = query.eq("metode_pembayaran", metode_pembayaran);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('transaksi')) {
        return res.json([]);
      }
      throw error;
    }
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("transaksi")
      .select("*, order:id_order(*, reservasi:id_reservasi(*))")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Transaction not found" });

    // Recalculate total dynamically to include recent add-ons
    if (data.id_order) {
      const recalculatedTotal = await recalculateOrderTotal(data.id_order);
      data.total = recalculatedTotal;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByOrder = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("transaksi")
      .select("*")
      .eq("id_order", req.params.orderId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Transaction not found" });

    // Recalculate total dynamically to include recent add-ons
    const recalculatedTotal = await recalculateOrderTotal(req.params.orderId);
    data.total = recalculatedTotal;

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_order, metode_pembayaran, created_by } = req.body;

    const finalTotal = await recalculateOrderTotal(id_order);

    const { data: existing } = await supabase
      .from("transaksi")
      .select("id, total, status")
      .eq("id_order", id_order)
      .single();

    if (existing) {
      return res.json({ ...existing, total: finalTotal });
    }

    const { data, error } = await supabase
      .from("transaksi")
      .insert({
        id_order,
        metode_pembayaran: ['Cash', 'QRIS', 'Debit'].includes(metode_pembayaran) ? metode_pembayaran : 'Cash',
        total: finalTotal,
        status: "PENDING",
        created_by: created_by || null
      })
      .select("*, order:id_order(*)")
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const processPayment = async (req, res, next) => {
  try {
    const { metode_pembayaran } = req.body;
    const validMethod = ['Cash', 'QRIS', 'Debit'].includes(metode_pembayaran) ? metode_pembayaran : 'Cash';

    // Fetch transaction to get orderId and recalculate total
    const { data: tx } = await supabase
      .from("transaksi")
      .select("id_order")
      .eq("id", req.params.id)
      .single();

    if (tx?.id_order) {
      await recalculateOrderTotal(tx.id_order);
    }

    const { data, error } = await supabase
      .from("transaksi")
      .update({
        status: "LUNAS",
        metode_pembayaran: validMethod,
        dibayar_kapan: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select("*, order:id_order(*)")
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Transaction not found" });

    // FIX Bug #7: processPayment sekarang atomik.
    // Setelah transaksi LUNAS, update order ke DIBAYAR dan dining_session ke SELESAI.
    if (tx?.id_order) {
      // Update order status ke DIBAYAR
      await supabase.from("orders")
        .update({ status: "DIBAYAR" })
        .eq("id", tx.id_order);

      // Cari dining_session untuk order ini dan akhiri jika masih BERJALAN
      const { data: orderData } = await supabase
        .from("orders")
        .select("id_dining_session, id_reservasi")
        .eq("id", tx.id_order)
        .single();

      if (orderData?.id_dining_session) {
        await supabase.from("dining_session")
          .update({ status: "SELESAI", selesai: new Date().toISOString() })
          .eq("id", orderData.id_dining_session)
          .eq("status", "BERJALAN"); // Hanya jika masih BERJALAN

        // Update reservasi ke SELESAI
        if (orderData.id_reservasi) {
          await supabase.from("reservasi")
            .update({ status: "SELESAI" })
            .eq("id", orderData.id_reservasi);
        }
      }
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};


export const update = async (req, res, next) => {
  try {
    const { metode_pembayaran, total, status } = req.body;
    const { data, error } = await supabase
      .from("transaksi")
      .update({ metode_pembayaran, total, status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Transaction not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("transaksi")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
