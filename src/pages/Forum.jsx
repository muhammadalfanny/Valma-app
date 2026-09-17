import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Forum() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const isAdmin = role === 'admin' || role === 'developer'

  const [forum, setForum] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [form, setForm] = useState({
    judul: '',
    isi: '',
    kategori: 'Uneg-Uneg'
  })

  const fetchForum = async () => {
    const { data, error } = await supabase
      .from('forum')
      .select('*')
      .eq('status', 'Publik')
      .order('created_at', { ascending: false })

    if (!error) {
      setForum(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchForum()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus postingan ini? Tindakan tidak bisa dibatalkan.')) return

    setDeletingId(id)
    const { error } = await supabase.from('forum').delete().eq('id', id)
    setDeletingId(null)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }

    setForum((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    setPosting(true)

    const { error } = await supabase
      .from('forum')
      .insert([{
        user_id: user.id,
        judul: form.judul,
        isi: form.isi,
        kategori: form.kategori,
        status: 'Menunggu'
      }])

    setPosting(false)

    if (error) {
      alert('Gagal membuat postingan: ' + error.message)
      return
    }

    alert('Postingan terkirim! Menunggu verifikasi admin sebelum tampil ke publik.')

    setForm({
      judul: '',
      isi: '',
      kategori: 'Uneg-Uneg'
    })

    fetchForum()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">💬 Uneg-Uneg Suroboyo</h1>
        <p className="text-xs text-brand-100 mt-1">
          Tempat warga menyampaikan cerita, saran, dan pendapat.
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
        >
          <h2 className="font-bold text-gray-800">
            🗣️ Sampaikan Uneg-Unegmu
          </h2>

          <input
            className="w-full border rounded-xl p-3 text-sm mt-3"
            placeholder="Judul postingan"
            value={form.judul}
            onChange={(e) =>
              setForm({ ...form, judul: e.target.value })
            }
            required
          />

          <select
            className="w-full border rounded-xl p-3 text-sm mt-3"
            value={form.kategori}
            onChange={(e) =>
              setForm({ ...form, kategori: e.target.value })
            }
          >
            <option>Uneg-Uneg</option>
            <option>Keluhan</option>
            <option>Saran</option>
            <option>Diskusi</option>
            <option>Info Warga</option>
          </select>

          <textarea
            className="w-full border rounded-xl p-3 text-sm mt-3"
            rows="4"
            placeholder="Ceritakan apa yang ingin kamu sampaikan..."
            value={form.isi}
            onChange={(e) =>
              setForm({ ...form, isi: e.target.value })
            }
            required
          />

          <button
            type="submit"
            disabled={posting}
            className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-bold mt-3"
          >
            {posting ? 'Mengirim...' : 'Posting Uneg-Uneg'}
          </button>
        </form>

        <div className="mt-5">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">
            🔥 Uneg-Uneg Warga
          </h2>

          {loading ? (
            <p className="text-center text-sm text-gray-400 py-10">
              Memuat postingan...
            </p>
          ) : forum.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-gray-500">
                Belum ada uneg-uneg warga.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {forum.map((item) => (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
                >
                  <span className="inline-block bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full">
                    {item.kategori || 'Uneg-Uneg'}
                  </span>

                  <h3 className="font-bold text-gray-800 mt-2">
                    {item.judul}
                  </h3>

                  <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                    {item.isi}
                  </p>

                  <div className="border-t border-gray-100 mt-3 pt-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-gray-400">
                        🕐 {new Date(item.created_at).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        🟡 LAPORAN/POSTINGAN WARGA
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-50 shrink-0"
                      >
                        {deletingId === item.id ? 'Menghapus...' : '🗑️ Hapus'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
