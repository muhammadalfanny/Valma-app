import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { supabase } from '../supabaseClient'

const money = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0))
// Batas jumlah kursi VIP yang bisa aktif bersamaan (samakan dengan DirektoriMerchant.jsx).
const MAX_VIP_HARIAN = 10
const MAX_VIP_BAGI_HASIL = 20
const tabs = [
  { key: 'merchant', label: '🏪 Merchant', title: 'Verifikasi Merchant' },
  { key: 'pasar', label: '🛒 Pasar', title: 'Moderasi Pasar' },
  { key: 'umkm', label: '🏪 UMKM', title: 'Moderasi UMKM' },
  { key: 'produk', label: '📦 Produk', title: 'Moderasi Produk Merchant' },
  { key: 'vip', label: '⭐ VIP Merchant', title: 'Promosi & VIP' },
  { key: 'tagihan', label: '💰 Tagihan VIP', title: 'Tagihan VIP Bagi Hasil' },
  { key: 'pesanan', label: '🧾 Pesanan', title: 'Pesanan Merchant' },
  { key: 'pengaturan', label: '⚙️ Pengaturan', title: 'Pengaturan Sistem' },
]

export default function AdminCommerce() {
  const key = useLocation().pathname.split('/').pop() || 'pasar'
  const tab = tabs.find((x) => x.key === key) || tabs[0]
  const [rows, setRows] = useState([])
  const [vip, setVip] = useState([])
  const [tagihan, setTagihan] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [settings, setSettings] = useState({ vip_commission: '5', vip_daily: '15000', app_name: 'Surabaya 24 Jam' })

  const load = async () => {
    setLoading(true); setMessage('')
    if (tab.key === 'pengaturan') {
      const { data, error } = await supabase.from('app_settings').select('key,value')
      if (!error) setSettings(Object.fromEntries((data || []).map(x => [x.key, x.value])))
      if (error) setMessage('Pengaturan database belum tersedia.')
    } else if (tab.key === 'merchant') {
      const { data, error } = await supabase.from('merchant_profiles').select('*').order('created_at', { ascending: false }).limit(100)
      if (error) setMessage('Data merchant belum dapat dimuat.')
      setRows(data || [])
    } else if (tab.key === 'vip') {
      const { data, error } = await supabase.from('merchant_vip').select('*').order('created_at', { ascending: false })
      if (error) setMessage(`Tabel VIP belum tersedia: ${error.message}`)
      setVip(data || [])
    } else if (tab.key === 'pesanan') {
      const { data, error } = await supabase.from('merchant_orders').select('*').order('created_at', { ascending: false }).limit(100)
      if (error) setMessage(`Data pesanan belum tersedia: ${error.message}`)
      setRows(data || [])
    } else if (tab.key === 'pasar') {
      const { data, error } = await supabase.from('produk_pasar').select('*').order('created_at', { ascending: false }).limit(100)
      if (error) setMessage(`Data pasar belum tersedia: ${error.message}`)
      setRows(data || [])
    } else if (tab.key === 'umkm') {
      const { data, error } = await supabase.from('umkm').select('*').order('created_at', { ascending: false }).limit(100)
      if (error) setMessage(`Data UMKM belum tersedia: ${error.message}`)
      setRows(data || [])
    } else if (tab.key === 'produk') {
      const { data, error } = await supabase.from('merchant_products').select('*, merchant_profiles(nama_merchant)').order('created_at', { ascending: false }).limit(100)
      if (error) setMessage(`Data produk merchant belum tersedia: ${error.message}`)
      setRows((data || []).map(r => ({ ...r, nama_merchant_join: r.merchant_profiles?.nama_merchant })))
    } else if (tab.key === 'tagihan') {
      const { data, error } = await supabase.from('vip_tagihan_harian').select('*, merchant_profiles(nama_merchant)').order('tanggal', { ascending: false }).limit(100)
      if (error) setMessage(`Data tagihan belum tersedia: ${error.message}`)
      setTagihan((data || []).map(r => ({ ...r, nama_merchant_join: r.merchant_profiles?.nama_merchant })))
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [tab.key])

  const stats = useMemo(() => ({
    total: tab.key === 'vip' ? vip.length : tab.key === 'tagihan' ? tagihan.length : rows.length,
    active: tab.key === 'vip' ? vip.filter((x) => x.status === 'active' || x.status === 'approved').length : tab.key === 'tagihan' ? tagihan.filter((x) => x.status_bayar === 'lunas').length : rows.filter((x) => ['aktif','active','Publik','approved'].includes(x.status)).length,
  }), [tab.key, rows, vip, tagihan])

  const updateVip = async (id, status) => {
    const selected = vip.find(v => v.id === id)
    if (status === 'active' && selected?.merchant_id) {
      const { data: merchant } = await supabase.from('merchant_profiles').select('status').eq('id', selected.merchant_id).maybeSingle()
      if (merchant?.status !== 'active') { setMessage('Merchant harus diverifikasi/diaktifkan terlebih dahulu sebelum VIP diaktifkan.'); return }
    }
    if (status === 'active') {
      const now = new Date().toISOString()
      const batasKursi = selected?.plan === 'daily' ? MAX_VIP_HARIAN : MAX_VIP_BAGI_HASIL
      const namaPaket = selected?.plan === 'daily' ? 'VIP Harian' : 'VIP Bagi Hasil'
      let countQuery = supabase
        .from('merchant_vip')
        .select('id', { count: 'exact', head: true })
        .eq('plan', selected?.plan)
        .eq('status', 'active')
        .neq('id', id)
      // VIP Harian punya batas waktu (ends_at), jadi yang sudah lewat ends_at-nya tidak dihitung.
      // VIP Bagi Hasil (commission) tidak punya ends_at (aktif terus sampai dinonaktifkan sendiri), jadi tidak perlu filter ends_at.
      if (selected?.plan === 'daily') countQuery = countQuery.gt('ends_at', now)
      const { count } = await countQuery
      if ((count || 0) >= batasKursi) {
        setMessage(`Kursi ${namaPaket} sudah penuh (${batasKursi}/${batasKursi}). Tunggu ada yang habis masa aktifnya sebelum mengaktifkan yang baru.`)
        return
      }
    }
    const now = new Date()
    const payload = { status, reviewed_at: now.toISOString() }
    if (status === 'active') {
      payload.starts_at = now.toISOString()
      if (selected?.plan === 'daily') {
        const end = new Date(now)
        end.setDate(end.getDate() + 1)
        payload.ends_at = end.toISOString()
      } else {
        // VIP Bagi Hasil (commission): tanpa batas waktu, aktif sampai merchant sendiri yang nonaktifkan
        payload.ends_at = null
      }
    }
    const { error } = await supabase.from('merchant_vip').update(payload).eq('id', id)
    if (error) setMessage('VIP gagal diperbarui.'); else load()
  }
  const saveSettings = async (next) => {
    setSettings(next); setMessage('')
    const entries = Object.entries(next)
    const { error } = await supabase.from('app_settings').upsert(entries.map(([key,value]) => ({ key, value: String(value), updated_at: new Date().toISOString() })), { onConflict: 'key' })
    setMessage(error ? 'Pengaturan belum dapat disimpan. Jalankan schema terbaru di Supabase.' : 'Pengaturan berhasil disimpan.')
  }

  const updateGeneric = async (id, status) => {
    const tableMap = { merchant: 'merchant_profiles', pasar: 'produk_pasar', umkm: 'umkm', produk: 'merchant_products' }
    const table = tableMap[tab.key] || 'umkm'
    const { error } = await supabase.from(table).update({ status }).eq('id', id)
    if (error) setMessage(error.message); else load()
  }

  const tandaiLunas = async (id) => {
    const { error } = await supabase.from('vip_tagihan_harian').update({ status_bayar: 'lunas', dibayar_at: new Date().toISOString() }).eq('id', id)
    if (error) setMessage(error.message); else load()
  }

  const jalankanHitungTagihan = async () => {
    setMessage('')
    const { error } = await supabase.rpc('hitung_tagihan_vip_harian')
    if (error) setMessage(`Gagal menghitung tagihan: ${error.message}`); else { setMessage('Tagihan hari ini berhasil dihitung ulang.'); load() }
  }

  return <div className="min-h-screen bg-slate-50 pb-10">
    <AppHeader title={tab.title} backTo="/admin" />
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map((t) => <Link key={t.key} to={`/admin/${t.key}`} className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${tab.key === t.key ? 'bg-brand-600 text-white border-brand-600 shadow' : 'bg-white text-gray-600 border-gray-200'}`}>{t.label}</Link>)}
      </div>
      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"><b>Catatan sistem:</b> {message}<br/><span className="text-[10px]">Jalankan SQL di <code>supabase/schema.sql</code> jika tabel baru belum dibuat.</span></div>}
      {tab.key === 'pengaturan' ? <Settings settings={settings} saveSettings={saveSettings} /> : tab.key === 'vip' ? <Vip rows={vip} loading={loading} stats={stats} updateVip={updateVip} /> : tab.key === 'pesanan' ? <Orders rows={rows} loading={loading} /> : tab.key === 'tagihan' ? <Tagihan rows={tagihan} loading={loading} stats={stats} tandaiLunas={tandaiLunas} jalankanHitungTagihan={jalankanHitungTagihan} /> : <Moderation type={tab.key} rows={rows} loading={loading} stats={stats} updateGeneric={updateGeneric} />}
    </main>
  </div>
}

function Moderation({ type, rows, loading, stats, updateGeneric }) {
  const label = type === 'merchant' ? 'merchant' : type === 'pasar' ? 'produk pasar' : type === 'produk' ? 'produk merchant' : 'UMKM'
  // Pasar & UMKM ditampilkan ke publik hanya jika status === 'Publik' (lihat Pasar.jsx/UMKM.jsx),
  // jadi opsi ini WAJIB ada di sini, kalau tidak produk yang di-approve tidak akan pernah tampil.
  const statusOptions = type === 'merchant'
    ? [['pending','Pending'],['aktif','Aktif'],['active','Active'],['approved','Disetujui'],['ditolak','Ditolak']]
    : [['Menunggu','Menunggu'],['Publik','Publik (tampil ke warga)'],['Ditolak','Ditolak']]
  return <>
    <section className="grid grid-cols-2 gap-3"><Stat title="Total" value={stats.total}/><Stat title="Aktif" value={stats.active}/></section>
    <section className="card p-4"><div className="flex justify-between items-center mb-4"><div><h2 className="font-extrabold text-gray-900">Kelola {label}</h2><p className="text-xs text-gray-500">Tinjau dan ubah status data yang masuk.</p></div></div>
      {loading ? <Loading/> : rows.length === 0 ? <Empty text={`Belum ada data ${label}.`}/> : <div className="space-y-2">{rows.map((r) => <div key={r.id} className="border border-gray-100 rounded-xl p-3 flex gap-3 items-center justify-between"><div className="min-w-0"><p className="font-bold text-sm truncate">{r.nama || r.nama_produk || r.judul || 'Tanpa nama'}</p><p className="text-[11px] text-gray-400 truncate">{r.nama_merchant_join ? `Toko: ${r.nama_merchant_join} · ` : ''}{r.kategori || r.alamat || r.deskripsi || '—'}</p></div><select value={r.status || ''} onChange={(e)=>updateGeneric(r.id,e.target.value)} className="input-field !w-auto !py-2 text-xs"><option value="">Status</option>{statusOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>)}</div>}
    </section>
  </>
}
function Vip({ rows, loading, stats, updateVip }) { return <>
  <section className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white p-5 shadow-xl"><div className="flex justify-between gap-4"><div><span className="badge-brand !bg-white/15 !text-white">⭐ MERCHANT VIP</span><h2 className="text-2xl font-extrabold mt-3">Prioritas yang benar-benar terasa.</h2><p className="text-brand-100 text-xs mt-2 max-w-xl">Merchant dapat memilih bagi hasil 5% per pesanan atau tarif tetap Rp15.000 per hari. Admin mengatur persetujuan dan masa aktif dari sini.</p></div><div className="text-right"><p className="text-3xl font-black">{stats.active}</p><p className="text-[10px] text-brand-200">VIP aktif</p></div></div></section>
  <section className="card p-4"><h3 className="font-extrabold">Pengajuan VIP</h3><p className="text-xs text-gray-500 mt-1 mb-4">Setujui hanya merchant yang sudah diverifikasi.</p>{loading ? <Loading/> : rows.length === 0 ? <Empty text="Belum ada pengajuan VIP."/> : <div className="space-y-2">{rows.map(r=><div key={r.id} className="border border-gray-100 rounded-2xl p-4"><div className="flex justify-between gap-3"><div><b className="text-sm">{r.merchant_name || r.nama_merchant || 'Merchant'}</b><p className="text-[11px] text-gray-400 mt-1">Skema: {r.plan === 'commission' ? '5% per pesanan' : 'Rp15.000/hari'} · {r.status}</p></div><span className="badge-brand">{r.status || 'pending'}</span></div>{r.status !== 'active' && r.status !== 'approved' && <div className="flex gap-2 mt-3"><button onClick={()=>updateVip(r.id,'active')} className="btn-primary !py-2">Aktifkan</button><button onClick={()=>updateVip(r.id,'rejected')} className="btn-ghost !py-2">Tolak</button></div>}</div>)}</div>}</section>
  <section className="grid md:grid-cols-2 gap-3"><PlanCard title="Bagi hasil" price="5%" desc="Per pesanan yang masuk melalui merchant."/><PlanCard title="Harian" price="Rp15.000" desc="Tarif tetap per hari tanpa bagi hasil."/></section>
</> }
function Orders({ rows, loading }) { return <section className="card p-4"><h2 className="font-extrabold">Pesanan Merchant</h2><p className="text-xs text-gray-500 mt-1 mb-4">Monitor transaksi merchant dan status pemrosesan.</p>{loading?<Loading/>:rows.length===0?<Empty text="Belum ada pesanan."/>:<div className="space-y-2">{rows.map(r=><div key={r.id} className="border border-gray-100 rounded-xl p-3 flex justify-between"><div><b className="text-sm">#{String(r.id).slice(0,8)}</b><p className="text-xs text-gray-500 mt-1">{r.merchant_name || 'Merchant'} · {r.status || 'pending'}</p></div><b className="text-sm text-brand-700">{money(r.total_amount)}</b></div>)}</div>}</section> }
function Tagihan({ rows, loading, stats, tandaiLunas, jalankanHitungTagihan }) {
  const totalBelumBayar = rows.filter(r => r.status_bayar !== 'lunas').reduce((a, r) => a + Number(r.jumlah_tagihan || 0), 0)
  return <>
    <section className="grid grid-cols-2 gap-3"><Stat title="Total tagihan" value={stats.total}/><Stat title="Sudah lunas" value={stats.active}/></section>
    <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex justify-between items-center gap-3"><div><p className="text-xs font-bold text-amber-800">Total belum dibayar</p><p className="text-lg font-black text-amber-900">{money(totalBelumBayar)}</p></div><button onClick={jalankanHitungTagihan} className="btn-ghost !py-2 !px-3 text-xs shrink-0">🔄 Hitung ulang hari ini</button></section>
    <section className="card p-4"><h2 className="font-extrabold">Tagihan VIP Bagi Hasil (5%)</h2><p className="text-xs text-gray-500 mt-1 mb-4">Merchant yang tidak membayar tagihan akan di-ban dari daftar UMKM.</p>
      {loading ? <Loading/> : rows.length === 0 ? <Empty text="Belum ada tagihan."/> : <div className="space-y-2">{rows.map(r=><div key={r.id} className="border border-gray-100 rounded-xl p-3 flex gap-3 items-center justify-between"><div className="min-w-0"><p className="font-bold text-sm truncate">{r.nama_merchant_join || 'Merchant'}</p><p className="text-[11px] text-gray-400 truncate">{r.tanggal} · Omzet {money(r.total_pesanan)}</p></div><div className="text-right shrink-0"><p className="font-black text-sm text-brand-700">{money(r.jumlah_tagihan)}</p>{r.status_bayar === 'lunas' ? <span className="badge-brand !bg-green-100 !text-green-700">Lunas</span> : <button onClick={()=>tandaiLunas(r.id)} className="btn-primary !py-1 !px-2 text-[11px] mt-1">Tandai lunas</button>}</div></div>)}</div>}
    </section>
  </>
}
function Settings({settings,saveSettings}){const [draft,setDraft]=useState(settings);useEffect(()=>setDraft(settings),[settings]);return <div className="space-y-4"><section className="card p-5"><h2 className="font-extrabold">Pengaturan sistem</h2><p className="text-xs text-gray-500 mt-1">Atur nilai bisnis yang aman diubah tanpa mengedit source code.</p><div className="grid gap-3 mt-4"><div><label className="field-label">Nama aplikasi</label><input className="input-field" value={draft.app_name||''} onChange={e=>setDraft({...draft,app_name:e.target.value})}/></div><div><label className="field-label">Komisi VIP (%)</label><input type="number" min="0" max="100" className="input-field" value={draft.vip_commission||'5'} onChange={e=>setDraft({...draft,vip_commission:e.target.value})}/></div><div><label className="field-label">Tarif VIP harian (Rp)</label><input type="number" min="0" className="input-field" value={draft.vip_daily||'15000'} onChange={e=>setDraft({...draft,vip_daily:e.target.value})}/></div><div><label className="field-label">Zona awal</label><input className="input-field" value="Surabaya" readOnly/></div><button className="btn-primary" onClick={()=>saveSettings(draft)}>Simpan pengaturan</button></div></section><section className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-xs text-brand-800"><b>Keamanan:</b> secret key pembayaran tidak disimpan di tabel ini dan tidak boleh diletakkan di frontend.</section></div>}
function SettingRow({title,value}){return <div className="flex justify-between gap-4 rounded-xl bg-gray-50 p-3"><span className="text-xs font-bold text-gray-600">{title}</span><span className="text-xs text-gray-500 text-right">{value}</span></div>}
function PlanCard({title,price,desc}){return <div className="card p-4"><p className="text-xs font-bold text-brand-600">{title}</p><p className="text-2xl font-black text-gray-900 mt-1">{price}</p><p className="text-xs text-gray-500 mt-1">{desc}</p></div>}
function Stat({title,value}){return <div className="card p-4"><p className="text-[10px] uppercase tracking-wide font-bold text-gray-400">{title}</p><p className="text-2xl font-black text-brand-700 mt-1">{value}</p></div>}
function Loading(){return <div className="py-10 text-center text-xs text-gray-400">Memuat data…</div>}
function Empty({text}){return <div className="py-10 text-center"><div className="text-3xl">📭</div><p className="text-sm font-bold text-gray-700 mt-2">{text}</p></div>}
