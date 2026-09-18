import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import LencanaBadge from '../components/LencanaBadge'

const SUMBER_PENGAJUAN = [
  { type: 'event', icon: '🎪', label: 'Event', table: 'event', title: (r) => r.judul },
  { type: 'umkm', icon: '🏪', label: 'UMKM', table: 'umkm', title: (r) => r.nama_usaha },
  { type: 'lowongan', icon: '💼', label: 'Lowongan', table: 'lowongan', title: (r) => r.judul },
]

const statusBadge = (status) => {
  if (status === 'Publik') return 'bg-green-100 text-green-700'
  if (status === 'Ditolak') return 'bg-red-100 text-red-600'
  return 'bg-amber-100 text-amber-700'
}

export default function Profile() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [myReports, setMyReports] = useState([])
  const [reportUpdates, setReportUpdates] = useState({})
  const [notifications, setNotifications] = useState([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [myPengajuan, setMyPengajuan] = useState([])
  const [loadingPengajuan, setLoadingPengajuan] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [showFormLencana, setShowFormLencana] = useState(false)
  const [alasanLencana, setAlasanLencana] = useState('')
  const [kirimLencanaLoading, setKirimLencanaLoading] = useState(false)
  const [showEditNama, setShowEditNama] = useState(false)
  const [namaBaru, setNamaBaru] = useState('')
  const [simpanNamaLoading, setSimpanNamaLoading] = useState(false)
  const [errorNama, setErrorNama] = useState('')
  const [hapusAudioLoadingId, setHapusAudioLoadingId] = useState(null)

  useEffect(() => {
    if (user) {
      fetchMyReports()
      fetchNotifications()
      fetchMyPengajuan()
      fetchProfileData()
    }
  }, [user])

  const fetchProfileData = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('nama, nomor_id, centang_akurat, lencana_menunggu, lencana_alasan, jumlah_ganti_nama, ganti_nama_sejak')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfileData(data)
      setNamaBaru(data.nama || '')
    }
  }

  const handleSimpanNama = async () => {
    const teks = namaBaru.trim()
    if (!teks) {
      setErrorNama('Nama tidak boleh kosong.')
      return
    }

    const bebasBatas = role === 'admin' || role === 'developer'

    const sekarang = new Date()
    const sejak = profileData?.ganti_nama_sejak ? new Date(profileData.ganti_nama_sejak) : null
    const tujuhHariMs = 7 * 24 * 60 * 60 * 1000
    const masihDalamPeriode = sejak && (sekarang - sejak) < tujuhHariMs
    const jumlahSaatIni = masihDalamPeriode ? (profileData?.jumlah_ganti_nama || 0) : 0

    if (!bebasBatas && jumlahSaatIni >= 2) {
      const sisaMs = tujuhHariMs - (sekarang - sejak)
      const sisaHari = Math.ceil(sisaMs / (24 * 60 * 60 * 1000))
      setErrorNama(`Anda sudah mengganti nama 2 kali minggu ini. Coba lagi dalam ${sisaHari} hari.`)
      return
    }

    setErrorNama('')
    setSimpanNamaLoading(true)

    const dataUpdate = bebasBatas
      ? { nama: teks }
      : {
          nama: teks,
          jumlah_ganti_nama: jumlahSaatIni + 1,
          ganti_nama_sejak: masihDalamPeriode ? profileData.ganti_nama_sejak : sekarang.toISOString(),
        }

    const { error } = await supabase
      .from('profiles')
      .update(dataUpdate)
      .eq('id', user.id)

    setSimpanNamaLoading(false)

    if (!error) {
      setProfileData((prev) => ({ ...prev, ...dataUpdate }))
      setShowEditNama(false)
    } else {
      setErrorNama('Gagal menyimpan nama, coba lagi.')
    }
  }

  const handleAjukanLencana = async () => {
    const teks = alasanLencana.trim()
    if (!teks) return

    setKirimLencanaLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ lencana_menunggu: true, lencana_alasan: teks })
      .eq('id', user.id)

    setKirimLencanaLoading(false)

    if (!error) {
      setProfileData((prev) => ({
        ...prev,
        lencana_menunggu: true,
        lencana_alasan: teks,
      }))
      setShowFormLencana(false)
      setAlasanLencana('')
    } else {
      alert('Gagal mengirim pengajuan, coba lagi.')
    }
  }

  const fetchMyPengajuan = async () => {
    setLoadingPengajuan(true)
    const hasil = await Promise.all(
      SUMBER_PENGAJUAN.map(async (src) => {
        const { data, error } = await supabase
          .from(src.table)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (error) return []
        return (data || []).map((row) => ({ ...row, __sumber: src }))
      })
    )
    const gabungan = hasil
      .flat()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setMyPengajuan(gabungan)
    setLoadingPengajuan(false)
  }

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNotifications(data)
    }
  }

  const fetchMyReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMyReports(data)

      const ids = data.map((rep) => rep.id)

      if (ids.length > 0) {
        const { data: updates } = await supabase
          .from('report_updates')
          .select('*')
          .in('report_id', ids)
          .order('created_at', { ascending: true })

        const grouped = {}
        ;(updates || []).forEach((update) => {
          if (!grouped[update.report_id]) {
            grouped[update.report_id] = []
          }
          grouped[update.report_id].push(update)
        })

        setReportUpdates(grouped)
      }
    }
    setLoadingReports(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Hapus/tarik voice note milik sendiri dari laporan (hapus file di Storage + kosongkan audio_url)
  const handleHapusAudio = async (reportId, audioUrl) => {
    if (!window.confirm('Hapus rekaman suara dari laporan ini?')) return

    setHapusAudioLoadingId(reportId)

    try {
      const bagianPath = audioUrl.split('/suara-laporan/')[1]
      if (bagianPath) {
        await supabase.storage.from('suara-laporan').remove([bagianPath])
      }

      const { error } = await supabase
        .from('reports')
        .update({ audio_url: null })
        .eq('id', reportId)

      if (error) throw error

      setMyReports((prev) =>
        prev.map((rep) => (rep.id === reportId ? { ...rep, audio_url: null } : rep))
      )
    } catch (err) {
      console.error(err)
      alert('Gagal menghapus rekaman suara: ' + err.message)
    } finally {
      setHapusAudioLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-bold">Profil Saya</h1>
        <button
          onClick={() => navigate('/')}
          className="text-xs bg-white text-brand-600 px-3 py-1 rounded font-semibold"
        >
          Beranda
        </button>
      </header>

      {/* Informasi Akun */}
      <main className="p-4 max-w-md mx-auto space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-2">Informasi Akun</h2>
          <p className="text-sm font-semibold text-gray-800 break-all">{user?.email}</p>
          {profileData?.nomor_id && (
            <p className="text-xs text-gray-500 mt-1">
              ID: <span className="font-bold text-gray-700">{profileData.nomor_id}</span>
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Nama Pengguna:</span>
            </div>

            {showEditNama ? (
              <div>
                <input
                  type="text"
                  value={namaBaru}
                  onChange={(e) => setNamaBaru(e.target.value)}
                  placeholder="Masukkan nama"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-1"
                />
                {errorNama && (
                  <p className="text-xs text-rose-600 mb-2">{errorNama}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSimpanNama}
                    disabled={simpanNamaLoading}
                    className="bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    {simpanNamaLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditNama(false)
                      setNamaBaru(profileData?.nama || '')
                      setErrorNama('')
                    }}
                    className="text-xs font-semibold text-gray-500 px-4 py-2"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    {profileData?.nama || 'Belum ada nama'}
                  </p>
                  <button
                    onClick={() => setShowEditNama(true)}
                    className="text-xs font-semibold text-brand-600"
                  >
                    Ubah
                  </button>
                </div>
                {role !== 'admin' && role !== 'developer' && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Nama bisa diubah maksimal 2 kali per minggu.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
            <span className="text-gray-500">Peran Akun (Role):</span>
            <span className="bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded uppercase">
              {role || 'Warga'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 bg-gray-100 text-brand-600 border border-brand-200 py-2 rounded-lg font-semibold text-xs active:bg-gray-200"
          >
            Keluar dari Akun
          </button>
        </div>

        {/* Lencana Terverifikasi Akurat */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-2">Lencana Terverifikasi</h2>

          {profileData?.centang_akurat ? (
            <div className="flex items-center gap-2">
              <LencanaBadge size={20} />
              <p className="text-sm font-semibold text-gray-800">
                Anda sudah terverifikasi akurat
              </p>
            </div>
          ) : profileData?.lencana_menunggu ? (
            <p className="text-sm text-amber-600 font-semibold">
              Menunggu persetujuan admin...
            </p>
          ) : showFormLencana ? (
            <div>
              <textarea
                value={alasanLencana}
                onChange={(e) => setAlasanLencana(e.target.value)}
                placeholder="Kenapa Anda pantas dapat lencana ini?"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAjukanLencana}
                  disabled={kirimLencanaLoading}
                  className="bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  {kirimLencanaLoading ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
                <button
                  onClick={() => setShowFormLencana(false)}
                  className="text-xs font-semibold text-gray-500 px-4 py-2"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowFormLencana(true)}
              className="bg-brand-50 text-brand-700 text-xs font-semibold px-4 py-2 rounded-lg"
            >
              Ajukan Lencana
            </button>
          )}
        </div>

        {/* Notifikasi */}
        {notifications.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                  🔔 Notifikasi
                </h3>
                <span className="text-[10px] text-gray-400">
                  Notifikasi akun Anda
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-brand-100 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full">
                  {notifications.length}
                </span>

                <button
                  onClick={() => navigate('/notifikasi-pribadi')}
                  className="bg-brand-600 text-white text-[10px] font-semibold px-3 py-2 rounded-lg"
                >
                  Buka
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs font-bold text-gray-800">{notif.judul}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.isi}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat Pengajuan Saya (Event/UMKM/Lowongan yang dikirim warga) */}
        <div>
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Riwayat Pengajuan Saya</h3>

          {loadingPengajuan ? (
            <p className="text-center text-xs text-gray-400 py-4">Memuat riwayat...</p>
          ) : myPengajuan.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 text-sm">
              <p>Anda belum pernah mengirim Event, UMKM, atau Lowongan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPengajuan.map((item) => (
                <div key={`${item.__sumber.type}-${item.id}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {item.__sumber.icon} {item.__sumber.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{item.__sumber.title(item) || 'Tanpa judul'}</h4>
                  <span className="text-[10px] text-gray-400">
                    Dikirim pada: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riwayat Laporan Pengguna */}
        <div>
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Riwayat Laporan Saya</h3>

          {loadingReports ? (
            <p className="text-center text-xs text-gray-400 py-4">Memuat riwayat...</p>
          ) : myReports.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 text-sm">
              <p>Anda belum pernah mengirim laporan.</p>
              <button
                onClick={() => navigate('/report')}
                className="mt-3 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
              >
                Buat Laporan Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map((rep) => (
                <div key={rep.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {rep.kategori}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      {rep.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{rep.judul}</h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{rep.deskripsi}</p>

                  {rep.audio_url && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2">
                      <audio src={rep.audio_url} controls className="w-full" />
                      <button
                        onClick={() => handleHapusAudio(rep.id, rep.audio_url)}
                        disabled={hapusAudioLoadingId === rep.id}
                        className="mt-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded disabled:opacity-50"
                      >
                        {hapusAudioLoadingId === rep.id ? 'Menghapus...' : '🗑️ Hapus Rekaman Suara'}
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] text-gray-400">
                    Dikirim pada: {new Date(rep.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {reportUpdates[rep.id]?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                        Perjalanan Laporan
                      </p>

                      <div className="space-y-2">
                        {reportUpdates[rep.id].map((update) => (
                          <div key={update.id} className="flex items-start gap-2">
                            <span className="mt-1 w-2 h-2 rounded-full bg-brand-500 shrink-0"></span>
                            <div>
                              <p className="text-xs font-semibold text-gray-700">
                                {update.status}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(update.created_at).toLocaleString('id-ID')}
                              </p>
                              {update.catatan && (
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {update.catatan}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
