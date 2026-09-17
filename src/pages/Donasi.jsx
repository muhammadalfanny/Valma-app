import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const rupiah = (angka = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka)

export default function Donasi() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadPrograms = async () => {
      const { data, error } = await supabase
        .from('program_donasi')
        .select('*')
        .eq('status', 'Publik')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setError(true)
      } else {
        setPrograms(data || [])
      }

      setLoading(false)
    }

    loadPrograms()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-6 shadow-md">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-brand-100 font-semibold uppercase">
            Program Sosial
          </p>

          <h1 className="text-2xl font-bold mt-1">
            ❤️ Donasi
          </h1>

          <p className="text-sm text-brand-100 mt-2">
            Bantu program sosial yang membutuhkan.
            Dana donasi akan dicatat dan dilaporkan secara transparan.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <div className="bg-white border border-brand-100 rounded-2xl p-4 mb-5 shadow-sm">
          <h2 className="font-bold text-gray-800">
            🔎 Transparansi Donasi
          </h2>

          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Setiap program akan memiliki informasi target,
            dana terkumpul, jumlah donatur, penyaluran,
            penerima, dan laporan penggunaan dana.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-12">
            Memuat program donasi...
          </p>
        ) : error ? (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <div className="text-4xl mb-3">❤️</div>
            <h2 className="font-bold text-gray-800">
              Program donasi sedang disiapkan
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              Belum ada program yang dapat ditampilkan saat ini.
            </p>
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <div className="text-4xl mb-3">❤️</div>
            <h2 className="font-bold text-gray-800">
              Belum ada program donasi
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              Program yang sudah dipublikasikan akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {programs.map((program) => {
              const target = Number(program.target_dana || 0)
              const terkumpul = Number(program.dana_terkumpul || 0)

              const persen = target > 0
                ? Math.min(100, Math.round((terkumpul / target) * 100))
                : 0

              return (
                <article
                  key={program.id}
                  onClick={() => navigate(`/donasi/${program.id}`)}
                  className="bg-white rounded-2xl border overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition"
                >
                  {program.foto_url ? (
                    <img
                      src={program.foto_url}
                      alt={program.judul}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="h-32 bg-brand-50 flex items-center justify-center text-5xl">
                      ❤️
                    </div>
                  )}

                  <div className="p-4">
                    <span className="text-[10px] font-bold text-brand-600 uppercase">
                      {program.kategori || 'Sosial'}
                    </span>

                    <h2 className="font-bold text-gray-800 mt-1">
                      {program.judul}
                    </h2>

                    <p className="text-xs text-gray-500 mt-2">
                      {program.deskripsi}
                    </p>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{rupiah(terkumpul)}</span>
                        <span>{persen}%</span>
                      </div>

                      <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-brand-600 rounded-full"
                          style={{ width: `${persen}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-gray-400 mt-2">
                        Target {rupiah(target)} · {program.jumlah_donatur || 0} donatur
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/donasi/${program.id}`)
                      }}
                      className="w-full mt-4 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-bold"
                    >
                      Lihat Program
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
