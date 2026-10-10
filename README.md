# 📚 Library Loan API

REST API sederhana untuk **pencatatan peminjaman buku perpustakaan**. Dibangun dengan Node.js, Express.js, dan Supabase (PostgreSQL), lalu di-deploy ke Vercel.

## Deskripsi & Tujuan
API ini membantu petugas perpustakaan mencatat siapa meminjam buku apa, kapan jatuh tempo, dan kapan dikembalikan. Mendukung operasi CRUD serta filter query (mis. `GET /loans?status=Terlambat`). Tugas Responsi Praktikum PPB 2026.

## 👥 Anggota Kelompok
| No | Nama |
|---|---|
| 1 | Amanda Lalita |
| 2 | Rosita Dwi |
| 3 | Fina Aprilia |
| 4 | Radhine Muhammad |

## Teknologi
Node.js (>= 18) · Express.js · Supabase · Vercel

## 🔗 Link
- **Base URL (Vercel):** `https://library-loan-api-delta.vercel.app`
- **Repository:** `https://github.com/mndlitaa/library-loan-api`

## Struktur Data (tabel `loans`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint (PK, auto) | ID peminjaman |
| nama_anggota | text | Nama anggota peminjam (wajib) |
| judul_buku | text | Judul buku (wajib) |
| tanggal_pinjam | date | Format `YYYY-MM-DD` (wajib) |
| tanggal_jatuh_tempo | date | Format `YYYY-MM-DD` (wajib) |
| tanggal_kembali | date / null | Terisi saat buku dikembalikan |
| status | text | `Dipinjam` (default), `Dikembalikan`, `Terlambat` |
| created_at | timestamptz | Waktu data dibuat |

Script SQL lengkap ada di [`docs/schema.sql`](docs/schema.sql).

## Endpoint
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/` | Cek status API |
| GET | `/loans` | Ambil semua data (mendukung filter) |
| GET | `/loans/:id` | Detail satu peminjaman |
| POST | `/loans` | Tambah peminjaman |
| PUT | `/loans/:id` | Ubah data peminjaman |
| DELETE | `/loans/:id` | Hapus peminjaman |

**Query filter pada `GET /loans`:** `status` (`Dipinjam`/`Dikembalikan`/`Terlambat`), `nama_anggota` (pencarian sebagian), `judul_buku` (pencarian sebagian), `sort` (`id`, `tanggal_pinjam`, `tanggal_jatuh_tempo`, `nama_anggota`, `judul_buku`), `order` (`asc`/`desc`).

> Pinjaman berstatus `Dipinjam` yang melewati tanggal jatuh tempo otomatis diubah menjadi `Terlambat` saat `GET /loans` diakses.

## Contoh Request & Response

### GET /loans?status=Terlambat
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "nama_anggota": "Budi Santoso",
      "judul_buku": "Laskar Pelangi",
      "tanggal_pinjam": "2026-09-01",
      "tanggal_jatuh_tempo": "2026-09-08",
      "tanggal_kembali": null,
      "status": "Terlambat",
      "created_at": "2026-10-10T03:00:00.000Z"
    }
  ]
}
```

### POST /loans
Request body:
```json
{
  "nama_anggota": "Rina Putri",
  "judul_buku": "Filosofi Teras",
  "tanggal_pinjam": "2026-10-10",
  "tanggal_jatuh_tempo": "2026-10-17"
}
```
Response `201 Created`:
```json
{
  "success": true,
  "message": "Peminjaman berhasil dicatat",
  "data": { "id": 4, "nama_anggota": "Rina Putri", "judul_buku": "Filosofi Teras", "tanggal_pinjam": "2026-10-10", "tanggal_jatuh_tempo": "2026-10-17", "tanggal_kembali": null, "status": "Dipinjam" }
}
```

### PUT /loans/4 (pengembalian buku)
Request body: `{ "status": "Dikembalikan" }`  
Response: `tanggal_kembali` otomatis terisi tanggal hari ini.

### DELETE /loans/4
```json
{ "success": true, "message": "Data peminjaman berhasil dihapus", "data": { "id": 4 } }
```

### Contoh error `400` (validasi)
```json
{ "success": false, "message": "Validasi gagal", "errors": ["judul_buku wajib diisi", "tanggal_pinjam wajib diisi", "tanggal_jatuh_tempo wajib diisi"] }
```
### Contoh error `404`
```json
{ "success": false, "message": "Data peminjaman tidak ditemukan" }
```

## Instalasi & Menjalankan Lokal
1. Clone repo: `git clone https://github.com/mndlitaa/library-loan-api.git && cd library-loan-api`
2. Install dependency: `npm install`
3. Buat project Supabase, lalu jalankan `docs/schema.sql` di **SQL Editor**.
4. Salin `.env.example` menjadi `.env`, isi `SUPABASE_URL` dan `SUPABASE_KEY` (Project Settings → API).
5. Jalankan: `npm start` (atau `npm run dev`). Buka `http://localhost:3000`.

## Deployment (Vercel)
Import repo GitHub di Vercel, tambahkan Environment Variables `SUPABASE_URL` dan `SUPABASE_KEY`, lalu Deploy. Konfigurasi ada di `vercel.json` dan `api/index.js`.

## Pengujian
Import `docs/postman_collection.json` ke Postman, lalu ubah variable `baseUrl` ke URL Vercel.
