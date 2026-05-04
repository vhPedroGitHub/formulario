import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { academicApi } from '@/api/academic'
import { specialRolesApi } from '@/api/specialRoles'
import { authApi } from '@/api/auth'
import { extractErrorMessage } from '@/api/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'

export function SignupPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm: '',
    first_name: '',
    last_name: '',
    faculty_id: '',
    career_id: '',
    group_id: '',
    special_role_id: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: faculties = [] } = useQuery({
    queryKey: ['faculties'],
    queryFn: academicApi.listFaculties,
  })

  const selectedFacultyId = form.faculty_id ? Number(form.faculty_id) : undefined
  const { data: careers = [] } = useQuery({
    queryKey: ['careers', selectedFacultyId],
    queryFn: () => academicApi.listCareers(selectedFacultyId),
    enabled: !!selectedFacultyId,
  })

  const selectedCareerId = form.career_id ? Number(form.career_id) : undefined
  const { data: groups = [] } = useQuery({
    queryKey: ['groups', selectedCareerId],
    queryFn: () => academicApi.listGroups(selectedCareerId!),
    enabled: !!selectedCareerId,
  })

  const { data: specialRoles = [] } = useQuery({
    queryKey: ['special-roles'],
    queryFn: specialRolesApi.list,
  })

  const mutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => setSuccess(true),
    onError: (err: unknown) => {
      setError(extractErrorMessage(err, 'Error al registrarse'))
    },
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    mutation.mutate({
      username: form.username,
      password: form.password,
      first_name: form.first_name,
      last_name: form.last_name,
      faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
      career_id: form.career_id ? Number(form.career_id) : null,
      group_id: form.group_id ? Number(form.group_id) : null,
      special_role_id: form.special_role_id ? Number(form.special_role_id) : null,
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="size-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
          <p className="text-sm text-gray-600 mb-6">
            Tu cuenta está pendiente de confirmación por un administrador. Una vez confirmada, podrás iniciar sesión.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
          >
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <FileText className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UniForm</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Crear cuenta</h2>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                required
              />
              <Input
                label="Apellidos"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                required
              />
            </div>
            <Input
              label="Usuario"
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              required
              placeholder="nombre.apellido"
              helpText="Solo letras, números, puntos y guiones bajos"
            />
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
              helpText="Mín. 8 caracteres, mayúscula, minúscula, número y símbolo"
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              required
            />

            <hr className="border-gray-100" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Información académica (opcional)
            </p>

            <Select
              label="Facultad"
              value={form.faculty_id}
              onChange={(e) => {
                set('faculty_id', e.target.value)
                set('career_id', '')
                set('group_id', '')
              }}
              options={faculties.map((f) => ({ value: f.id, label: f.name }))}
              placeholder="Seleccionar facultad..."
            />
            {form.faculty_id && (
              <Select
                label="Carrera"
                value={form.career_id}
                onChange={(e) => {
                  set('career_id', e.target.value)
                  set('group_id', '')
                }}
                options={careers.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Seleccionar carrera..."
              />
            )}
            {form.career_id && (
              <Select
                label="Grupo"
                value={form.group_id}
                onChange={(e) => set('group_id', e.target.value)}
                options={groups.map((g) => ({ value: g.id, label: g.display_name }))}
                placeholder="Seleccionar grupo..."
              />
            )}
            {specialRoles.length > 0 && (
              <Select
                label="Rol especial"
                value={form.special_role_id}
                onChange={(e) => set('special_role_id', e.target.value)}
                options={specialRoles.map((r) => ({ value: r.id, label: r.name }))}
                placeholder="Sin rol especial"
              />
            )}

            <Button type="submit" loading={mutation.isPending} className="mt-2 w-full" size="lg">
              Registrarse
            </Button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
