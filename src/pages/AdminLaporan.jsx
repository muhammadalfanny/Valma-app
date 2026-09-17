import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminLaporan() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [fotoSigned, setFotoSigned] = useState({})

  // Foto laporan disimpan di bucket privat, jadi foto_url (public URL) tidak
  // bisa langsung dipakai. Untuk tiap laporan yang punya foto, minta URL
  // sementara (signed URL) khusus untuk sesi admin yang sedang login.
  const buatSignedUrl = async (daftarLaporan) => {
    const hasil = {}

    for (const rep of daftarLaporan) {
      if (!rep.foto_url) continue

      // Ambil nama file dari public URL yang tersimpan, lalu minta signed URL-nya.
      const namaFile = rep.foto_url.split('/foto-laporan/').pop()
      if (!namaFile) continue

      const { data, error } = await supabase.storage
        .from('foto-laporan')
        .createSignedUrl(namaFile, 3600) // berlaku 1 jam

      if (!error && data?.signedUrl) {
        hasil[rep.id] = data.signedUrl
      }
    }

    setFotoSigned(hasil)
  }

  const fetchReports = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert('Gagal memuat laporan: ' + error.message)
    } else {
      setReports(data || [])
      await buatSignedUrl(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Gagal memperbarui status: ' + error.message)
      return
    }

    await supabase
      .from('report_updates')
      .insert([{
        report_id: id,
        status: newStatus,
        catatan: `Status laporan diubah menjadi ${newStatus}`
      }])

    const laporan = reports.find((rep) => rep.id === id)

    if (laporan?.user_id) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: laporan.user_id,
          judul: `Laporan ${newStatus}`,
          isi: `Laporan "${laporan.judul}" sekarang berstatus ${newStatus}.`
        }])
    }

    fetchReports()
  }

  const verifikasiLaporan = async (id) => {
    const { error } = await supabase
      .from('reports')
      .update({ terverifikasi: true })
      .eq('id', id)

    if (error) {
      alert('Gagal verifikasi laporan: ' + error.message)
      return
    }

    fetchReports()
  }

  const deleteReport = async (id) => {
    if (!confirm('Yakin ingin menghapus laporan ini?')) {
      return
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      fetchReports()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              📝 Laporan Warga
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Kelola dan verifikasi laporan warga.
            </p>
          </div>

          <button
            onClick={fetchReports}
            className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-semibold shadow-sm"
          >
            Muat Ulang
          </button>
        </div>

        {loading ? (
          <p className="text-center text-xs text-gray-500 py-10">
            Memuat data laporan...
          </p>
        ) : reports.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 text-sm">
            <p>Belum ada laporan di database.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {rep.kategori}
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        rep.status === 'Selesai'
                          ? 'bg-green-100 text-green-700'
                          : rep.status === 'Diproses'
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {rep.status}
                    </span>

                    <button
                      onClick={() => deleteReport(rep.id)}
                      className="text-rose-600 text-xs font-bold px-1.5 py-0.5 hover:bg-rose-50 rounded"
                      title="Hapus Laporan"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                    {rep.judul}
                    {rep.terverifikasi && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-blue-500 shrink-0"
                        title="Laporan terverifikasi"
                      >
                        <path d="M12 2l2.4 1.2 2.6-.6 1.5 2.2 2.5.9.1 2.6 1.9 1.7-1.9 1.7-.1 2.6-2.5.9-1.5 2.2-2.6-.6L12 22l-2.4-1.2-2.6.6-1.5-2.2-2.5-.9-.1-2.6L1 12l1.9-1.7.1-2.6 2.5-.9 1.5-2.2 2.6.6L12 2z" />
                        <path d="M9.5 12.5l1.8 1.8 3.7-3.9" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </h3>

                  <p className="text-xs text-gray-600 mt-1">
                    {rep.deskripsi}
                  </p>
                </div>

                {rep.foto_url && (
                  fotoSigned[rep.id] ? (
                    <img
                      src={fotoSigned[rep.id]}
                      alt="Bukti"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg text-xs text-gray-400">
                      Memuat foto...
                    </div>
                  )
                )}

                <span
                  className={`inline-block text-[10px] font-medium ${
                    rep.terverifikasi ? 'text-blue-500' : 'text-gray-400'
                  }`}
                >
                  {rep.terverifikasi ? 'Terverifikasi' : 'Belum diverifikasi'}
                </span>

                <div className="text-[10px] text-gray-400 flex flex-col gap-0.5 pt-2 border-t border-gray-100">
                  <span>
                    Lokasi:{' '}
                    {rep.latitude && rep.longitude
                      ? `${rep.latitude.toFixed(4)}, ${rep.longitude.toFixed(4)}`
                      : 'Tidak ada koordinat'}
                  </span>

                  <span>
                    Waktu: {new Date(rep.created_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-600">
                    Ubah Status:
                  </span>

                  <button
                    onClick={() => updateStatus(rep.id, 'Menunggu')}
                    className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded font-medium"
                  >
                    Menunggu
                  </button>

                  <button
                    onClick={() => updateStatus(rep.id, 'Diproses')}
                    className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-2 py-1 rounded font-medium"
                  >
                    Diproses
                  </button>

                  <button
                    onClick={() => updateStatus(rep.id, 'Selesai')}
                    className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-medium"
                  >
                    Selesai
                  </button>

                  {!rep.terverifikasi && (
                    <button
                      onClick={() => verifikasiLaporan(rep.id)}
                      className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded font-medium ml-auto"
                    >
                      ✓ Verifikasi
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
