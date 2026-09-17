import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminPeta() {
  const [data, setData] = useState([])
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kategori, setKategori] = useState('Info')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    const { data: hasil } = await supabase
      .from('peta_surabaya')
      .select('*')
      .order('created_at', { ascending: false })

    setData(hasil || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  const gunakanLokasiSaatIni = () => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung lokasi.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude))
        setLongitude(String(position.coords.longitude))
      },
      (error) => {
        alert("Gagal mengambil lokasi: " + error.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const tambahTitik = async (e) => {
    e.preventDefault()

    if (!judul || !latitude || !longitude) {
      alert('Judul, latitude, dan longitude wajib diisi.')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('peta_surabaya')
      .insert([{
        judul,
        deskripsi,
        kategori,
        latitude: Number(latitude),
        longitude: Number(longitude),
        status: 'Publik'
      }])

    setLoading(false)

    if (error) {
      alert('Gagal menambahkan titik: ' + error.message)
      return
    }

    setJudul('')
    setDeskripsi('')
    setKategori('Info')
    setLatitude('')
    setLongitude('')

    fetchData()
  }

  const hapusTitik = async (id) => {
    if (!confirm('Hapus titik ini?')) return

    const { error } = await supabase
      .from('peta_surabaya')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }

    fetchData()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <h1 className="text-xl font-bold">🗺️ Admin Peta Surabaya</h1>
        <p className="text-xs text-brand-100 mt-1">
          Kelola titik informasi di peta
        </p>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-5">
        <form
          onSubmit={tambahTitik}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3"
        >
          <h2 className="font-bold text-gray-800">
            Tambah Titik
          </h2>

          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul titik"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          >
            <option>Info</option>
            <option>Laporan Warga</option>
            <option>Fasilitas</option>
            <option>Darurat</option>
            <option>Event</option>
            <option>Banjir</option>
            <option>Jalan</option>
          </select>

          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitude, contoh: -7.2575"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={gunakanLokasiSaatIni}
            className="w-full border border-brand-200 text-brand-700 py-2.5 rounded-xl text-sm font-bold"
          >
            📍 Gunakan Lokasi Saat Ini
          </button>

          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitude, contoh: 112.7521"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-bold"
          >
            {loading ? 'Menyimpan...' : '➕ Tambah Titik'}
          </button>
        </form>

        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                    {item.kategori}
                  </span>

                  <h3 className="font-bold text-gray-800 mt-2">
                    {item.judul}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {item.latitude}, {item.longitude}
                  </p>

                  {item.deskripsi && (
                    <p className="text-xs text-gray-600 mt-2">
                      {item.deskripsi}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => hapusTitik(item.id)}
                  className="text-xs text-rose-600 font-bold"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
