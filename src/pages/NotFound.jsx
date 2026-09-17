import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🗺️</div>
        <h1 className="text-2xl font-black text-gray-800">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Sepertinya kamu mengikuti tautan yang salah, atau halaman ini sudah dipindahkan.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 bg-brand-600 text-white text-sm font-bold px-6 py-3 rounded-xl"
        >
          ⬅ Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
