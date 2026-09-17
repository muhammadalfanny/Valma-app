import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function NotifikasiWilayah() {
  const [notifikasi, setNotifikasi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifikasi = async () => {
      const { data, error } = await supabase
        .from('notifikasi_wilayah')
        .select('*')
        .eq('status', 'Publik')
        .order('created_at', { ascending: false })

      if (!error) {
        setNotifikasi(data || [])
      }

      setLoading(false)
    }

    fetchNotifikasi()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">📣 Woro-Woro</h1>
        <p className="text-xs text-brand-100 mt-1">
          Informasi penting untuk warga Surabaya
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat informasi...
          </p>
        ) : notifikasi.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">📣</div>
            <p className="text-sm text-gray-600 font-semibold">
              Belum ada informasi wilayah.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Informasi dari admin akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifikasi.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <span className="inline-block bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full">
                  📣 INFORMASI
                </span>

                <h2 className="font-bold text-gray-800 mt-2">
                  {item.judul}
                </h2>

                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {item.pesan}
                </p>

                {(item.kecamatan || item.kelurahan) && (
                  <div className="bg-gray-50 rounded-xl p-3 mt-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">
                      Wilayah
                    </p>

                    <p className="text-xs text-gray-700 mt-1">
                      📍 {item.kecamatan || 'Semua Kecamatan'}
                      {item.kelurahan && ` • ${item.kelurahan}`}
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 mt-3">
                  🕐 {new Date(item.created_at).toLocaleString('id-ID')}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
