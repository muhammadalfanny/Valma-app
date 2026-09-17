import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const kosong = { judul: '', penyelenggara: '', deskripsi: '', lokasi: '', tanggal_mulai: '', tanggal_selesai: '', kategori: '', kontak: '' }

export default function Event() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(kosong)
  const [saving, setSaving] = useState(false)

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('event')
      .select('*')
      .eq('status', 'Publik')
      .order('tanggal_mulai', { ascending: true })

    if (!error) {
      setEvents(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const formatTanggal = (tanggal) => {
    if (!tanggal) return 'Tanggal belum ditentukan'

    return new Date(tanggal).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openForm = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setShowForm((v) => !v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    setSaving(true)

    const { error } = await supabase.from('event').insert([
      {
        user_id: user.id,
        judul: form.judul,
        penyelenggara: form.penyelenggara,
        deskripsi: form.deskripsi,
        lokasi: form.lokasi,
        tanggal_mulai: form.tanggal_mulai || null,
        tanggal_selesai: form.tanggal_selesai || null,
        kategori: form.kategori,
        kontak: form.kontak,
        status: 'Menunggu',
      },
    ])

    setSaving(false)

    if (error) {
      alert('Gagal mengirim event: ' + error.message)
      return
    }

    alert('Event terkirim! Menunggu verifikasi admin sebelum tampil ke publik.')
    setForm(kosong)
    setShowForm(false)
    fetchEvents()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🎪 Event Surabaya</h1>
        <p className="text-xs text-brand-100 mt-1">
          Temukan kegiatan dan acara menarik di Surabaya
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <button
          onClick={openForm}
          className="w-full bg-white border border-brand-200 text-brand-700 font-bold text-sm py-3 rounded-2xl mb-4 shadow-sm"
        >
          {showForm ? '✕ Tutup form' : '➕ Bagikan event komunitas'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4 space-y-3">
            <p className="text-xs text-gray-500">
              Cocok untuk kegiatan RT/RW, komunitas, atau acara warga. Admin akan verifikasi dulu sebelum tampil ke publik.
            </p>
            <input required placeholder="Judul event" className="input-field" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
            <input placeholder="Penyelenggara" className="input-field" value={form.penyelenggara} onChange={(e) => setForm({ ...form, penyelenggara: e.target.value })} />
            <input placeholder="Kategori (mis. Bazar, Olahraga, Sosial)" className="input-field" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
            <label className="field-label">Mulai</label>
            <input type="datetime-local" required className="input-field" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} />
            <label className="field-label">Selesai (opsional)</label>
            <input type="datetime-local" className="input-field" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} />
            <input placeholder="Lokasi" className="input-field" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            <textarea required placeholder="Deskripsi event" className="input-field min-h-20" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            <input placeholder="Link info/daftar - opsional" className="input-field" value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} />
            <button disabled={saving} className="btn-primary w-full">{saving ? 'Mengirim...' : 'Kirim untuk diverifikasi'}</button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat event...
          </p>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">🎪</div>
            <p className="text-sm text-gray-600 font-semibold">
              Belum ada event yang tersedia.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Event Surabaya akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <span className="inline-block bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  🎪 {item.kategori || 'EVENT'}
                </span>

                <h2 className="font-bold text-gray-800 text-base mt-2">
                  {item.judul}
                </h2>

                <p className="text-sm font-semibold text-brand-600 mt-1">
                  {item.penyelenggara}
                </p>

                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500">
                    📅 {formatTanggal(item.tanggal_mulai)}
                  </p>

                  {item.tanggal_selesai && (
                    <p className="text-xs text-gray-500">
                      🏁 Selesai: {formatTanggal(item.tanggal_selesai)}
                    </p>
                  )}

                  {item.lokasi && (
                    <p className="text-xs text-gray-500">
                      📍 {item.lokasi}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                  {item.deskripsi}
                </p>

                {item.kontak && (
                  <a
                    href={item.kontak}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center bg-brand-600 text-white py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    ℹ️ Info / Daftar
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
