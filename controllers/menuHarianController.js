import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { tanggal } = req.query;
    let query = supabase
      .from("menu_harian")
      .select(`
        *,
        menu_harian_detail(*, menu(*))
      `)
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
      .select(`
        *,
        menu_harian_detail(*, menu(*))
      `)
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
      .select(`
        *,
        menu_harian_detail(*, menu(*))
      `)
      .eq("tanggal", req.params.date)
      .single();

    if (error && error.code !== "PGRST116") throw error; // Handle single() zero rows
    if (!data) return res.status(404).json({ message: "Daily menu not found for this date" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const {
      tanggal,
      nama_set,
      created_by,
      details // Array of { id_menu, course }
    } = req.body;

    // 1. Insert header
    const { data: menuHarian, error: mhError } = await supabase
      .from("menu_harian")
      .insert({ tanggal, nama_set, created_by })
      .select()
      .single();
    if (mhError) throw mhError;

    // 2. Insert details
    if (details && details.length > 0) {
      const detailsToInsert = details.map(d => ({
        id_menu_harian: menuHarian.id,
        id_menu: d.id_menu,
        course: d.course
      }));
      const { error: dError } = await supabase
        .from("menu_harian_detail")
        .insert(detailsToInsert);
      if (dError) throw dError;
    }

    const { data: completeData } = await supabase
      .from("menu_harian")
      .select("*, menu_harian_detail(*, menu(*))")
      .eq("id", menuHarian.id)
      .single();

    res.status(201).json(completeData);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { tanggal, nama_set, aktif, details } = req.body;
    
    const { data: menuHarian, error: mhError } = await supabase
      .from("menu_harian")
      .update({ tanggal, nama_set, aktif })
      .eq("id", req.params.id)
      .select()
      .single();

    if (mhError) throw mhError;

    if (details) {
      await supabase.from("menu_harian_detail").delete().eq("id_menu_harian", menuHarian.id);
      if (details.length > 0) {
        const detailsToInsert = details.map(d => ({
          id_menu_harian: menuHarian.id,
          id_menu: d.id_menu,
          course: d.course
        }));
        await supabase.from("menu_harian_detail").insert(detailsToInsert);
      }
    }

    const { data: completeData } = await supabase
      .from("menu_harian")
      .select("*, menu_harian_detail(*, menu(*))")
      .eq("id", menuHarian.id)
      .single();

    res.json(completeData);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await supabase.from("menu_harian_detail").delete().eq("id_menu_harian", req.params.id);
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
