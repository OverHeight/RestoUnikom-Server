import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";

export const getAll = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = supabase
      .from("users")
      .select("id, nama, email, role, created_at")
      .order("id", { ascending: true });

    if (role) query = query.eq("role", role);

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
      .from("users")
      .select("id, nama, email, role, created_at")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { nama, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("users")
      .insert({ nama, email, password_hash: hashedPassword, role })
      .select("id, nama, email, role, created_at")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { nama, email, role } = req.body;
    const { data, error } = await supabase
      .from("users")
      .update({ nama, email, role })
      .eq("id", req.params.id)
      .select("id, nama, email, role, created_at")
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { data, error } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", id)
      .select("id, nama, email, role")
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Password berhasil diperbarui", user: data });
  } catch (err) {
    next(err);
  }
};

