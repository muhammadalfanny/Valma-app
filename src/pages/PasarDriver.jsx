import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function PasarDriver() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [driver, setDriver] = useState(null)
  const [pesan, setPesan] = useState('')

  const [form, setForm] = useState({ nama: '', kontak: '', kendaraan: 'Motor', plat_nomor: '' })
  const [foto, setFoto] = useState(null)
  const [gps, setGps] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [menyimpan, setMenyimpan] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    muatDriver()
  }, [user])

  const muatDriver = async () => {
    setLoading(true)
    const { data } = await supabase.from('driver').select('*').eq('owner_id', user.id).maybeSingle()
    setDriver(data)
    setLoading(false)
  }

  const ambilGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('gagal')
      return
    }
    setGpsStatus('mencari')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGpsStatus('ok')
      },
      () => setGpsStatus('gagal'),
      { enableHighAccuracy: true }
    )
  }

  useEffect(() => {
    if (!loading && !driver) ambilGps()
  }, [loading, driver])

  const daftar = async () => {
    setPesan('')
    if (!form.nama.trim()) return setPesan('Nama wajib diisi.')
    const waRegex = /^(\+62|62|0)8[0-9]{8,11}$/
    if (!form.kontak.trim() || !waRegex.test(form.kontak.trim())) {
      return setPesan('Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx.')
    }
    if (!form.plat_nomor.trim()) return setPesan('Plat nomor kendaraan wajib diisi.')
    if (gpsStatus !== 'ok' || !gps) return setPesan('Titik lokasi wajib diambil dulu. Nyalakan izin lokasi lalu coba lagi.')

    setMenyimpan(true)
    let foto_url = null
    if (foto) {
      const namaFile = `${user.id}/driver-${Date.now()}-${foto.name}`
      const { error: errUpload } = await supabase.storage.from('pasar-foto').upload(namaFile, foto)
      if (!errUpload) {
        const { data } = supabase.storage.from('pasar-foto').getPublicUrl(namaFile)
        foto_url = data.publicUrl
      }
    }

    const { error } = await supabase.from('driver').insert({
      owner_id: user.id,
      nama: form.nama.trim(),
      kontak: form.kontak.trim(),
      kendaraan: form.kendaraan,
      plat_nomor: form.plat_nomor.trim(),
      foto_url,
      latitude: gps.latitude,
      longitude: gps.longitude,
      lokasi_terverifikasi: true,
      status: 'Menunggu',
    })

    if (error) {
      setPesan('Gagal mendaftar: ' + error.message)
    } else {
      alert('Pendaftaran CAK JASTIP terkirim, menunggu persetujuan admin.')
      muatDriver()
    }
    setMenyimpan(false)
  }

  const badgeStatus = (status) => {
    const warna = { Aktif: 'bg-green-100 text-green-700', Menunggu: 'bg-amber-100 text-amber-700', Ditolak: 'bg-red-100 text-red-700' }
    return <span className={`text-[10px] font-black px-2 py-1 rounded-full ${warna[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="CAK JASTIP" backTo="/pasar" />
        <div className="py-16 text-center text-sm text-gray-400">Memuat…</div>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <AppHeader title="Daftar CAK JASTIP" backTo="/pasar" />
        <main className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🛵</div>
              <h1 className="text-lg font-bold text-gray-800">Daftar Jadi CAK JASTIP</h1>
              <p className="text-xs text-gray-500 mt-1">Antar-jemput pesanan Pasar, hasil dihitung per hari.</p>
            </div>

            <div className="space-y-3">
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <input value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} placeholder="Nomor WhatsApp" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <select value={form.kendaraan} onChange={(e) => setForm({ ...form, kendaraan: e.target.value })} className="w-full border rounded-xl px-3 py-3 text-sm">
                <option>Motor</option>
                <option>Mobil</option>
              </select>
              <input value={form.plat_nomor} onChange={(e) => setForm({ ...form, plat_nomor: e.target.value })} placeholder="Plat nomor kendaraan" className="w-full border rounded-xl px-3 py-3 text-sm" />

              <div>
                <label className="text-xs font-semibold text-gray-600">Foto diri/kendaraan (opsional)</label>
                <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} className="w-full text-xs mt-1" />
              </div>

              <div className={`rounded-xl p-3 text-xs font-semibold ${gpsStatus === 'ok' ? 'bg-green-50 text-green-700' : gpsStatus === 'gagal' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                {gpsStatus === 'idle' && 'Menyiapkan pengambilan titik lokasi…'}
                {gpsStatus === 'mencari' && '📍 Mengambil titik lokasi, mohon tunggu…'}
                {gpsStatus === 'ok' && '🟢 Titik lokasi berhasil diambil.'}
                {gpsStatus === 'gagal' && (
                  <div className="flex items-center justify-between gap-2">
                    <span>🔴 Gagal ambil lokasi. Nyalakan izin lokasi.</span>
                    <button onClick={ambilGps} className="underline shrink-0">Coba lagi</button>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 leading-relaxed">
                Sistem bayar CAK JASTIP: kamu bisa langsung aktif tanpa bayar dulu. Tiap order
                selesai dicatat, jam 20:00 sistem tutup buku jadi 1 tagihan harian (12% dari
                total order — 10% untuk platform, 2% masuk tabungan THR kamu). Tagihan belum
                lunas = tidak bisa aktif sampai dibayar.
              </div>

              {pesan && <div className="rounded-xl bg-amber-50 border border-amber-100 text-amber-800 p-3 text-xs font-semibold">{pesan}</div>}

              <button disabled={menyimpan} onClick={daftar} className="w-full bg-brand-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
                {menyimpan ? 'Menyimpan…' : 'Daftar Sekarang'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <AppHeader title="CAK JASTIP" backTo="/pasar" />
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{driver.nama}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{driver.kendaraan} · {driver.plat_nomor}</p>
            </div>
            {badgeStatus(driver.status)}
          </div>

          {driver.status === 'Menunggu' && (
            <p className="text-xs text-amber-600 mt-3">⏳ Pendaftaran kamu sedang menunggu persetujuan admin.</p>
          )}
          {driver.status === 'Ditolak' && (
            <p className="text-xs text-red-600 mt-3">❌ Pendaftaran kamu ditolak admin. Hubungi admin untuk info lebih lanjut.</p>
          )}
          {driver.status === 'Aktif' && (
            <p className="text-xs text-green-700 mt-3">🟢 Kamu sudah aktif sebagai CAK JASTIP. Fitur penugasan order sedang disiapkan, segera hadir!</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-1">Tabungan THR</h2>
          <p className="text-2xl font-extrabold text-brand-600">Rp{Number(driver.saldo_thr).toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-gray-400 mt-1">Terkumpul dari 2% tiap order, dicairkan admin menjelang Lebaran.</p>
        </div>
      </main>
    </div>
  )
}
