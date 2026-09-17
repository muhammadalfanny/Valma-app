import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Capacitor } from "@capacitor/core";
import BottomNav from "../components/BottomNav";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const fiturUtama = [
  { to: "/peta", label: "Peta Kota", desc: "Info & laporan real-time", icon: "🗺️", color: "brand" },
  { to: "/berita", label: "Berita", desc: "Kabar terbaru Surabaya", icon: "📰", color: "brand" },
  { to: "/layanan", label: "Layanan", desc: "Kontak layanan penting", icon: "🏛️", color: "brand" },
  { to: "/event", label: "Event", desc: "Kegiatan di kotamu", icon: " 🎪", color: "brand" },
  { to: "/pasar", label: "Pasar", desc: "Jual beli warga Surabaya", icon: "🛒", color: "brand" },
  { to: "/lowongan", label: "Loker", desc: "Info lowongan kerja", icon: "💼", color: "brand" },
];

const fiturLainnya = [
  { to: "/emergency", label: "Darurat", icon: "🚨" },
  { to: "/wilayah", label: "Wilayah", icon: "🏙️" },
  { to: "/notifikasi", label: "Woro-Woro", icon: "📣" },
  { to: "/forum", label: "Uneg-Uneg", icon: "💬" },
  { to: "/beasiswa", label: "Beasiswa", icon: "🎓" },
  { to: "/polling", label: "Polling", icon: "📊" },
  { to: "/donasi", label: "Donasi", icon: "❤️" },
  { to: "/qris-surabaya-24-jam", label: "Pembayaran", icon: "💳" },
];

export default function Home() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState([-7.2575, 112.7521]);
  const [reports, setReports] = useState([]);
  const [fotoSigned, setFotoSigned] = useState({});
  const [pasarPilihan, setPasarPilihan] = useState([]);
  // Banner instal cuma boleh nongol di WEBSITE. Kalau ini lagi jalan di
  // DALAM aplikasi Android (dibungkus Capacitor), otomatis disembunyikan
  // dari awal, gak nunggu di-klik ✕ dulu.
  const [showInstallBanner, setShowInstallBanner] = useState(!Capacitor.isNativePlatform());

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("Gagal ambil GPS, pakai default Surabaya", err),
        { enableHighAccuracy: true }
      );
    }
    fetchReports();
    fetchPasarPilihan();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Gagal memuat laporan:", error);
      return;
    }
    setReports(data || []);

    const hasil = {};
    for (const rep of data || []) {
      if (!rep.foto_url || !rep.terverifikasi) continue;
      const namaFile = rep.foto_url.split("/foto-laporan/").pop();
      if (!namaFile) continue;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("foto-laporan")
        .createSignedUrl(namaFile, 3600);

      if (!signedError && signedData?.signedUrl) {
        hasil[rep.id] = signedData.signedUrl;
      }
    }
    setFotoSigned(hasil);
  };

  const fetchPasarPilihan = async () => {
    const { data, error } = await supabase
      .from("pasar")
      .select("id,nama,kategori,harga,lokasi,vip_plan,vip_status,vip_selesai")
      .eq("status", "Publik")
      .eq("diban", false)
      .eq("vip_status", "active")
      .or(`vip_selesai.is.null,vip_selesai.gte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Gagal memuat Pasar pilihan:", error);
      return;
    }
    setPasarPilihan(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-with-bottom-nav">
      {/* ===== BANNER INSTAL APLIKASI (hanya di web, otomatis sembunyi di app) ===== */}
      {showInstallBanner && (
        <div className="bg-white flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 sticky top-0 z-50">
          <button
            onClick={() => setShowInstallBanner(false)}
            className="text-gray-400 text-base leading-none w-5 shrink-0"
            aria-label="Tutup"
          >
            ✕
          </button>
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-[11px] shrink-0">
            S24
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-gray-800 leading-tight truncate">Surabaya 24 Jam App</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">Lebih cepat &amp; nyaman lewat aplikasi</p>
          </div>
          <a
            href="/Surabaya24Jam.apk"
            download
            className="bg-brand-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shrink-0"
          >
            Instal
          </a>
        </div>
      )}

      {/* ===== HERO ===== */}
      <header className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-extrabold text-sm">
                S24
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-brand-100 uppercase">
                  Layanan Warga
                </p>
                <p className="text-sm font-bold -mt-0.5">Surabaya 24 Jam</p>
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold"
                  title={user.email}
                >
                  {user.email?.[0]?.toUpperCase() || "U"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[11px] font-semibold bg-white/15 px-2.5 py-1.5 rounded-lg active:bg-white/25"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white text-brand-700 px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-sm"
              >
                Masuk
              </Link>
            )}
          </div>

          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
            Kabar &amp; layanan kota,{"\n"}dalam satu genggaman.
          </h1>
          <p className="text-brand-100 text-sm mt-2 leading-relaxed max-w-sm">
            Pantau kejadian real-time, laporkan masalah di sekitarmu, dan akses
            layanan publik Surabaya — semuanya dari satu aplikasi.
          </p>

          <div className="flex gap-2.5 mt-5">
            <button
              onClick={() => (user ? navigate("/report") : navigate("/login"))}
              className="flex-1 bg-white text-brand-700 font-bold text-sm rounded-xl py-3 shadow-lg active:scale-[0.98] transition-transform"
            >
              📢 Lapor Sekarang
            </button>
            <Link
              to="/emergency"
              className="w-14 flex items-center justify-center rounded-xl bg-white/15 border border-white/25 text-xl active:scale-[0.98] transition-transform"
              title="Kontak Darurat"
            >
              🚨
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        {/* ===== FITUR UTAMA ===== */}
        <section className="-mt-5">
          <div className="grid grid-cols-3 gap-3">
            {fiturUtama.map((f) => (
              <Link key={f.to} to={f.to} className="card-interactive p-3.5 flex flex-col items-start">
                <span className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-lg mb-2">
                  {f.icon}
                </span>
                <span className="text-[12.5px] font-bold text-gray-800 leading-tight">{f.label}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{f.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== FITUR LAINNYA (scroll horizontal, tidak memenuhi layar) ===== */}
        <section className="mt-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5 px-0.5">
            Layanan Lainnya
          </h2>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {fiturLainnya.map((f) => (
              <Link
                key={f.to}
                to={f.to}
                className="shrink-0 w-[74px] flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-gray-100 p-3 active:scale-95 transition-transform"
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">
                  {f.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {role === "admin" || role === "developer" ? (
          <Link
            to="/admin"
            className="mt-5 flex items-center justify-between card p-4 bg-brand-900 border-brand-900 text-white"
          >
            <div>
              <p className="text-sm font-bold">Panel Admin</p>
              <p className="text-[11px] text-brand-200 mt-0.5">Kelola laporan &amp; semua modul</p>
            </div>
            <span className="text-xl">→</span>
          </Link>
        ) : null}

        {/* ===== PASAR PILIHAN (listing VIP aktif dari tabel `pasar`) ===== */}
        {pasarPilihan.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pasar Pilihan</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Prioritas untuk listing VIP aktif</p>
              </div>
              <Link to="/pasar" className="text-xs font-bold text-brand-600">Lihat semua →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {pasarPilihan.map((p) => (
                <Link
                  key={p.id}
                  to="/pasar"
                  className="shrink-0 w-64 card p-4 border-brand-100 bg-gradient-to-br from-white to-brand-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-xl">
                      {p.vip_plan === "daily" ? "⭐" : "📈"}
                    </div>
                    <div className="min-w-0">
                      <b className="text-sm truncate block">{p.nama}</b>
                      <span className="badge-brand mt-1">VIP</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 truncate">{p.kategori} · {p.lokasi || '-'}</p>
                  <p className="text-[11px] text-brand-700 font-semibold mt-2">Prioritas tampil di Pasar →</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== PETA REAL-TIME ===== */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Peta Real-Time</h2>
            <Link to="/peta" className="text-xs font-bold text-brand-600">Lihat penuh →</Link>
          </div>
          <div className="card overflow-hidden h-[38vh] relative isolate">
            <MapContainer
              center={position}
              zoom={14}
              scrollWheelZoom={false}
              style={{ width: "100%", height: "100%", zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>Lokasi Anda saat ini</Popup>
              </Marker>

              {reports.map((rep) =>
                rep.latitude && rep.longitude ? (
                  <Marker key={rep.id} position={[rep.latitude, rep.longitude]}>
                    <Popup>
                      <strong>{rep.judul}</strong><br />
                      <span className="text-xs text-gray-500 uppercase">{rep.kategori}</span><br />
                      <p className="text-xs mt-1">{rep.deskripsi}</p>
                    </Popup>
                  </Marker>
                ) : null
              )}
            </MapContainer>
          </div>
        </section>

        {/* ===== FEED LAPORAN ===== */}
        <section className="mt-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5 px-0.5">
            Laporan Warga Terbaru
          </h2>

          {reports.length === 0 ? (
            <div className="card p-6 text-center text-gray-500 text-sm">
              <p>Belum ada laporan aktif.</p>
              <p className="text-xs text-gray-400 mt-1">
                Jadilah yang pertama mengirim laporan di sekitar wilayahmu!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reports.map((rep) => (
                <div key={rep.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="badge-brand uppercase">{rep.kategori}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(rep.created_at).toLocaleDateString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-1">
                    {rep.judul}
                    {rep.terverifikasi && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="#378ADD"
                        className="w-3.5 h-3.5 shrink-0"
                        role="img"
                      >
                        <title>Terverifikasi admin</title>
                        <path d="M12 2l2.4 1.2 2.6-.6 1.5 2.2 2.5.9.1 2.6 1.9 1.7-1.9 1.7-.1 2.6-2.5.9-1.5 2.2-2.6-.6L12 22l-2.4-1.2-2.6.6-1.5-2.2-2.6.6L12 2z" />
                        <path d="M9.5 12.5l1.8 1.8 3.7-3.9" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{rep.deskripsi}</p>

                  {rep.foto_url && rep.terverifikasi && (
                    fotoSigned[rep.id] ? (
                      <img
                        src={fotoSigned[rep.id]}
                        alt="Bukti Laporan"
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-xl mb-3 text-xs text-gray-400">
                        Memuat foto...
                      </div>
                    )
                  )}

                  <div className="flex justify-between items-center text-[11px] text-gray-500 pt-2.5 border-t border-gray-100">
                    <span className="truncate max-w-[180px]">
                      Status:{" "}
                      <strong
                        className={
                          rep.status === "Selesai"
                            ? "text-emerald-600"
                            : rep.status === "Diproses"
                            ? "text-brand-600"
                            : "text-amber-600"
                        }
                      >
                        {rep.status}
                      </strong>
                    </span>
                    <span className="text-brand-600 font-semibold">Surabaya</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
