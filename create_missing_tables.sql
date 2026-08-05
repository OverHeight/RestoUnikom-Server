-- ============================================================
-- 🛠️ DDL SQL UNTUK MEMBUAT TABEL TERTINGGAL & MENGAKTIFKAN REALTIME
-- Jalankan Query ini di Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Buat Tabel public.menu (Katalog Menu Makanan & Minuman)
CREATE TABLE IF NOT EXISTS public.menu (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nama text NOT NULL UNIQUE,
  kategori menu_kategori_enum NOT NULL DEFAULT 'MAIN'::menu_kategori_enum,
  harga numeric NOT NULL DEFAULT 0,
  aktif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_pkey PRIMARY KEY (id)
);

-- 2. Buat Tabel public.orders (Pesanan Meja / Dining Session)
CREATE TABLE IF NOT EXISTS public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_reservasi bigint NOT NULL,
  id_dining_session bigint,
  status order_status_enum DEFAULT 'MENUNGGU'::order_status_enum,
  total_harga numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_id_reservasi_fkey FOREIGN KEY (id_reservasi) REFERENCES public.reservasi(id) ON DELETE CASCADE
);

-- 3. Buat Tabel public.order_course (Detail Tahapan Course Pesanan)
CREATE TABLE IF NOT EXISTS public.order_course (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_order bigint NOT NULL,
  id_menu bigint,
  course course_enum NOT NULL,
  qty integer DEFAULT 1,
  status order_course_status_enum DEFAULT 'MENUNGGU'::order_course_status_enum,
  served_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_course_pkey PRIMARY KEY (id),
  CONSTRAINT order_course_id_order_fkey FOREIGN KEY (id_order) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- 4. Buat Tabel public.transaksi (Transaksi Pembayaran Kasir)
CREATE TABLE IF NOT EXISTS public.transaksi (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_order bigint NOT NULL UNIQUE,
  metode_pembayaran pembayaran_enum NOT NULL DEFAULT 'Cash'::pembayaran_enum,
  total numeric NOT NULL DEFAULT 0,
  status pembayaran_status_enum DEFAULT 'PENDING'::pembayaran_status_enum,
  dibayar_kapan timestamp with time zone,
  created_by bigint,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transaksi_pkey PRIMARY KEY (id),
  CONSTRAINT transaksi_id_order_fkey FOREIGN KEY (id_order) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT transaksi_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- 5. Buat Tabel public.notifikasi (Notifikasi Real-Time Seluruh Role Staff)
CREATE TABLE IF NOT EXISTS public.notifikasi (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_user bigint,
  role user_role_enum,
  judul text NOT NULL,
  pesan text NOT NULL,
  tipe text DEFAULT 'INFO',
  dibaca boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifikasi_pkey PRIMARY KEY (id),
  CONSTRAINT notifikasi_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 6. Aktifkan Replica Identity Full untuk Realtime CDC
ALTER TABLE public.meja REPLICA IDENTITY FULL;
ALTER TABLE public.reservasi REPLICA IDENTITY FULL;
ALTER TABLE public.dining_session REPLICA IDENTITY FULL;
ALTER TABLE public.menu REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_course REPLICA IDENTITY FULL;
ALTER TABLE public.transaksi REPLICA IDENTITY FULL;
ALTER TABLE public.bahan REPLICA IDENTITY FULL;
ALTER TABLE public.notifikasi REPLICA IDENTITY FULL;

-- 7. Tambahkan Seluruh Tabel Operasional ke Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.meja;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservasi;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dining_session;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_course;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaksi;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bahan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stok_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifikasi;
