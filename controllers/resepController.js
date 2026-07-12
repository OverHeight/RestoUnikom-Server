import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { id_menu, id_bahan } = req.query;
    let query = supabase
      .from("resep")
      .select("*, menu:menu_id(*), bahan:bahan_id(*)")
      .order("id", { ascending: true });

    if (id_menu) query = query.eq("id_menu", id_menu);
    if (id_bahan) query = query.eq("id_bahan", id_bahan);

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
      .from("resep")
      .select("*, menu:menu_id(*), bahan:bahan_id(*)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Recipe not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_menu, id_bahan, jumlah } = req.body;
    const { data, error } = await supabase
      .from("resep")
      .insert({ id_menu, id_bahan, jumlah })
      .select("*, menu:menu_id(*), bahan:bahan_id(*)")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id_menu, id_bahan, jumlah } = req.body;
    const { data, error } = await supabase
      .from("resep")
      .update({ id_menu, id_bahan, jumlah })
      .eq("id", req.params.id)
      .select("*, menu:menu_id(*), bahan:bahan_id(*)")
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Recipe not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("resep")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
