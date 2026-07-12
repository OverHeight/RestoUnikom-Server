import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = supabase
      .from("users")
      .select("id, nama, email, role, created_at")
      .order("id", { ascending: true });

    if (role) query = query.eq("role", role);

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
      .from("users")
      .select("id, nama, email, role, created_at")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { nama, email, password, role } = req.body;
    const { data, error } = await supabase
      .from("users")
      .insert({ nama, email, password, role })
      .select("id, nama, email, role, created_at")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { nama, email, role } = req.body;
    const { data, error } = await supabase
      .from("users")
      .update({ nama, email, role })
      .eq("id", req.params.id)
      .select("id, nama, email, role, created_at")
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
