import AppHeader from '../components/AppHeader'

export default function PasarMitra() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <AppHeader title="Daftar Mitra" backTo="/pasar" />
      <main className="max-w-2xl mx-auto p-4">
        <div className="text-center mt-4 mb-6">
          <h1 className="text-lg font-bold text-gray-800">Mau jadi mitra yang mana?</h1>
          <p className="text-xs text-gray-500 mt-1">Pilih salah satu untuk mulai daftar.</p>
        </div>

        <div className="space-y-3">
          <a
            href="/pasar/toko"
            className="block bg-white rounded-2xl border border-gray-200 shadow-sm p-5 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl">🏪</div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Daftar Toko</h2>
                <p className="text-xs text-gray-500 mt-0.5">Jual produk atau jasa kamu di Pasar</p>
              </div>
              <span className="text-gray-300 text-xl">→</span>
            </div>
          </a>

          <a
            href="/pasar/driver"
            className="block bg-white rounded-2xl border border-gray-200 shadow-sm p-5 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl">🛵</div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Daftar CAK JASTIP</h2>
                <p className="text-xs text-gray-500 mt-0.5">Jadi kurir antar-jemput pesanan Pasar</p>
              </div>
              <span className="text-gray-300 text-xl">→</span>
            </div>
          </a>
        </div>
      </main>
    </div>
  )
}
