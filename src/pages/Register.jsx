import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Register() {
  const navigate = useNavigate()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDaftar(e) {
    e.preventDefault()
    setLoading(true)
    setPesan('')

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { nama: nama },
      },
    })

    if (error) {
      setPesan('Gagal daftar: ' + error.message)
      setLoading(false)
    } else {
      setPesan('Berhasil daftar! Mengarahkan ke beranda...')
      setTimeout(() => {
        navigate('/')
      }, 1200)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-brand-600 mb-4">Daftar Akun Surabaya 24 Jam</h1>
<p className="text-sm text-gray-600 mb-4">Akun ini hanya untuk aplikasi Surabaya 24 Jam. Kami tidak pernah meminta password akun lain.</p>
      <form onSubmit={handleDaftar} className="flex flex-col gap-3">
        <input
          type="text"
autoComplete="name"
          placeholder="Nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 text-white p-2 rounded font-bold"
        >
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>
      {pesan && <p className="mt-4">{pesan}</p>}
    </div>
  )
}

export default Register
