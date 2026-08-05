import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { tanggal, status } = req.query;
    let query = supabase
      .from("jadwal_sesi")
      .select("*, sesi_makan(*)")
      .order('id', { ascending: true });

    if (tanggal) query = query.eq("tanggal", tanggal);
    if (status !== undefined) query = query.eq("status", status === "true");

    let { data, error } = await query;
    if (error) throw error;

    // Auto-generate logic for a specific date if no sessions exist
    if (tanggal && data.length === 0) {
       // Get static active sessions
       const { data: staticSessions, error: sessErr } = await supabase
         .from('sesi_makan')
         .select('*')
         .eq('aktif', true)
         .order('waktu_mulai', { ascending: true });
         
       if (!sessErr && staticSessions.length > 0) {
          const inserts = staticSessions.map(s => ({
             id_sesi_makan: s.id,
             tanggal,
             status: true
          }));
          
          await supabase.from('jadwal_sesi').insert(inserts);
          
          // Re-query
          const { data: newData, error: newErr } = await supabase
            .from("jadwal_sesi")
            .select("*, sesi_makan(*)")
            .eq("tanggal", tanggal)
            .order('id', { ascending: true });
            
          if (!newErr) data = newData;
       }
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("jadwal_sesi")
      .select("*, sesi_makan(*)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Jadwal Sesi not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_sesi_makan, tanggal } = req.body;
    const { data, error } = await supabase
      .from("jadwal_sesi")
      .insert({ id_sesi_makan, tanggal, status: true })
      .select("*, sesi_makan(*)")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const toggleStatus = async (req, res, next) => {
  try {
    const { data: current } = await supabase
      .from("jadwal_sesi")
      .select("status")
      .eq("id", req.params.id)
      .single();

    const { data, error } = await supabase
      .from("jadwal_sesi")
      .update({ status: !current?.status })
      .eq("id", req.params.id)
      .select("*, sesi_makan(*)")
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
      .from("jadwal_sesi")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
