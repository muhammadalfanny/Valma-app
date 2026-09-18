import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setPesan(""); setError(false);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (loginError) {
      setLoading(false); setError(true);
      setPesan("Email atau password tidak benar. Silakan coba lagi.");
      return;
    }
    const { data: profil, error: profilError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profilError) console.warn("Profil belum dapat dibaca:", profilError.message);
    setLoading(false);
    setPesan("Login berhasil. Mengarahkan…");

    const redirectTo = location.state?.redirectTo;
    if (redirectTo) {
      navigate(redirectTo);
    } else {
      navigate(profil?.role === "admin" || profil?.role === "developer" ? "/admin" : "/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 via-white to-white px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white flex items-center justify-center font-black shadow-xl shadow-brand-900/20">V</div>
          <h1 className="text-2xl font-black text-gray-900 mt-4 tracking-tight">Surabaya 24 Jam</h1>
          <p className="text-gray-500 text-sm mt-1">Satu ruang informasi dan layanan warga Surabaya.</p>
        </div>
        <div className="bg-white rounded-3xl border border-brand-100 shadow-[var(--shadow-card-lg)] p-6 md:p-7">
          <div className="mb-5"><h2 className="text-lg font-extrabold text-gray-900">Selamat datang kembali</h2><p className="text-xs text-gray-500 mt-1">Masuk untuk mengakses fitur personal dan laporanmu.</p></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="field-label">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" className="input-field" placeholder="email@contoh.com" /></div>
            <div><label className="field-label">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" className="input-field" placeholder="Masukkan password" /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Memproses…" : "Masuk ke Surabaya 24 Jam"}</button>
          </form>
          {pesan && <div className={`mt-4 rounded-xl border p-3 text-xs font-semibold ${error ? "semantic-danger" : "bg-brand-50 text-brand-700 border-brand-100"}`}>{pesan}</div>}
          <p className="mt-6 text-center text-sm text-gray-500">Belum punya akun? <Link to="/register" className="text-brand-600 font-bold">Daftar sekarang</Link></p>
          <Link to="/" className="block text-center text-xs text-gray-400 mt-4">← Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
