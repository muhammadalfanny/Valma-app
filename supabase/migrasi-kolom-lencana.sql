-- Migrasi kolom fitur "Lencana Centang Akurat" & pembatasan ganti nama
-- Aman dijalankan berkali-kali (IF NOT EXISTS)

alter table public.profiles
  add column if not exists nomor_id text,
  add column if not exists centang_akurat boolean not null default false,
  add column if not exists lencana_menunggu boolean not null default false,
  add column if not exists lencana_alasan text,
  add column if not exists jumlah_ganti_nama integer not null default 0,
  add column if not exists ganti_nama_sejak timestamp with time zone;
