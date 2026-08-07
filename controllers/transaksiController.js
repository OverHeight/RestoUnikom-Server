import { supabase } from "../config/supabase.js";

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
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_order, metode_pembayaran, created_by } = req.body;

    const { data: existing } = await supabase
      .from("transaksi")
      .select("id, total, status")
      .eq("id_order", id_order)
      .single();

    if (existing) {
      return res.json(existing);
    }

    // Safe separate fetch to avoid PGRST200 schema cache relationship errors
    const { data: orderCourses, error: ocError } = await supabase
      .from("order_course")
      .select("qty, id_menu")
      .eq("id_order", id_order);
      
    if (ocError && ocError.code !== 'PGRST116') {
      console.error("Warning reading order_course:", ocError.message);
    }

    let subtotal = 0;
    if (orderCourses && orderCourses.length > 0) {
      const menuIds = orderCourses.map(oc => oc.id_menu).filter(Boolean);
      let menuPrices = {};
      
      if (menuIds.length > 0) {
        const { data: menuList } = await supabase.from("menu").select("id, harga").in("id", menuIds);
        (menuList || []).forEach(m => { menuPrices[m.id] = Number(m.harga) || 0; });
      }

      orderCourses.forEach(oc => {
        const price = (oc.id_menu && menuPrices[oc.id_menu]) ? menuPrices[oc.id_menu] : 150000;
        subtotal += price * (oc.qty || 1);
      });
    } else {
      subtotal = 350000; // Fine dining set menu base price
    }

    const tax = subtotal * 0.11; // 11% PB1
    const serviceCharge = subtotal * 0.05; // 5% Service
    const finalTotal = subtotal + tax + serviceCharge;

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
    
    // Update order total
    try {
      await supabase.from("orders").update({ total_harga: finalTotal }).eq("id", id_order);
    } catch(e) { console.error(e); }

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const processPayment = async (req, res, next) => {
  try {
    const { metode_pembayaran } = req.body;
    const validMethod = ['Cash', 'QRIS', 'Debit'].includes(metode_pembayaran) ? metode_pembayaran : 'Cash';

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
