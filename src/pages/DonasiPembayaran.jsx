import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { supabase } from '../supabaseClient'
import { QRIS_DATA } from '../utils/qris'

export default function DonasiPembayaran() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const canvasRef = useRef(null)

  const donasiId = searchParams.get('donasi')

  const [donasi, setDonasi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mengonfirmasi, setMengonfirmasi] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const ambilDonasi = async () => {
      if (!donasiId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('donasi')
        .select('id, nominal, status, metode_pembayaran')
        .eq('id', donasiId)
        .single()

      if (error) {
        console.error(error)
        setDonasi(null)
      } else {
        setDonasi(data)
      }

      setLoading(false)
    }

    ambilDonasi()
  }, [donasiId])

  useEffect(() => {
    if (!donasi || !canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, QRIS_DATA, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
  }, [donasi])

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka || 0)
  }

  const sudahMenunggu = donasi?.status?.toLowerCase().includes('menunggu verifikasi')
  const sudahLunas = donasi?.status?.toLowerCase().includes('lunas') || donasi?.status?.toLowerCase().includes('berhasil')

  const handleSudahBayar = async () => {
    setMengonfirmasi(true)
    setErrorMsg('')

    const { error } = await supabase
      .from('donasi')
      .update({ status: 'Menunggu Verifikasi' })
      .eq('id', donasiId)

    setMengonfirmasi(false)

    if (error) {
      console.error(error)
      setErrorMsg('Gagal menyimpan konfirmasi. Coba lagi, atau hubungi admin jika terus gagal.')
      return
    }

    setDonasi((prev) => (prev ? { ...prev, status: 'Menunggu Verifikasi' } : prev))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/donasi/${id}/form`)}
            className="text-xs bg-white/15 px-3 py-2 rounded-xl"
          >
            ← Kembali
          </button>

          <h1 className="text-xl font-bold mt-4">
            💳 Pembayaran Donasi
          </h1>

          <p className="text-xs text-brand-100 mt-1">
            Selesaikan pembayaran untuk melanjutkan donasi.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">

        {loading ? (
          <div className="bg-white rounded-2xl border p-6 text-center">
            <p className="text-sm text-gray-500">
              Memuat detail pembayaran...
            </p>
          </div>
        ) : !donasi ? (
          <div className="bg-white rounded-2xl border p-6 text-center">
            <p className="text-sm text-rose-600 font-semibold">
              Data donasi tidak ditemukan.
            </p>

            <button
              onClick={() => navigate(`/donasi/${id}`)}
              className="mt-4 border px-4 py-2 rounded-xl text-sm"
            >
              Kembali ke Program
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border p-5 shadow-sm">

            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500">
                Nominal Donasi
              </p>

              <p className="text-2xl font-bold text-brand-600 mt-1">
                {formatRupiah(donasi.nominal)}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Status: {donasi.status}
              </p>
            </div>

            {sudahLunas ? (
              <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
                <p className="text-2xl">✅</p>
                <p className="font-bold text-green-700 mt-2">Donasi Terverifikasi</p>
                <p className="text-xs text-gray-500 mt-1">
                  Terima kasih, donasimu sudah dikonfirmasi diterima.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6 text-center">
                  <div className="w-64 h-64 mx-auto rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center p-2">
                    <canvas ref={canvasRef} />
                  </div>

                  <h2 className="font-bold text-gray-800 mt-4">
                    Scan QRIS untuk Membayar
                  </h2>

                  <p className="text-xs text-gray-500 mt-2 leading-relaxed px-2">
                    Ini adalah QRIS statis (satu kode untuk semua transaksi).
                    Setelah scan, <span className="font-semibold text-gray-700">masukkan nominal sebesar {formatRupiah(donasi.nominal)} secara manual</span> di
                    aplikasi e-wallet/m-banking kamu sebelum membayar.
                  </p>
                </div>

                {sudahMenunggu ? (
                  <div className="mt-5 bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-yellow-700">
                      ⏳ Menunggu Verifikasi Admin
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Konfirmasi pembayaranmu sudah kami terima. Admin akan memverifikasi
                      manual dan status akan berubah menjadi "Lunas" setelah dicek.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-yellow-700 mb-2">
                      Sudah selesai membayar?
                    </p>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                      Tekan tombol di bawah setelah kamu benar-benar sudah scan &amp; bayar.
                      Ini akan memberi tahu admin untuk memverifikasi pembayaranmu secara manual.
                    </p>

                    {errorMsg && (
                      <p className="text-xs text-rose-600 mb-2">{errorMsg}</p>
                    )}

                    <button
                      onClick={handleSudahBayar}
                      disabled={mengonfirmasi}
                      className="w-full bg-yellow-500 text-white py-3 rounded-lg font-bold text-sm shadow-sm active:bg-yellow-600 disabled:bg-gray-400"
                    >
                      {mengonfirmasi ? 'Menyimpan...' : 'Saya Sudah Bayar'}
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => navigate(`/donasi/${id}`)}
              className="w-full mt-5 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold"
            >
              Kembali ke Program
            </button>

          </div>
        )}

      </main>
    </div>
  )
}
