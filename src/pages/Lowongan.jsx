import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const kosong = { judul: '', posisi: '', perusahaan: '', deskripsi: '', lokasi: '', kategori: '', tipe_kerja: '', kontak: '' }

export default function Lowongan() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lowongan, setLowongan] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(() => {
    const draft = localStorage.getItem('draft_lowongan')
    return draft ? JSON.parse(draft) : kosong
  })
  const [saving, setSaving] = useState(false)

  const fetchLowongan = async () => {
    const { data, error } = await supabase
      .from('lowongan')
      .select('*')
      .eq('status', 'Publik')
      .order('created_at', { ascending: false })

    if (!error) {
      setLowongan(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLowongan()
  }, [])

  useEffect(() => {
    localStorage.setItem('draft_lowongan', JSON.stringify(form))
  }, [form])

  const handleShare = async (item) => {
    const url = `${window.location.origin}/lowongan/${item.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: item.judul, text: `Lowongan: ${item.judul} - ${item.perusahaan}`, url })
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link lowongan disalin ke clipboard!')
    }
  }

  const openForm = () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: '/lowongan' } })
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

    const { error } = await supabase.from('lowongan').insert([
      {
        user_id: user.id,
        judul: form.judul,
        posisi: form.posisi,
        perusahaan: form.perusahaan,
        deskripsi: form.deskripsi,
        lokasi: form.lokasi,
        kategori: form.kategori,
        tipe_kerja: form.tipe_kerja,
        kontak: form.kontak,
        status: 'Menunggu',
      },
    ])

    setSaving(false)

    if (error) {
      alert('Gagal mengirim lowongan: ' + error.message)
      return
    }

    alert('Lowongan terkirim! Menunggu verifikasi admin sebelum tampil ke publik.')
    setForm(kosong)
    localStorage.removeItem('draft_lowongan')
    setShowForm(false)
    fetchLowongan()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">💼 Lowongan Kerja</h1>
        <p className="text-xs text-brand-100 mt-1">
          Temukan peluang kerja di Surabaya
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed">
          <p className="font-bold mb-1">⚠️ Waspada penipuan lowongan kerja</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Jangan pernah transfer uang dengan alasan apa pun (biaya admin, seragam, pelatihan, tiket)</li>
            <li>Waspada gaji yang tidak wajar tinggi untuk pekerjaan mudah</li>
            <li>Jangan berikan data pribadi sensitif (KTP, rekening, OTP, password) sebelum proses resmi</li>
            <li>Cek kejelasan alamat kantor dan legalitas perusahaan sebelum melamar</li>
            <li>Laporkan ke admin jika menemukan lowongan mencurigakan</li>
          </ul>
        </div>
      </div>

      <main className="p-4 max-w-2xl mx-auto">
        <button
          onClick={openForm}
          className="w-full bg-white border border-brand-200 text-brand-700 font-bold text-sm py-3 rounded-2xl mb-4 shadow-sm"
        >
          {showForm ? '✕ Tutup form' : '➕ Bagikan info lowongan'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4 space-y-3">
            <p className="text-xs text-gray-500">
              Sertakan sumber/kontak yang jelas agar mudah diverifikasi admin sebelum tampil ke warga lain.
            </p>
            <input required placeholder="Judul lowongan" className="input-field" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
            <input required placeholder="Posisi yang dibutuhkan (mis. Kasir, Sopir, Admin)" className="input-field" value={form.posisi} onChange={(e) => setForm({ ...form, posisi: e.target.value })} />
            <input required placeholder="Nama perusahaan" className="input-field" value={form.perusahaan} onChange={(e) => setForm({ ...form, perusahaan: e.target.value })} />
            <input placeholder="Kategori (mis. Retail, IT, Pabrik)" className="input-field" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
            <input placeholder="Tipe kerja (Full-time/Part-time/Freelance)" className="input-field" value={form.tipe_kerja} onChange={(e) => setForm({ ...form, tipe_kerja: e.target.value })} />
            <input placeholder="Lokasi kerja" className="input-field" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            <textarea required placeholder="Deskripsi & syarat lowongan" className="input-field min-h-20" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            <input required placeholder="Link/kontak resmi untuk melamar" className="input-field" value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} />
            <button disabled={saving} className="btn-primary w-full">{saving ? 'Mengirim...' : 'Kirim untuk diverifikasi'}</button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat lowongan...
          </p>
        ) : lowongan.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">
              Belum ada lowongan yang tersedia.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lowongan.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <span className="inline-block bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full">
                  {item.kategori || 'Umum'}
                </span>

                <h2 className="font-bold text-gray-800 text-base mt-2 flex items-center gap-1">
                  {item.judul}
                  {item.lowongan_terverifikasi && (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
                      <circle cx="12" cy="12" r="12" fill="#2563eb" />
                      <path d="M7 12.5l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  )}
                </h2>

                <p className="text-sm font-semibold text-brand-600 mt-1">
                  {item.perusahaan}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Posisi: {item.posisi || "-"}
                </p>

                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500">
                    📍 {item.lokasi || 'Lokasi tidak dicantumkan'}
                  </p>
                  <p className="text-xs text-gray-500">
                    💼 {item.tipe_kerja || 'Tipe kerja tidak dicantumkan'}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                  {item.deskripsi}
                </p>

                {item.kontak && (
                  <a
                    href={item.kontak}
                    target="_blank"
                    rel="noreferrer"
onClick={(e) => { if (user) return; e.preventDefault(); navigate('/login', { state: { redirectTo: '/lowongan' } }) }}
                    className="block text-center bg-brand-600 text-white py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    Lihat / Lamar
                  </a>
                )}
                <button
                  onClick={() => handleShare(item)}
                  className="w-full text-center border border-brand-200 text-brand-600 py-2 rounded-xl text-xs font-bold mt-2"
                >
                  🔗 Bagikan lowongan
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
