import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function LowonganDetail() {
  const { id } = useParams()
const { user } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let batal = false
    async function ambilData() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('lowongan')
        .select('*')
        .eq('id', id)
        .eq('status', 'Publik')
        .maybeSingle()
      if (batal) return
      if (error) setError('Gagal memuat lowongan. Coba lagi nanti.')
      else setItem(data)
      setLoading(false)
    }
    ambilData()
    return () => {
      batal = true
    }
  }, [id])

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Memuat lowongan...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>
  }

  if (!item) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-4">Lowongan tidak ditemukan atau belum dipublikasikan.</p>
        <Link to="/lowongan" className="text-blue-600 underline">
          Kembali ke daftar lowongan
        </Link>
      </div>
    )
  }

  const kontakAdalahLink = item.kontak && /^https?:\/\//i.test(item.kontak)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link to="/lowongan" className="text-blue-600 text-sm">
        &larr; Kembali ke daftar lowongan
      </Link>

      <div className="bg-white rounded-2xl shadow p-5 mt-3">
        <h1 className="text-xl font-bold text-gray-900">{item.judul}</h1>
        <p className="text-gray-600 mt-1">{item.perusahaan}</p>

        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          {item.posisi && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{item.posisi}</span>
          )}
          {item.kategori && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{item.kategori}</span>
          )}
          {item.tipe_kerja && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{item.tipe_kerja}</span>
          )}
          {item.lowongan_terverifikasi && (
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full">Terverifikasi</span>
          )}
        </div>

        {item.lokasi && <p className="text-sm text-gray-600 mt-3">Lokasi: {item.lokasi}</p>}

        {item.deskripsi && (
          <div className="mt-4">
            <h2 className="font-semibold text-gray-900 mb-1">Deskripsi</h2>
            <p className="text-gray-700 whitespace-pre-line">{item.deskripsi}</p>
          </div>
        )}

        {item.kontak && (
          <div className="mt-5">
            <h2 className="font-semibold text-gray-900 mb-1">Cara melamar</h2>
            {!user ? (<button onClick={() => navigate('/login', { state: { redirectTo: '/lowongan/' + id } })} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">Login untuk melamar</button>) : kontakAdalahLink ? (
              <a
                href={item.kontak}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Lamar sekarang
              </a>
            ) : (
              <p className="text-gray-700">{item.kontak}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
