import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from("dining_session")
      .select(`
        *,
        reservasi(*, customer(*), reservasi_meja(meja(*)), jadwal_sesi(*, sesi_makan(*)))
      `)
      .order("mulai", { ascending: false });

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
      .from("dining_session")
      .select(`
        *,
        reservasi(*, customer(*), reservasi_meja(meja(*)), jadwal_sesi(*, sesi_makan(*)))
      `)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Dining session not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const checkInQR = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // 1. Verify QR token
    const { data: qrData, error: qrError } = await supabase
      .from("reservasi_qr")
      .select("*, reservasi(*, jadwal_sesi(*, sesi_makan(*)), reservasi_meja(meja(*)))")
      .eq("token", token)
      .single();
      
    if (qrError || !qrData) return res.status(404).json({ message: "Invalid QR code" });
    if (qrData.status !== "AKTIF") return res.status(400).json({ message: "QR code has already been used or expired" });

    // 2. Mark QR as DIGUNAKAN
    await supabase.from("reservasi_qr")
      .update({ status: "DIGUNAKAN", digunakan_pada: new Date().toISOString() })
      .eq("id", qrData.id);

    // 3. Mark Reservasi as DATANG
    await supabase.from("reservasi")
      .update({ status: "DATANG" })
      .eq("id", qrData.id_reservasi);

    // 4. Create Dining Session
    const { data: sessionData, error: sessionError } = await supabase
      .from("dining_session")
      .insert({
        id_reservasi: qrData.id_reservasi,
        status: "BERJALAN"
      })
      .select(`
        *,
        reservasi(*, customer(*), reservasi_meja(meja(*)), jadwal_sesi(*, sesi_makan(*)))
      `)
      .single();

    if (sessionError) throw sessionError;

    res.status(201).json(sessionData);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_reservasi } = req.body;

    // 1. Mark Reservasi as DATANG
    await supabase.from("reservasi")
      .update({ status: "DATANG" })
      .eq("id", id_reservasi);

    // 2. Check existing active dining session
    const { data: existing } = await supabase
      .from("dining_session")
      .select("*")
      .eq("id_reservasi", id_reservasi)
      .single();

    if (existing) {
      return res.status(200).json(existing);
    }

    // 3. Create new Dining Session
    const { data: sessionData, error } = await supabase
      .from("dining_session")
      .insert({
        id_reservasi,
        status: "BERJALAN"
      })
      .select(`
        *,
        reservasi(*, customer(*), reservasi_meja(meja(*)), jadwal_sesi(*, sesi_makan(*)))
      `)
      .single();

    if (error) throw error;

    res.status(201).json(sessionData);
  } catch (err) {
    next(err);
  }
};

export const endSession = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("dining_session")
      .update({
        status: "SELESAI",
        selesai: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Dining session not found" });

    // Also update reservasi status to SELESAI
    await supabase.from("reservasi")
      .update({ status: "SELESAI" })
      .eq("id", data.id_reservasi);

    res.json(data);
  } catch (err) {
    next(err);
  }
};
