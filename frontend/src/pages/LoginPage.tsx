import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { extractErrorMessage } from '@/api/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, user } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // If already logged in, redirect
  if (user) {
    const to = user.role === 'admin' ? '/admin' : '/dashboard'
    navigate(to, { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      const u = useAuthStore.getState().user
      navigate(u?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Error al iniciar sesión'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <FileText className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UniForm</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de Formularios Universitarios</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Iniciar sesión</h2>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Usuario"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="nombre.apellido"
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Button type="submit" loading={isLoading} className="mt-2 w-full" size="lg">
              Entrar
            </Button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
            ¿No tienes cuenta?{' '}
            <Link to="/signup" className="text-indigo-600 hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
