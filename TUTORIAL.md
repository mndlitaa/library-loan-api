# Tutorial Lengkap: REST API Peminjaman Buku (Node.js + Express + Supabase + Vercel)

Urutan kerja: **Install tools → Supabase → Jalankan lokal → Tes Postman lokal → GitHub → Vercel → Tes Postman publik → Kumpulkan**.

## 0. Persiapan
Install: Node.js LTS (v18+) dari nodejs.org, Git dari git-scm.com, VS Code, Postman. Buat akun gratis: Supabase, GitHub, Vercel (login Vercel pakai GitHub).
Cek di terminal: `node -v`, `npm -v`, `git --version`.

## 1. Setup Supabase (database)
1. Buka supabase.com → **New project**. Isi nama (mis. `library-loan`), password database (simpan), region **Southeast Asia (Singapore)**. Tunggu ±2 menit.
2. Menu kiri **SQL Editor → New query**. Copy seluruh isi `docs/schema.sql`, tempel, klik **Run**. Harus muncul "Success".
3. Cek di **Table Editor** → tabel `loans` berisi 3 data contoh.
4. Ambil kredensial: **Project Settings (ikon gear) → API**.
   - **Project URL** → untuk `SUPABASE_URL`
   - **anon public key** (atau `service_role` key) → untuk `SUPABASE_KEY`
   - Jika Anda memakai anon key, RLS harus dimatikan (sudah ada di schema.sql). Jangan commit key ke GitHub.

## 2. Jalankan di komputer lokal
1. Ekstrak folder project, buka di VS Code, buka Terminal.
2. `npm install`
3. Salin `.env.example` jadi `.env` (di Windows: `copy .env.example .env`), isi:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOi...
   PORT=3000
   ```
4. `npm start` → muncul "Server berjalan di http://localhost:3000".
5. Buka `http://localhost:3000/loans` di browser; harus muncul JSON 3 data.

## 3. Tes dengan Postman (lokal)
1. Postman → **Import** → pilih `docs/postman_collection.json`.
2. Klik collection **Library Loan API → tab Variables**, `baseUrl` = `http://localhost:3000` (Current value). **Save**.
3. Jalankan request berurutan (klik Send):

| No | Request | Setting di Postman | Hasil yang benar |
|---|---|---|---|
| 1 | GET semua | GET `{{baseUrl}}/loans` | 200, `count` ≥ 3 |
| 2 | GET filter | GET `{{baseUrl}}/loans?status=Terlambat` (tab **Params**: Key `status`, Value `Terlambat`) | 200, hanya status Terlambat |
| 3 | GET detail | GET `{{baseUrl}}/loans/1` | 200 |
| 4 | POST tambah | POST `{{baseUrl}}/loans` → tab **Body → raw → JSON** (isi di bawah) | 201, ada `id` baru |
| 5 | PUT ubah | PUT `{{baseUrl}}/loans/ID_BARU` → Body raw JSON: `{"status":"Dikembalikan"}` | 200, `tanggal_kembali` terisi |
| 6 | DELETE | DELETE `{{baseUrl}}/loans/ID_BARU` | 200 |
| 7 | Error test | POST body kosong/kurang field | 400 + daftar errors |
| 8 | Not found | GET `{{baseUrl}}/loans/9999` | 404 |

Body untuk POST (Body → raw → pilih **JSON**; header `Content-Type: application/json` otomatis):
```json
{
  "nama_anggota": "Rina Putri",
  "judul_buku": "Filosofi Teras",
  "tanggal_pinjam": "2026-10-10",
  "tanggal_jatuh_tempo": "2026-10-17"
}
```
Screenshot hasil tes ini bisa dipakai sebagai bukti/lampiran.

## 4. Upload ke GitHub
1. github.com → **New repository** → nama `library-loan-api`, **Public**, jangan centang "Add README" (sudah ada).
2. Di terminal folder project:
   ```
   git init
   git add .
   git commit -m "Initial commit: Library Loan REST API"
   git branch -M main
   git remote add origin https://github.com/USERNAME/library-loan-api.git
   git push -u origin main
   ```
3. Pastikan `.env` **tidak** ikut ter-upload (sudah ada di `.gitignore`) dan `node_modules` juga tidak.
4. Edit `README.md`: ganti `GANTI-USERNAME` dan placeholder URL, lalu `git add . && git commit -m "update readme" && git push`.

## 5. Deploy ke Vercel
1. vercel.com → **Add New → Project** → pilih repo `library-loan-api` → **Import**.
2. Framework Preset: **Other**. Root Directory biarkan `./`. Build/Output biarkan kosong.
3. Buka **Environment Variables**, tambahkan:
   - `SUPABASE_URL` = URL project Supabase
   - `SUPABASE_KEY` = key Supabase
4. Klik **Deploy**. Setelah sukses, salin domain, mis. `https://library-loan-api.vercel.app`.
5. Tes di browser: `https://DOMAIN/` dan `https://DOMAIN/loans`.
6. Kalau error 500: periksa Environment Variables (salah ketik/belum diisi) → ubah, lalu **Deployments → Redeploy**. Log ada di tab **Logs**.

## 6. Tes Postman ke URL publik
Ubah variable `baseUrl` di collection menjadi `https://DOMAIN.vercel.app` (tanpa slash di akhir), ulangi semua request di langkah 3.

## 7. Finalisasi & pengumpulan
1. Isi link Vercel & GitHub di README.md, push ulang.
2. Checklist: README memuat deskripsi, schema, contoh request/response, panduan instalasi lokal, link Vercel ✔ · repo Public ✔ · endpoint bisa diakses ✔.
3. Kumpulkan: **Link Repository GitHub** dan **Base URL Vercel**.

## Troubleshooting
| Masalah | Solusi |
|---|---|
| `permission denied for table loans` / data kosong | RLS aktif: jalankan `alter table public.loans disable row level security;` atau pakai service_role key |
| `fetch failed` / `Invalid URL` | `SUPABASE_URL` salah/belum diisi di `.env` atau Vercel |
| Vercel 404 NOT_FOUND | Pastikan `vercel.json` dan `api/index.js` ada di root repo |
| Vercel 500 | Cek Environment Variables lalu Redeploy |
| POST selalu 400 | Body harus raw **JSON**, tanggal format `YYYY-MM-DD` |
| `npm` tidak dikenali | Install ulang Node.js, restart terminal |
