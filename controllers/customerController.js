import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("customer")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("customer")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Customer not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByPhone = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("customer")
      .select("*")
      .eq("no_telp", req.params.phone)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Customer not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { nama, email, no_telp } = req.body;
    const { data, error } = await supabase
      .from("customer")
      .insert({ nama, email, no_telp })
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
    const { nama, email, no_telp } = req.body;
    const { data, error } = await supabase
      .from("customer")
      .update({ nama, email, no_telp })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Customer not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const incrementVisit = async (req, res, next) => {
  try {
    const { data: current } = await supabase
      .from("customer")
      .select("kali_kedatangan")
      .eq("id", req.params.id)
      .single();

    const { data, error } = await supabase
      .from("customer")
      .update({ kali_kedatangan: (current?.kali_kedatangan || 0) + 1 })
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
      .from("customer")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
