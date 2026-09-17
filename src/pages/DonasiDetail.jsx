import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const rupiah = (angka = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka)

export default function DonasiDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [program, setProgram] = useState(null)
  const [penyaluran, setPenyaluran] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true)

      const { data: programData, error: programError } = await supabase
        .from('program_donasi')
        .select('*')
        .eq('id', id)
        .eq('status', 'Publik')
        .single()

      if (programError) {
        console.error(programError)
        setError(true)
        setLoading(false)
        return
      }

      const { data: penyaluranData } = await supabase
        .from('penyaluran_donasi')
        .select('*')
        .eq('program_id', id)
        .order('tanggal_penyaluran', { ascending: false })

      setProgram(programData)
      setPenyaluran(penyaluranData || [])
      setLoading(false)
    }

    loadDetail()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">
          Memuat detail program...
        </p>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border p-8 text-center mt-10">
          <div className="text-4xl mb-3">❤️</div>
          <h1 className="font-bold text-gray-800">
            Program tidak ditemukan
          </h1>
          <button
            onClick={() => navigate('/donasi')}
            className="mt-5 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold"
          >
            Kembali ke Donasi
          </button>
        </div>
      </div>
    )
  }

  const target = Number(program.target_dana || 0)
  const terkumpul = Number(program.dana_terkumpul || 0)

  const persen =
    target > 0
      ? Math.min(100, Math.round((terkumpul / target) * 100))
      : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/donasi')}
            className="text-xs bg-white/15 px-3 py-2 rounded-xl"
          >
            ← Kembali
          </button>

          <h1 className="text-xl font-bold mt-4">
            ❤️ Detail Program
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <section className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          {program.foto_url ? (
            <img
              src={program.foto_url}
              alt={program.judul}
              className="w-full h-52 object-cover"
            />
          ) : (
            <div className="h-40 bg-brand-50 flex items-center justify-center text-6xl">
              ❤️
            </div>
          )}

          <div className="p-5">
            <span className="text-[10px] font-bold text-brand-600 uppercase">
              {program.kategori || 'Sosial'}
            </span>

            <h2 className="text-xl font-bold text-gray-800 mt-1">
              {program.judul}
            </h2>

            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {program.deskripsi}
            </p>

            <div className="mt-5">
              <div className="flex justify-between text-sm font-bold">
                <span>{rupiah(terkumpul)}</span>
                <span>{persen}%</span>
              </div>

              <div className="h-3 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full"
                  style={{ width: `${persen}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Target {rupiah(target)}</span>
                <span>{program.jumlah_donatur || 0} donatur</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/donasi/${program.id}/form`)}
              className="w-full mt-6 bg-brand-600 text-white py-3 rounded-xl font-bold"
            >
              ❤️ Donasi Sekarang
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border p-5 shadow-sm">
          <h2 className="font-bold text-gray-800">
            🔎 Transparansi Program
          </h2>

          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Dana yang masuk akan dicatat berdasarkan program.
            Penyaluran dan penggunaan dana akan ditampilkan
            agar dapat dipantau secara transparan.
          </p>
        </section>

        <section className="bg-white rounded-2xl border p-5 shadow-sm">
          <h2 className="font-bold text-gray-800">
            📋 Penyaluran Dana
          </h2>

          {penyaluran.length === 0 ? (
            <p className="text-xs text-gray-400 mt-3">
              Belum ada penyaluran dana yang tercatat.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {penyaluran.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-xl p-3"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {item.penerima}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.keterangan || 'Penyaluran dana program'}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-brand-600">
                      {rupiah(item.jumlah)}
                    </p>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(item.tanggal_penyaluran).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
