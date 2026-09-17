import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminPolling() {
  const [polling, setPolling] = useState([])
  const [pertanyaan, setPertanyaan] = useState('')
  const [opsi, setOpsi] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [hasil, setHasil] = useState({})

  const fetchPolling = async () => {
    const { data } = await supabase
      .from('polling')
      .select('*')
      .order('created_at', { ascending: false })

    setPolling(data || [])
  }

  const ambilHasil = async (pollId) => {
    const { data } = await supabase.rpc('hasil_polling', {
      p_polling_id: pollId
    })

    setHasil((sebelumnya) => ({
      ...sebelumnya,
      [pollId]: data || []
    }))
  }

  useEffect(() => {
    const mulai = async () => {
      await fetchPolling()
    }

    mulai()
  }, [])

  useEffect(() => {
    polling.forEach((item) => {
      ambilHasil(item.id)
    })
  }, [polling])

  const tambahOpsi = () => {
    setOpsi([...opsi, ''])
  }

  const ubahOpsi = (index, value) => {
    const baru = [...opsi]
    baru[index] = value
    setOpsi(baru)
  }

  const hapusOpsi = (index) => {
    if (opsi.length <= 2) return

    setOpsi(opsi.filter((_, i) => i !== index))
  }

  const tambahPolling = async (e) => {
    e.preventDefault()

    const opsiBersih = opsi
      .map((item) => item.trim())
      .filter(Boolean)

    if (!pertanyaan.trim()) {
      alert('Pertanyaan wajib diisi.')
      return
    }

    if (opsiBersih.length < 2) {
      alert('Minimal harus ada 2 pilihan.')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('polling')
      .insert([{
        pertanyaan: pertanyaan.trim(),
        opsi: opsiBersih,
        status: 'Publik'
      }])

    setLoading(false)

    if (error) {
      alert('Gagal membuat polling: ' + error.message)
      return
    }

    setPertanyaan('')
    setOpsi(['', ''])
    fetchPolling()
  }

  const hapusPolling = async (id) => {
    if (!confirm('Hapus polling ini?')) return

    const { error } = await supabase
      .from('polling')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus polling: ' + error.message)
      return
    }

    fetchPolling()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">📊 Kelola Polling Warga</h1>
        <p className="text-xs text-brand-100 mt-1">
          Buat jajak pendapat untuk warga Surabaya
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">

        <form
          onSubmit={tambahPolling}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3"
        >
          <h2 className="font-bold text-gray-800">
            Buat Polling Baru
          </h2>

          <textarea
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            placeholder="Contoh: Masalah apa yang paling perlu diperhatikan di Surabaya?"
            className="w-full border rounded-xl px-3 py-2 text-sm"
            rows="3"
          />

          <div className="space-y-2">
            {opsi.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={item}
                  onChange={(e) => ubahOpsi(index, e.target.value)}
                  placeholder={`Pilihan ${index + 1}`}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm"
                />

                {opsi.length > 2 && (
                  <button
                    type="button"
                    onClick={() => hapusOpsi(index)}
                    className="px-3 rounded-xl bg-gray-100 text-brand-600 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={tambahOpsi}
            className="w-full border border-brand-200 text-brand-600 py-2.5 rounded-xl text-xs font-bold"
          >
            ➕ Tambah Pilihan
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-bold"
          >
            {loading ? 'Menyimpan...' : '📊 Publikasikan Polling'}
          </button>
        </form>

        <div className="space-y-3">
          {polling.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
            >
              <span className="text-[10px] font-bold text-brand-600">
                📊 POLLING
              </span>

              <h3 className="font-bold text-gray-800 mt-2">
                {item.pertanyaan}
              </h3>

              <div className="mt-3 space-y-2">
                {(Array.isArray(item.opsi) ? item.opsi : []).map((pilihan, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700"
                  >
                    {index + 1}. {pilihan}
                  </div>
                ))}
              </div>

              {hasil[item.id] && hasil[item.id].length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    📈 HASIL SUARA
                  </p>

                  {item.opsi.map((jawaban, index) => {
                    const dataHasil = hasil[item.id].find(
                      (x) => x.pilihan === jawaban
                    )

                    const jumlah = Number(dataHasil?.jumlah || 0)
                    const total = hasil[item.id].reduce(
                      (sum, x) => sum + Number(x.jumlah || 0),
                      0
                    )

                    const persen = total > 0
                      ? Math.round((jumlah / total) * 100)
                      : 0

                    return (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between text-xs">
                          <span>{jawaban}</span>
                          <span className="font-bold text-brand-600">
                            {jumlah} suara ({persen}%)
                          </span>
                        </div>

                        <div className="w-full h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${persen}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={() => hapusPolling(item.id)}
                className="mt-3 text-xs font-bold text-rose-600"
              >
                🗑️ Hapus Polling
              </button>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
