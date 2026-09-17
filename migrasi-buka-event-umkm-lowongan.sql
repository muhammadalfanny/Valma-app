-- Jalankan sekali di Supabase SQL Editor.
-- Tujuan: membuka tabel event, umkm, lowongan supaya warga bisa mengirim data sendiri
-- (statusnya Menunggu dulu, admin yang konfirmasi/tolak lewat Antrean Konfirmasi).

alter table event    add column if not exists user_id uuid references auth.users(id);
alter table umkm     add column if not exists user_id uuid references auth.users(id);
alter table lowongan add column if not exists user_id uuid references auth.users(id);

alter table event    enable row level security;
alter table umkm     enable row level security;
alter table lowongan enable row level security;

drop policy if exists event_select_publik on event;
create policy event_select_publik on event for select
  using (status = 'Publik' or role_asli(auth.uid()) = 'admin');

drop policy if exists event_insert_user on event;
create policy event_insert_user on event for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists event_admin_all on event;
create policy event_admin_all on event for all
  using (role_asli(auth.uid()) = 'admin');

drop policy if exists umkm_select_publik on umkm;
create policy umkm_select_publik on umkm for select
  using (status = 'Publik' or role_asli(auth.uid()) = 'admin');

drop policy if exists umkm_insert_user on umkm;
create policy umkm_insert_user on umkm for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists umkm_admin_all on umkm;
create policy umkm_admin_all on umkm for all
  using (role_asli(auth.uid()) = 'admin');

drop policy if exists lowongan_select_publik on lowongan;
create policy lowongan_select_publik on lowongan for select
  using (status = 'Publik' or role_asli(auth.uid()) = 'admin');

drop policy if exists lowongan_insert_user on lowongan;
create policy lowongan_insert_user on lowongan for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists lowongan_admin_all on lowongan;
create policy lowongan_admin_all on lowongan for all
  using (role_asli(auth.uid()) = 'admin');
