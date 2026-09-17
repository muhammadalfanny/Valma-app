import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

const KATEGORI_LIST = ['Makanan', 'Minuman', 'Barang', 'Jasa']

export default function PasarToko() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [toko, setToko] = useState(null)
  const [produkList, setProdukList] = useState([])
  const [pesan, setPesan] = useState('')

  const [formToko, setFormToko] = useState({ nama_toko: '', kategori: 'Makanan', deskripsi: '', kontak: '', alamat: '' })
  const [fotoToko, setFotoToko] = useState(null)
  const [bannerToko, setBannerToko] = useState(null)
  const [gps, setGps] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [menyimpanToko, setMenyimpanToko] = useState(false)

  const [formProdukBuka, setFormProdukBuka] = useState(false)
  const [formProduk, setFormProduk] = useState({ nama: '', harga: '', deskripsi: '', stok: '' })
  const [fotoProduk, setFotoProduk] = useState(null)
  const [menyimpanProduk, setMenyimpanProduk] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    muatToko()
  }, [user])

  const muatToko = async () => {
    setLoading(true)
    const { data: t } = await supabase.from('toko').select('*').eq('owner_id', user.id).maybeSingle()
    setToko(t)
    if (t) {
      const { data: p } = await supabase.from('produk').select('*').eq('toko_id', t.id).order('created_at', { ascending: false })
      setProdukList(p || [])
    }
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
    if (!toko) ambilGps()
  }, [toko])

  const uploadFoto = async (file, folder) => {
    const namaFile = `${user.id}/${folder}-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('pasar-foto').upload(namaFile, file)
    if (error) return null
    const { data } = supabase.storage.from('pasar-foto').getPublicUrl(namaFile)
    return data.publicUrl
  }

  const daftarToko = async () => {
    setPesan('')
    if (!formToko.nama_toko.trim()) return setPesan('Nama toko wajib diisi.')
    const waRegex = /^(\+62|62|0)8[0-9]{8,11}$/
    if (!formToko.kontak.trim() || !waRegex.test(formToko.kontak.trim())) {
      return setPesan('Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx.')
    }
    if (gpsStatus !== 'ok' || !gps) {
      return setPesan('Titik lokasi wajib diambil dulu. Nyalakan izin lokasi lalu coba lagi.')
    }

    setMenyimpanToko(true)
    let foto_url = null
    let banner_url = null
    let gagalUpload = []
    if (fotoToko) {
      foto_url = await uploadFoto(fotoToko, 'toko-logo')
      if (!foto_url) gagalUpload.push('logo')
    }
    if (bannerToko) {
      banner_url = await uploadFoto(bannerToko, 'toko-banner')
      if (!banner_url) gagalUpload.push('banner')
    }
    if (gagalUpload.length > 0) {
      alert(`Peringatan: foto ${gagalUpload.join(' & ')} gagal diupload (cek koneksi). Toko tetap disimpan tanpa foto itu — kamu bisa coba upload lagi nanti.`)
    }

    const { error } = await supabase.from('toko').insert({
      owner_id: user.id,
      nama_toko: formToko.nama_toko.trim(),
      kategori: formToko.kategori,
      deskripsi: formToko.deskripsi.trim(),
      kontak: formToko.kontak.trim(),
      alamat: formToko.alamat.trim(),
      foto_url,
      banner_url,
      latitude: gps.latitude,
      longitude: gps.longitude,
      lokasi_terverifikasi: true,
      status: 'Menunggu',
    })
    if (error) {
      setPesan('Gagal mendaftar toko: ' + error.message)
    } else {
      alert('Toko berhasil didaftarkan, menunggu persetujuan admin.')
      muatToko()
    }
    setMenyimpanToko(false)
  }

  const tambahProduk = async () => {
    setPesan('')
    if (!formProduk.nama.trim() || !formProduk.harga) return setPesan('Nama & harga produk wajib diisi.')

    setMenyimpanProduk(true)
    let foto_url = null
    if (fotoProduk) {
      foto_url = await uploadFoto(fotoProduk, 'produk')
      if (!foto_url) alert('Peringatan: foto produk gagal diupload (cek koneksi). Produk tetap disimpan tanpa foto — bisa coba upload lagi nanti.')
    }

    const { error } = await supabase.from('produk').insert({
      toko_id: toko.id,
      nama: formProduk.nama.trim(),
      harga: Number(formProduk.harga),
      deskripsi: formProduk.deskripsi.trim(),
      stok: Number(formProduk.stok || 0),
      foto_url,
      status: 'Menunggu',
    })
    if (error) {
      setPesan('Gagal menambah produk: ' + error.message)
    } else {
      setFormProduk({ nama: '', harga: '', deskripsi: '', stok: '' })
      setFotoProduk(null)
      setFormProdukBuka(false)
      muatToko()
    }
    setMenyimpanProduk(false)
  }

  const hapusProduk = async (id) => {
    if (!confirm('Hapus produk ini?')) return
    await supabase.from('produk').delete().eq('id', id)
    muatToko()
  }

  const ajukanVip = async (plan) => {
    if (!confirm(`Ajukan VIP ${plan === 'daily' ? 'Harian' : 'Bagi Hasil'}?`)) return
    const { error } = await supabase.from('toko').update({ vip_plan: plan, vip_status: 'pending' }).eq('id', toko.id)
    if (error) {
      alert('Gagal mengajukan VIP: ' + error.message)
    } else {
      alert('Pengajuan VIP terkirim, menunggu persetujuan admin.')
      muatToko()
    }
  }

  const badgeStatus = (status) => {
    const warna = { Publik: 'bg-green-100 text-green-700', Menunggu: 'bg-amber-100 text-amber-700', Ditolak: 'bg-red-100 text-red-700' }
    return <span className={`text-[10px] font-black px-2 py-1 rounded-full ${warna[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Toko Saya" backTo="/pasar" />
        <div className="py-16 text-center text-sm text-gray-400">Memuat…</div>
      </div>
    )
  }

  if (!toko) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <AppHeader title="Daftar Toko" backTo="/pasar" />
        <main className="max-w-2xl mx-auto p-4 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h1 className="text-lg font-bold text-gray-800 mb-1">Daftar Toko Baru</h1>
            <p className="text-xs text-gray-500 mb-4">Isi profil tokomu untuk mulai berjualan di Pasar.</p>

            <div className="space-y-3">
              <input value={formToko.nama_toko} onChange={(e) => setFormToko({ ...formToko, nama_toko: e.target.value })} placeholder="Nama toko" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <select value={formToko.kategori} onChange={(e) => setFormToko({ ...formToko, kategori: e.target.value })} className="w-full border rounded-xl px-3 py-3 text-sm">
                {KATEGORI_LIST.map((k) => <option key={k}>{k}</option>)}
              </select>
              <textarea value={formToko.deskripsi} onChange={(e) => setFormToko({ ...formToko, deskripsi: e.target.value })} placeholder="Deskripsi toko" rows="3" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <input value={formToko.alamat} onChange={(e) => setFormToko({ ...formToko, alamat: e.target.value })} placeholder="Alamat / area toko" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <input value={formToko.kontak} onChange={(e) => setFormToko({ ...formToko, kontak: e.target.value })} placeholder="Nomor WhatsApp" className="w-full border rounded-xl px-3 py-3 text-sm" />

              <div>
                <label className="text-xs font-semibold text-gray-600">Logo toko (opsional)</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoToko(e.target.files?.[0] || null)} className="w-full text-xs mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Foto banner toko (opsional)</label>
                <input type="file" accept="image/*" onChange={(e) => setBannerToko(e.target.files?.[0] || null)} className="w-full text-xs mt-1" />
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

              {pesan && <div className="rounded-xl bg-amber-50 border border-amber-100 text-amber-800 p-3 text-xs font-semibold">{pesan}</div>}

              <button disabled={menyimpanToko} onClick={daftarToko} className="w-full bg-brand-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
                {menyimpanToko ? 'Menyimpan…' : 'Daftar Toko'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <AppHeader title="Toko Saya" backTo="/pasar" />
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-24 bg-brand-50">
            {toko.banner_url && <img src={toko.banner_url} alt="Banner" className="w-full h-full object-cover" />}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-gray-800">{toko.nama_toko}</h1>
                <p className="text-xs text-gray-500 mt-0.5">{toko.kategori} · {toko.alamat}</p>
              </div>
              {badgeStatus(toko.status)}
            </div>
            {toko.status === 'Menunggu' && <p className="text-xs text-amber-600 mt-3">⏳ Toko kamu sedang menunggu persetujuan admin.</p>}
            {toko.status === 'Ditolak' && <p className="text-xs text-red-600 mt-3">❌ Toko kamu ditolak admin. Hubungi admin untuk info lebih lanjut.</p>}
            <p className="text-xs text-gray-500 mt-3">⭐ {toko.rating_rata > 0 ? toko.rating_rata : 'Belum ada rating'} · 🛒 {toko.jumlah_pesanan} pesanan</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-2">Status VIP</h2>
          {toko.vip_status === 'active' ? (
            <p className="text-sm text-green-700 font-semibold">
              🟢 VIP {toko.vip_plan === 'daily' ? 'Harian' : 'Bagi Hasil'} aktif
              {toko.vip_selesai ? ` sampai ${new Date(toko.vip_selesai).toLocaleDateString('id-ID')}` : ''}.
            </p>
          ) : toko.vip_status === 'pending' ? (
            <p className="text-sm text-amber-600 font-semibold">⏳ Pengajuan VIP sedang menunggu persetujuan admin.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Belum VIP — toko tetap tampil gratis di Pasar, cuma di bawah yang VIP. Ajukan VIP biar tampil lebih atas:</p>
              <div className="flex gap-2">
                <button onClick={() => ajukanVip('daily')} className="flex-1 bg-amber-500 text-white rounded-xl py-2.5 text-xs font-bold">⭐ Ajukan VIP Harian</button>
                <button onClick={() => ajukanVip('commission')} className="flex-1 bg-brand-600 text-white rounded-xl py-2.5 text-xs font-bold">📈 Ajukan VIP Bagi Hasil</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Produk Saya</h2>
            <button onClick={() => setFormProdukBuka(true)} className="text-xs font-bold text-brand-600">＋ Tambah</button>
          </div>

          {produkList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Belum ada produk. Tambah produk pertamamu.</p>
          ) : (
            <div className="space-y-2">
              {produkList.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                  {p.foto_url ? <img src={p.foto_url} alt={p.nama} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg">📦</div>}
                  <div className="flex-1 min-w-0">
                    <b className="text-sm truncate block">{p.nama}</b>
                    <p className="text-xs text-brand-600 font-bold">Rp{Number(p.harga).toLocaleString('id-ID')} · Stok {p.stok ?? 0}</p>
                  </div>
                  {badgeStatus(p.status)}
                  <button onClick={() => hapusProduk(p.id)} className="text-red-500 text-xs font-bold shrink-0">Hapus</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {formProdukBuka && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setFormProdukBuka(false)} className="float-right text-gray-500 text-xl">✕</button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tambah Produk</h2>
            <div className="space-y-3">
              <input value={formProduk.nama} onChange={(e) => setFormProduk({ ...formProduk, nama: e.target.value })} placeholder="Nama produk" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <input type="number" value={formProduk.harga} onChange={(e) => setFormProduk({ ...formProduk, harga: e.target.value })} placeholder="Harga" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <input type="number" value={formProduk.stok} onChange={(e) => setFormProduk({ ...formProduk, stok: e.target.value })} placeholder="Stok (opsional, 0 = tidak dilacak)" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <textarea value={formProduk.deskripsi} onChange={(e) => setFormProduk({ ...formProduk, deskripsi: e.target.value })} placeholder="Deskripsi produk" rows="3" className="w-full border rounded-xl px-3 py-3 text-sm" />
              <input type="file" accept="image/*" onChange={(e) => setFotoProduk(e.target.files?.[0] || null)} className="w-full text-xs" />
              {pesan && <div className="rounded-xl bg-amber-50 border border-amber-100 text-amber-800 p-3 text-xs font-semibold">{pesan}</div>}
              <button disabled={menyimpanProduk} onClick={tambahProduk} className="w-full bg-brand-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
                {menyimpanProduk ? 'Menyimpan…' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
