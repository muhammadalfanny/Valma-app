// Data QRIS statis resmi VALMA / Surabaya 24 Jam.
// PENTING: ini QRIS statis (satu kode QR tetap untuk semua transaksi),
// bukan QRIS dinamis per-nominal. Nominal harus diisi manual oleh
// pengirim di aplikasi e-wallet/mobile banking-nya masing-masing.
// Jangan ubah string ini kecuali memang mengganti akun QRIS resmi,
// karena string ini sudah termasuk kode checksum (CRC) resmi dari
// penyedia QRIS — mengedit sebagian isinya bisa membuat QR tidak valid.
export const QRIS_DATA =
  '00020101021126570011ID.DANA.WWW011893600915396918421102099691842110303UMI51440014ID.CO.QRIS.WWW0215ID10254236132030303UMI5204899953033605802ID5915SURABAYA 24 JAM6015Kab. Banyuwangi6105684316304E4FB'
