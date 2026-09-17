import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminBeasiswa() {
  const [beasiswa, setBeasiswa] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    judul: '',
    penyelenggara: '',
    deskripsi: '',
    jenjang: '',
    batas_pendaftaran: '',
    kontak: '',
    status: 'Publik'
  })

  const fetchBeasiswa = async () => {
    const { data } = await supabase
      .from('beasiswa')
      .select('*')
      .order('created_at', { ascending: false })

    setBeasiswa(data || [])
  }

  useEffect(() => {
    fetchBeasiswa()
  }, [])

  const resetForm = () => {
    setForm({
      judul: '',
      penyelenggara: '',
      deskripsi: '',
      jenjang: '',
      batas_pendaftaran: '',
      kontak: '',
      status: 'Publik'
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (editingId) {
      await supabase
        .from('beasiswa')
        .update(form)
        .eq('id', editingId)
    } else {
      await supabase
        .from('beasiswa')
        .insert([form])
    }

    setSaving(false)
    resetForm()
    fetchBeasiswa()
  }

  const editBeasiswa = (item) => {
    setEditingId(item.id)
    setForm({
      judul: item.judul || '',
      penyelenggara: item.penyelenggara || '',
      deskripsi: item.deskripsi || '',
      jenjang: item.jenjang || '',
      batas_pendaftaran: item.batas_pendaftaran || '',
      kontak: item.kontak || '',
      status: item.status || 'Publik'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteBeasiswa = async (id) => {
    if (!confirm('Hapus beasiswa ini?')) return

    await supabase
      .from('beasiswa')
      .delete()
      .eq('id', id)

    fetchBeasiswa()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🎓 Admin Beasiswa</h1>
        <p className="text-xs text-brand-100 mt-1">
          Kelola informasi beasiswa S24J
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3"
        >
          <h2 className="font-bold text-gray-800">
            {editingId ? '✏️ Edit Beasiswa' : '➕ Tambah Beasiswa'}
          </h2>

          <input
            className="w-full border rounded-xl p-3 text-sm"
            placeholder="Judul beasiswa"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            required
          />

          <input
            className="w-full border rounded-xl p-3 text-sm"
            placeholder="Penyelenggara"
            value={form.penyelenggara}
            onChange={(e) => setForm({ ...form, penyelenggara: e.target.value })}
            required
          />

          <textarea
            className="w-full border rounded-xl p-3 text-sm"
            placeholder="Deskripsi"
            rows="4"
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            required
          />

          <input
            className="w-full border rounded-xl p-3 text-sm"
            placeholder="Jenjang, contoh: SMA / D3 / S1"
            value={form.jenjang}
            onChange={(e) => setForm({ ...form, jenjang: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Batas pendaftaran
            </label>
            <input
              type="date"
              className="w-full border rounded-xl p-3 text-sm"
              value={form.batas_pendaftaran}
              onChange={(e) => setForm({ ...form, batas_pendaftaran: e.target.value })}
            />
          </div>

          <input
            className="w-full border rounded-xl p-3 text-sm"
            placeholder="Link / kontak pendaftaran"
            value={form.kontak}
            onChange={(e) => setForm({ ...form, kontak: e.target.value })}
          />

          <select
            className="w-full border rounded-xl p-3 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="Publik">Publik</option>
            <option value="Draft">Draft</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand-600 text-white py-3 rounded-xl text-sm font-bold"
            >
              {saving
                ? 'Menyimpan...'
                : editingId
                  ? 'Simpan Perubahan'
                  : 'Simpan Beasiswa'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 bg-gray-100 rounded-xl text-sm font-semibold"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {beasiswa.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                    {item.status}
                  </span>
                  <h3 className="font-bold text-gray-800 mt-2">
                    {item.judul}
                  </h3>
                  <p className="text-xs text-brand-600 font-semibold mt-1">
                    {item.penyelenggara}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-3">
                {item.deskripsi}
              </p>

              <div className="text-[11px] text-gray-500 mt-3 space-y-1">
                {item.jenjang && <p>🎓 {item.jenjang}</p>}
                {item.batas_pendaftaran && (
                  <p>⏰ Batas: {item.batas_pendaftaran}</p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => editBeasiswa(item)}
                  className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-xs font-bold"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteBeasiswa(item.id)}
                  className="flex-1 bg-rose-50 text-rose-700 py-2 rounded-lg text-xs font-bold"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
