import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminWilayah() {
  const [wilayah, setWilayah] = useState([])
  const [kecamatan, setKecamatan] = useState('')
  const [kelurahan, setKelurahan] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchWilayah = async () => {
    const { data } = await supabase
      .from('wilayah_surabaya')
      .select('*')
      .order('kecamatan', { ascending: true })

    setWilayah(data || [])
  }

  useEffect(() => {
    fetchWilayah()
  }, [])

  const tambahWilayah = async (e) => {
    e.preventDefault()

    if (!kecamatan || !kelurahan) {
      alert('Kecamatan dan kelurahan wajib diisi.')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('wilayah_surabaya')
      .insert([{
        kecamatan,
        kelurahan,
        deskripsi,
        status: 'Publik'
      }])

    setLoading(false)

    if (error) {
      alert('Gagal menambahkan: ' + error.message)
      return
    }

    setKecamatan('')
    setKelurahan('')
    setDeskripsi('')
    fetchWilayah()
  }

  const hapusWilayah = async (id) => {
    if (!confirm('Hapus wilayah ini?')) return

    const { error } = await supabase
      .from('wilayah_surabaya')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }

    fetchWilayah()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🏙️ Kelola Wilayah</h1>
        <p className="text-xs text-brand-100 mt-1">
          Kecamatan & Kelurahan Surabaya
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">

        <form
          onSubmit={tambahWilayah}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3"
        >
          <h2 className="font-bold text-gray-800">
            Tambah Wilayah
          </h2>

          <input
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
            placeholder="Nama Kecamatan"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <input
            value={kelurahan}
            onChange={(e) => setKelurahan(e.target.value)}
            placeholder="Nama Kelurahan"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi wilayah (opsional)"
            className="w-full border rounded-xl px-3 py-2 text-sm"
            rows="3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-bold"
          >
            {loading ? 'Menyimpan...' : '➕ Tambah Wilayah'}
          </button>
        </form>

        <div className="space-y-3">
          {wilayah.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
            >
              <p className="text-xs text-brand-600 font-bold">
                KECAMATAN
              </p>

              <h3 className="font-bold text-gray-800">
                {item.kecamatan}
              </h3>

              <p className="text-sm text-gray-600 mt-1">
                Kelurahan: {item.kelurahan}
              </p>

              {item.deskripsi && (
                <p className="text-xs text-gray-500 mt-2">
                  {item.deskripsi}
                </p>
              )}

              <button
                onClick={() => hapusWilayah(item.id)}
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
