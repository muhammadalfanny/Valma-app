import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const rupiah = (angka = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka)

export default function AdminDonasi() {
  const [donasi, setDonasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [memproses, setMemproses] = useState(null)
  const [filter, setFilter] = useState('perlu_verifikasi')

  const ambilData = async () => {
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('donasi')
      .select('id, nominal, status, metode_pembayaran, nama_donatur, catatan, anonim, created_at, program_id, program_donasi(judul)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMsg('Gagal memuat data donasi: ' + error.message)
      setDonasi([])
    } else {
      setDonasi(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    ambilData()
  }, [])

  const ubahStatus = async (id, statusBaru) => {
    setMemproses(id)
    const { error } = await supabase
      .from('donasi')
      .update({ status: statusBaru })
      .eq('id', id)

    setMemproses(null)

    if (error) {
      console.error(error)
      setErrorMsg('Gagal mengubah status: ' + error.message)
      return
    }

    setDonasi((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: statusBaru } : d))
    )
  }

  const cocokFilter = (item) => {
    const s = (item.status || '').toLowerCase()
    if (filter === 'semua') return true
    if (filter === 'perlu_verifikasi') return s.includes('menunggu verifikasi')
    if (filter === 'lunas') return s.includes('lunas')
    if (filter === 'lainnya') return !s.includes('menunggu verifikasi') && !s.includes('lunas')
    return true
  }

  const daftar = donasi.filter(cocokFilter)

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white px-4 py-5 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold">Verifikasi Donasi</h1>
          <p className="text-xs text-brand-100 mt-1">
            Cek pembayaran yang masuk, lalu tandai Lunas setelah dana benar-benar diterima.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            ['perlu_verifikasi', 'Perlu Verifikasi'],
            ['lunas', 'Lunas'],
            ['lainnya', 'Lainnya'],
            ['semua', 'Semua'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap ${
                filter === key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 p-3 rounded-lg mb-4 text-sm">{errorMsg}</div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 text-center mt-10">Memuat data donasi...</p>
        ) : daftar.length === 0 ? (
          <p className="text-sm text-gray-500 text-center mt-10">Tidak ada donasi pada kategori ini.</p>
        ) : (
          <div className="space-y-3">
            {daftar.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border p-4 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {d.anonim ? 'Donatur Anonim' : d.nama_donatur || '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Program: {d.program_donasi?.judul || '-'}
                    </p>
                    {d.catatan && (
                      <p className="text-xs text-gray-400 mt-1 italic">"{d.catatan}"</p>
                    )}
                  </div>
                  <p className="font-bold text-brand-600 text-sm whitespace-nowrap">
                    {rupiah(d.nominal)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {d.status}
                  </span>

                  <div className="flex gap-2">
                    {!(d.status || '').toLowerCase().includes('lunas') && (
                      <button
                        onClick={() => ubahStatus(d.id, 'Lunas')}
                        disabled={memproses === d.id}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold disabled:bg-gray-300"
                      >
                        Tandai Lunas
                      </button>
                    )}
                    {(d.status || '').toLowerCase().includes('lunas') && (
                      <button
                        onClick={() => ubahStatus(d.id, 'Menunggu Verifikasi')}
                        disabled={memproses === d.id}
                        className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
