import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

// Kecilin foto sebelum upload, biar HP gak nge-hang/crash pas proses foto
// asli dari kamera (bisa 3-10MB). Hasilnya JPEG maks 1280px, jauh lebih ringan.
function kompresGambar(file, maksUkuran = 1280, kualitas = 0.7) {
  return new Promise((resolve, reject) => {
    const gambar = new Image()
    const urlSementara = URL.createObjectURL(file)

    gambar.onload = () => {
      URL.revokeObjectURL(urlSementara)

      let { width, height } = gambar
      if (width > height && width > maksUkuran) {
        height = Math.round((height * maksUkuran) / width)
        width = maksUkuran
      } else if (height > maksUkuran) {
        width = Math.round((width * maksUkuran) / height)
        height = maksUkuran
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(gambar, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal memproses foto'))
            return
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        kualitas
      )
    }

    gambar.onerror = () => {
      URL.revokeObjectURL(urlSementara)
      reject(new Error('Foto tidak valid'))
    }

    gambar.src = urlSementara
  })
}

// Durasi maksimal rekaman suara (detik)
const MAKS_DETIK_REKAM = 60

export default function ReportForm() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState('lalu lintas')
  const [deskripsi, setDeskripsi] = useState('')
  const [fileFoto, setFileFoto] = useState(null)
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // --- State untuk voice note ---
  const [merekam, setMerekam] = useState(false)
  const [detikRekam, setDetikRekam] = useState(0)
  const [blobAudio, setBlobAudio] = useState(null)
  const [urlPreviewAudio, setUrlPreviewAudio] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    // Ambil GPS otomatis saat halaman lapor dibuka
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
        },
        (err) => {
          console.log('Gagal ambil GPS:', err)
          // Default ke pusat Surabaya jika gagal
          setLat(-7.2575)
          setLng(112.7521)
        },
        { enableHighAccuracy: true }
      )
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Anda harus login terlebih dahulu untuk melapor!')
      navigate('/login')
      return
    }

    if (!judul || !deskripsi) {
      setErrorMsg('Judul dan deskripsi wajib diisi!')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      let fotoUrl = null
      let audioUrl = null

      // 1. Upload foto ke Supabase Storage jika ada file yang dipilih
      if (fileFoto) {
        const fotoTerkompres = await kompresGambar(fileFoto)
        const fileName = `${Date.now()}_${Math.random()}.jpg`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('foto-laporan')
          .upload(filePath, fotoTerkompres)

        if (uploadError) throw uploadError

        // Ambil public URL foto
        const { data: publicData } = supabase.storage
          .from('foto-laporan')
          .getPublicUrl(filePath)

        fotoUrl = publicData.publicUrl
      }

      // 2. Upload voice note ke Supabase Storage jika ada rekaman
      if (blobAudio) {
        const namaFileAudio = `${user.id}/${Date.now()}.webm`

        const { error: uploadAudioError } = await supabase.storage
          .from('suara-laporan')
          .upload(namaFileAudio, blobAudio)

        if (uploadAudioError) throw uploadAudioError

        const { data: publicAudioData } = supabase.storage
          .from('suara-laporan')
          .getPublicUrl(namaFileAudio)

        audioUrl = publicAudioData.publicUrl
      }

      // 3. Simpan data laporan ke tabel 'reports'
      const { error: insertError } = await supabase.from('reports').insert([
        {
          user_id: user.id,
          judul,
          kategori,
          deskripsi,
          foto_url: fotoUrl,
          audio_url: audioUrl,
          latitude: lat,
          longitude: lng,
          status: 'Menunggu'
        }
      ])

      if (insertError) throw insertError

      alert('Laporan berhasil dikirim! Menunggu verifikasi admin.')
      navigate('/')
    } catch (err) {
      console.error(err)
      setErrorMsg('Gagal mengirim laporan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-bold">Kirim Laporan Warga</h1>
        <button
          onClick={() => navigate('/')}
          className="text-xs bg-white text-brand-600 px-3 py-1 rounded font-semibold"
        >
          Kembali
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {errorMsg && (
          <div className="bg-brand-100 text-brand-700 p-3 rounded-lg mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kategori Laporan</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="lalu lintas">Lalu Lintas</option>
              <option value="jalan & infrastruktur">Jalan & Infrastruktur</option>
              <option value="pembangunan">Pembangunan</option>
              <option value="lingkungan & bencana">Lingkungan & Bencana</option>
              <option value="keamanan & kejadian">Keamanan & Kejadian</option>
              <option value="fasilitas & pelayanan">Fasilitas & Pelayanan</option>
              <option value="aktivitas kota">Aktivitas Kota</option>
              <option value="info lainnya">Info Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Judul Kejadian</label>
            <input
              type="text"
              placeholder="Contoh: Jalan berlubang besar di Gubeng"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Deskripsi Lengkap</label>
            <textarea
              rows="3"
              placeholder="Jelaskan detail lokasi dan kondisi kejadian..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Foto Bukti (Kamera/Galeri)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFileFoto(e.target.files[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
            <p className="text-[10px] text-gray-400 mt-1">Gunakan kamera belakang langsung untuk hasil terbaik.</p>

            {fileFoto && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Preview foto:</p>
                <img
                  src={URL.createObjectURL(fileFoto)}
                  alt="Preview foto laporan"
                  className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Rekam Suara (Opsional)</label>

            {!urlPreviewAudio && !merekam && (
              <button
                type="button"
                onClick={mulaiRekam}
                className="w-full flex items-center justify-center gap-2 bg-brand-50 text-brand-700 py-3 rounded-lg font-semibold text-sm border border-brand-200"
              >
                🎤 Mulai Rekam Suara
              </button>
            )}

            {merekam && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Preview rekaman ({formatDetik(detikRekam)}):</p>
                <audio src={urlPreviewAudio} controls className="w-full" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={hapusRekaman}
                    className="flex-1 text-xs bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                  >
                    Hapus & Rekam Ulang
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-600">
            <span className="font-semibold">Koordinat GPS:</span> {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Mendeteksi lokasi...'}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold text-sm shadow-md active:bg-brand-700 disabled:bg-gray-400"
          >
            {loading ? 'Mengirim Laporan...' : 'Kirim Laporan Sekarang'}
          </button>
        </form>
      </main>
    </div>
  )
}
