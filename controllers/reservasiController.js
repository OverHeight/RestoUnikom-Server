import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status, id_jadwal_sesi, id_customer } = req.query;
    let query = supabase
      .from("reservasi")
      .select(`
        *,
        customer(*),
        jadwal_sesi(*, sesi_makan(*)),
        reservasi_meja(meja(*)),
        reservasi_qr(token, status)
      `)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (id_jadwal_sesi) query = query.eq("id_jadwal_sesi", id_jadwal_sesi);
    if (id_customer) query = query.eq("id_customer", id_customer);

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
      .from("reservasi")
      .select(`
        *,
        customer(*),
        jadwal_sesi(*, sesi_makan(*)),
        reservasi_meja(meja(*)),
        reservasi_qr(token, status),
        dining_session(*)
      `)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Reservation not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getByCustomer = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("reservasi")
      .select(`
        *,
        jadwal_sesi(*, sesi_makan(*)),
        reservasi_meja(meja(*)),
        reservasi_qr(token, status)
      `)
      .eq("id_customer", req.params.customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_customer, nama, nama_customer, no_telp, no_telp_customer, email, jumlah_tamu, id_jadwal_sesi, id_meja, created_by } = req.body;

    const finalNama = nama || nama_customer;
    const finalPhone = no_telp || no_telp_customer;
    let finalCustomerId = id_customer;

    // 0. Customer Reuse / Creation Logic
    if (!finalCustomerId) {
      if (!finalNama || !finalPhone) {
        return res.status(400).json({ message: "nama and no_telp are required if id_customer is not provided" });
      }

      // Check if customer exists by phone number
      const { data: existingCustomer } = await supabase
        .from("customer")
        .select("id")
        .eq("no_telp", finalPhone)
        .single();

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from("customer")
          .insert({ nama: finalNama, no_telp: finalPhone, email: email || null })
          .select("id")
          .single();
          
        if (createError) throw createError;
        finalCustomerId = newCustomer.id;
      }
    }

    // 1. Verify Meja (Optional)
    if (id_meja) {
      const { data: meja, error: mejaError } = await supabase
        .from("meja")
        .select("kapasitas")
        .eq("id", id_meja)
        .single();
      if (mejaError) throw mejaError;
      if (!meja) return res.status(400).json({ message: "Table not found" });
    }
    
    // 2. Insert Reservasi
    const { data: reservasi, error } = await supabase
      .from("reservasi")
      .insert({
        id_customer: finalCustomerId,
        jumlah_tamu,
        id_jadwal_sesi,
        status: "MENUNGGU",
        created_by,
      })
      .select()
      .single();
    if (error) throw error;

    // 3. Insert Reservasi_Meja (if table provided)
    if (id_meja) {
      const { error: rmError } = await supabase
        .from("reservasi_meja")
        .insert({
          id_reservasi: reservasi.id,
          id_meja
        });
      if (rmError) throw rmError;
    }

    // 4. Generate QR
    const { error: qrError } = await supabase
      .from("reservasi_qr")
      .insert({
        id_reservasi: reservasi.id
      });
    if (qrError) throw qrError;

    // Fetch complete data to return
    const { data: completeData } = await supabase
      .from("reservasi")
      .select(`
        *,
        customer(*),
        jadwal_sesi(*, sesi_makan(*)),
        reservasi_meja(meja(*)),
        reservasi_qr(token, status)
      `)
      .eq("id", reservasi.id)
      .single();

    res.status(201).json(completeData);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from("reservasi")
      .update({ status })
      .eq("id", req.params.id)
      .select(`
        *,
        customer(*),
        jadwal_sesi(*, sesi_makan(*)),
        reservasi_meja(meja(*)),
        reservasi_qr(token, status)
      `)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Reservation not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { jumlah_tamu, id_meja } = req.body;
    
    if (jumlah_tamu) {
      const { error } = await supabase
        .from("reservasi")
        .update({ jumlah_tamu })
        .eq("id", req.params.id);
      if (error) throw error;
    }
    
    if (id_meja) {
      // Check if existing
      const { data: existingRm } = await supabase.from("reservasi_meja").select("*").eq("id_reservasi", req.params.id);
      if (existingRm && existingRm.length > 0) {
        await supabase.from("reservasi_meja").update({ id_meja }).eq("id_reservasi", req.params.id);
      } else {
        await supabase.from("reservasi_meja").insert({ id_reservasi: req.params.id, id_meja });
      }
    }
    
    const { data: completeData, error: fetchErr } = await supabase
      .from("reservasi")
      .select(`
        *,
        customer(*),
        jadwal_sesi(*, sesi_makan(*)),
        reservasi_meja(meja(*)),
        reservasi_qr(token, status)
      `)
      .eq("id", req.params.id)
      .single();
      
    if (fetchErr) throw fetchErr;
    res.json(completeData);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    // Supabase cascade delete handles related tables if configured, otherwise manual delete needed.
    // Ensure relations are deleted first.
    await supabase.from("reservasi_qr").delete().eq("id_reservasi", req.params.id);
    await supabase.from("reservasi_meja").delete().eq("id_reservasi", req.params.id);
    
    const { error } = await supabase
      .from("reservasi")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
