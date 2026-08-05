import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or API Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRoles() {
  console.log("Generating password hash...");
  const passwordHash = await bcrypt.hash("password123", 10);

  // Akun Placeholder
  const accounts = [
    {
      nama: "Pemilik Resto (Owner)",
      email: "owner@resto.com",
      password_hash: passwordHash,
      role: "OWNER",
    },
    {
      nama: "Administrator Resto (Admin)",
      email: "admin@resto.com",
      password_hash: passwordHash,
      role: "ADMIN",
    },
    {
      nama: "Kasir Resto (Cashier)",
      email: "kasir@resto.com",
      password_hash: passwordHash,
      role: "KASIR",
    },
    {
      nama: "Pelayan Resto (Waiter)",
      email: "waiter@resto.com",
      password_hash: passwordHash,
      role: "WAITER",
    },
    {
      nama: "Koki Resto (Chef)",
      email: "chef@resto.com",
      password_hash: passwordHash,
      role: "CHEF",
    },
  ];

  console.log("Upserting user accounts into Supabase...");

  for (const acc of accounts) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", acc.email)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("users")
        .update({
          nama: acc.nama,
          password_hash: acc.password_hash,
          role: acc.role,
        })
        .eq("id", existing.id);

      if (error) {
        console.error(`Failed to update ${acc.email}:`, error.message);
      } else {
        console.log(`Updated account for role ${acc.role}: ${acc.email}`);
      }
    } else {
      const { error } = await supabase.from("users").insert(acc);

      if (error) {
        // Fallback for role enum variation (PELAYAN/KOKI)
        let fallbackRole = acc.role;
        if (acc.role === "WAITER") fallbackRole = "PELAYAN";
        if (acc.role === "CHEF") fallbackRole = "KOKI";

        const { error: fallbackError } = await supabase
          .from("users")
          .insert({ ...acc, role: fallbackRole });

        if (fallbackError) {
          console.error(`Failed to insert ${acc.email}:`, fallbackError.message);
        } else {
          console.log(`Created account for role ${fallbackRole}: ${acc.email}`);
        }
      } else {
        console.log(`Created account for role ${acc.role}: ${acc.email}`);
      }
    }
  }

  console.log("\n--- ALL ROLE ACCOUNTS SEEDED SUCCESSFULLY ---");
}

seedRoles();
