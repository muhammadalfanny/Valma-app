import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// Durasi maksimal rekaman suara (detik)
const MAKS_DETIK_REKAM = 60

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

  // --- State untuk voice note ---
  const [merekam, setMerekam] = useState(false)
  const [detikRekam, setDetikRekam] = useState(0)
  const [blobAudio, setBlobAudio] = useState(null)
  const [urlPreviewAudio, setUrlPreviewAudio] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

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

    // Bersihkan mic & timer kalau halaman ditutup saat masih merekam
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // --- Fungsi mulai rekam ---
  const mulaiRekam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setBlobAudio(blob)
        setUrlPreviewAudio(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorder.start()
      setMerekam(true)
      setDetikRekam(0)

      timerRef.current = setInterval(() => {
        setDetikRekam((detikSaatIni) => {
          if (detikSaatIni + 1 >= MAKS_DETIK_REKAM) {
            hentikanRekam()
            return MAKS_DETIK_REKAM
          }
          return detikSaatIni + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Gagal akses mikrofon:', err)
      alert('Tidak bisa mengakses mikrofon. Pastikan izin mikrofon sudah diberikan.')
    }
  }

  // --- Fungsi hentikan rekam ---
  const hentikanRekam = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setMerekam(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // --- Hapus rekaman & rekam ulang ---
  const hapusRekaman = () => {
    if (urlPreviewAudio) URL.revokeObjectURL(urlPreviewAudio)
    setBlobAudio(null)
    setUrlPreviewAudio(null)
    setDetikRekam(0)
  }

  const formatDetik = (detik) => {
    const menit = Math.floor(detik / 60)
    const sisaDetik = detik % 60
    return `${menit}:${sisaDetik.toString().padStart(2, '0')}`
  }

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

    try {
      let audioUrl = null

      // Upload voice note ke Supabase Storage jika ada rekaman
      if (blobAudio) {
        const namaFileAudio = `${user.id}/${Date.now()}.webm`

        const { error: uploadAudioError } = await supabase.storage
          .from('suara-uneg-uneg')
          .upload(namaFileAudio, blobAudio)

        if (uploadAudioError) throw uploadAudioError

        const { data: publicAudioData } = supabase.storage
          .from('suara-uneg-uneg')
          .getPublicUrl(namaFileAudio)

        audioUrl = publicAudioData.publicUrl
      }

      const { error } = await supabase
        .from('forum')
        .insert([{
          user_id: user.id,
          judul: form.judul,
          isi: form.isi,
          kategori: form.kategori,
          audio_url: audioUrl,
          status: 'Menunggu'
        }])

      if (error) throw error

      alert('Postingan terkirim! Menunggu verifikasi admin sebelum tampil ke publik.')

      setForm({
        judul: '',
        isi: '',
        kategori: 'Uneg-Uneg'
      })
      hapusRekaman()

      fetchForum()
    } catch (err) {
      console.error(err)
      alert('Gagal membuat postingan: ' + err.message)
    } finally {
      setPosting(false)
    }
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

          <div className="mt-3">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Rekam Suara (Opsional)</label>

            {!urlPreviewAudio && !merekam && (
              <button
                type="button"
                onClick={mulaiRekam}
                className="w-full flex items-center justify-center gap-2 bg-brand-50 text-brand-700 py-3 rounded-xl font-semibold text-sm border border-brand-200"
              >
                🎤 Mulai Rekam Suara
              </button>
            )}

            {merekam && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  Merekam... {formatDetik(detikRekam)} / {formatDetik(MAKS_DETIK_REKAM)}
                </span>
                <button
                  type="button"
                  onClick={hentikanRekam}
                  className="text-xs bg-red-600 text-white px-3 py-1.5 rounded font-semibold"
                >
                  Selesai
                </button>
              </div>
            )}

            {urlPreviewAudio && !merekam && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Preview rekaman ({formatDetik(detikRekam)}):</p>
                <audio src={urlPreviewAudio} controls className="w-full" />
                <button
                  type="button"
                  onClick={hapusRekaman}
                  className="w-full text-xs bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                >
                  Hapus & Rekam Ulang
                </button>
              </div>
            )}
          </div>

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
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full">
                      {item.kategori || 'Uneg-Uneg'}
                    </span>
                    {item.audio_url && (
                      <span className="inline-block bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">
                        🎤 Ada suara
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-800 mt-2">
                    {item.judul}
                  </h3>

                  <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                    {item.isi}
                  </p>

                  {item.audio_url && (
                    <audio src={item.audio_url} controls className="w-full mt-2" />
                  )}

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
