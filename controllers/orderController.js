import { supabase } from "../config/supabase.js";
import { recalculateOrderTotal } from "./transaksiController.js";

export const getAll = async (req, res, next) => {
  try {
    const { status, id_reservasi } = req.query;
    let query = supabase
      .from("orders")
      .select(`
        *,
        reservasi:id_reservasi(
          *,
          customer(*),
          reservasi_meja(meja(*))
        ),
        dining_session:id_dining_session(
          *,
          reservasi(*, customer(*), reservasi_meja(meja(*)))
        ),
        order_course(*, menu(*))
      `)
      .order("id", { ascending: false });

    if (status) query = query.eq("status", status);
    if (id_reservasi) query = query.eq("id_reservasi", id_reservasi);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST200' || error.message?.includes('relationship') || error.message?.includes('schema cache')) {
        // Fallback: Query orders without invalid relationship joins
        let fallbackQuery = supabase
          .from("orders")
          .select(`
            *,
            reservasi:id_reservasi(
              *,
              customer(*),
              reservasi_meja(meja(*))
            ),
            order_course(*)
          `)
          .order("id", { ascending: false });

        if (status) fallbackQuery = fallbackQuery.eq("status", status);
        if (id_reservasi) fallbackQuery = fallbackQuery.eq("id_reservasi", id_reservasi);

        const { data: fallbackData } = await fallbackQuery;
        return res.json(fallbackData || []);
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
      .from("orders")
      .select(`
        *,
        reservasi:id_reservasi(
          *,
          customer(*),
          reservasi_meja(meja(*))
        ),
        dining_session:id_dining_session(
          *,
          reservasi(*, customer(*), reservasi_meja(meja(*)))
        ),
        order_course(*, menu(*)),
        transaksi(*)
      `)
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST200' || error.message?.includes('relationship')) {
        const { data: fallbackData } = await supabase
          .from("orders")
          .select(`
            *,
            reservasi:id_reservasi(
              *,
              customer(*),
              reservasi_meja(meja(*))
            ),
            order_course(*),
            transaksi(*)
          `)
          .eq("id", req.params.id)
          .single();
        return res.json(fallbackData);
      }
      throw error;
    }
    if (!data) return res.status(404).json({ message: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_reservasi, id_dining_session, status } = req.body;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id_reservasi,
        id_dining_session,
        status: status || "MENUNGGU",
        total_harga: 0
      })
      .select(`
        *,
        reservasi:id_reservasi(
          *,
          customer(*),
          reservasi_meja(meja(*))
        ),
        dining_session:id_dining_session(
          *,
          reservasi(*, customer(*), reservasi_meja(meja(*)))
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST200' || error.message?.includes('relationship')) {
        const { data: fallbackData } = await supabase
          .from("orders")
          .insert({
            id_reservasi,
            id_dining_session,
            status: status || "MENUNGGU",
            total_harga: 0
          })
          .select(`
            *,
            reservasi:id_reservasi(
              *,
              customer(*),
              reservasi_meja(meja(*))
            )
          `)
          .single();
        return res.status(201).json(fallbackData);
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateTotal = async (req, res, next) => {
  try {
    const { total_harga } = req.body;
    const { data, error } = await supabase
      .from("orders")
      .update({ total_harga })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const { data, error } = await supabase
      .from("order_course")
      .select("*, menu(*)")
      .eq("id_order", orderId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
};

export const addCourse = async (req, res, next) => {
  try {
    const { id_menu, qty, catatan } = req.body;
    let { course } = req.body;
    const targetOrderId = req.params.orderId || req.params.id || req.body.id_order;

    if (!targetOrderId) {
      return res.status(400).json({ message: "Order ID (id_order) is required." });
    }

    // Try inserting with given course value
    let { data, error } = await supabase
      .from("order_course")
      .insert({
        id_order: parseInt(targetOrderId),
        course,
        id_menu: id_menu ? parseInt(id_menu) : null,
        qty: qty || 1,
        catatan,
        status: "MENUNGGU"
      })
      .select("*, menu(*)")
      .single();

    // Fallback if FK to menu relationship is missing in PostgREST cache
    if (error && (error.code === 'PGRST200' || error.message?.includes('relationship'))) {
      const fallbackInsert = await supabase
        .from("order_course")
        .insert({
          id_order: parseInt(targetOrderId),
          course,
          id_menu: id_menu ? parseInt(id_menu) : null,
          qty: qty || 1,
          catatan,
          status: "MENUNGGU"
        })
        .select()
        .single();

      data = fallbackInsert.data;
      error = fallbackInsert.error;
    }

    // If MAIN_COURSE is not yet in DB enum, fallback to MAIN_A
    if (error && error.message?.includes('invalid input value for enum') && course === 'MAIN_COURSE') {
      console.log('[addCourse] MAIN_COURSE not in enum yet, falling back to MAIN_A');
      course = 'MAIN_A';
      const fallback2 = await supabase
        .from("order_course")
        .insert({
          id_order: parseInt(targetOrderId),
          course,
          id_menu: id_menu ? parseInt(id_menu) : null,
          qty: qty || 1,
          catatan,
          status: "MENUNGGU"
        })
        .select()
        .single();
      data = fallback2.data;
      error = fallback2.error;
    }

    if (error) throw error;

    // Recalculate order total in transactions dynamically
    try {
      await recalculateOrderTotal(targetOrderId);
    } catch(e) {
      console.error("Failed to recalculate order total:", e);
    }

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};


export const updateCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    if (status === 'DISAJIKAN') {
      updateData.served_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("order_course")
      .update(updateData)
      .eq("id", req.params.courseId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Course item not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
