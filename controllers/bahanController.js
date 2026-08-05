import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { low_stock } = req.query;
    let query = supabase
      .from("bahan")
      .select("*")
      .order("nama", { ascending: true });

    if (low_stock === "true") {
      query = query.lte("stok", supabase.raw("stok_minimal"));
    }

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
      .from("bahan")
      .select("*, resep(*, menu(*))")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Ingredient not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { nama, stok, unit, stok_minimal } = req.body;
    const { data, error } = await supabase
      .from("bahan")
      .insert({ nama, stok, unit, stok_minimal })
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
    const { nama, stok, unit, stok_minimal } = req.body;
    const { data, error } = await supabase
      .from("bahan")
      .update({ nama, stok, unit, stok_minimal })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Ingredient not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// adjustStock has been removed in accordance with the backend architecture spec.
// All stock modifications must go through inventoryLogController (stok_log).

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("bahan")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
