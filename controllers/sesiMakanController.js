import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { aktif } = req.query;
    let query = supabase
      .from("sesi_makan")
      .select("*")
      .order("waktu_mulai", { ascending: true });

    if (aktif !== undefined) query = query.eq("aktif", aktif === "true");

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
      .from("sesi_makan")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Sesi Makan not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { nama, waktu_mulai, waktu_selesai, kapasitas } = req.body;
    const { data, error } = await supabase
      .from("sesi_makan")
      .insert({ nama, waktu_mulai, waktu_selesai, kapasitas, aktif: true })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { nama, waktu_mulai, waktu_selesai, kapasitas, aktif } = req.body;
    const { data, error } = await supabase
      .from("sesi_makan")
      .update({ nama, waktu_mulai, waktu_selesai, kapasitas, aktif })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Sesi Makan not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const toggleStatus = async (req, res, next) => {
  try {
    const { data: current } = await supabase
      .from("sesi_makan")
      .select("aktif")
      .eq("id", req.params.id)
      .single();

    const { data, error } = await supabase
      .from("sesi_makan")
      .update({ aktif: !current?.aktif })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("sesi_makan")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
