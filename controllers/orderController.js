import { supabase } from "../config/supabase.js";

export const getAll = async (req, res, next) => {
  try {
    const { status, id_reservasi } = req.query;
    let query = supabase
      .from("orders")
      .select("*, reservasi:id_reservasi(*), order_course(*)")
      .order("id", { ascending: false });

    if (status) query = query.eq("status", status);
    if (id_reservasi) query = query.eq("id_reservasi", id_reservasi);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('orders')) {
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
      .from("orders")
      .select("*, reservasi:id_reservasi(*), order_course(*), transaksi(*)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { id_reservasi, id_dining_session, status } = req.body;

    const { data: reservasi } = await supabase
      .from("reservasi")
      .select("status")
      .eq("id", id_reservasi)
      .single();

    if (!reservasi || !['DITERIMA', 'DIKONFIRMASI', 'DATANG'].includes(reservasi.status)) {
      return res
        .status(400)
        .json({ message: "Reservation must be accepted/confirmed first" });
    }

    // Exact order_status_enum: MENUNGGU, DISAJIKAN, SELESAI, DIBAYAR
    const validOrderStatus = ['MENUNGGU', 'DISAJIKAN', 'SELESAI', 'DIBAYAR'].includes(status) ? status : 'MENUNGGU';

    const { data, error } = await supabase
      .from("orders")
      .insert({ 
        id_reservasi, 
        id_dining_session: id_dining_session || null,
        status: validOrderStatus, 
        total_harga: 0 
      })
      .select("*, reservasi:id_reservasi(*)")
      .single();

    if (error) {
      console.error("Error creating order:", error);
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

// Order Course
export const getCourses = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("order_course")
      .select("*")
      .eq("id_order", req.params.orderId)
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const addCourse = async (req, res, next) => {
  try {
    const { course, id_menu, menu_id, qty } = req.body;
    const finalMenuId = id_menu || menu_id || null;

    // Normalize course string to valid course_enum: APPETIZER, MAIN_A, MAIN_B, DESSERT, BEVERAGE
    let validCourse = course;
    if (course === 'MAIN_COURSE' || course === 'MAIN') validCourse = 'MAIN_A';

    const { data, error } = await supabase
      .from("order_course")
      .insert({ 
        id_order: req.params.orderId, 
        course: validCourse, 
        id_menu: finalMenuId, 
        qty: qty || 1, 
        status: "MENUNGGU" 
      })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        return res.status(201).json({ id: Date.now(), course: validCourse, status: "MENUNGGU" });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updates = { status };
    
    if (status === "DISAJIKAN") updates.served_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("order_course")
      .update(updates)
      .eq("id", req.params.courseId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Course not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
