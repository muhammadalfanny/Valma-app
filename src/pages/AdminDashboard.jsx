import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function AdminDashboard() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [produkMenunggu, setProdukMenunggu] = useState([])
  const [loadingPasar, setLoadingPasar] = useState(true)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [showEventPanel, setShowEventPanel] = useState(false)
  const [editingEventId, setEditingEventId] = useState(null)
  const [eventForm, setEventForm] = useState({
    judul: '',
    penyelenggara: '',
    deskripsi: '',
    lokasi: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    kategori: ''
  })

  const totalLaporan = reports.length
  const laporanMenunggu = reports.filter((rep) => rep.status === 'Menunggu').length
  const laporanDiproses = reports.filter((rep) => rep.status === 'Diproses').length
  const laporanSelesai = reports.filter((rep) => rep.status === 'Selesai').length

  useEffect(() => {
    fetchReports()
    fetchProdukMenunggu()
    fetchUsers()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReports(data)
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nama, role, wilayah_saya, created_at')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data)
    }

    setLoadingUsers(false)
  }

  const fetchEvents = async () => {
    setLoadingEvents(true)

    const { data, error } = await supabase
      .from('event')
      .select('*')
      .order('tanggal_mulai', { ascending: true })

    if (error) {
      alert('Gagal memuat event: ' + error.message)
    } else {
      setEvents(data || [])
    }

    setLoadingEvents(false)
  }

  const resetEventForm = () => {
    setEditingEventId(null)
    setEventForm({
      judul: '',
      penyelenggara: '',
      deskripsi: '',
      lokasi: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      kategori: ''
    })
  }

  const saveEvent = async (e) => {
    e.preventDefault()

    if (!eventForm.judul.trim()) {
      alert('Judul event wajib diisi.')
      return
    }

    if (!eventForm.tanggal_mulai) {
      alert('Tanggal mulai wajib diisi.')
      return
    }

    const payload = {
      judul: eventForm.judul.trim(),
      penyelenggara: eventForm.penyelenggara.trim(),
      deskripsi: eventForm.deskripsi.trim(),
      lokasi: eventForm.lokasi.trim(),
      tanggal_mulai: new Date(eventForm.tanggal_mulai).toISOString(),
      tanggal_selesai: eventForm.tanggal_selesai
        ? new Date(eventForm.tanggal_selesai).toISOString()
        : null,
      kategori: eventForm.kategori.trim()
    }

    let result

    if (editingEventId) {
      result = await supabase
        .from('event')
        .update(payload)
        .eq('id', editingEventId)
    } else {
      result = await supabase
        .from('event')
        .insert([payload])
    }

    if (result.error) {
      alert('Gagal menyimpan event: ' + result.error.message)
      return
    }

    alert(
      editingEventId
        ? 'Event berhasil diperbarui.'
        : 'Event berhasil ditambahkan.'
    )

    resetEventForm()
    fetchEvents()
  }

  const editEvent = (item) => {
    setEditingEventId(item.id)

    const toInputDateTime = (value) => {
      if (!value) return ''
      const date = new Date(value)
      const pad = (number) => String(number).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    setEventForm({
      judul: item.judul || '',
      penyelenggara: item.penyelenggara || '',
      deskripsi: item.deskripsi || '',
      lokasi: item.lokasi || '',
      tanggal_mulai: toInputDateTime(item.tanggal_mulai),
      tanggal_selesai: toInputDateTime(item.tanggal_selesai),
      kategori: item.kategori || ''
    })
  }

  const deleteEvent = async (id) => {
    if (!confirm('Yakin ingin menghapus event ini?')) {
      return
    }

    const { error } = await supabase
      .from('event')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus event: ' + error.message)
      return
    }

    alert('Event berhasil dihapus.')
    fetchEvents()
  }

  const fetchProdukMenunggu = async () => {
    setLoadingPasar(true)

    const { data, error } = await supabase
      .from('produk_pasar')
      .select('*')
      .eq('status', 'Menunggu')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProdukMenunggu(data)
    }

    setLoadingPasar(false)
  }

  const updateStatusProduk = async (id, newStatus) => {
    const { error } = await supabase
      .from('produk_pasar')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert('Gagal memperbarui produk: ' + error.message)
      return
    }

    setProdukMenunggu((sebelumnya) =>
      sebelumnya.filter((produk) => produk.id !== id)
    )

    alert(
      newStatus === 'Publik'
        ? 'Produk berhasil dipublikasikan.'
        : 'Produk berhasil ditolak.'
    )
  }

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Gagal memperbarui status: ' + error.message)
    } else {
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
  }

  const deleteReport = async (id) => {
    if (confirm('Yakin ingin menghapus laporan ini?')) {
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
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const antreanBadge = laporanMenunggu + (produkMenunggu?.length || 0)
  const menu = [
    { label: `📥 Antrean Konfirmasi${antreanBadge > 0 ? ` (${antreanBadge})` : ''}`, path: '/admin/antrean' },
    { label: '📝 Laporan Warga', path: '/admin/laporan' },
    { label: '📰 Berita', path: '/admin/berita' },
    { label: '🏪 Merchant (Lama)', path: '/admin/merchant' },
    { label: '🛒 Pasar (Lama)', path: '/admin/pasar' },
    { label: '⭐ PASAR (AKTIF - PAKAI INI)', path: '/admin/pasar-v2' },
    { label: '📅 Event', path: 'EVENT_PANEL' },
    { label: '💼 Lowongan', path: '/admin/lowongan' },
    { label: '🎓 Beasiswa', path: '/admin/beasiswa' },
    { label: '🗺️ Wilayah', path: '/admin/wilayah' },
    { label: '🔔 Notifikasi', path: '/admin/notifikasi' },
    { label: '📊 Polling', path: '/admin/polling' },
    { label: '📍 Peta', path: '/admin/peta' },
    { label: '❤️ Donasi', path: '/admin/donasi' },
    { label: '⭐ Promosi & VIP (Lama)', path: '/admin/vip' },
    { label: '📦 Produk (Lama)', path: '/admin/produk' },
    { label: '💰 Tagihan VIP (Lama)', path: '/admin/tagihan' },
    { label: '👥 Pengguna', path: '/admin/pengguna' },
    { label: '🧾 Pesanan (Lama)', path: '/admin/pesanan' },
    { label: '⚙️ Pengaturan', path: '/admin/pengaturan' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-brand-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold">VALMA Admin Center</h1>
          <p className="text-[10px] text-gray-400">
            Pusat Kendali Seluruh Sistem VALMA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="text-xs bg-gray-700 text-white px-3 py-1 rounded font-semibold"
          >
            Beranda
          </button>

          <button
            onClick={handleLogout}
            className="text-xs bg-brand-600 text-white px-3 py-1 rounded font-semibold"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto">

        {/* MENU ADMIN CENTER */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-5">
          <div className="mb-3">
            <h2 className="font-bold text-gray-800">
              Pusat Kendali VALMA
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Semua pengelolaan VALMA berada dalam satu pusat Admin.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {menu.map((item) => {
              if (item.path === 'EVENT_PANEL') {
                return (
                  <div key={item.label} className="col-span-2 sm:col-span-3">
                    <button
                      onClick={() => {
                        setShowEventPanel((prev) => !prev)
                        fetchEvents()
                      }}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition"
                    >
                      <div>{item.label}</div>
                      <div className="text-[9px] mt-1 font-normal">
                        {showEventPanel
                          ? 'Tutup pengelolaan event'
                          : 'Kelola event'}
                      </div>
                    </button>

                    {showEventPanel && (
                      <div className="mt-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">

                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                                📅 Kelola Event
                              </h2>
                              <p className="text-[10px] text-gray-400 mt-1">
                                Kelola seluruh event Surabaya dari Admin Center.
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setShowEventPanel(false)
                                resetEventForm()
                              }}
                              className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-semibold"
                            >
                              Tutup
                            </button>
                          </div>

                          <form onSubmit={saveEvent} className="space-y-3 mb-6">
                            <input
                              type="text"
                              placeholder="Judul event"
                              value={eventForm.judul}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  judul: e.target.value
                                })
                              }
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                            />

                            <input
                              type="text"
                              placeholder="Penyelenggara"
                              value={eventForm.penyelenggara}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  penyelenggara: e.target.value
                                })
                              }
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                            />

                            <input
                              type="text"
                              placeholder="Kategori"
                              value={eventForm.kategori}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  kategori: e.target.value
                                })
                              }
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                            />

                            <input
                              type="text"
                              placeholder="Lokasi"
                              value={eventForm.lokasi}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  lokasi: e.target.value
                                })
                              }
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                            />

                            <textarea
                              placeholder="Deskripsi event"
                              value={eventForm.deskripsi}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  deskripsi: e.target.value
                                })
                              }
                              rows="4"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 resize-none"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                                  Tanggal mulai
                                </label>
                                <input
                                  type="datetime-local"
                                  value={eventForm.tanggal_mulai}
                                  onChange={(e) =>
                                    setEventForm({
                                      ...eventForm,
                                      tanggal_mulai: e.target.value
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                                  Tanggal selesai
                                </label>
                                <input
                                  type="datetime-local"
                                  value={eventForm.tanggal_selesai}
                                  onChange={(e) =>
                                    setEventForm({
                                      ...eventForm,
                                      tanggal_selesai: e.target.value
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-xs font-bold"
                              >
                                {editingEventId
                                  ? 'Simpan Perubahan'
                                  : 'Tambah Event'}
                              </button>

                              {editingEventId && (
                                <button
                                  type="button"
                                  onClick={resetEventForm}
                                  className="px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                                >
                                  Batal
                                </button>
                              )}
                            </div>
                          </form>

                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h3 className="font-bold text-gray-700 text-sm">
                                Daftar Event
                              </h3>
                              <p className="text-[10px] text-gray-400">
                                Semua event yang tersimpan.
                              </p>
                            </div>

                            <button
                              onClick={fetchEvents}
                              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-semibold"
                            >
                              Muat Ulang
                            </button>
                          </div>

                          {loadingEvents ? (
                            <p className="text-center text-xs text-gray-500 py-6">
                              Memuat event...
                            </p>
                          ) : events.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-xs text-gray-500">
                              Belum ada event.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {events.map((item) => (
                                <div
                                  key={item.id}
                                  className="border border-gray-200 rounded-xl p-4"
                                >
                                  <div className="flex justify-between items-start gap-3">
                                    <div>
                                      <h3 className="font-bold text-gray-800 text-sm">
                                        {item.judul}
                                      </h3>
                                      <p className="text-[10px] text-orange-600 font-semibold mt-1">
                                        {item.kategori || 'EVENT'}
                                      </p>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => editEvent(item)}
                                        className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-2 py-1 rounded-lg font-semibold"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        onClick={() => deleteEvent(item.id)}
                                        className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg font-semibold"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>

                                  <div className="text-[10px] text-gray-500 mt-3 space-y-1">
                                    <div>
                                      Penyelenggara: {item.penyelenggara || '-'}
                                    </div>
                                    <div>
                                      Lokasi: {item.lokasi || '-'}
                                    </div>
                                    <div>
                                      Mulai:{' '}
                                      {item.tanggal_mulai
                                        ? new Date(item.tanggal_mulai).toLocaleString('id-ID')
                                        : '-'}
                                    </div>
                                    <div>
                                      Selesai:{' '}
                                      {item.tanggal_selesai
                                        ? new Date(item.tanggal_selesai).toLocaleString('id-ID')
                                        : '-'}
                                    </div>
                                  </div>

                                  <p className="text-xs text-gray-600 mt-3">
                                    {item.deskripsi || 'Tidak ada deskripsi.'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="text-left p-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-brand-50 hover:border-brand-200 text-xs font-semibold transition"
                >
                  <div>{item.label}</div>
                  <div className="text-[9px] mt-1 font-normal text-brand-600">Buka modul →</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* STATISTIK ADMIN */}
        <section className="mb-5">
          <div className="mb-3">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
              Pusat Pengguna
            </h2>
            <p className="text-[10px] text-gray-400 mt-1">
              Daftar akun yang terdaftar di VALMA.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loadingUsers ? (
              <div className="p-4 text-sm text-gray-500">
                Memuat pengguna...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                Belum ada pengguna.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">
                        {item.nama || 'Tanpa Nama'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.wilayah_saya || 'Wilayah belum diatur'}
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="inline-block px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
                        {item.role || 'user'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-5">
          <div className="mb-3">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
              Ringkasan Sistem
            </h2>
            <p className="text-[10px] text-gray-400 mt-1">
              Kondisi terbaru data utama VALMA.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] text-gray-500">Total Laporan</div>
              <div className="text-xl font-bold text-gray-800 mt-1">{totalLaporan}</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] text-gray-500">Menunggu</div>
              <div className="text-xl font-bold text-amber-600 mt-1">{laporanMenunggu}</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] text-gray-500">Diproses</div>
              <div className="text-xl font-bold text-brand-600 mt-1">{laporanDiproses}</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] text-gray-500">Selesai</div>
              <div className="text-xl font-bold text-green-600 mt-1">{laporanSelesai}</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] text-gray-500">Pasar Menunggu</div>
              <div className="text-xl font-bold text-purple-600 mt-1">{produkMenunggu.length}</div>
            </div>
          </div>
        </section>

        {/* MODERASI PASAR */}

        <section className="mb-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                Produk Pasar Menunggu
              </h2>
              <p className="text-[10px] text-gray-400 mt-1">
                Periksa produk warga sebelum dipublikasikan.
              </p>
            </div>

            <button
              onClick={fetchProdukMenunggu}
              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg font-semibold shadow-sm"
            >
              Muat Ulang
            </button>
          </div>

          {loadingPasar ? (
            <p className="text-center text-xs text-gray-500 py-6">
              Memuat produk Pasar...
            </p>
          ) : produkMenunggu.length === 0 ? (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 text-sm">
              Belum ada produk yang menunggu pengecekan.
            </div>
          ) : (
            <div className="space-y-3">
              {produkMenunggu.map((produk) => (
                <div
                  key={produk.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {produk.nama}
                      </h3>

                      <p className="text-[10px] text-gray-500 mt-1">
                        {produk.kategori} • Rp {Number(produk.harga || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded">
                      Menunggu
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-3">
                    {produk.deskripsi || 'Tidak ada deskripsi.'}
                  </p>

                  <div className="text-[10px] text-gray-400 mt-3 space-y-1">
                    <div>Penjual: {produk.penjual || 'Warga'}</div>
                    <div>Lokasi: {produk.lokasi || 'Tidak dicantumkan'}</div>
                    <div>Kontak: {produk.kontak || 'Tidak dicantumkan'}</div>
                    <div>
                      Dikirim: {produk.created_at
                        ? new Date(produk.created_at).toLocaleString('id-ID')
                        : '-'}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => updateStatusProduk(produk.id, 'Publik')}
                      className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700"
                    >
                      Publikasikan
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Yakin ingin menolak produk ini?')) {
                          updateStatusProduk(produk.id, 'Ditolak')
                        }
                      }}
                      className="flex-1 bg-rose-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-rose-700"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LAPORAN WARGA */}
        <section id="laporan-warga">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                Semua Laporan Masuk
              </h2>
              <p className="text-[10px] text-gray-400 mt-1">
                Kelola dan verifikasi laporan warga.
              </p>
            </div>

            <button
              onClick={fetchReports}
              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg font-semibold shadow-sm"
            >
              Muat Ulang
            </button>
          </div>

          {loading ? (
            <p className="text-center text-xs text-gray-500 py-6">
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        rep.status === 'Selesai'
                          ? 'bg-green-100 text-green-700'
                          : rep.status === 'Diproses'
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
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
                    <h3 className="font-bold text-gray-800 text-sm">
                      {rep.judul}
                    </h3>

                    <p className="text-xs text-gray-600 mt-1">
                      {rep.deskripsi}
                    </p>
                  </div>

                  {rep.foto_url && (
                    <img
                      src={rep.foto_url}
                      alt="Bukti"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}

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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
