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
    const { id_customer, nama, nama_customer, no_telp, no_telp_customer, email, jumlah_tamu, id_jadwal_sesi, id_meja, created_by, pilihan_menu } = req.body;

    const finalNama = nama || nama_customer;
    const finalPhone = no_telp || no_telp_customer;
    let finalCustomerId = id_customer;

    if (!finalCustomerId) {
      if (!finalNama || !finalPhone) {
        return res.status(400).json({ message: "nama and no_telp are required if id_customer is not provided" });
      }

      const { data: existingCustomer } = await supabase
        .from("customer")
        .select("id")
        .eq("no_telp", finalPhone)
        .single();

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: createError } = await supabase
          .from("customer")
          .insert({ nama: finalNama, no_telp: finalPhone, email: email || null })
          .select("id")
          .single();

        if (createError) throw createError;
        finalCustomerId = newCustomer.id;
      }
    }

    if (id_meja) {
      const { data: meja, error: mejaError } = await supabase
        .from("meja")
        .select("kapasitas")
        .eq("id", id_meja)
        .single();
      if (mejaError) throw mejaError;
      if (!meja) return res.status(400).json({ message: "Table not found" });
    }

    const { data: reservasi, error } = await supabase
      .from("reservasi")
      .insert({
        id_customer: finalCustomerId,
        jumlah_tamu,
        id_jadwal_sesi,
        status: "MENUNGGU",
        created_by,
        pilihan_menu: pilihan_menu || "Set Menu A",   // Save customer's menu choice
      })
      .select()
      .single();
    if (error) throw error;

    if (id_meja) {
      const { error: rmError } = await supabase
        .from("reservasi_meja")
        .insert({
          id_reservasi: reservasi.id,
          id_meja
        });
      if (rmError) throw rmError;
    }

    const { error: qrError } = await supabase
      .from("reservasi_qr")
      .insert({
        id_reservasi: reservasi.id
      });
    if (qrError) throw qrError;

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

    // EDGE CASE GUARD: Prevent cancelling reservations once guest has arrived or completed dining
    if (status === "BATAL") {
      const { data: existing } = await supabase
        .from("reservasi")
        .select("status")
        .eq("id", req.params.id)
        .single();

      if (existing && ["DATANG", "SELESAI"].includes(existing.status)) {
        return res.status(400).json({
          message: "Reservasi yang sudah DATANG atau SELESAI tidak dapat dibatalkan (Cannot cancel arrived/finished reservation)."
        });
      }

      // FIX Bug #3: 'BATAL' tidak ada di order_status_enum ('MENUNGGU','DISAJIKAN','SELESAI','DIBAYAR')
      // maupun pembayaran_status_enum ('PENDING','LUNAS').
      // Jika reservasi dibatal sebelum check-in, orders yang belum dimulai cukup dimark SELESAI
      // agar tidak muncul di queue. Transaksi PENDING dibiarkan (bisa di-reconcile manual).
      const { data: orderList } = await supabase.from("orders").select("id, status").eq("id_reservasi", req.params.id);
      if (orderList && orderList.length > 0) {
        const pendingOrderIds = orderList.filter(o => o.status === "MENUNGGU").map(o => o.id);
        if (pendingOrderIds.length > 0) {
          await supabase.from("orders").update({ status: "SELESAI" }).in("id", pendingOrderIds);
        }
      }
    }

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
    const { jumlah_tamu, id_meja, id_jadwal_sesi } = req.body;
    const updatePayload = {};

    if (jumlah_tamu) updatePayload.jumlah_tamu = jumlah_tamu;
    if (id_jadwal_sesi) updatePayload.id_jadwal_sesi = id_jadwal_sesi;

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase
        .from("reservasi")
        .update(updatePayload)
        .eq("id", req.params.id);
      if (error) throw error;
    }

    if (id_meja) {
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
