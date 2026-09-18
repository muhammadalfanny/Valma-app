import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function PosCakAI() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kategori, setKategori] = useState("lamar-loker");
  const [pesan, setPesan] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      let file_url = null;

      if (file) {
        const namaFile = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("file_bantuan")
          .upload(namaFile, file);

        if (uploadError) throw uploadError;
        file_url = uploadData.path;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id || null;

      const { error: insertError } = await supabase.from("bantuan_user").insert({
        user_id,
        nama,
        email,
        kategori,
        pesan,
        file_url,
      });

      if (insertError) throw insertError;

      setSukses(true);
      setNama("");
      setEmail("");
      setPesan("");
      setFile(null);
    } catch (err) {
      setError("Gagal mengirim: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sukses) {
    return (
      <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-xl shadow text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">Terima kasih!</h1>
        <p className="text-gray-700">
          Permintaan Anda sudah kami terima dan akan segera diproses.
        </p>
        <button
          onClick={() => setSukses(false)}
          className="mt-4 text-sm text-red-600 underline"
        >
          Kirim permintaan lain
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-6">
      <h1 className="text-xl font-bold text-red-600 mb-1">Pos Cak AI</h1>
      <p className="text-gray-600 text-sm mb-4">
        Butuh bantuan lamar loker, buatkan CV, atau hal lain? Kirim di sini,
        nanti diproses untuk Anda.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama (opsional)</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="lamar-loker">Lamar Loker</option>
            <option value="buat-cv">Minta Dibuatkan CV</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Upload File (CV, dll - opsional)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pesan (opsional)</label>
          <textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Mengirim..." : "Kirim"}
        </button>
      </form>
    </div>
  );
}
