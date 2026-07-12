import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status, id_sesi_makan, id_customer } = req.query;
    let query = supabase
      .from("reservasi")
      .select(
        "*, customer:customer_id(*), sesi_makan:sesi_makan_id(*), meja:meja_id(*)",
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (id_sesi_makan) query = query.eq("id_sesi_makan", id_sesi_makan);
    if (id_customer) query = query.eq("id_customer", id_customer);

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
      .from("reservasi")
      .select(
        "*, customer:customer_id(*), sesi_makan:sesi_makan_id(*), meja:meja_id(*), orders(*)",
      )
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ message: "Reservation not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByCustomer = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("reservasi")
      .select("*, sesi_makan:sesi_makan_id(*), meja:meja_id(*)")
      .eq("id_customer", req.params.customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const {
      id_customer,
      jumlah_tamu,
      id_sesi_makan,
      id_meja,
      pilihan_menu,
      created_by,
    } = req.body;

    const { data: meja, error: mejaError } = await supabase
      .from("meja")
      .select("kapasitas, status")
      .eq("id", id_meja)
      .single();

    if (mejaError) throw mejaError;
    if (!meja) return res.status(400).json({ message: "Table not found" });
    if (meja.kapasitas < jumlah_tamu)
      return res.status(400).json({ message: "Table capacity insufficient" });

    const { data: sesi, error: sesiError } = await supabase
      .from("sesi_makan")
      .select("kapasitas")
      .eq("id", id_sesi_makan)
      .single();

    if (sesiError) throw sesiError;

    const { count, error: countError } = await supabase
      .from("reservasi")
      .select("*", { count: "exact", head: true })
      .eq("id_sesi_makan", id_sesi_makan)
      .in("status", ["MENUNGGU", "DITERIMA"]);

    if (countError) throw countError;
    if (count >= sesi.kapasitas)
      return res.status(400).json({ message: "Session capacity full" });

    const { data, error } = await supabase
      .from("reservasi")
      .insert({
        id_customer,
        jumlah_tamu,
        id_sesi_makan,
        id_meja,
        pilihan_menu,
        status: "MENUNGGU",
        created_by,
      })
      .select(
        "*, customer:customer_id(*), sesi_makan:sesi_makan_id(*), meja:meja_id(*)",
      )
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
      .from("reservasi")
      .update({ status })
      .eq("id", req.params.id)
      .select(
        "*, customer:customer_id(*), sesi_makan:sesi_makan_id(*), meja:meja_id(*)",
      )
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ message: "Reservation not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { jumlah_tamu, id_sesi_makan, id_meja, pilihan_menu } = req.body;
    const { data, error } = await supabase
      .from("reservasi")
      .update({ jumlah_tamu, id_sesi_makan, id_meja, pilihan_menu })
      .eq("id", req.params.id)
      .select(
        "*, customer:customer_id(*), sesi_makan:sesi_makan_id(*), meja:meja_id(*)",
      )
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ message: "Reservation not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("reservasi")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
