import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from("meja")
      .select("*")
      .order("no_meja", { ascending: true });

    if (status) query = query.eq("status", status);

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
      .from("meja")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Table not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getAvailable = async (req, res, next) => {
  try {
    const { kapasitas } = req.query;
    let query = supabase.from("meja").select("*").eq("status", "KOSONG");

    if (kapasitas) query = query.gte("kapasitas", kapasitas);

    const { data, error } = await query.order("no_meja", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { no_meja, kapasitas } = req.body;
    const { data, error } = await supabase
      .from("meja")
      .insert({ no_meja, kapasitas, status: "KOSONG" })
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
    const { no_meja, kapasitas, status } = req.body;
    const { data, error } = await supabase
      .from("meja")
      .update({ no_meja, kapasitas, status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Table not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from("meja")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Table not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("meja")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
