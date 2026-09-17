import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ReportForm from './pages/ReportForm'
import AdminDashboard from './pages/AdminDashboard'
import AdminLaporan from './pages/AdminLaporan'
import AdminAntrean from './pages/AdminAntrean'
import AdminBerita from './pages/AdminBerita'
import Berita from './pages/Berita'
import BeritaDetail from './pages/BeritaDetail'
import Emergency from './pages/Emergency'
import AdminLowongan from './pages/AdminLowongan'
import Lowongan from './pages/Lowongan'
import AdminBeasiswa from './pages/AdminBeasiswa'
import AdminWilayah from './pages/AdminWilayah'
import Wilayah from './pages/Wilayah'
import NotifikasiWilayah from './pages/NotifikasiWilayah'
import AdminNotifikasiWilayah from './pages/AdminNotifikasiWilayah'
import AdminPolling from './pages/AdminPolling'
import AdminPeta from './pages/AdminPeta'
import Peta from './pages/Peta'
import Pasar from './pages/Pasar'
import PasarToko from './pages/PasarToko'
import PasarMitra from './pages/PasarMitra'
import PasarDriver from './pages/PasarDriver'
import Polling from './pages/Polling'
import Layanan from './pages/Layanan'
import Beasiswa from './pages/Beasiswa'
import Forum from './pages/Forum'
import UMKM from './pages/UMKM'
import Event from './pages/Event'
import ProtectedRoute from './components/ProtectedRoute'
import NotifikasiPribadi from './pages/NotifikasiPribadi'
import Donasi from './pages/Donasi'
import DonasiDetail from './pages/DonasiDetail'
import DonasiForm from './pages/DonasiForm'
import DonasiPembayaran from './pages/DonasiPembayaran'
import QRISSurabaya24Jam from './pages/QRISSurabaya24Jam'
import AdminDonasi from './pages/AdminDonasi'
import AdminPengguna from './pages/AdminPengguna'
import AdminCommerce from './pages/AdminCommerce'
import AdminPasar from './pages/AdminPasar'
import Merchant from './pages/Merchant'
import MerchantShop from './pages/MerchantShop'
import DirektoriMerchant from './pages/DirektoriMerchant'
import NotFound from './pages/NotFound'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const backHandler = CapacitorApp.addListener("backButton", () => {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1)
      } else {
        CapacitorApp.exitApp()
      }
    })

    return () => {
      backHandler.remove()
    }
  }, [navigate])

  useEffect(() => {
    const setupPush = async () => {
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') {
        console.log('Izin notifikasi ditolak user')
        return
      }

      await PushNotifications.register()
    }

    PushNotifications.addListener('registration', (token) => {
      console.log('PUSH TOKEN:', token.value)
      alert('PUSH TOKEN: ' + token.value)
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.log('PUSH REGISTRATION ERROR:', JSON.stringify(err))
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('NOTIFIKASI DITERIMA (app terbuka):', JSON.stringify(notification))
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('NOTIFIKASI DIKLIK:', JSON.stringify(notification))
    })

    setupPush()

    return () => {
      PushNotifications.removeAllListeners()
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/report" element={<ReportForm />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifikasi-pribadi"
        element={
          <ProtectedRoute>
            <NotifikasiPribadi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/berita"
        element={<Berita />}
      />
      <Route
        path="/berita/:id"
        element={<BeritaDetail />}
      />
      <Route
        path="/emergency"
        element={<Emergency />}
      />
          <Route path="/event" element={<Event />} />
      <Route path="/donasi" element={<Donasi />} />
      <Route path="/donasi/:id" element={<DonasiDetail />} />
      <Route path="/donasi/:id/form" element={<DonasiForm />} />
      <Route path="/donasi/:id/pembayaran" element={<DonasiPembayaran />} />
      <Route path="/qris-surabaya-24-jam" element={<QRISSurabaya24Jam />} />
      <Route path="/merchant" element={<ProtectedRoute><Merchant /></ProtectedRoute>} />
      <Route path="/merchant/:id" element={<MerchantShop />} />
      <Route path="/direktori-merchant" element={<DirektoriMerchant />} />
      <Route path="/wilayah" element={<Wilayah />} />
      <Route path="/notifikasi" element={<NotifikasiWilayah />} />
      <Route path="/umkm" element={<UMKM />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/beasiswa" element={<Beasiswa />} />
      <Route path="/layanan" element={<Layanan />} />
      <Route path="/admin/peta" element={<ProtectedRoute adminOnly><AdminPeta /></ProtectedRoute>} />
      <Route path="/peta" element={<Peta />} />
      <Route path="/pasar" element={<Pasar />} />
      <Route path="/pasar/toko" element={<ProtectedRoute><PasarToko /></ProtectedRoute>} />
      <Route path="/pasar/mitra" element={<PasarMitra />} />
      <Route path="/pasar/driver" element={<ProtectedRoute><PasarDriver /></ProtectedRoute>} />
      <Route path="/polling" element={<Polling />} />
      <Route path="/admin/polling" element={<ProtectedRoute adminOnly><AdminPolling /></ProtectedRoute>} />
      <Route path="/admin/notifikasi" element={<ProtectedRoute adminOnly><AdminNotifikasiWilayah /></ProtectedRoute>} />
      <Route path="/admin/donasi" element={<ProtectedRoute adminOnly><AdminDonasi /></ProtectedRoute>} />
      <Route path="/admin/pengguna" element={<ProtectedRoute adminOnly><AdminPengguna /></ProtectedRoute>} />
      <Route path="/admin/merchant" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/pasar" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/pasar-v2" element={<ProtectedRoute adminOnly><AdminPasar /></ProtectedRoute>} />
      <Route path="/admin/umkm" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/produk" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/vip" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/tagihan" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/pesanan" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/pengaturan" element={<ProtectedRoute adminOnly><AdminCommerce /></ProtectedRoute>} />
      <Route path="/admin/wilayah" element={<ProtectedRoute adminOnly><AdminWilayah /></ProtectedRoute>} />
      <Route path="/admin/beasiswa" element={<ProtectedRoute adminOnly><AdminBeasiswa /></ProtectedRoute>} />
      <Route path="/admin/lowongan" element={<ProtectedRoute adminOnly><AdminLowongan /></ProtectedRoute>} />
      <Route path="/lowongan" element={<Lowongan />} />
      <Route
        path="/admin/berita"
        element={
          <ProtectedRoute adminOnly>
            <AdminBerita />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/laporan" element={<ProtectedRoute adminOnly><AdminLaporan /></ProtectedRoute>} />
      <Route path="/admin/antrean" element={<ProtectedRoute adminOnly><AdminAntrean /></ProtectedRoute>} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
