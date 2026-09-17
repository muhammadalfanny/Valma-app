import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function DonasiForm() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [nama, setNama] = useState('')
  const [nominal, setNominal] = useState('')
  const [anonim, setAnonim] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState('')

  const kirimDonasi = async (e) => {
    e.preventDefault()
    setPesan('')

    const jumlah = Number(nominal)

    if (!jumlah || jumlah <= 0) {
      setPesan('Masukkan nominal donasi yang valid.')
      return
    }

    setLoading(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user

    if (!user) {
      setLoading(false)
      setPesan('Silakan login terlebih dahulu untuk melakukan donasi.')
      return
    }

    const { data: donasiBaru, error } = await supabase
      .from('donasi')
      .insert([{
        program_id: id,
        user_id: user.id,
        nama_donatur: anonim ? 'Anonim' : nama.trim(),
        nominal: jumlah,
        metode_pembayaran: 'QR',
        status: 'Menunggu',
        anonim,
        catatan: catatan.trim() || null,
      }])
      .select('id')
      .single()

    setLoading(false)

    if (error) {
      console.error(error)
      setPesan('Donasi belum berhasil dicatat. Silakan coba lagi.')
      return
    }

    alert('Donasi berhasil dicatat. Silakan lanjutkan pembayaran.')
    navigate(`/donasi/${id}/pembayaran?donasi=${donasiBaru.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/donasi/${id}`)}
            className="text-xs bg-white/15 px-3 py-2 rounded-xl"
          >
            ← Kembali
          </button>

          <h1 className="text-xl font-bold mt-4">
            ❤️ Form Donasi
          </h1>

          <p className="text-xs text-brand-100 mt-1">
            Isi data donasi sebelum melakukan pembayaran.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <form
          onSubmit={kirimDonasi}
          className="bg-white rounded-2xl border p-5 shadow-sm space-y-4"
        >
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Nama Donatur
            </label>

            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={anonim}
              placeholder="Nama Anda"
              className="w-full mt-2 border rounded-xl px-3 py-3 text-sm outline-none focus:border-brand-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Nominal Donasi
            </label>

            <input
              type="number"
              min="1000"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="Contoh: 50000"
              className="w-full mt-2 border rounded-xl px-3 py-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <label className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={anonim}
              onChange={(e) => setAnonim(e.target.checked)}
            />

            <span className="text-sm text-gray-700">
              Sembunyikan nama saya sebagai donatur anonim
            </span>
          </label>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Catatan
            </label>

            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan untuk program (opsional)"
              rows="4"
              className="w-full mt-2 border rounded-xl px-3 py-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          {pesan && (
            <div className="bg-brand-50 border border-brand-200 text-brand-600 rounded-xl p-3 text-sm">
              {pesan}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Lanjut ke Pembayaran'}
          </button>
        </form>
      </main>
    </div>
  )
}
