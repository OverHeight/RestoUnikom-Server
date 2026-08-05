import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user by email
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", cleanEmail);

    if (error) {
      console.error("Supabase login query error:", error);
      return res.status(500).json({ message: "Database query error", detail: error.message });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];
    const passwordHash = user.password_hash || user.password;

    if (!passwordHash) {
      return res.status(401).json({ message: "Account has no password set" });
    }

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error("Unhandled login exception:", err);
    next(err);
  }
};
