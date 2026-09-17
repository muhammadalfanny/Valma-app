import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { supabase } from '../supabaseClient'

// Batas jumlah kursi VIP yang bisa aktif bersamaan. Ubah angka ini kalau mau
// menambah/mengurangi kuota (samakan juga dengan MAX_VIP di AdminCommerce.jsx).
const MAX_VIP_HARIAN = 10
const MAX_VIP_BAGI_HASIL = 20

export default function DirektoriMerchant() {
  const [loading, setLoading] = useState(true)
  const [harian, setHarian] = useState([])
  const [bagiHasil, setBagiHasil] = useState([])
  const [biasa, setBiasa] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const now = new Date().toISOString()

      const [{ data: merchants }, { data: vipAktif }] = await Promise.all([
        supabase
          .from('merchant_profiles')
          .select('*')
          .in('status', ['active', 'aktif', 'approved'])
          .order('created_at', { ascending: false }),
        supabase
          .from('merchant_vip')
          .select('*')
          .eq('status', 'active')
          .gt('ends_at', now)
          .order('starts_at', { ascending: true }),
      ])

      const daftarMerchant = merchants || []
      const daftarVip = vipAktif || []

      // Cocokkan tiap merchant dengan VIP aktifnya (kalau ada)
      const denganVip = daftarMerchant.map((m) => ({
        ...m,
        __vip: daftarVip.find((v) => v.merchant_id === m.id) || null,
      }))

      const vipHarian = denganVip
        .filter((m) => m.__vip?.plan === 'daily')
        .sort((a, b) => new Date(a.__vip.starts_at) - new Date(b.__vip.starts_at))
        .slice(0, MAX_VIP_HARIAN)

      const vipBagiHasil = denganVip
        .filter((m) => m.__vip?.plan === 'commission')
        .sort((a, b) => new Date(a.__vip.starts_at) - new Date(b.__vip.starts_at))
        .slice(0, MAX_VIP_BAGI_HASIL)

      const nonVip = denganVip
        .filter((m) => !m.__vip)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setHarian(vipHarian)
      setBagiHasil(vipBagiHasil)
      setBiasa(nonVip)
      setLoading(false)
    }

    load()
  }, [])

  const KartuMerchant = ({ m, nomorKursi, jenisBadge }) => (
    <Link
      to={`/merchant/${m.id}`}
      className="block bg-white rounded-2xl border border-gray-200 shadow-sm p-4 active:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {jenisBadge && (
            <span
              className={`inline-block text-[10px] font-black px-2 py-1 rounded-full mb-2 ${
                jenisBadge === 'harian'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-brand-100 text-brand-700'
              }`}
            >
              {jenisBadge === 'harian' ? `⭐ VIP HARIAN #${nomorKursi}` : `📈 VIP BAGI HASIL #${nomorKursi}`}
            </span>
          )}
          <h2 className="font-bold text-gray-800 truncate">{m.nama_merchant}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{m.kategori || 'UMKM'} · {m.alamat}</p>
          {m.deskripsi && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{m.deskripsi}</p>}
        </div>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <AppHeader title="Direktori Merchant" backTo="/layanan" />

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Memuat direktori merchant…</div>
        ) : (
          <>
            {harian.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">⭐ Merchant Unggulan (VIP Harian)</h3>
                <div className="space-y-3">
                  {harian.map((m, i) => (
                    <KartuMerchant key={m.id} m={m} nomorKursi={i + 1} jenisBadge="harian" />
                  ))}
                </div>
              </section>
            )}

            {bagiHasil.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">📈 Merchant Pilihan (VIP Bagi Hasil)</h3>
                <div className="space-y-3">
                  {bagiHasil.map((m, i) => (
                    <KartuMerchant key={m.id} m={m} nomorKursi={i + 1} jenisBadge="bagi-hasil" />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">🏪 Merchant Lainnya</h3>
              {biasa.length === 0 && harian.length === 0 && bagiHasil.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <div className="text-3xl mb-2">🏪</div>
                  <p className="text-sm font-bold text-gray-700">Belum ada merchant terverifikasi.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {biasa.map((m) => (
                    <KartuMerchant key={m.id} m={m} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
