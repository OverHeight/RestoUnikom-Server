import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { tanggal } = req.query;
    let query = supabase
      .from("menu_harian")
      .select(
        "*, appetizer:appetizer_id(*), menu_a:menu_a_id(*), menu_b:menu_b_id(*), dessert:dessert_id(*), creator:created_by(*)",
      )
      .order("tanggal", { ascending: false });

    if (tanggal) query = query.eq("tanggal", tanggal);

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
      .from("menu_harian")
      .select(
        "*, appetizer:appetizer_id(*), menu_a:menu_a_id(*), menu_b:menu_b_id(*), dessert:dessert_id(*), creator:created_by(*)",
      )
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Daily menu not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByDate = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("menu_harian")
      .select(
        "*, appetizer:appetizer_id(*), menu_a:menu_a_id(*), menu_b:menu_b_id(*), dessert:dessert_id(*)",
      )
      .eq("tanggal", req.params.date)
      .single();

    if (error) throw error;
    if (!data)
      return res
        .status(404)
        .json({ message: "Daily menu not found for this date" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const {
      tanggal,
      appetizer_id,
      menu_a_id,
      menu_b_id,
      dessert_id,
      created_by,
    } = req.body;
    const { data, error } = await supabase
      .from("menu_harian")
      .insert({
        tanggal,
        appetizer_id,
        menu_a_id,
        menu_b_id,
        dessert_id,
        created_by,
      })
      .select(
        "*, appetizer:appetizer_id(*), menu_a:menu_a_id(*), menu_b:menu_b_id(*), dessert:dessert_id(*)",
      )
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const {
      tanggal,
      appetizer_id,
      menu_a_id,
      menu_b_id,
      dessert_id,
      created_by,
    } = req.body;
    const { data, error } = await supabase
      .from("menu_harian")
      .update({
        tanggal,
        appetizer_id,
        menu_a_id,
        menu_b_id,
        dessert_id,
        created_by,
      })
      .eq("id", req.params.id)
      .select(
        "*, appetizer:appetizer_id(*), menu_a:menu_a_id(*), menu_b:menu_b_id(*), dessert:dessert_id(*)",
      )
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Daily menu not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("menu_harian")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
