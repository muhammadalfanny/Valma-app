import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Wilayah() {
  const [wilayah, setWilayah] = useState([])
  const [loading, setLoading] = useState(true)
  const [cari, setCari] = useState('')

  useEffect(() => {
    const fetchWilayah = async () => {
      const { data, error } = await supabase
        .from('wilayah_surabaya')
        .select('*')
        .eq('status', 'Publik')
        .order('kecamatan', { ascending: true })

      if (!error) {
        setWilayah(data || [])
      }

      setLoading(false)
    }

    fetchWilayah()
  }, [])

  const hasil = wilayah.filter((item) =>
    `${item.kecamatan} ${item.kelurahan}`
      .toLowerCase()
      .includes(cari.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🏙️ Wilayah Surabaya</h1>
        <p className="text-xs text-brand-100 mt-1">
          Kecamatan & Kelurahan
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="🔎 Cari kecamatan atau kelurahan..."
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm shadow-sm outline-none"
        />

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat wilayah...
          </p>
        ) : hasil.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
            <p className="text-gray-500 text-sm">
              Wilayah tidak ditemukan.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {hasil.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <span className="text-[10px] font-bold text-brand-600 uppercase">
                  Kecamatan
                </span>

                <h2 className="font-bold text-gray-800 text-base mt-1">
                  {item.kecamatan}
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                  📍 Kelurahan: {item.kelurahan}
                </p>

                {item.deskripsi && (
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {item.deskripsi}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
