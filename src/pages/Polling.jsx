import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Polling() {
  const [polling, setPolling] = useState([])
  const [pilihan, setPilihan] = useState({})
  const [loading, setLoading] = useState(true)
  const [hasil, setHasil] = useState({})
  const [sudahMemilih, setSudahMemilih] = useState({})

  useEffect(() => {
    const fetchPolling = async () => {
      const { data } = await supabase
        .from('polling')
        .select('*')
        .eq('status', 'Publik')
        .order('created_at', { ascending: false })

      const daftarPolling = data || []
      setPolling(daftarPolling)

      for (const item of daftarPolling) {
        await ambilHasil(item.id)
        await cekSudahMemilih(item.id)
      }

      setLoading(false)
    }

    fetchPolling()
  }, [])

  const cekSudahMemilih = async (pollId) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('polling_votes')
      .select('id')
      .eq('polling_id', pollId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (data) {
      setSudahMemilih((sebelumnya) => ({
        ...sebelumnya,
        [pollId]: true
      }))
    }
  }

  const ambilHasil = async (pollId) => {
    const { data, error } = await supabase.rpc('hasil_polling', {
      p_polling_id: pollId
    })

    if (!error) {
      setHasil((sebelumnya) => ({
        ...sebelumnya,
        [pollId]: data || []
      }))
    }
  }

  const pilihJawaban = (pollId, jawaban) => {
    setPilihan({
      ...pilihan,
      [pollId]: jawaban
    })
  }

  const kirimSuara = async (pollId) => {
    if (!pilihan[pollId]) return

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Silakan login terlebih dahulu untuk mengikuti polling.')
      return
    }

    const { error } = await supabase
      .from('polling_votes')
      .insert([{
        polling_id: pollId,
        user_id: user.id,
        pilihan: pilihan[pollId]
      }])

    if (error) {
      if (error.code === '23505') {
        alert('Anda sudah memberikan suara pada polling ini.')
      } else {
        alert('Gagal mengirim suara: ' + error.message)
      }
      return
    }

    alert('Suara berhasil dikirim! 🗳️')
    await ambilHasil(pollId)
    setPilihan((sebelumnya) => ({
      ...sebelumnya,
      [pollId]: null
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">📊 Polling Warga</h1>
        <p className="text-xs text-brand-100 mt-1">
          Suara warga Surabaya untuk Surabaya
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat polling...
          </p>
        ) : polling.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">
              Belum ada polling aktif.
            </p>
          </div>
        ) : (
          polling.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
            >
              <span className="text-[10px] font-bold text-brand-600">
                📊 POLLING WARGA
              </span>

              <h2 className="font-bold text-gray-800 text-base mt-2">
                {item.pertanyaan}
              </h2>

              <div className="mt-4 space-y-2">
                {(Array.isArray(item.opsi) ? item.opsi : []).map((jawaban, index) => (
                  <button
                    key={index}
                    onClick={() => pilihJawaban(item.id, jawaban)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                      pilihan[item.id] === jawaban
                        ? 'border-brand-500 bg-brand-50 text-brand-600 font-bold'
                        : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-bold mr-2">
                      {index + 1}.
                    </span>
                    {jawaban}
                  </button>
                ))}
              </div>

              {pilihan[item.id] && !sudahMemilih[item.id] && (
                <button
                  onClick={() => kirimSuara(item.id)}
                  className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-bold mt-4"
                >
                  🗳️ Kirim Suara
                </button>
              )}

              {sudahMemilih[item.id] && (
                <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs font-bold text-green-700">
                  ✅ Anda sudah memberikan suara
                </div>
              )}

              {hasil[item.id] && hasil[item.id].length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-bold text-gray-500 mb-3">
                    📈 HASIL POLLING
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
                      <div key={index} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">
                            {jawaban}
                          </span>
                          <span className="font-bold text-brand-600">
                            {persen}% ({jumlah})
                          </span>
                        </div>

                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
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
            </article>
          ))
        )}
      </main>
    </div>
  )
}
