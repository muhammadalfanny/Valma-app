import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminPosCakAI() {
  const [daftar, setDaftar] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [selected, setSelected] = useState(null)
  const [balasan, setBalasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [fileUrlTampil, setFileUrlTampil] = useState(null)

  const fetchDaftar = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bantuan_user')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setDaftar(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDaftar()
  }, [])

  const bukaDetail = async (item) => {
    setSelected(item)
    setBalasan(item.balasan_admin || '')
    setFileUrlTampil(null)

    if (item.file_url) {
      const { data, error } = await supabase.storage
        .from('file_bantuan')
        .createSignedUrl(item.file_url, 3600)

      if (!error && data?.signedUrl) {
        setFileUrlTampil(data.signedUrl)
      }
    }
  }

  const tutupDetail = () => {
    setSelected(null)
    setBalasan('')
    setFileUrlTampil(null)
  }

  const simpanBalasan = async (statusBaru) => {
    if (!selected) return
    setSaving(true)

    const { error } = await supabase
      .from('bantuan_user')
      .update({
        balasan_admin: balasan,
        status: statusBaru,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selected.id)

    setSaving(false)

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
      return
    }

    tutupDetail()
    fetchDaftar()
  }

  const daftarTersaring =
    filterStatus === 'Semua'
      ? daftar
      : daftar.filter((d) => d.status === filterStatus)

  const badgeWarna = (status) => {
    if (status === 'Selesai') return 'bg-green-100 text-green-700'
    if (status === 'Diproses') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-600'
  }

  const labelKategori = (kategori) => {
    if (kategori === 'lamar-loker') return 'Lamar Loker'
    if (kategori === 'buat-cv') return 'Buatkan CV'
    return 'Lainnya'
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold text-red-600 mb-1">Pos Cak AI - Admin</h1>
      <p className="text-sm text-gray-500 mb-4">
        Semua permintaan bantuan dari warga masuk ke sini.
      </p>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['Semua', 'Diproses', 'Selesai'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
              filterStatus === s
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat...</p>
      ) : daftarTersaring.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center text-gray-500 text-sm shadow">
          Belum ada permintaan{filterStatus !== 'Semua' ? ` berstatus "${filterStatus}"` : ''}.
        </div>
      ) : (
        <div className="space-y-2">
          {daftarTersaring.map((item) => (
            <button
              key={item.id}
              onClick={() => bukaDetail(item)}
              className="w-full text-left bg-white rounded-xl p-4 shadow flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">
                  {item.nama || '(Tanpa nama)'} · {item.email}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {labelKategori(item.kategori)}
                  {item.pesan ? ` — ${item.pesan.slice(0, 50)}${item.pesan.length > 50 ? '...' : ''}` : ''}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(item.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${badgeWarna(item.status)}`}>
                {item.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-bold text-gray-800">Detail Permintaan</h2>
              <button onClick={tutupDetail} className="text-gray-400 text-lg leading-none">✕</button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-gray-400">Nama:</span> {selected.nama || '-'}</p>
              <p><span className="text-gray-400">Email:</span> {selected.email}</p>
              <p><span className="text-gray-400">Kategori:</span> {labelKategori(selected.kategori)}</p>
              {selected.pesan && (
                <p><span className="text-gray-400">Pesan:</span> {selected.pesan}</p>
              )}
              {fileUrlTampil && (
                <p>
                  <a
                    href={fileUrlTampil}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-600 font-semibold underline"
                  >
                    📎 Lihat file terlampir
                  </a>
                </p>
              )}
            </div>

            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Balasan Anda
            </label>
            <textarea
              value={balasan}
              onChange={(e) => setBalasan(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="Tulis balasan untuk warga ini..."
            />

            <div className="flex gap-2">
              <button
                onClick={() => simpanBalasan('Diproses')}
                disabled={saving}
                className="flex-1 border border-red-600 text-red-600 font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Simpan (Diproses)
              </button>
              <button
                onClick={() => simpanBalasan('Selesai')}
                disabled={saving}
                className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Tandai Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
