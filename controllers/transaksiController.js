import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status, metode_pembayaran } = req.query;
    let query = supabase
      .from("transaksi")
      .select(
        "*, order:order_id(*, reservasi:reservasi_id(*)), creator:created_by(*)",
      )
      .order("id", { ascending: false });

    if (status) query = query.eq("status", status);
    if (metode_pembayaran)
      query = query.eq("metode_pembayaran", metode_pembayaran);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("transaksi")
      .select(
        "*, order:order_id(*, reservasi:reservasi_id(*)), creator:created_by(*)",
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
    const { id_order, metode_pembayaran, total, created_by } = req.body;

    const { data: existing } = await supabase
      .from("transaksi")
      .select("id")
      .eq("id_order", id_order)
      .single();

    if (existing)
      return res
        .status(409)
        .json({ message: "Transaction already exists for this order" });

    const { data, error } = await supabase
      .from("transaksi")
      .insert({
        id_order,
        metode_pembayaran,
        total,
        status: "PENDING",
        created_by,
      })
      .select("*, order:order_id(*), creator:created_by(*)")
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
    const { data, error } = await supabase
      .from("transaksi")
      .update({
        status: "LUNAS",
        metode_pembayaran,
        dibayar_kapan: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select("*, order:order_id(*), creator:created_by(*)")
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
