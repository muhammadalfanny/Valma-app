import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminLowongan() {
  const [lowongan, setLowongan] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [judul, setJudul] = useState('')
  const [perusahaan, setPerusahaan] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [kategori, setKategori] = useState('')
  const [tipeKerja, setTipeKerja] = useState('')
  const [kontak, setKontak] = useState('')
  const [status, setStatus] = useState('Publik')

  const fetchLowongan = async () => {
    const { data, error } = await supabase
      .from('lowongan')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setLowongan(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLowongan()
  }, [])

  const resetForm = () => {
    setJudul('')
    setPerusahaan('')
    setDeskripsi('')
    setLokasi('')
    setKategori('')
    setTipeKerja('')
    setKontak('')
    setStatus('Publik')
    setEditingId(null)
  }

  const editLowongan = (item) => {
    setEditingId(item.id)
    setJudul(item.judul || '')
    setPerusahaan(item.perusahaan || '')
    setDeskripsi(item.deskripsi || '')
    setLokasi(item.lokasi || '')
    setKategori(item.kategori || '')
    setTipeKerja(item.tipe_kerja || '')
    setKontak(item.kontak || '')
    setStatus(item.status || 'Publik')
    setShowForm(true)
  }

  const simpanLowongan = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      judul,
      perusahaan,
      deskripsi,
      lokasi,
      kategori,
      tipe_kerja: tipeKerja,
      kontak,
      status
    }

    const result = editingId
      ? await supabase.from('lowongan').update(payload).eq('id', editingId)
      : await supabase.from('lowongan').insert([payload])

    setSaving(false)

    if (result.error) {
      alert('Gagal menyimpan lowongan: ' + result.error.message)
      return
    }

    resetForm()
    setShowForm(false)
    fetchLowongan()
  }

  const hapusLowongan = async (id) => {
    if (!confirm('Hapus lowongan ini?')) return

    const { error } = await supabase
      .from('lowongan')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus lowongan: ' + error.message)
      return
    }

    fetchLowongan()
  }

  const toggleVerifikasi = async (item) => {
    const { error } = await supabase
      .from('lowongan')
      .update({ lowongan_terverifikasi: !item.lowongan_terverifikasi })
      .eq('id', item.id)

    if (error) {
      alert('Gagal mengubah status verifikasi: ' + error.message)
      return
    }

    fetchLowongan()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">💼 Kelola Lowongan</h1>
        <p className="text-xs text-brand-100 mt-1">
          Kelola informasi pekerjaan untuk warga Surabaya
        </p>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow-sm"
        >
          {showForm ? 'Tutup Form' : '+ Tambah Lowongan'}
        </button>

        {showForm && (
          <form
            onSubmit={simpanLowongan}
            className="bg-white p-4 rounded-2xl border border-gray-200 mt-4 space-y-3"
          >
            <input
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul pekerjaan"
              className="w-full border rounded-xl px-3 py-3 text-sm"
            />

            <input
              required
              value={perusahaan}
              onChange={(e) => setPerusahaan(e.target.value)}
              placeholder="Nama perusahaan"
              className="w-full border rounded-xl px-3 py-3 text-sm"
            />

            <textarea
              required
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi pekerjaan"
              rows="5"
              className="w-full border rounded-xl px-3 py-3 text-sm"
            />

            <input
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Lokasi"
              className="w-full border rounded-xl px-3 py-3 text-sm"
            />

            <input
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              placeholder="Kategori (IT, Marketing, F&B, dll)"
              className="w-full border rounded-xl px-3 py-3 text-sm"
            />

            <input
              value={tipeKerja}
              onChange={(e) => setTipeKerja(e.target.value)}
              placeholder="Tipe kerja (Full Time, Part Time, Freelance)"
              className="w-full border rounded-xl px-3 py-3 text-sm"
            />

            <input
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              placeholder="Kontak / link lamaran"
              className="w-full border rounded-xl px-3 py-3 text-sm"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-xl px-3 py-3 text-sm"
            >
              <option value="Publik">Publik</option>
              <option value="Draft">Draft</option>
            </select>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold"
            >
              {saving
                ? 'Menyimpan...'
                : editingId
                  ? 'Simpan Perubahan'
                  : 'Simpan Lowongan'}
            </button>
          </form>
        )}

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 py-10">
              Memuat lowongan...
            </p>
          ) : lowongan.length === 0 ? (
            <div className="bg-white rounded-2xl border p-8 text-center text-sm text-gray-400">
              Belum ada lowongan.
            </div>
          ) : (
            lowongan.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-gray-800 flex items-center gap-1">
                      {item.judul}
                      {item.lowongan_terverifikasi && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
                          <circle cx="12" cy="12" r="12" fill="#2563eb" />
                          <path d="M7 12.5l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      )}
                    </h2>
                    <p className="text-sm text-brand-600 font-semibold mt-1">
                      {item.perusahaan}
                    </p>
                  </div>

                  <span
                    className={`h-fit text-[10px] font-bold px-2 py-1 rounded-full ${
                      item.status === 'Publik'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  📍 {item.lokasi || 'Lokasi tidak dicantumkan'}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  💼 {item.tipe_kerja || 'Tipe kerja tidak dicantumkan'}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => editLowongan(item)}
                    className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-xs font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => hapusLowongan(item.id)}
                    className="flex-1 bg-rose-50 text-rose-700 py-2 rounded-lg text-xs font-bold"
                  >
                    Hapus
                  </button>
                </div>

                <button
                  onClick={() => toggleVerifikasi(item)}
                  className={`w-full mt-2 py-2 rounded-lg text-xs font-bold ${
                    item.lowongan_terverifikasi
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  {item.lowongan_terverifikasi ? 'Cabut Verifikasi ✓' : 'Verifikasi Lowongan ✓'}
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
