-- VALMA / Surabaya 24 Jam - Commerce & VIP foundation
-- Jalankan di Supabase SQL Editor. Review RLS sesuai kebijakan produksi sebelum go-live.
create extension if not exists pgcrypto;

create table if not exists public.merchant_profiles (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  nama_merchant text not null, kategori text, alamat text, deskripsi text, status text not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.merchant_vip (
  id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  merchant_name text, plan text not null check (plan in ('commission','daily')), status text not null default 'pending',
  starts_at timestamptz, ends_at timestamptz, reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.merchant_orders (
  id uuid primary key default gen_random_uuid(), merchant_id uuid references public.merchant_profiles(id) on delete set null,
  merchant_name text, customer_id uuid references auth.users(id) on delete set null, total_amount numeric(14,2) not null default 0,
  status text not null default 'pending', source text default 'valma', created_at timestamptz not null default now()
);
create table if not exists public.merchant_vip_ledger (
  id uuid primary key default gen_random_uuid(), merchant_id uuid references public.merchant_profiles(id) on delete cascade,
  order_id uuid references public.merchant_orders(id) on delete set null, plan text not null,
  gross_amount numeric(14,2) not null default 0, fee_amount numeric(14,2) not null default 0,
  fee_rate numeric(6,3) default 0, period_date date, created_at timestamptz not null default now()
);
create index if not exists merchant_vip_status_idx on public.merchant_vip(status);
create index if not exists merchant_orders_merchant_idx on public.merchant_orders(merchant_id, created_at desc);

alter table public.merchant_profiles enable row level security;
alter table public.merchant_vip enable row level security;
alter table public.merchant_orders enable row level security;
alter table public.merchant_vip_ledger enable row level security;

-- Owner can read/create their own merchant profile.
drop policy if exists merchant_profiles_owner_select on public.merchant_profiles;
create policy merchant_profiles_owner_select on public.merchant_profiles for select using (owner_id = auth.uid());
drop policy if exists merchant_profiles_owner_insert on public.merchant_profiles;
create policy merchant_profiles_owner_insert on public.merchant_profiles for insert with check (owner_id = auth.uid());
drop policy if exists merchant_profiles_owner_update on public.merchant_profiles;
create policy merchant_profiles_owner_update on public.merchant_profiles for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- VIP: owner can read/submit. Admin/developer policies should be created according to the existing profiles role model.
drop policy if exists merchant_vip_owner_select on public.merchant_vip;
create policy merchant_vip_owner_select on public.merchant_vip for select using (exists(select 1 from public.merchant_profiles m where m.id=merchant_id and m.owner_id=auth.uid()));
drop policy if exists merchant_vip_owner_insert on public.merchant_vip;
create policy merchant_vip_owner_insert on public.merchant_vip for insert with check (exists(select 1 from public.merchant_profiles m where m.id=merchant_id and m.owner_id=auth.uid()));

-- Admin/developer access for moderation and accounting.
drop policy if exists merchant_profiles_admin_all on public.merchant_profiles;
create policy merchant_profiles_admin_all on public.merchant_profiles for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer')));
drop policy if exists merchant_vip_admin_all on public.merchant_vip;
create policy merchant_vip_admin_all on public.merchant_vip for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer')));
drop policy if exists merchant_orders_admin_all on public.merchant_orders;
create policy merchant_orders_admin_all on public.merchant_orders for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer')));
drop policy if exists merchant_vip_ledger_admin_all on public.merchant_vip_ledger;
create policy merchant_vip_ledger_admin_all on public.merchant_vip_ledger for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer')));

-- Automatically record the commercial fee when a merchant order is created.
create or replace function public.record_merchant_vip_fee()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_plan text; v_fee numeric := 0; v_rate numeric := 0;
begin
  select plan into v_plan from public.merchant_vip
  where merchant_id = new.merchant_id and status in ('active','approved')
    and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
  order by created_at desc limit 1;
  if v_plan = 'commission' then
    v_rate := 5; v_fee := round(new.total_amount * 0.05, 2);
  elsif v_plan = 'daily' then
    if not exists(select 1 from public.merchant_vip_ledger where merchant_id=new.merchant_id and plan='daily' and period_date=current_date) then
      v_fee := 15000;
    end if;
  end if;
  if v_fee > 0 then
    insert into public.merchant_vip_ledger(merchant_id, order_id, plan, gross_amount, fee_amount, fee_rate, period_date)
    values(new.merchant_id,new.id,coalesce(v_plan,'none'),new.total_amount,v_fee,v_rate,current_date);
  end if;
  return new;
end; $$;
drop trigger if exists trg_record_merchant_vip_fee on public.merchant_orders;
create trigger trg_record_merchant_vip_fee after insert on public.merchant_orders for each row execute function public.record_merchant_vip_fee();


-- ===== VALMA COMMERCE V2 =====
create table if not exists public.merchant_products (
  id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  nama text not null, harga numeric(14,2) not null default 0 check (harga >= 0), deskripsi text, foto_url text,
  status text not null default 'active' check (status in ('active','inactive','pending')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.merchant_orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.merchant_orders add column if not exists updated_at timestamptz not null default now();
create index if not exists merchant_products_merchant_idx on public.merchant_products(merchant_id, status, created_at desc);
create index if not exists merchant_orders_customer_idx on public.merchant_orders(customer_id, created_at desc);
alter table public.merchant_products enable row level security;

drop policy if exists merchant_products_public_read on public.merchant_products;
create policy merchant_products_public_read on public.merchant_products for select using (status='active');
drop policy if exists merchant_products_owner_all on public.merchant_products;
create policy merchant_products_owner_all on public.merchant_products for all using (exists(select 1 from public.merchant_profiles m where m.id=merchant_id and m.owner_id=auth.uid())) with check (exists(select 1 from public.merchant_profiles m where m.id=merchant_id and m.owner_id=auth.uid()));
drop policy if exists merchant_products_admin_all on public.merchant_products;
create policy merchant_products_admin_all on public.merchant_products for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer')));

-- Public discovery only exposes active merchant profiles.
drop policy if exists merchant_profiles_public_active on public.merchant_profiles;
create policy merchant_profiles_public_active on public.merchant_profiles for select using (status='active' or owner_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer')));

-- Orders: customer creates/reads own orders; merchant reads/updates own orders; admin has full access.
drop policy if exists merchant_orders_customer_insert on public.merchant_orders;
-- Customer orders are created through create_merchant_order() so price/total cannot be forged from the client.
create or replace function public.create_merchant_order(p_merchant_id uuid, p_items jsonb)
returns public.merchant_orders
language plpgsql
security definer
set search_path = public
as $$
declare v_order public.merchant_orders; v_total numeric := 0; v_items jsonb := '[]'::jsonb; r jsonb; v_product public.merchant_products; v_qty integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.merchant_profiles where id=p_merchant_id and status='active') then raise exception 'MERCHANT_NOT_ACTIVE'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'ITEMS_REQUIRED'; end if;
  for r in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(99, (r->>'qty')::integer));
    select * into v_product from public.merchant_products where id=(r->>'product_id')::uuid and merchant_id=p_merchant_id and status='active';
    if not found then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;
    v_total := v_total + (v_product.harga * v_qty);
    v_items := v_items || jsonb_build_array(jsonb_build_object('product_id',v_product.id,'nama',v_product.nama,'harga',v_product.harga,'qty',v_qty));
  end loop;
  insert into public.merchant_orders(merchant_id,merchant_name,customer_id,total_amount,status,items)
  select p_merchant_id,nama_merchant,auth.uid(),v_total,'pending',v_items from public.merchant_profiles where id=p_merchant_id
  returning * into v_order;
  return v_order;
end; $$;
revoke all on function public.create_merchant_order(uuid,jsonb) from public;
grant execute on function public.create_merchant_order(uuid,jsonb) to authenticated;
drop policy if exists merchant_orders_customer_select on public.merchant_orders;
create policy merchant_orders_customer_select on public.merchant_orders for select using (customer_id=auth.uid());
drop policy if exists merchant_orders_owner_select on public.merchant_orders;
create policy merchant_orders_owner_select on public.merchant_orders for select using (exists(select 1 from public.merchant_profiles m where m.id=merchant_id and m.owner_id=auth.uid()));
drop policy if exists merchant_orders_owner_update on public.merchant_orders;
create policy merchant_orders_owner_update on public.merchant_orders for update using (exists(select 1 from public.merchant_profiles m where m.id=merchant_id and m.owner_id=auth.uid())) with check (exists(select 1 from public.merchant_profiles m where m.id=merchant_id and m.owner_id=auth.uid()));

-- Make merchant order status constrained to known states where possible.
do $$ begin
  if not exists (select 1 from pg_constraint where conname='merchant_orders_status_check') then
    alter table public.merchant_orders add constraint merchant_orders_status_check check (status in ('pending','accepted','processing','ready','completed','cancelled','paid'));
  end if;
exception when others then null; end $$;

-- Keep merchant profiles searchable to the public only after approval/activation.

-- Public discovery of active VIP merchants only.
drop policy if exists merchant_vip_public_active on public.merchant_vip;
create policy merchant_vip_public_active on public.merchant_vip for select
using (status in ('active','approved') and (ends_at is null or ends_at >= now()));


-- ===== SYSTEM SETTINGS =====
create table if not exists public.app_settings (
  key text primary key, value text not null, updated_at timestamptz not null default now()
);
insert into public.app_settings(key,value) values
 ('app_name','Surabaya 24 Jam'), ('vip_commission','5'), ('vip_daily','15000')
on conflict (key) do nothing;
alter table public.app_settings enable row level security;
drop policy if exists app_settings_admin_all on public.app_settings;
create policy app_settings_admin_all on public.app_settings for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','developer')));

-- Public-safe settings needed by the frontend can be duplicated into constants; keep business/admin values private.
