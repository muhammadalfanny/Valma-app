import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { supabase } from '../supabaseClient'

// Konfigurasi tiap sumber antrean: tabel, cara menampilkan judul/isi,
// dan nilai status saat disetujui/ditolak. Tambah entri baru di sini
// kalau nanti ada modul lain yang dibuka untuk user (Event, UMKM, dst).
const SOURCES = [
  {
    type: 'laporan',
    icon: '📢',
    label: 'Laporan Warga',
    table: 'reports',
    pendingValue: 'Menunggu',
    title: (r) => r.judul,
    subtitle: (r) => r.kategori,
    body: (r) => r.deskripsi,
    approveValue: 'Diproses',
    rejectValue: null, // laporan tidak punya status "ditolak", lihat detail di menu Laporan
    detailPath: '/admin/laporan',
  },
  {
    type: 'forum',
    icon: '💬',
    label: 'Uneg-Uneg',
    table: 'forum',
    pendingValue: 'Menunggu',
    title: (r) => r.judul,
    subtitle: (r) => r.kategori,
    body: (r) => r.isi,
    approveValue: 'Publik',
    rejectValue: 'Ditolak',
    detailPath: '/forum',
  },
  {
    type: 'pasar',
    icon: '🛒',
    label: 'Pasar',
    table: 'produk_pasar',
    pendingValue: 'Menunggu',
    title: (r) => r.nama,
    subtitle: (r) => `${r.kategori || ''}${r.harga ? ' · Rp' + Number(r.harga).toLocaleString('id-ID') : ''}`,
    body: (r) => r.deskripsi,
    approveValue: 'Publik',
    rejectValue: 'Ditolak',
    detailPath: '/admin/pasar',
  },
  {
    type: 'vip',
    icon: '⭐',
    label: 'Pengajuan VIP',
    table: 'merchant_vip',
    pendingValue: 'pending',
    title: (r) => r.merchant_name,
    subtitle: (r) => (r.plan === 'commission' ? 'Bagi hasil 5% per pesanan' : 'Tarif harian Rp15.000'),
    body: () => null,
    approveValue: null, // butuh logika tanggal aktif, tetap dikerjakan di halaman VIP
    rejectValue: null,
    detailPath: '/admin/vip',
  },
  {
    type: 'event',
    icon: '🎪',
    label: 'Event Warga',
    table: 'event',
    pendingValue: 'Menunggu',
    title: (r) => r.judul,
    subtitle: (r) => r.lokasi,
    body: (r) => r.deskripsi,
    approveValue: 'Publik',
    rejectValue: 'Ditolak',
    detailPath: '/event',
  },
  {
    type: 'umkm',
    icon: '🏪',
    label: 'UMKM',
    table: 'umkm',
    pendingValue: 'Menunggu',
    title: (r) => r.nama_usaha,
    subtitle: (r) => r.kategori,
    body: (r) => r.deskripsi,
    approveValue: 'Publik',
    rejectValue: 'Ditolak',
    detailPath: '/umkm',
  },
  {
    type: 'lowongan',
    icon: '💼',
    label: 'Lowongan',
    table: 'lowongan',
    pendingValue: 'Menunggu',
    title: (r) => r.judul,
    subtitle: (r) => r.perusahaan,
    body: (r) => r.deskripsi,
    approveValue: 'Publik',
    rejectValue: 'Ditolak',
    detailPath: '/lowongan',
  },
]

export default function AdminAntrean() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    const results = await Promise.all(
      SOURCES.map(async (src) => {
        const { data, error } = await supabase
          .from(src.table)
          .select('*')
          .eq('status', src.pendingValue)
          .order('created_at', { ascending: false })
        if (error) return []
        return (data || []).map((row) => ({ ...row, __source: src }))
      })
    )
    const merged = results
      .flat()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setItems(merged)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const act = async (item, value) => {
    setBusyId(item.id)
    const { error } = await supabase
      .from(item.__source.table)
      .update({ status: value })
      .eq('id', item.id)

    if (!error && item.user_id) {
      const judul = item.__source.title(item) || item.__source.label
      await supabase.from('notifications').insert([
        {
          user_id: item.user_id,
          judul: `${item.__source.label} ${value === item.__source.rejectValue ? 'ditolak' : 'disetujui'}`,
          isi: `"${judul}" sekarang berstatus ${value}.`,
        },
      ])
    }

    setBusyId(null)
    if (error) {
      alert('Gagal memperbarui: ' + error.message)
      return
    }
    fetchAll()
  }

  const grouped = items.reduce((acc, it) => {
    acc[it.__source.type] = (acc[it.__source.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <AppHeader title="Antrean Konfirmasi" backTo="/admin" />

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <section className="rounded-2xl bg-brand-900 text-white p-5">
          <p className="text-xs text-brand-200">Total menunggu konfirmasi</p>
          <p className="text-4xl font-black mt-1">{items.length}</p>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SOURCES.filter((s) => grouped[s.type]).map((s) => (
                <span key={s.type} className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full">
                  {s.icon} {s.label} · {grouped[s.type]}
                </span>
              ))}
            </div>
          )}
        </section>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Memuat antrean…</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-3xl">✅</div>
            <p className="text-sm font-bold text-gray-700 mt-2">Semua sudah dikonfirmasi.</p>
            <p className="text-xs text-gray-400 mt-1">Tidak ada yang menunggu saat ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const src = item.__source
              return (
                <article key={`${src.type}-${item.id}`} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-block bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full">
                        {src.icon} {src.label}
                      </span>
                      <h2 className="font-bold text-gray-800 mt-2 truncate">{item.__source.title(item) || 'Tanpa judul'}</h2>
                      {src.subtitle(item) && <p className="text-[11px] text-gray-400 mt-0.5">{src.subtitle(item)}</p>}
                      {src.body(item) && <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">{src.body(item)}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {src.approveValue ? (
                      <button
                        disabled={busyId === item.id}
                        onClick={() => act(item, src.approveValue)}
                        className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-xl disabled:opacity-50"
                      >
                        ✓ Setujui
                      </button>
                    ) : (
                      <Link
                        to={src.detailPath}
                        className="flex-1 text-center bg-brand-600 text-white text-xs font-bold py-2 rounded-xl"
                      >
                        Buka di menu {src.label} →
                      </Link>
                    )}
                    {src.rejectValue && (
                      <button
                        disabled={busyId === item.id}
                        onClick={() => act(item, src.rejectValue)}
                        className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-2 rounded-xl disabled:opacity-50"
                      >
                        ✕ Tolak
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
