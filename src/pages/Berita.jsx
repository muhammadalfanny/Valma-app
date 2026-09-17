import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Berita() {
  const navigate = useNavigate()
  const [berita, setBerita] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBerita = async () => {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .eq('status', 'Publik')
        .order('id', { ascending: false })

      if (!error) {
        setBerita(data || [])
      }

      setLoading(false)
    }

    fetchBerita()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-4 shadow-md">
        <h1 className="text-xl font-bold">📰 Berita Surabaya</h1>
        <p className="text-xs text-brand-100 mt-1">
          Informasi terbaru untuk Arek Suroboyo
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat berita...
          </p>
        ) : berita.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">
              Belum ada berita yang dipublikasikan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {berita.map((item) => (
              <article
                key={item.id}
                onClick={() => navigate(`/berita/${item.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer active:opacity-80"
              >
                {item.foto && (
                  <img
                    src={item.foto}
                    alt={item.judul}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-4">
                  <span className="inline-block bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    {item.kategori || 'Umum'}
                  </span>

                  <h2 className="font-bold text-gray-800 text-base mt-2">
                    {item.judul}
                  </h2>

                  <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-2">
                    {item.deskripsi}
                  </p>

                  <p className="text-[11px] text-brand-600 font-semibold mt-1">
                    Baca selengkapnya →
                  </p>

                  {(item.wilayah || item.kecamatan) && (
                    <p className="text-[10px] text-gray-400 mt-3">
                      📍 {item.wilayah || 'Surabaya'}
                      {item.kecamatan ? ` • ${item.kecamatan}` : ''}
                    </p>
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
