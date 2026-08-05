import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { id_bahan } = req.query;
    let query = supabase
      .from("stok_log")
      .select("*, bahan(nama)")
      .order("created_at", { ascending: false });

    if (id_bahan) {
      query = query.eq("id_bahan", id_bahan);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { id_bahan, jenis_mutasi, jumlah, keterangan, created_by } = req.body;
    
    // jenis_mutasi: 'IN', 'OUT', 'ADJUSTMENT'

    if (!id_bahan || !jenis_mutasi || jumlah === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get current stock
    const { data: currentBahan, error: bahanError } = await supabase
      .from("bahan")
      .select("stok")
      .eq("id", id_bahan)
      .single();

    if (bahanError || !currentBahan) {
      return res.status(404).json({ message: "Bahan not found" });
    }

    const currentStock = currentBahan.stok;
    let newStock = currentStock;

    let tipeEnum = 'KOREKSI';
    if (jenis_mutasi === 'IN' || jenis_mutasi === 'MASUK') {
      newStock += Math.abs(jumlah);
      tipeEnum = 'MASUK';
    } else if (jenis_mutasi === 'OUT' || jenis_mutasi === 'KELUAR') {
      newStock -= Math.abs(jumlah);
      tipeEnum = 'KELUAR';
    } else if (jenis_mutasi === 'ADJUSTMENT' || jenis_mutasi === 'KOREKSI') {
      newStock += jumlah;
      tipeEnum = 'KOREKSI';
    }

    if (newStock < 0) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // 1. Insert Log
    const { data: log, error: logError } = await supabase
      .from("stok_log")
      .insert({
        id_bahan,
        tipe: tipeEnum,
        jumlah,
        keterangan,
        created_by
      })
      .select()
      .single();

    if (logError) throw logError;

    // 2. Update Stock
    const { error: updateError } = await supabase
      .from("bahan")
      .update({ stok: newStock })
      .eq("id", id_bahan);

    if (updateError) throw updateError;

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};
