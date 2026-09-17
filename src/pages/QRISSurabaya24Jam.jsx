import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { QRIS_DATA } from '../utils/qris'

export default function QRISSurabaya24Jam() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, QRIS_DATA, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S24
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-600 uppercase">
                Layanan Digital
              </p>
              <h1 className="text-lg font-bold tracking-tight">
                Surabaya 24 Jam
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 md:py-12">
        {/* Intro */}
        <div className="max-w-2xl mb-8">
          <p className="text-sm font-semibold text-brand-600">
            PEMBAYARAN DIGITAL
          </p>

          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Pembayaran Surabaya 24 Jam
          </h2>

          <p className="mt-3 text-gray-500 leading-relaxed">
            Gunakan QRIS untuk melakukan pembayaran dengan cepat dan praktis
            melalui aplikasi pembayaran yang mendukung QRIS.
          </p>
        </div>

        {/* Main card */}
        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-6">
          {/* QR Card */}
          <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  QRIS
                </p>
                <h3 className="text-xl font-bold mt-1">
                  Scan untuk membayar
                </h3>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold">
                Surabaya 24 Jam
              </div>
            </div>

            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Buka aplikasi pembayaran Anda, lalu scan QRIS di atas.
              </p>
            </div>
          </section>

          {/* Information */}
          <section className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Informasi Pembayaran
              </p>

              <div className="mt-5">
                <p className="text-xs text-gray-400">Merchant</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  SURABAYA 24 JAM
                </p>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400">Area layanan</p>
                <p className="mt-1 font-semibold text-gray-800">
                  Surabaya
                </p>
              </div>
            </div>

            <div className="bg-gray-900 text-white rounded-3xl p-6">
              <p className="text-sm font-semibold">
                Cara melakukan pembayaran
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Buka aplikasi pembayaran yang mendukung QRIS.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Scan QRIS Surabaya 24 Jam.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Periksa nama merchant sebelum menyelesaikan pembayaran.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Surabaya 24 Jam · Layanan digital terintegrasi
          </p>
        </div>
      </main>
    </div>
  )
}
