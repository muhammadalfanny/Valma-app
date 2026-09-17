import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function NotifikasiPribadi() {
  const { user } = useAuth()
  const [notifikasi, setNotifikasi] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifikasi = async () => {
    if (!user?.id) return

    setLoading(true)

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) {
      setNotifikasi(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchNotifikasi()
  }, [user?.id])

  const tandaiDibaca = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ dibaca: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setNotifikasi((sebelumnya) =>
        sebelumnya.map((item) =>
          item.id === id ? { ...item, dibaca: true } : item
        )
      )
    }
  }

  const tandaiSemuaDibaca = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ dibaca: true })
      .eq('user_id', user.id)
      .eq('dibaca', false)

    if (!error) {
      setNotifikasi((sebelumnya) =>
        sebelumnya.map((item) => ({ ...item, dibaca: true }))
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-brand-600 text-white px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">🔔 Notifikasi</h1>
            <p className="text-xs text-brand-100 mt-1">
              Informasi terbaru untuk akun Anda
            </p>
          </div>

          {notifikasi.some((item) => !item.dibaca) && (
            <button
              onClick={tandaiSemuaDibaca}
              className="text-xs bg-white text-brand-600 px-3 py-2 rounded-xl font-semibold"
            >
              Tandai semua
            </button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Memuat notifikasi...
          </p>
        ) : notifikasi.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-sm text-gray-600 font-semibold">
              Belum ada notifikasi.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Perubahan status laporan Anda akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifikasi.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.dibaca && tandaiDibaca(item.id)}
                className={`w-full text-left rounded-2xl border p-4 shadow-sm transition ${
                  item.dibaca
                    ? 'bg-white border-gray-200'
                    : 'bg-brand-50 border-brand-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {item.dibaca ? '🔔' : '🔴'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-bold text-gray-800 text-sm">
                        {item.judul}
                      </h2>

                      {!item.dibaca && (
                        <span className="text-[9px] font-bold text-brand-600">
                          BARU
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {item.isi}
                    </p>

                    <p className="text-[10px] text-gray-400 mt-3">
                      {new Date(item.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
