import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const kosong = { nama_usaha: '', pemilik: '', kategori: '', deskripsi: '', alamat: '', telepon: '', link: '' }

export default function UMKM() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [umkm, setUmkm] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(kosong)
  const [saving, setSaving] = useState(false)

  const fetchUMKM = async () => {
    const { data, error } = await supabase
      .from('umkm')
      .select('*')
      .eq('status', 'Publik')
      .order('created_at', { ascending: false })

    if (!error) {
      setUmkm(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchUMKM()
  }, [])

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
    const waRegex = /^(\+62|62|0)8[0-9]{8,11}$/
    if (!form.telepon.trim() || !waRegex.test(form.telepon.trim())) {
      alert("Nomor WhatsApp/telepon tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx")
      return
    }
    setSaving(true)

    const { error } = await supabase.from('umkm').insert([
      {
        user_id: user.id,
        nama_usaha: form.nama_usaha,
        pemilik: form.pemilik,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        alamat: form.alamat,
        telepon: form.telepon,
        link: form.link,
        status: 'Menunggu',
      },
    ])

    setSaving(false)

    if (error) {
      alert('Gagal mengirim data usaha: ' + error.message)
      return
    }

    alert('Usaha Anda terkirim! Menunggu verifikasi admin sebelum tampil ke publik.')
    setForm(kosong)
    setShowForm(false)
    fetchUMKM()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🏪 UMKM Surabaya</h1>
        <p className="text-xs text-brand-100 mt-1">
          Temukan usaha lokal dan dukung Arek Suroboyo
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <button
          onClick={openForm}
          className="w-full bg-white border border-brand-200 text-brand-700 font-bold text-sm py-3 rounded-2xl mb-4 shadow-sm"
        >
          {showForm ? '✕ Tutup form' : '➕ Daftarkan usaha Anda'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4 space-y-3">
            <p className="text-xs text-gray-500">
              Isi data usaha Anda. Setelah dikirim, admin akan memverifikasi sebelum tampil ke warga lain.
            </p>
            <input required placeholder="Nama usaha" className="input-field" value={form.nama_usaha} onChange={(e) => setForm({ ...form, nama_usaha: e.target.value })} />
            <input placeholder="Nama pemilik" className="input-field" value={form.pemilik} onChange={(e) => setForm({ ...form, pemilik: e.target.value })} />
            <input placeholder="Kategori (mis. Kuliner, Jasa, Fashion)" className="input-field" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
            <textarea required placeholder="Deskripsi usaha" className="input-field min-h-20" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            <input placeholder="Alamat" className="input-field" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
            <input placeholder="Nomor telepon/WhatsApp" className="input-field" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
            <input placeholder="Link (Instagram/WhatsApp/Website) - opsional" className="input-field" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            <button disabled={saving} className="btn-primary w-full">{saving ? 'Mengirim...' : 'Kirim untuk diverifikasi'}</button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat UMKM...
          </p>
        ) : umkm.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-sm text-gray-600 font-semibold">
              Belum ada UMKM yang tersedia.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Data usaha lokal akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {umkm.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <span className="inline-block bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  🏪 UMKM
                </span>

                <h2 className="font-bold text-gray-800 text-base mt-2">
                  {item.nama_usaha}
                </h2>

                {item.pemilik && (
                  <p className="text-xs text-brand-600 font-semibold mt-1">
                    👤 {item.pemilik}
                  </p>
                )}

                {item.kategori && (
                  <p className="text-xs text-gray-500 mt-2">
                    🏷️ {item.kategori}
                  </p>
                )}

                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                  {item.deskripsi}
                </p>

                {item.alamat && (
                  <p className="text-xs text-gray-500 mt-3">
                    📍 {item.alamat}
                  </p>
                )}

                {item.telepon && (
                  <p className="text-xs text-gray-500 mt-1">
                    📞 {item.telepon}
                  </p>
                )}

                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center bg-brand-600 text-white py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    Kunjungi / Hubungi
                  </a>
                )}

                <div className="border-t border-gray-100 mt-3 pt-2">
                  <p className="text-[10px] text-gray-400">
                    🟢 TERVERIFIKASI S24J
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
