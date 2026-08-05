import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { aktif } = req.query;
    let query = supabase
      .from("meja")
      .select("*")
      .order("no_meja", { ascending: true });

    if (aktif !== undefined) query = query.eq("aktif", aktif === "true");

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getAvailable = async (req, res, next) => {
  try {
    const { id_jadwal_sesi } = req.query;
    if (!id_jadwal_sesi) {
      return res.status(400).json({ message: "id_jadwal_sesi is required" });
    }

    // 1. Get all active tables
    const { data: allTables, error: tableError } = await supabase
      .from("meja")
      .select("*")
      .eq("aktif", true)
      .order("no_meja", { ascending: true });
    
    if (tableError) throw tableError;

    // 2. Get reservations for this schedule that are NOT cancelled or done
    // 'SELESAI', 'BATAL' should free up the table. 
    // MENUNGGU, DATANG mean the table is occupied/reserved.
    const { data: reservations, error: resError } = await supabase
      .from("reservasi")
      .select(`id, reservasi_meja(id_meja)`)
      .eq("id_jadwal_sesi", id_jadwal_sesi)
      .in("status", ["MENUNGGU", "DATANG"]);

    if (resError) throw resError;

    // 3. Extract booked table IDs
    const bookedTableIds = new Set();
    reservations.forEach(r => {
      r.reservasi_meja?.forEach(rm => {
        bookedTableIds.add(rm.id_meja);
      });
    });

    // 4. Filter available tables
    const availableTables = allTables.filter(t => !bookedTableIds.has(t.id));

    res.json(availableTables);
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

export const create = async (req, res, next) => {
  try {
    const { no_meja, kapasitas, catatan } = req.body;
    const { data, error } = await supabase
      .from("meja")
      .insert({ no_meja, kapasitas, catatan, aktif: true })
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
    const { no_meja, kapasitas, aktif, catatan, status } = req.body;
    const updateData = {};
    if (no_meja !== undefined) updateData.no_meja = no_meja;
    if (kapasitas !== undefined) updateData.kapasitas = kapasitas;
    if (catatan !== undefined) updateData.catatan = catatan;

    if (aktif !== undefined) {
      updateData.aktif = aktif;
    } else if (status !== undefined) {
      // Map status string to active boolean safely
      updateData.aktif = status === "available" || status === "KOSONG" || status === "CLEANED" || status === "open";
    }

    const { data, error } = await supabase
      .from("meja")
      .update(updateData)
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: "Table not found" });
    res.json(data[0]);
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
