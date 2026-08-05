import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or API Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMeja() {
  console.log("Checking existing tables in Supabase...");
  const { data: existingTables, error: fetchErr } = await supabase.from("meja").select("*");

  if (fetchErr) {
    console.error("Error fetching tables:", fetchErr.message);
    return;
  }

  console.log(`Found ${existingTables ? existingTables.length : 0} existing tables.`);

  const mejaPayload = [];
  for (let i = 1; i <= 12; i++) {
    mejaPayload.push({
      no_meja: i,
      kapasitas: i === 1 || i === 6 || i === 7 ? 6 : 4,
      aktif: true,
      catatan: i === 1 ? "Private Room Table" : i === 11 || i === 12 ? "Outdoor Table" : "Regular Table"
    });
  }

  for (const meja of mejaPayload) {
    const existing = existingTables?.find(t => t.no_meja === meja.no_meja);

    if (existing) {
      const { error: updateErr } = await supabase
        .from("meja")
        .update({ kapasitas: meja.kapasitas, aktif: true })
        .eq("id", existing.id);

      if (updateErr) console.error(`Error updating table ${meja.no_meja}:`, updateErr.message);
      else console.log(`Table T${meja.no_meja} updated.`);
    } else {
      const { error: insertErr } = await supabase.from("meja").insert(meja);

      if (insertErr) console.error(`Error inserting table ${meja.no_meja}:`, insertErr.message);
      else console.log(`Table T${meja.no_meja} created.`);
    }
  }

  console.log("\n--- MEJA SEEDING COMPLETED ---");
}

seedMeja();
