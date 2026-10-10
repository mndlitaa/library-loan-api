-- Jalankan di Supabase > SQL Editor
create table if not exists public.loans (
  id                  bigint generated always as identity primary key,
  nama_anggota        text        not null,
  judul_buku          text        not null,
  tanggal_pinjam      date        not null,
  tanggal_jatuh_tempo date        not null,
  tanggal_kembali     date,
  status              text        not null default 'Dipinjam'
                      check (status in ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  created_at          timestamptz not null default now()
);

-- Untuk tugas: matikan RLS agar API bisa akses dengan anon key
-- (alternatif: pakai service_role key di server dan biarkan RLS aktif)
alter table public.loans disable row level security;

-- Data contoh (opsional)
insert into public.loans (nama_anggota, judul_buku, tanggal_pinjam, tanggal_jatuh_tempo, tanggal_kembali, status) values
('Budi Santoso',  'Laskar Pelangi',           '2026-09-01', '2026-09-08', null,         'Terlambat'),
('Siti Aminah',   'Bumi Manusia',             '2026-10-05', '2026-10-12', null,         'Dipinjam'),
('Andi Wijaya',   'Algoritma dan Pemrograman','2026-09-20', '2026-09-27', '2026-09-26', 'Dikembalikan');
