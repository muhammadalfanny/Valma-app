import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Beasiswa() {
  const [beasiswa, setBeasiswa] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBeasiswa = async () => {
      const { data, error } = await supabase
        .from('beasiswa')
        .select('*')
        .eq('status', 'Publik')
        .order('created_at', { ascending: false })

      if (!error) {
        setBeasiswa(data || [])
      }

      setLoading(false)
    }

    fetchBeasiswa()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🎓 Beasiswa</h1>
        <p className="text-xs text-brand-100 mt-1">
          Informasi beasiswa untuk warga Surabaya
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat beasiswa...
          </p>
        ) : beasiswa.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-gray-600 text-sm font-semibold">
              Belum ada beasiswa yang tersedia.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Informasi beasiswa akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {beasiswa.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <span className="inline-block bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  🎓 BEASISWA
                </span>

                <h2 className="font-bold text-gray-800 text-base mt-2">
                  {item.judul}
                </h2>

                <p className="text-sm font-semibold text-brand-600 mt-1">
                  {item.penyelenggara}
                </p>

                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                  {item.deskripsi}
                </p>

                <div className="mt-3 space-y-1">
                  {item.jenjang && (
                    <p className="text-xs text-gray-500">
                      📚 Jenjang: {item.jenjang}
                    </p>
                  )}

                  {item.batas_pendaftaran && (
                    <p className="text-xs text-gray-500">
                      ⏰ Batas pendaftaran: {item.batas_pendaftaran}
                    </p>
                  )}
                </div>

                {item.kontak && (
                  <a
                    href={item.kontak}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center bg-brand-600 text-white py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    Lihat / Daftar
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
