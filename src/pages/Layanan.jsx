import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Layanan() {
  const [layanan, setLayanan] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLayanan = async () => {
      const { data } = await supabase
        .from('layanan_penting')
        .select('*')
        .eq('status', 'Publik')
        .order('nama', { ascending: true })

      setLayanan(data || [])
      setLoading(false)
    }

    fetchLayanan()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">📞 Layanan Penting</h1>
        <p className="text-xs text-brand-100 mt-1">
          Informasi layanan penting untuk warga Surabaya
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat layanan...
          </p>
        ) : layanan.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">
              Belum ada layanan yang tersedia.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {layanan.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <span className="inline-block bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full">
                  {item.kategori || 'Layanan'}
                </span>

                <h2 className="font-bold text-gray-800 mt-2">
                  {item.nama}
                </h2>

                {item.deskripsi && (
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {item.deskripsi}
                  </p>
                )}

                {item.alamat && (
                  <p className="text-xs text-gray-500 mt-2">
                    📍 {item.alamat}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  {item.telepon && (
                    <a
                      href={`tel:${item.telepon}`}
                      className="flex-1 text-center bg-brand-600 text-white py-2.5 rounded-xl text-xs font-bold"
                    >
                      📞 Hubungi
                    </a>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold"
                    >
                      🔗 Buka
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
