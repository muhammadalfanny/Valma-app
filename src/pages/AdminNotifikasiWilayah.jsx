import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminNotifikasiWilayah() {
  const [notifikasi, setNotifikasi] = useState([])
  const [judul, setJudul] = useState('')
  const [pesan, setPesan] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [kelurahan, setKelurahan] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchNotifikasi = async () => {
    const { data } = await supabase
      .from('notifikasi_wilayah')
      .select('*')
      .order('created_at', { ascending: false })

    setNotifikasi(data || [])
  }

  useEffect(() => {
    fetchNotifikasi()
  }, [])

  const tambahNotifikasi = async (e) => {
    e.preventDefault()

    if (!judul || !pesan) {
      alert('Judul dan pesan wajib diisi.')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('notifikasi_wilayah')
      .insert([{
        judul,
        pesan,
        kecamatan,
        kelurahan,
        status: 'Publik'
      }])

    setLoading(false)

    if (error) {
      alert('Gagal menambahkan: ' + error.message)
      return
    }

    setJudul('')
    setPesan('')
    setKecamatan('')
    setKelurahan('')
    fetchNotifikasi()
  }

  const hapusNotifikasi = async (id) => {
    if (!confirm('Hapus informasi ini?')) return

    const { error } = await supabase
      .from('notifikasi_wilayah')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }

    fetchNotifikasi()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">📣 Kelola Info Wilayah</h1>
        <p className="text-xs text-brand-100 mt-1">
          Buat informasi penting untuk warga
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">

        <form
          onSubmit={tambahNotifikasi}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3"
        >
          <h2 className="font-bold text-gray-800">
            Tambah Informasi
          </h2>

          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul informasi"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            placeholder="Isi informasi"
            className="w-full border rounded-xl px-3 py-2 text-sm"
            rows="4"
          />

          <input
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
            placeholder="Kecamatan (opsional)"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <input
            value={kelurahan}
            onChange={(e) => setKelurahan(e.target.value)}
            placeholder="Kelurahan (opsional)"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-bold"
          >
            {loading ? 'Menyimpan...' : '📣 Publikasikan Informasi'}
          </button>
        </form>

        <div className="space-y-3">
          {notifikasi.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
            >
              <span className="text-[10px] font-bold text-brand-600">
                📣 INFORMASI
              </span>

              <h3 className="font-bold text-gray-800 mt-1">
                {item.judul}
              </h3>

              <p className="text-sm text-gray-600 mt-2">
                {item.pesan}
              </p>

              {(item.kecamatan || item.kelurahan) && (
                <p className="text-xs text-gray-500 mt-2">
                  📍 {item.kecamatan || 'Semua Kecamatan'}
                  {item.kelurahan && ` • ${item.kelurahan}`}
                </p>
              )}

              <button
                onClick={() => hapusNotifikasi(item.id)}
                className="mt-3 text-xs font-bold text-rose-600"
              >
                🗑️ Hapus
              </button>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
