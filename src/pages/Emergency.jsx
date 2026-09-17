export default function Emergency() {
  const layanan = [
    {
      nama: 'Command Center Surabaya',
      nomor: '112',
      icon: '🚨',
      warna: 'bg-red-50 text-red-700'
    },
    {
      nama: 'Polisi',
      nomor: '110',
      icon: '👮',
      warna: 'bg-blue-50 text-blue-700'
    },
    {
      nama: 'Pemadam Kebakaran',
      nomor: '113',
      icon: '🚒',
      warna: 'bg-orange-50 text-orange-700'
    },
    {
      nama: 'Darurat Kesehatan',
      nomor: '119',
      icon: '🚑',
      warna: 'bg-green-50 text-green-700'
    },
    {
      nama: 'Basarnas / SAR',
      nomor: '115',
      icon: '🛟',
      warna: 'bg-cyan-50 text-cyan-700'
    },
    {
      nama: 'PLN',
      nomor: '123',
      icon: '⚡',
      warna: 'bg-yellow-50 text-yellow-700'
    },
    {
      nama: 'BPBD Surabaya',
      nomor: '112',
      icon: '🌊',
      warna: 'bg-sky-50 text-sky-700'
    },
    {
      nama: 'Pemkot Surabaya',
      nomor: '112',
      icon: '🏛️',
      warna: 'bg-purple-50 text-purple-700'
    }
  ]

  const panggil = (nomor) => {
    window.location.href = `tel:${nomor}`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">🚨 Emergency Center</h1>
          <p className="text-xs text-brand-100 mt-1">
            Akses cepat layanan darurat Surabaya
          </p>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="bg-brand-600 text-white rounded-2xl p-5 mb-5 shadow-sm">
          <p className="text-xs font-semibold opacity-90">
            DALAM KEADAAN DARURAT?
          </p>

          <h2 className="text-2xl font-black mt-1">
            Tetap tenang.
          </h2>

          <p className="text-xs mt-2 opacity-90">
            Pilih layanan yang kamu butuhkan untuk melakukan panggilan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {layanan.map((item) => (
            <button
              key={`${item.nama}-${item.nomor}`}
              onClick={() => panggil(item.nomor)}
              className={`${item.warna} bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm active:scale-95 transition`}
            >
              <div className="text-3xl">{item.icon}</div>

              <p className="font-bold text-sm mt-3">
                {item.nama}
              </p>

              <p className="text-sm font-black mt-1">
                📞 {item.nomor}
              </p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 mt-5">
          <h3 className="font-bold text-gray-800 text-sm">
            ℹ️ Bingung harus lapor ke mana?
          </h3>

          <div className="text-xs text-gray-600 mt-3 space-y-2 leading-relaxed">
            <p>
              🚨 <b>Tawuran, keributan, ancaman, atau gangguan keamanan:</b>
              hubungi Polisi 110 atau 112.
            </p>

            <p>
              🔥 <b>Kebakaran:</b> hubungi Damkar 113 atau 112.
            </p>

            <p>
              🚑 <b>Kecelakaan atau kondisi medis darurat:</b>
              hubungi 119 atau 112.
            </p>

            <p>
              🌊 <b>Banjir atau bencana:</b> hubungi 112.
            </p>

            <p>
              🧍 <b>Orang terlantar atau kondisi sosial darurat:</b>
              hubungi 112 untuk mendapatkan arahan layanan yang sesuai.
            </p>

            <p>
              ⚡ <b>Gangguan listrik:</b> hubungi PLN 123.
            </p>

            <p>
              🛟 <b>Keadaan yang membutuhkan pencarian dan pertolongan:</b>
              hubungi Basarnas 115.
            </p>

            <p>
              ❓ <b>Tidak tahu harus menghubungi siapa?</b>
              Hubungi 112 untuk mendapatkan arahan layanan darurat.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mt-4">
          <h3 className="font-bold text-yellow-800 text-sm">
            ⚠️ Gunakan dengan bijak
          </h3>

          <p className="text-xs text-yellow-700 mt-2 leading-relaxed">
            Gunakan layanan darurat hanya untuk keadaan yang benar-benar
            membutuhkan bantuan. Nomor dan layanan dapat berubah mengikuti
            ketentuan penyedia layanan.
          </p>
        </div>
      </main>
    </div>
  )
}
