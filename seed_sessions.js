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

async function seedSessions() {
  console.log("Checking sesi_makan in Supabase...");
  let { data: sesiList, error: fetchErr } = await supabase.from("sesi_makan").select("*");

  if (fetchErr) {
    console.error("Error fetching sesi_makan:", fetchErr.message);
    return;
  }

  if (!sesiList || sesiList.length === 0) {
    console.log("Seeding sesi_makan...");
    const sesiPayload = [
      {
        nama: "Lunch Session",
        waktu_mulai: "11:30:00",
        waktu_selesai: "15:00:00",
        kapasitas: 50,
        aktif: true,
      },
      {
        nama: "Dinner & Fine Dining",
        waktu_mulai: "17:30:00",
        waktu_selesai: "22:00:00",
        kapasitas: 50,
        aktif: true,
      },
    ];

    const { data: newSesi, error: insertErr } = await supabase
      .from("sesi_makan")
      .insert(sesiPayload)
      .select();

    if (insertErr) {
      console.error("Error inserting sesi_makan:", insertErr.message);
      return;
    }
    sesiList = newSesi;
    console.log("Created sesi_makan:", sesiList.length);
  } else {
    console.log(`Found ${sesiList.length} existing sesi_makan records.`);
  }

  const today = new Date().toISOString().split("T")[0];
  console.log(`\nChecking jadwal_sesi for today (${today})...`);

  const { data: existingJadwal, error: jErr } = await supabase
    .from("jadwal_sesi")
    .select("*")
    .eq("tanggal", today);

  if (jErr) {
    console.error("Error fetching jadwal_sesi:", jErr.message);
    return;
  }

  if (!existingJadwal || existingJadwal.length === 0) {
    console.log(`Seeding jadwal_sesi for date ${today}...`);
    const jadwalPayload = sesiList.map((s) => ({
      id_sesi_makan: s.id,
      tanggal: today,
      status: true,
    }));

    const { data: newJadwal, error: insertJadwalErr } = await supabase
      .from("jadwal_sesi")
      .insert(jadwalPayload)
      .select();

    if (insertJadwalErr) {
      console.error("Error inserting jadwal_sesi:", insertJadwalErr.message);
    } else {
      console.log(`Created ${newJadwal.length} active session schedules for today!`);
    }
  } else {
    console.log(`Jadwal_sesi for today already exists (${existingJadwal.length} records). Ensuring status is true...`);
    for (const j of existingJadwal) {
      await supabase.from("jadwal_sesi").update({ status: true }).eq("id", j.id);
    }
    console.log("Jadwal_sesi status set to ACTIVE for today.");
  }

  console.log("\n--- SESSION SEEDING COMPLETED SUCCESSFULLY ---");
}

seedSessions();
