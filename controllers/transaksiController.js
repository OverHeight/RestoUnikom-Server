import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status, metode_pembayaran } = req.query;
    let query = supabase
      .from("transaksi")
      .select(
        "*, order:id_order(*, reservasi:id_reservasi(*)), creator:created_by(*)",
      )
      .order("id", { ascending: false });

    if (status) query = query.eq("status", status);
    if (metode_pembayaran)
      query = query.eq("metode_pembayaran", metode_pembayaran);

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
      .select(
        "*, order:id_order(*, reservasi:id_reservasi(*)), creator:created_by(*)",
      )
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ message: "Transaction not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByOrder = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("transaksi")
      .select("*, creator:created_by(*)")
      .eq("id_order", req.params.orderId)
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ message: "Transaction not found" });
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
      .select("id")
      .eq("id_order", id_order)
      .single();

    if (existing)
      return res
        .status(409)
        .json({ message: "Transaction already exists for this order" });

    // Server-side calculation
    const { data: orderCourses, error: ocError } = await supabase
      .from("order_course")
      .select("qty, menu(harga)")
      .eq("id_order", id_order);
      
    if (ocError) throw ocError;

    let subtotal = 0;
    orderCourses.forEach(oc => {
      const price = oc.menu?.harga || 0;
      subtotal += price * (oc.qty || 1);
    });

    const tax = subtotal * 0.11; // 11% PB1
    const serviceCharge = subtotal * 0.05; // 5% Service
    const finalTotal = subtotal + tax + serviceCharge;

    const { data, error } = await supabase
      .from("transaksi")
      .insert({
        id_order,
        metode_pembayaran,
        total: finalTotal, // Use server-calculated total
        status: "PENDING",
        created_by,
      })
      .select("*, order:id_order(*), creator:created_by(*)")
      .single();

    if (error) throw error;
    
    // Also update order total
    await supabase.from("orders").update({ total_harga: finalTotal }).eq("id", id_order);

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const processPayment = async (req, res, next) => {
  try {
    const { metode_pembayaran } = req.body;
    const { data, error } = await supabase
      .from("transaksi")
      .update({
        status: "LUNAS",
        metode_pembayaran,
        dibayar_kapan: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select("*, order:id_order(*), creator:created_by(*)")
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ message: "Transaction not found" });
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
    if (!data)
      return res.status(404).json({ message: "Transaction not found" });
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
