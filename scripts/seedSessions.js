import { supabase } from '../config/supabase.js';

const staticSessions = [
  { nama: 'Session 1', waktu_mulai: '10:00:00', waktu_selesai: '12:30:00', kapasitas: 50, aktif: true },
  { nama: 'Session 2', waktu_mulai: '13:00:00', waktu_selesai: '15:30:00', kapasitas: 50, aktif: true },
  { nama: 'Session 3', waktu_mulai: '16:00:00', waktu_selesai: '18:30:00', kapasitas: 50, aktif: true },
  { nama: 'Session 4', waktu_mulai: '19:00:00', waktu_selesai: '21:30:00', kapasitas: 50, aktif: true },
  { nama: 'Session 5', waktu_mulai: '22:00:00', waktu_selesai: '23:30:00', kapasitas: 50, aktif: true },
];

async function seed() {
  console.log("Seeding static sessions...");
  try {
    // Delete all existing sesi_makan to prevent duplicates
    // Note: this assumes we don't have constraints blocking it right now (e.g., active reservations on old sessions).
    // Let's just upsert or handle gracefully.
    
    // First, clear old jadwal_sesi if needed, but since it's dev we might just leave them or delete them.
    // Actually, safer to just check if 'Session 1' exists, if not, insert all. If it exists, update.
    
    for (const session of staticSessions) {
      const { data: existing } = await supabase.from('sesi_makan').select('id').eq('nama', session.nama).single();
      if (existing) {
        await supabase.from('sesi_makan').update(session).eq('id', existing.id);
        console.log(`Updated ${session.nama}`);
      } else {
        await supabase.from('sesi_makan').insert(session);
        console.log(`Inserted ${session.nama}`);
      }
    }
    
    // We should also delete any other random sessions that don't match these 5
    const { data: allSessions } = await supabase.from('sesi_makan').select('id, nama');
    const validNames = staticSessions.map(s => s.nama);
    
    for (const s of allSessions) {
       if (!validNames.includes(s.nama)) {
          // Attempt delete
          const { error } = await supabase.from('sesi_makan').delete().eq('id', s.id);
          if (error) {
             console.log(`Could not delete ${s.nama}: it might be referenced by reservations. Marking as inactive.`);
             await supabase.from('sesi_makan').update({ aktif: false }).eq('id', s.id);
          } else {
             console.log(`Deleted old session ${s.nama}`);
          }
       }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}

seed();
