# ⚙️ RestoUnikom — RESTful API Server (Backend)

[![Build Status](https://img.shields.io/badge/Server-Active-emerald?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x_+-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT_Bcrypt-red?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

**RestoUnikom Backend Server** adalah repositori API RESTful berbasis **Node.js (ES Modules) + Express.js** yang berfungsi sebagai mesin pemroses bisnis utama (*Business Logic Engine*) untuk sistem restoran fine dining berbasis sesi.

Server ini menangani otentikasi berbasis JWT, reservasi meja, pengontrolan alur penyajian *multi-course* fine dining, pengurangan stok bahan baku otomatis, transaksi pembayaran, serta integrasi data dengan **Supabase PostgreSQL**.

---

## 📑 Daftar Isi

- [🏛️ Arsitektur & Teknologi Server](#️-arsitektur--teknologi-server)
- [🔄 Diagram Alur Pemrosesan API Server (Mermaid.js Flowchart)](#-diagram-alur-pemrosesan-api-server-mermaidjs-flowchart)
- [🗄️ Diagram Skema Database (Mermaid.js ERD)](#️-diagram-skema-database-mermaidjs-erd)
  - [1. Reservasi & Meja](#1-reservasi--meja)
  - [2. Order & Pembayaran](#2-order--pembayaran)
  - [3. Menu & Inventory](#3-menu--inventory)
  - [4. Users, Audit Log & Notifikasi](#4-users-audit-log--notifikasi)
- [📁 Struktur Folder Server](#-struktur-folder-server)
- [📡 Direktori API Endpoints](#-direktori-api-endpoints)
- [🛠️ Panduan Instalasi & Pengaturan Environment](#️-panduan-instalasi--pengaturan-environment)

---

## 🏛️ Arsitektur & Teknologi Server

1. **⚡ Express.js 5.x ES Modules Architecture**:
   Menggunakan arsitektur JavaScript ES Modules (`import/export`) untuk performa tinggi, modularitas *routes*, *controllers*, dan *middleware*.

2. **🔒 Authentication & Role Security**:
   Pendaftaran dan login staf diamankan dengan **Bcrypt.js** untuk komparasi hash kata sandi dan **JSON Web Token (JWT)** untuk otorisasi akses rute terlindungi (*Role: OWNER, ADMIN, WAITER, CHEF, KASIR*).

3. **🗃️ Supabase PostgreSQL Integration**:
   Mengintegrasikan `@supabase/supabase-js` sebagai *Data Access Layer* langsung ke database PostgreSQL, mendukung operasi CRUD instan, relasi *Foreign Key*, dan *Realtime Broadcast Triggers*.

4. **📦 Automatic Ingredient Inventory Deduction**:
   Memiliki logika bisnis terintegrasi yang menghitung resep menu (`resep`) dan secara otomatis mengurangi stok bahan baku (`bahan`) serta mencatat entri log transaksi stok (`stok_log`) setiap kali pesanan diproses oleh Dapur.

---

## 🔄 Diagram Alur Pemrosesan API Server (Mermaid.js Flowchart)

```mermaid
%%{init: { 'flowchart': { 'curve': 'ortho' } }}%%
flowchart TD
    A["📱 Frontend Client App"] -->|1. HTTP Request + JWT Bearer Token| B["🌐 Express.js API Gateway (/api)"]

    B --> C{"🔒 Auth & Validation Middleware"}
    C -->|Unauthorized / Invalid Token| D["❌ Return 401 / 403 Response"]
    C -->|Valid Request| E["🎛️ API Route Handlers & Controllers"]

    E -->|Business Logic Execution| F["📦 Supabase PostgreSQL Layer"]
    F -->|Insert / Update / Delete| G["🗄️ Database State Engine"]

    G -->|Broadcast Postgres Changes| H["⚡ Supabase Realtime WebSockets"]
    H -->|Instant Push Notification| A

    E -->|JSON Result| I["✅ Return 200 / 201 Success Response"] --> A
```

---

## 🗄️ Diagram Skema Database (Mermaid.js ERD)

Skema lengkap dipecah jadi 4 diagram per domain supaya garis relasi tetap rapi dan gampang dibaca (satu diagram utuh untuk 20 tabel akan terlalu padat).

### 1. Reservasi & Meja

```mermaid
erDiagram
    customer ||--o{ reservasi : "melakukan"
    users ||--o{ reservasi : "created_by"
    sesi_makan ||--o{ jadwal_sesi : "punya jadwal"
    jadwal_sesi ||--o{ reservasi : "dipesan untuk"
    reservasi ||--o{ reservasi_meja : "menempati"
    meja ||--o{ reservasi_meja : "ditempati oleh"
    reservasi ||--o| reservasi_qr : "punya QR"
    reservasi ||--o| dining_session : "memulai sesi"

    customer {
        bigint id PK
        text nama
        text no_telp UK
        text email
    }

    users {
        bigint id PK
        text nama
        text email UK
        user_role_enum role
    }

    sesi_makan {
        bigint id PK
        text nama
        time waktu_mulai
        time waktu_selesai
        int kapasitas
        bool aktif
    }

    jadwal_sesi {
        bigint id PK
        bigint id_sesi_makan FK
        date tanggal
        bool status
    }

    meja {
        bigint id PK
        int no_meja UK
        int kapasitas
        bool aktif
    }

    reservasi {
        bigint id PK
        bigint id_customer FK
        bigint id_jadwal_sesi FK
        bigint created_by FK
        int jumlah_tamu
        reservasi_status_enum status
        text pilihan_menu
    }

    reservasi_meja {
        bigint id PK
        bigint id_reservasi FK
        bigint id_meja FK
    }

    reservasi_qr {
        bigint id PK
        bigint id_reservasi FK
        uuid token UK
        qr_status_enum status
        timestamptz digunakan_pada
    }

    dining_session {
        bigint id PK
        bigint id_reservasi FK "UK"
        timestamptz mulai
        timestamptz selesai
        dining_status_enum status
    }
```

### 2. Order & Pembayaran

```mermaid
erDiagram
    reservasi ||--o{ orders : "menghasilkan"
    dining_session ||--o{ orders : "selama sesi"
    orders ||--o{ order_course : "berisi"
    menu ||--o{ order_course : "dipesan sebagai"
    orders ||--|| transaksi : "dibayar via"
    users ||--o{ transaksi : "created_by"

    reservasi {
        bigint id PK
        bigint id_customer FK
        reservasi_status_enum status
    }

    dining_session {
        bigint id PK
        bigint id_reservasi FK
        dining_status_enum status
    }

    orders {
        bigint id PK
        bigint id_reservasi FK
        bigint id_dining_session FK
        order_status_enum status
        numeric total_harga
    }

    order_course {
        bigint id PK
        bigint id_order FK
        bigint id_menu FK
        course_enum course
        int qty
        order_course_status_enum status
        timestamptz served_at
    }

    menu {
        bigint id PK
        text nama UK
        menu_kategori_enum kategori
        numeric harga
        bool aktif
    }

    transaksi {
        bigint id PK
        bigint id_order FK "UK"
        bigint created_by FK
        pembayaran_enum metode_pembayaran
        numeric total
        pembayaran_status_enum status
        timestamptz dibayar_kapan
    }

    users {
        bigint id PK
        text nama
        user_role_enum role
    }
```

### 3. Menu & Inventory

```mermaid
erDiagram
    menu ||--o{ resep : "butuh bahan"
    bahan ||--o{ resep : "dipakai di"
    bahan ||--o{ stok_log : "dicatat pergerakannya"
    users ||--o{ stok_log : "created_by"
    menu_harian ||--o{ menu_harian_detail : "berisi"
    menu ||--o{ menu_harian_detail : "ditampilkan sebagai"
    users ||--o{ menu_harian : "created_by"

    menu {
        bigint id PK
        text nama UK
        menu_kategori_enum kategori
        numeric harga
        bool aktif
    }

    bahan {
        bigint id PK
        text nama UK
        numeric stok
        text unit
        numeric stok_minimal
        bool aktif
    }

    resep {
        bigint id PK
        bigint id_menu FK
        bigint id_bahan FK
        numeric jumlah
        text unit
    }

    stok_log {
        bigint id PK
        bigint id_bahan FK
        bigint created_by FK
        stok_action_enum tipe
        numeric jumlah
        text keterangan
    }

    menu_harian {
        bigint id PK
        bigint created_by FK
        date tanggal
        text nama_set
        bool aktif
    }

    menu_harian_detail {
        bigint id PK
        bigint id_menu_harian FK
        bigint id_menu FK
        course_enum course
    }

    users {
        bigint id PK
        text nama
        user_role_enum role
    }
```

### 4. Users, Audit Log & Notifikasi

```mermaid
erDiagram
    users ||--o{ audit_log : "melakukan aksi"
    users ||--o{ notifikasi : "menerima"

    users {
        bigint id PK
        text nama
        text email UK
        text password_hash
        user_role_enum role
        timestamptz created_at
    }

    audit_log {
        bigint id PK
        bigint id_user FK
        text aksi
        text tabel
        bigint id_data
        jsonb detail
        timestamptz created_at
    }

    notifikasi {
        bigint id PK
        bigint id_user FK
        user_role_enum role
        text judul
        text pesan
        text tipe
        bool dibaca
        timestamptz created_at
    }
```

---

## 📁 Struktur Folder Server

```text
server/
├── config/                     # Konfigurasi koneksi Supabase & environment
├── controllers/                # Logic Pemrosesan Bisnis (Auth, Reservasi, Orders, Transaksi, DLL)
│   ├── authController.js
│   ├── reservasiController.js
│   ├── diningSessionController.js
│   ├── orderController.js
│   ├── transaksiController.js
│   ├── menuController.js
│   ├── bahanController.js
│   └── notifikasiController.js
│
├── middleware/                 # Auth JWT, Role Checker, & Global Error Handler
│   ├── authMiddleware.js
│   └── errorHandler.js
│
├── routes/                     # Router Endpoints API Express
│   ├── index.js                # Master Router Entry (/api)
│   ├── authRoute.js
│   ├── reservasiRoute.js
│   ├── diningSessionRoute.js
│   ├── orderRoute.js
│   ├── transaksiRoute.js
│   ├── menuRoute.js
│   ├── bahanRoute.js
│   └── notifikasiRoute.js
│
├── .env                        # Variabel Lingkungan Server (GitIgnored)
├── index.js                    # Server Entry Point Express Listener
├── package.json                # Dependensi Backend & Script Nodemon
└── README.md                   # Dokumentasi Utama Repositori Server
```

---

## 📡 Direktori API Endpoints

Seluruh endpoint diawali dengan prefix `/api`:

| Modul | Method | Endpoint | Deskripsi |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Mendaftarkan akun staf baru |
| **Auth** | `POST` | `/api/auth/login` | Autentikasi staf & penerbitan token JWT |
| **Reservasi** | `GET` | `/api/reservasi` | Mengambil seluruh daftar reservasi |
| **Reservasi** | `POST` | `/api/reservasi` | Membuat reservasi tamu baru / walk-in |
| **Reservasi** | `PATCH` | `/api/reservasi/:id/status` | Mengubah status reservasi (`DATANG`, `SELESAI`, `BATAL`) |
| **Dining Session** | `GET` | `/api/dining-session` | Mengambil sesi dining yang sedang berjalan (`BERJALAN`) |
| **Dining Session** | `PATCH` | `/api/dining-session/:id/end` | Mengakhiri sesi dining meja |
| **Orders** | `GET` | `/api/orders` | Mengambil daftar bill & order meja |
| **Orders** | `POST` | `/api/orders` | Menambahkan order baru / add-on course |
| **Order Course** | `PATCH` | `/api/orders/course/:id/status` | Mengubah status masakan (`DIMASAK`, `SIAP`, `DISAJIKAN`) |
| **Transaksi** | `GET` | `/api/transaksi` | Mengambil riwayat transaksi |
| **Transaksi** | `POST` | `/api/transaksi` | Memproses pembayaran meja (`Cash`, `QRIS`, `Debit`) |
| **Notifikasi** | `GET` | `/api/notifikasi` | Mengambil notifikasi real-time per peran |

---

## 🛠️ Panduan Instalasi & Pengaturan Environment

### 1. Prasyarat Sistem
- Node.js v18.x atau versi yang lebih baru
- NPM v9.x atau Yarn

### 2. Instalasi Dependensi
Jalankan perintah berikut di dalam direktori `server/`:
```bash
npm install
```

### 3. Pengaturan Variabel Lingkungan (`.env`)
Buat berkas `.env` di direktori utama `server/`:
```env
PORT=5000
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secure-jwt-secret-key
```

### 4. Menjalankan Backend Server (Development)
```bash
npm run start
```
Server backend akan berjalan di `http://localhost:5000` dengan otomatis merefresh jika ada perubahan berkas (*Nodemon*).

---

## 📜 Lisensi
Dikembangkan untuk sistem operasional **RestoUnikom Fine Dining Management System (Server API)**. All rights reserved.
