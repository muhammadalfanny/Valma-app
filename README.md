# VALMA — Surabaya 24 Jam

Aplikasi warga Surabaya berbasis React + Vite + Tailwind CSS v4 + Supabase + Leaflet.

## Jalankan di Termux / Acode

```bash
npm install
npm run dev
```

Buka `http://localhost:5173/` di browser yang sama.

Build produksi:

```bash
npm run build
```

## Supabase

1. Buka Supabase SQL Editor.
2. Jalankan seluruh isi `supabase/schema.sql`.
3. Pastikan tabel aplikasi lama seperti `profiles`, `reports`, `berita`, `event`, `produk_pasar`, `umkm`, dan lainnya tetap tersedia.
4. Pastikan role pada `profiles` menggunakan `user`, `admin`, atau `developer` sesuai aplikasi.
5. Review RLS sebelum go-live.

## Commerce / Merchant

- `/merchant` — dashboard pemilik merchant.
- `/merchant/:id` — halaman merchant publik + pemesanan.
- `/admin/merchant` — verifikasi merchant.
- `/admin/vip` — moderasi VIP.
- `/admin/pesanan` — monitor pesanan.

VIP:

- 5% dari setiap pesanan selama paket VIP aktif.
- Rp15.000 per hari tanpa skema bagi hasil.
- Persetujuan admin menetapkan periode awal (1 hari untuk paket harian, 30 hari untuk paket bagi hasil) pada source saat ini.
- Merchant VIP aktif mendapat prioritas tampil di Home.

## Keamanan order

Order customer dibuat melalui fungsi database `create_merchant_order()` sehingga harga dan total dihitung dari produk aktif di database, bukan dipercaya dari frontend.

## Yang masih membutuhkan akun/konfigurasi eksternal

Pembayaran otomatis VIP/order belum diikat ke payment gateway produksi. Integrasi Midtrans/Xendit atau provider lain memerlukan akun merchant, credential, webhook, dan konfigurasi backend/Edge Function milik pemilik aplikasi. **Jangan menaruh secret key di frontend.**
