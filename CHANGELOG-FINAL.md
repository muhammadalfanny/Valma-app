# VALMA — Pekerjaan yang sudah dikerjakan pada paket ini

- Perbaikan layering Leaflet agar tidak menutupi Bottom Navigation.
- Safe-area padding untuk halaman yang memakai navigasi bawah.
- Login didesain ulang dengan tema biru-putih dan pesan error yang lebih ramah.
- Merchant dijadikan Protected Route.
- Merchant Center diperluas menjadi dashboard profil, VIP, produk, pesanan, omzet, dan halaman publik.
- Halaman merchant publik dibuat dengan pemesanan berbasis produk aktif.
- Order customer menggunakan database RPC untuk menghitung harga dari database sehingga total tidak dipercaya dari frontend.
- Admin Commerce ditambah modul Verifikasi Merchant.
- Aktivasi VIP mensyaratkan merchant sudah aktif dan menetapkan periode awal.
- Admin Settings dibuat dapat menyimpan nilai bisnis ke `app_settings`.
- Home menampilkan merchant VIP aktif sebagai Merchant Pilihan.
- Schema Supabase ditambah products, order fields, RLS order/product, public discovery, RPC order aman, VIP public policy, dan app settings.
- Asset template Vite yang tidak dipakai dihapus.

## Belum termasuk

- Payment gateway produksi (Midtrans/Xendit/provider lain) dan webhook karena membutuhkan akun/credential eksternal.
- Migrasi otomatis ke Supabase; `supabase/schema.sql` harus dijalankan oleh pemilik project.
- Build production tidak divalidasi di environment paket ini karena dependency registry tidak tersedia saat audit.
