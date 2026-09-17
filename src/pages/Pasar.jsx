import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { supabase } from '../supabaseClient'

const KATEGORI_LIST = ['Makanan', 'Minuman', 'Barang', 'Jasa']

export default function Pasar() {
  const [toko, setToko] = useState([])
  const [loading, setLoading] = useState(true)
  const [pencarian, setPencarian] = useState('')
  const [produkTerpilih, setProdukTerpilih] = useState(null)

  useEffect(() => {
    ambilPasar()
  }, [])

  async function ambilPasar() {
    setLoading(true)
    const { data, error } = await supabase
      .from('toko')
      .select(
        'id,nama_toko,kategori,alamat,deskripsi,foto_url,banner_url,kontak,lokasi_terverifikasi,vip_plan,vip_status,vip_selesai,rating_rata,jumlah_rating,produk(id,nama,harga,deskripsi,foto_url,stok,status)'
      )
      .eq('status', 'Publik')
      .eq('diban', false)

    if (error) {
      console.error('Gagal memuat Pasar:', error)
      setToko([])
    } else {
      setToko(
        (data || []).map((item) => ({
          ...item,
          produk: (item.produk || []).filter((p) => p.status === 'Publik'),
        }))
      )
    }
    setLoading(false)
  }

  const vipAktif = (t) => t.vip_status === 'active' && (!t.vip_selesai || new Date(t.vip_selesai) >= new Date())

  const kelompok = useMemo(() => {
    const kata = pencarian.trim().toLowerCase()
    const cocokCari = (store) => {
      if (!kata) return true
      return [store.nama_toko, store.deskripsi, store.alamat, ...store.produk.map((p) => p.nama)]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(kata))
    }

    return KATEGORI_LIST.map((kat) => {
      const daftar = toko
        .filter((t) => t.kategori === kat && cocokCari(t))
        .sort((a, b) => {
          const av = vipAktif(a) ? 1 : 0
          const bv = vipAktif(b) ? 1 : 0
          if (av !== bv) return bv - av
          return Number(b.rating_rata || 0) - Number(a.rating_rata || 0)
        })
      return { kategori: kat, daftar }
    }).filter((k) => k.daftar.length > 0)
  }, [toko, pencarian])

  const hubungiPenjual = (kontak) => {
    if (!kontak) {
      alert('Kontak penjual belum tersedia.')
      return
    }
    const bersih = kontak.replace(/[^0-9]/g, '')
    const nomorWa = bersih.startsWith('0') ? '62' + bersih.slice(1) : bersih.startsWith('62') ? bersih : '62' + bersih
    window.location.href = `https://wa.me/${nomorWa}`
  }

  return (
    <div className="min-h-screen bg-gray-50 page-with-bottom-nav pb-8">
      <AppHeader title="Pasar" backTo="/" />
      <header className="bg-brand-600 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-brand-100 font-bold">Surabaya 24 Jam</p>
            <h1 className="text-xl font-extrabold">🛒 Pasar Surabaya</h1>
          </div>
          <div className="mt-4">
            <input
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              placeholder="Cari makanan, toko, jasa..."
              className="w-full rounded-xl bg-white text-gray-800 px-4 py-3 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {loading ? (
          <div className="card p-8 text-center text-sm text-gray-400 mt-4">Memuat Pasar…</div>
        ) : kelompok.length === 0 ? (
          <div className="card p-8 text-center mt-4">
            <p className="font-bold text-gray-700">Belum ada toko atau produk yang cocok.</p>
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain, atau jadi yang pertama daftar toko.</p>
          </div>
        ) : (
          kelompok.map((k) => (
            <section key={k.kategori} className="mt-5">
              <h2 className="text-xs font-bold text-gray-500 uppercase mb-2 px-0.5">{k.kategori}</h2>
              <div className="space-y-4">
                {k.daftar.map((store) => (
                  <article key={store.id} className="card overflow-hidden bg-white">
                    <div className="h-28 bg-brand-50 relative">
                      {store.banner_url ? (
                        <img src={store.banner_url} alt={store.nama_toko} className="w-full h-full object-cover" />
                      ) : store.foto_url ? (
                        <img src={store.foto_url} alt={store.nama_toko} className="w-full h-full object-cover" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {store.foto_url && (
                        <div className="absolute left-4 top-4 w-11 h-11 rounded-full border-2 border-white overflow-hidden bg-white shadow-md">
                          <img src={store.foto_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="absolute left-4 right-4 bottom-3 flex items-end justify-between text-white">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold truncate">{store.nama_toko}</h3>
                            {vipAktif(store) && (
                              <span className="bg-white text-brand-700 rounded-full px-2 py-0.5 text-[9px] font-extrabold">
                                {store.vip_plan === 'daily' ? '⭐ VIP' : '📈 VIP'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/85 truncate">
                            {store.alamat || 'Surabaya'} {store.lokasi_terverifikasi ? '· 🟢 Lokasi terverifikasi' : ''}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold shrink-0">
                          ⭐ {Number(store.rating_rata || 0).toFixed(1)} ({store.jumlah_rating || 0})
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {store.deskripsi && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{store.deskripsi}</p>}
                      {store.produk.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3 text-center">Belum ada produk aktif.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {store.produk.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => setProdukTerpilih({ ...product, toko: store })}
                              className="text-left border border-gray-100 rounded-2xl overflow-hidden bg-white active:scale-[0.99] transition"
                            >
                              <div className="h-28 bg-gray-100">
                                {product.foto_url ? (
                                  <img src={product.foto_url} alt={product.nama} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                                )}
                              </div>
                              <div className="p-3">
                                <p className="text-sm font-bold text-gray-800 line-clamp-2">{product.nama}</p>
                                <p className="text-brand-600 font-extrabold mt-1">Rp{Number(product.harga || 0).toLocaleString('id-ID')}</p>
                                {product.stok > 0 && <p className="text-[10px] text-gray-400 mt-1">Stok: {product.stok}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}

        <div className="text-center mt-8 pb-2">
          <a href="/pasar/mitra" className="text-xs text-gray-400 underline">
            Mau berjualan atau jadi kurir? Daftar jadi mitra di sini
          </a>
        </div>
      </main>

      {produkTerpilih && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-end sm:items-center justify-center" onClick={() => setProdukTerpilih(null)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-600">{produkTerpilih.toko.nama_toko}</p>
                <h2 className="text-xl font-extrabold text-gray-800">{produkTerpilih.nama}</h2>
              </div>
              <button onClick={() => setProdukTerpilih(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            {produkTerpilih.foto_url && (
              <img src={produkTerpilih.foto_url} alt={produkTerpilih.nama} className="w-full h-52 object-cover rounded-2xl mt-4" />
            )}
            <p className="text-xl font-extrabold text-brand-600 mt-4">Rp{Number(produkTerpilih.harga || 0).toLocaleString('id-ID')}</p>
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{produkTerpilih.deskripsi || 'Tidak ada deskripsi.'}</p>
            {produkTerpilih.stok > 0 && <p className="text-xs text-gray-400 mt-2">Stok tersedia: {produkTerpilih.stok}</p>}

            <div className={`mt-4 rounded-xl p-3 text-xs ${produkTerpilih.toko.lokasi_terverifikasi ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
              {produkTerpilih.toko.lokasi_terverifikasi ? '🟢 Lokasi penjual terverifikasi' : '⚪ Lokasi belum terverifikasi'}
            </div>

            <button
              onClick={() => hubungiPenjual(produkTerpilih.toko.kontak)}
              className="w-full mt-4 bg-brand-600 text-white rounded-xl py-3 font-bold"
            >
              Hubungi Penjual via WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
