import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { role, id_user, dibaca } = req.query;
    let query = supabase
      .from("notifikasi")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (role) {
      query = query.or(`role.eq.${role},role.is.null`);
    }
    if (id_user) {
      query = query.eq("id_user", id_user);
    }
    if (dibaca !== undefined) {
      query = query.eq("dibaca", dibaca === "true");
    }

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

export const create = async (req, res, next) => {
  try {
    const { id_user, role, judul, pesan, tipe } = req.body;
    const { data, error } = await supabase
      .from("notifikasi")
      .insert({
        id_user: id_user || null,
        role: role || null,
        judul,
        pesan,
        tipe: tipe || 'INFO',
        dibaca: false
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("notifikasi")
      .update({ dibaca: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const { role } = req.body;
    let query = supabase.from("notifikasi").update({ dibaca: true }).eq("dibaca", false);
    if (role) query = query.or(`role.eq.${role},role.is.null`);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};
