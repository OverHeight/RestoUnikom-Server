import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { kategori, aktif } = req.query;
    let query = supabase
      .from("menu")
      .select("*")
      .order("nama", { ascending: true });

    if (kategori) query = query.eq("kategori", kategori);
    if (aktif !== undefined) query = query.eq("aktif", aktif === "true");

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return res.json([]);
      }
      throw error;
    }
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("menu")
      .select("*, resep(*, bahan(*))")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Menu not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByCategory = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .eq("kategori", req.params.kategori)
      .eq("aktif", true)
      .order("nama", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { nama, kategori, harga } = req.body;
    const { data, error } = await supabase
      .from("menu")
      .insert({ nama, kategori, harga, aktif: true })
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
    const { nama, kategori, harga, aktif } = req.body;
    const { data, error } = await supabase
      .from("menu")
      .update({ nama, kategori, harga, aktif })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Menu not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const toggleActive = async (req, res, next) => {
  try {
    const { data: current } = await supabase
      .from("menu")
      .select("aktif")
      .eq("id", req.params.id)
      .single();

    const { data, error } = await supabase
      .from("menu")
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
      .from("menu")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
