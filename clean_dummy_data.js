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

async function cleanDummyData() {
  console.log("=== STARTING DUMMY DATA CLEANUP ===");
  console.log("Preserving: 'users' (accounts), 'meja' (tables T1-T12), 'sesi_makan' (session definitions).\n");

  const tablesToClearInOrder = [
    "transaksi",
    "order_course",
    "orders",
    "dining_session",
    "reservasi_qr",
    "reservasi_meja",
    "reservasi",
    "customer",
    "stok_log",
    "audit_log",
    "menu_harian_detail",
    "menu_harian"
  ];

  for (const tableName of tablesToClearInOrder) {
    try {
      console.log(`Clearing dummy data from '${tableName}'...`);
      // Delete rows where id is not null (deletes all rows in Supabase)
      const { error, count } = await supabase
        .from(tableName)
        .delete({ count: "exact" })
        .neq("id", -1);

      if (error) {
        console.warn(`Note on '${tableName}': ${error.message}`);
      } else {
        console.log(`✓ Cleared ${count ?? 0} records from '${tableName}'.`);
      }
    } catch (err) {
      console.error(`Error deleting from ${tableName}:`, err.message);
    }
  }

  // Ensure active schedule for today exists for session operational flow
  const today = new Date().toISOString().split("T")[0];
  console.log(`\nRe-syncing active jadwal_sesi for today (${today})...`);
  const { data: sesiList } = await supabase.from("sesi_makan").select("id");

  if (sesiList && sesiList.length > 0) {
    const { data: existingJadwal } = await supabase
      .from("jadwal_sesi")
      .select("id")
      .eq("tanggal", today);

    if (!existingJadwal || existingJadwal.length === 0) {
      const inserts = sesiList.map((s) => ({
        id_sesi_makan: s.id,
        tanggal: today,
        status: true,
      }));
      await supabase.from("jadwal_sesi").insert(inserts);
      console.log(`✓ Created clean active schedule for today.`);
    } else {
      await supabase
        .from("jadwal_sesi")
        .update({ status: true })
        .eq("tanggal", today);
      console.log(`✓ Updated schedule status for today to ACTIVE.`);
    }
  }

  console.log("\n=== DUMMY DATA CLEANUP COMPLETED SUCCESSFULLY ===");
}

cleanDummyData();
