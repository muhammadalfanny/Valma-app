import { useState } from "react";
import { Link } from "react-router-dom";

export default function CakAI() {
  const [pesan, setPesan] = useState("");
  const [tampilkanInfo, setTampilkanInfo] = useState(false);

  function handleKirim(e) {
    e.preventDefault();
    if (!pesan.trim()) return;
    setTampilkanInfo(true);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-red-600 text-white px-4 py-3 shadow">
        <h1 className="font-bold text-lg">Cak AI</h1>
        <p className="text-xs text-red-100">Asisten Surabaya 24 Jam</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow max-w-[80%]">
          <p className="text-sm text-gray-800">
            Sugeng rawuh! Cak AI masih dalam pengembangan, durung iso jawab dhewe saiki. 🙏
          </p>
        </div>

        {tampilkanInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl rounded-tl-none px-4 py-3 shadow max-w-[85%]">
            <p className="text-sm text-gray-800 mb-2">
              Fitur chat langsung ini masih <b>Coming Soon</b>. Sementara,
              silakan kirim kebutuhan Anda (lamar loker, buatkan CV, atau
              lainnya) lewat Pos Cak AI — nanti diproses untuk Anda.
            </p>
            <Link
              to="/pos-cak-ai"
              className="inline-block bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Buka Pos Cak AI
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={handleKirim} className="p-3 bg-white border-t flex gap-2">
        <input
          type="text"
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          placeholder="Tulis pesan ke Cak AI..."
          className="flex-1 border rounded-full px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
