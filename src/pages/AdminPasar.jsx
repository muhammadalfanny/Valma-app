import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { supabase } from '../supabaseClient'

export default function AdminPasar() {
  const [tab, setTab] = useState('toko') // toko | produk | vip | driver
  const [loading, setLoading] = useState(true)
  const [tokoList, setTokoList] = useState([])
  const [produkList, setProdukList] = useState([])
  const [driverList, setDriverList] = useState([])

  useEffect(() => {
    muatData()
  }, [])

  const muatData = async () => {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: d }] = await Promise.all([
      supabase.from('toko').select('*').order('created_at', { ascending: false }),
      supabase.from('produk').select('*, toko(nama_toko)').order('created_at', { ascending: false }),
      supabase.from('driver').select('*').order('created_at', { ascending: false }),
    ])
    setTokoList(t || [])
    setProdukList(p || [])
    setDriverList(d || [])
    setLoading(false)
  }

  const ubahStatusToko = async (id, status) => {
    const { error } = await supabase.from('toko').update({ status }).eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else muatData()
  }

  const toggleBan = async (id, diban) => {
    if (!confirm(diban ? 'Ban toko ini? Toko tidak akan tampil di Pasar.' : 'Buka ban toko ini?')) return
    const { error } = await supabase.from('toko').update({ diban }).eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else muatData()
  }

  const ubahStatusProduk = async (id, status) => {
    const { error } = await supabase.from('produk').update({ status }).eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else muatData()
  }

  const setujuiVip = async (toko) => {
    const hariAktif = toko.vip_plan === 'daily' ? 1 : 30
    const mulai = new Date()
    const selesai = new Date()
    selesai.setDate(selesai.getDate() + hariAktif)
    const { error } = await supabase
      .from('toko')
      .update({ vip_status: 'active', vip_mulai: mulai.toISOString(), vip_selesai: selesai.toISOString() })
      .eq('id', toko.id)
    if (error) alert('Gagal: ' + error.message)
    else muatData()
  }

  const tolakVip = async (id) => {
    const { error } = await supabase.from('toko').update({ vip_status: 'ditolak' }).eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else muatData()
  }

  const ubahStatusDriver = async (id, status) => {
    const { error } = await supabase.from('driver').update({ status }).eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else muatData()
  }

  const toggleBanDriver = async (id, diban) => {
    if (!confirm(diban ? 'Ban driver ini?' : 'Buka ban driver ini?')) return
    const { error } = await supabase.from('driver').update({ diban }).eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else muatData()
  }

  const badge = (status) => {
    const warna = {
      Publik: 'bg-green-100 text-green-700', Menunggu: 'bg-amber-100 text-amber-700', Ditolak: 'bg-red-100 text-red-700',
      active: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', ditolak: 'bg-red-100 text-red-700', none: 'bg-gray-100 text-gray-500',
    }
    return <span className={`text-[10px] font-black px-2 py-1 rounded-full ${warna[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
  }

  const tokoMenunggu = tokoList.filter((t) => t.status === 'Menunggu')
  const tokoLain = tokoList.filter((t) => t.status !== 'Menunggu')
  const produkMenunggu = produkList.filter((p) => p.status === 'Menunggu')
  const produkLain = produkList.filter((p) => p.status !== 'Menunggu')
  const vipPending = tokoList.filter((t) => t.vip_status === 'pending')
  const driverMenunggu = driverList.filter((d) => d.status === 'Menunggu')
  const driverLain = driverList.filter((d) => d.status !== 'Menunggu')

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <AppHeader title="Admin Pasar" backTo="/admin" />

      <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
        {[
          { key: 'toko', label: `🏪 Toko (${tokoMenunggu.length})` },
          { key: 'produk', label: `📦 Produk (${produkMenunggu.length})` },
          { key: 'vip', label: `⭐ VIP (${vipPending.length})` },
          { key: 'driver', label: `🛵 Driver (${driverMenunggu.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold ${tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="max-w-2xl mx-auto px-4 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Memuat…</div>
        ) : tab === 'toko' ? (
          <>
            {tokoMenunggu.length === 0 && tokoLain.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">Belum ada toko.</div>
            )}
            {[...tokoMenunggu, ...tokoLain].map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="text-sm block truncate">{t.nama_toko}</b>
                    <p className="text-xs text-gray-500 mt-0.5">{t.kategori} · {t.alamat}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📱 {t.kontak}</p>
                  </div>
                  {badge(t.status)}
                </div>
                {t.deskripsi && <p className="text-xs text-gray-600 mt-2">{t.deskripsi}</p>}
                <p className="text-[10px] text-gray-400 mt-2">{t.lokasi_terverifikasi ? '🟢 Lokasi terverifikasi' : '⚪ Lokasi belum terverifikasi'}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {t.status !== 'Publik' && (
                    <button onClick={() => ubahStatusToko(t.id, 'Publik')} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-xs font-bold">✓ Setujui</button>
                  )}
                  {t.status !== 'Ditolak' && (
                    <button onClick={() => ubahStatusToko(t.id, 'Ditolak')} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-xs font-bold">✕ Tolak</button>
                  )}
                  <button onClick={() => toggleBan(t.id, !t.diban)} className={`flex-1 rounded-xl py-2 text-xs font-bold ${t.diban ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.diban ? '🔓 Buka Ban' : '🚫 Ban'}
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : tab === 'produk' ? (
          <>
            {produkMenunggu.length === 0 && produkLain.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">Belum ada produk.</div>
            )}
            {[...produkMenunggu, ...produkLain].map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="text-sm block truncate">{p.nama}</b>
                    <p className="text-xs text-gray-500 mt-0.5">Toko: {p.toko?.nama_toko || '-'}</p>
                    <p className="text-xs text-brand-600 font-bold mt-0.5">Rp{Number(p.harga).toLocaleString('id-ID')} · Stok {p.stok ?? 0}</p>
                  </div>
                  {badge(p.status)}
                </div>
                <div className="flex gap-2 mt-3">
                  {p.status !== 'Publik' && (
                    <button onClick={() => ubahStatusProduk(p.id, 'Publik')} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-xs font-bold">✓ Setujui</button>
                  )}
                  {p.status !== 'Ditolak' && (
                    <button onClick={() => ubahStatusProduk(p.id, 'Ditolak')} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-xs font-bold">✕ Tolak</button>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : tab === 'vip' ? (
          <>
            {vipPending.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">Tidak ada pengajuan VIP.</div>
            ) : (
              vipPending.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <b className="text-sm block">{t.nama_toko}</b>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Ajukan: {t.vip_plan === 'daily' ? '⭐ VIP Harian (aktif 1 hari)' : '📈 VIP Bagi Hasil (aktif 30 hari)'}
                      </p>
                    </div>
                    {badge(t.vip_status)}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setujuiVip(t)} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-xs font-bold">✓ Setujui VIP</button>
                    <button onClick={() => tolakVip(t.id)} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-xs font-bold">✕ Tolak</button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {driverMenunggu.length === 0 && driverLain.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">Belum ada driver.</div>
            )}
            {[...driverMenunggu, ...driverLain].map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="text-sm block truncate">{d.nama}</b>
                    <p className="text-xs text-gray-500 mt-0.5">{d.kendaraan} · {d.plat_nomor}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📱 {d.kontak}</p>
                  </div>
                  {badge(d.status)}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">{d.lokasi_terverifikasi ? '🟢 Lokasi terverifikasi' : '⚪ Lokasi belum terverifikasi'}</p>
                <p className="text-xs text-brand-600 font-bold mt-1">Tabungan THR: Rp{Number(d.saldo_thr).toLocaleString('id-ID')}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {d.status !== 'Aktif' && (
                    <button onClick={() => ubahStatusDriver(d.id, 'Aktif')} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-xs font-bold">✓ Aktifkan</button>
                  )}
                  {d.status !== 'Ditolak' && (
                    <button onClick={() => ubahStatusDriver(d.id, 'Ditolak')} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-xs font-bold">✕ Tolak</button>
                  )}
                  <button onClick={() => toggleBanDriver(d.id, !d.diban)} className={`flex-1 rounded-xl py-2 text-xs font-bold ${d.diban ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>
                    {d.diban ? '🔓 Buka Ban' : '🚫 Ban'}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
