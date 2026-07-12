import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status, id_reservasi } = req.query;
    let query = supabase
      .from("orders")
      .select("*, reservasi:reservasi_id(*), order_course(*)")
      .order("id", { ascending: false });

    if (status) query = query.eq("status", status);
    if (id_reservasi) query = query.eq("id_reservasi", id_reservasi);

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
      .from("orders")
      .select("*, reservasi:reservasi_id(*), order_course(*), transaksi(*)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_reservasi } = req.body;

    const { data: reservasi } = await supabase
      .from("reservasi")
      .select("status")
      .eq("id", id_reservasi)
      .single();

    if (!reservasi || reservasi.status !== "DITERIMA") {
      return res
        .status(400)
        .json({ message: "Reservation must be accepted first" });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({ id_reservasi, status: "MENUNGGU", total_harga: 0 })
      .select("*, reservasi:reservasi_id(*)")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateTotal = async (req, res, next) => {
  try {
    const { total_harga } = req.body;
    const { data, error } = await supabase
      .from("orders")
      .update({ total_harga })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Order Course
export const getCourses = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("order_course")
      .select("*")
      .eq("id_order", req.params.orderId)
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const addCourse = async (req, res, next) => {
  try {
    const { course } = req.body;
    const { data, error } = await supabase
      .from("order_course")
      .insert({ id_order: req.params.orderId, course, status: "MENUNGGU" })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updates = { status };
    if (status === "SELESAI") updates.served_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("order_course")
      .update(updates)
      .eq("id", req.params.courseId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Course not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
