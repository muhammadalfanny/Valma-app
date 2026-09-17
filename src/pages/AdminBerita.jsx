import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminBerita() {
  const [berita, setBerita] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [wilayah, setWilayah] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [status, setStatus] = useState('Publik')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)

  const fetchBerita = async () => {
    const { data, error } = await supabase
      .from('berita')
      .select('*')
      .order('id', { ascending: false })

    if (!error) {
      setBerita(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchBerita()
  }, [])

  const hapusBerita = async (id) => {
    if (!confirm('Hapus berita ini?')) return

    const { error } = await supabase
      .from('berita')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus berita: ' + error.message)
      return
    }

    fetchBerita()
  }

  const editBerita = (item) => {
    setEditingId(item.id)
    setJudul(item.judul || '')
    setKategori(item.kategori || '')
    setDeskripsi(item.deskripsi || '')
    setWilayah(item.wilayah || '')
    setKecamatan(item.kecamatan || '')
    setStatus(item.status || 'Draft')
    setShowForm(true)
  }

  const simpanBerita = async (e) => {
    e.preventDefault()
    setSaving(true)

    let foto = null

    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      const namaFile = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('foto-berita')
        .upload(namaFile, fotoFile)

      if (uploadError) {
        setSaving(false)
        alert('Gagal upload foto: ' + uploadError.message)
        return
      }

      const { data: publicData } = supabase.storage
        .from('foto-berita')
        .getPublicUrl(namaFile)

      foto = publicData.publicUrl
    }

    const payload = {
      judul,
      kategori,
      deskripsi,
      wilayah,
      kecamatan,
      status
    }

    if (foto) {
      payload.foto = foto
    }

    const result = editingId
      ? await supabase.from('berita').update(payload).eq('id', editingId)
      : await supabase.from('berita').insert([payload])

    setSaving(false)

    if (result.error) {
      alert('Gagal menyimpan berita: ' + result.error.message)
      return
    }

    setJudul('')
    setKategori('')
    setDeskripsi('')
    setWilayah('')
    setKecamatan('')
    setStatus('Publik')
    setEditingId(null)
    setFotoFile(null)
    setShowForm(false)
    fetchBerita()
  }

  const tambahBerita = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('berita')
      .insert([{
        judul,
        kategori,
        deskripsi,
        wilayah,
        kecamatan,
        status
      }])

    setSaving(false)

    if (error) {
      alert('Gagal menambahkan berita: ' + error.message)
      return
    }

    setJudul('')
    setKategori('')
    setDeskripsi('')
    setWilayah('')
    setKecamatan('')
    setStatus('Publik')
    setShowForm(false)
    fetchBerita()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-4 shadow-md">
        <h1 className="text-xl font-bold">📰 Kelola Berita</h1>
        <p className="text-xs text-brand-100 mt-1">
          Pusat informasi Surabaya 24 Jam
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-800">Daftar Berita</h2>
            <p className="text-xs text-gray-500">
              Kelola informasi yang tampil untuk warga
            </p>
          </div>

          <button
            onClick={() => {
              setEditingId(null)
              setShowForm(!showForm)
            }}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
          >
            + Tambah Berita
          </button>
        </div>

        {showForm && (
          <form onSubmit={simpanBerita} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 space-y-3">
            <input
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul berita"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            <input
              required
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              placeholder="Kategori"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            <textarea
              required
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Isi/deskripsi berita"
              rows="5"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Foto Berita
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <input
              value={wilayah}
              onChange={(e) => setWilayah(e.target.value)}
              placeholder="Wilayah"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            <input
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              placeholder="Kecamatan"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="Draft">Draft</option>
              <option value="Publik">Publik</option>
            </select>

            <button
              disabled={saving}
              type="submit"
              className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-bold"
            >
              {saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Berita')}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat berita...
          </p>
        ) : berita.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">
              Belum ada berita.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {berita.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                {item.foto && (
                  <img
                    src={item.foto}
                    alt={item.judul}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}

                <div className="flex justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-brand-50 text-brand-600 px-2 py-1 rounded">
                      {item.kategori || 'Umum'}
                    </span>

                    <h3 className="font-bold text-gray-800 mt-2">
                      {item.judul}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {item.deskripsi}
                    </p>

                    <p className="text-[10px] text-gray-400 mt-2">
                      {item.wilayah || 'Surabaya'}
                      {item.kecamatan ? ` • ${item.kecamatan}` : ''}
                    </p>
                  </div>

                  <span className="shrink-0 h-fit text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {item.status || 'Draft'}
                  </span>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => editBerita(item)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => hapusBerita(item.id)}
                    className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-lg text-xs font-bold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
