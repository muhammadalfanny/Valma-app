import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import "leaflet/dist/leaflet.css";
import L from 'leaflet'
import { supabase } from '../supabaseClient'
import ReactMarkdown from 'react-markdown'


function PetaInteraktif({ target }) {
  const map = useMap()

  useEffect(() => {
    if (target) {
      map.setView([target.latitude, target.longitude], 16)
    }
  }, [target, map])

  return null
}

function KontrolPusat({ onReset, setLokasiPengguna }) {
  const map = useMap()

  const kembaliKePusat = () => {
    map.setView([-7.2575, 112.7521], 13)
  }

  const lokasiSaya = () => {
    if (!navigator.geolocation) {
      alert('Lokasi tidak tersedia di perangkat ini.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        const lokasi = [
          posisi.coords.latitude,
          posisi.coords.longitude
        ]

        setLokasiPengguna(lokasi)
        map.setView(lokasi, 16)
      },
      () => {
        alert('Lokasi perangkat tidak dapat diakses.')
      }
    )
  }

  return (
    <>
      <button
        onClick={() => {
          kembaliKePusat()
          if (onReset) onReset()
        }}
        className="absolute z-[1000] top-3 right-3 bg-white shadow-lg border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-gray-700"
      >
        📍 Pusat Surabaya
      </button>

      <button
        onClick={lokasiSaya}
        className="absolute z-[1000] top-14 right-3 bg-white shadow-lg border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-gray-700"
      >
        📍 Lokasi Saya
      </button>
    </>
  )
}

export default function Peta() {
  const [data, setData] = useState([])
  const [lokasiPengguna, setLokasiPengguna] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Semua')
  const [pencarian, setPencarian] = useState('')
  const [filterWaktu, setFilterWaktu] = useState('Semua')
  const [itemTerpilih, setItemTerpilih] = useState(null)

  const pusatSurabaya = [-7.2575, 112.7521]

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (posisi) => {
        setLokasiPengguna([
          posisi.coords.latitude,
          posisi.coords.longitude
        ])
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])


  const lolosFilterWaktu = (createdAt) => {
    if (filterWaktu === 'Semua' || !createdAt) return true

    const sekarang = Date.now()
    const waktu = new Date(createdAt).getTime()

    const batas = {
      '24 Jam': 24 * 60 * 60 * 1000,
      '7 Hari': 7 * 24 * 60 * 60 * 1000,
      '30 Hari': 30 * 24 * 60 * 60 * 1000
    }

    return sekarang - waktu <= batas[filterWaktu]
  }

  const buatIkon = (kategori) => {
    const warna = {
      'Laporan Warga': '#eab308',
      'Fasilitas': '#2563eb',
      'Banjir': '#f97316',
      'Jalan': '#6b7280',
      'Darurat': '#dc2626',
      'Event': '#9333ea',
      'Info': '#16a34a'
    }

    return L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${warna[kategori] || '#16a34a'};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    })
  }


  useEffect(() => {
    const fetchData = async () => {
      const { data: hasil } = await supabase
        .from('peta_surabaya')
        .select('*')
        .eq('status', 'Publik')
        .order('created_at', { ascending: false })

      const { data: hasilLaporan } = await supabase
        .from('reports')
        .select('id, judul, kategori, deskripsi, latitude, longitude, status, created_at')
        .in('status', ['Diproses', 'Selesai'])
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })

      const dataAman = (hasil || []).filter(
        (item) =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude))
      )

      const reportsAman = (hasilLaporan || []).filter(
        (item) =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude))
      )

      setData(dataAman)
      setReports(reportsAman)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Satu daftar gabungan (info admin + laporan warga), difilter SEKALI di sini
  // saja — dipakai ulang untuk titik di peta dan untuk daftar kartu di bawah,
  // supaya tidak ada 2-3 tempat beda yang harus disamakan tiap ada perubahan.
  const itemGabungan = useMemo(() => {
    const infoAdmin = data
      .filter((item) => (filter === 'Semua' || item.kategori === filter) && lolosFilterWaktu(item.created_at))
      .filter((item) =>
        (item.judul || '').toLowerCase().includes(pencarian.toLowerCase()) ||
        (item.deskripsi || '').toLowerCase().includes(pencarian.toLowerCase())
      )
      .map((item) => ({ ...item, sumber: 'peta' }))

    const laporanWarga = reports
      .filter((item) => (filter === 'Semua' || filter === 'Laporan Warga') && lolosFilterWaktu(item.created_at))
      .filter((item) =>
        (item.judul || '').toLowerCase().includes(pencarian.toLowerCase()) ||
        (item.deskripsi || '').toLowerCase().includes(pencarian.toLowerCase())
      )
      .map((item) => ({ ...item, kategori: 'Laporan Warga', sumber: 'laporan' }))

    return [...infoAdmin, ...laporanWarga]
  }, [data, reports, filter, filterWaktu, pencarian])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🗺️ Peta Surabaya</h1>
        <p className="text-xs text-brand-100 mt-1">
          Informasi lokasi dan kejadian di Surabaya
        </p>
      </header>

      <main>
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <input
            value={pencarian}
            onChange={(e) => setPencarian(e.target.value)}
            placeholder="🔎 Cari informasi di peta..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div className="px-4 py-3 bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {[
              'Semua',
              'Laporan Warga',
              'Fasilitas',
              'Banjir',
              'Jalan',
              'Darurat',
              'Event',
              'Info'
            ].map((kategori) => (
              <button
                key={kategori}
                onClick={() => setFilter(kategori)}
                className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
                  filter === kategori
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {kategori}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {['Semua', '24 Jam', '7 Hari', '30 Hari'].map((waktu) => (
              <button
                key={waktu}
                onClick={() => setFilterWaktu(waktu)}
                className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
                  filterWaktu === waktu
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                🕒 {waktu}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">🟡 Laporan Warga</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">🔵 Fasilitas</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">🟠 Banjir</span>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full">⚪ Jalan</span>
            <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded-full">🔴 Darurat</span>
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">🟣 Event</span>
          </div>
        </div>

        <div className="w-full h-[65vh]">
          <MapContainer
            center={pusatSurabaya}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <KontrolPusat onReset={() => setItemTerpilih(null)} setLokasiPengguna={setLokasiPengguna} />
            <PetaInteraktif target={itemTerpilih} />

            {lokasiPengguna && (
              <Marker
                position={lokasiPengguna}
                zIndexOffset={1000}
                icon={L.divIcon({
                  className: '',
                  html: '<div style="width:34px;height:34px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:16px;">📍</div>',
                  iconSize: [34, 34],
                  iconAnchor: [17, 17]
                })}
              >
                <Popup>
                  <strong>📍 Anda di sini</strong>
                  <br />
                  Lokasi perangkat Anda
                </Popup>
              </Marker>
            )}

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {itemGabungan.map((item) => (
              <Marker
                key={`${item.sumber}-${item.id}`}
                position={[item.latitude, item.longitude]}
                icon={buatIkon(item.sumber === 'laporan' ? 'Laporan Warga' : item.kategori)}
              >
                <Popup>
                  <strong>{item.sumber === 'laporan' ? `🟡 ${item.judul}` : item.judul}</strong>
                  <br />
                  <span>{item.kategori}</span>
                  {item.sumber === 'laporan' && (
                    <>
                      <br />
                      <span>Status: {item.status}</span>
                    </>
                  )}
                  {item.deskripsi && (
                    <>
                      <br />
                      <span>{item.deskripsi}</span>
                    </>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="p-4 max-w-2xl mx-auto">
          {itemTerpilih && (
            <div className="mb-4 bg-white rounded-2xl border border-brand-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-brand-600 uppercase">
                    Detail Lokasi
                  </p>
                  <h2 className="font-bold text-gray-800 mt-1">
                    {itemTerpilih.judul}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {itemTerpilih.kategori || 'Laporan Warga'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setItemTerpilih(null)
                  }}
                  className="text-xs font-bold text-gray-400"
                >
                  ✕
                </button>
              </div>

                {itemTerpilih.deskripsi && (
                  <div className="text-sm text-gray-600 mt-3 whitespace-pre-line">
                    <ReactMarkdown>{itemTerpilih.deskripsi}</ReactMarkdown>
                  </div>
                )}

              {itemTerpilih.sumber === 'laporan' && (
                <p className="text-xs font-semibold text-gray-500 mt-3">
                  Status: {itemTerpilih.status || 'Menunggu'}
                </p>
              )}

              <p className="text-[10px] text-gray-400 mt-3">
                📍 {itemTerpilih.latitude}, {itemTerpilih.longitude}
              </p>
            </div>
          )}

          {itemTerpilih && (
            <button
              onClick={() => setItemTerpilih(null)}
              className="mb-3 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-xl"
            >
              ✕ Hapus pilihan
            </button>
          )}
          {loading ? (
            <p className="text-center text-sm text-gray-400">
              Memuat titik peta...
            </p>
          ) : itemGabungan.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500">
                Belum ada informasi lokasi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {itemGabungan.map((item) => (
                <div
                  onClick={() => setItemTerpilih(item)}
                  className={`rounded-2xl border shadow-sm p-4 cursor-pointer active:scale-[0.99] transition ${
                    itemTerpilih?.id === item.id
                      ? 'bg-brand-50 border-brand-300 ring-2 ring-brand-100'
                      : 'bg-white border-gray-200'
                  }`}

                  key={`${item.sumber}-${item.id}`}

                >
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    item.sumber === 'laporan'
                      ? 'text-yellow-700 bg-yellow-50'
                      : 'text-brand-600 bg-brand-50'
                  }`}>
                    {item.sumber === 'laporan' ? '🟡 LAPORAN WARGA' : item.kategori}
                  </span>

                  <h2 className="font-bold text-gray-800 mt-2">
                    {item.judul}
                  </h2>

                  {item.deskripsi && (
                    <p className="text-xs text-gray-600 mt-1">
                      {item.deskripsi}
                    </p>
                  )}

                  {item.sumber === 'laporan' && (
                    <p className="text-[10px] font-semibold text-gray-500 mt-2">
                      Status: {item.status || 'Menunggu'}
                    </p>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setItemTerpilih(item)
                    }}
                    className="mt-3 text-[10px] font-bold text-brand-600 bg-brand-50 px-3 py-2 rounded-xl"
                  >
                    📍 Lihat di Peta
                  </button>

                  <p className="text-[10px] text-gray-400 mt-2">
                    📍 {item.latitude}, {item.longitude}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
