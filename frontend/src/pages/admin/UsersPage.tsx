import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { usersApi } from '@/api/users'
import { academicApi } from '@/api/academic'
import { specialRolesApi } from '@/api/specialRoles'
import { extractErrorMessage } from '@/api/client'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import {
  UserPlus, CheckCircle, Trash2, Edit, Search,
} from 'lucide-react'
import type { UserOut, UserCreate, UserUpdate, UserRole } from '@/types'

export function UsersPage() {
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') === 'pending' ? 'pending' : 'all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserOut | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  })
  const { data: faculties = [] } = useQuery({ queryKey: ['faculties'], queryFn: academicApi.listFaculties })
  const { data: allCareers = [] } = useQuery({ queryKey: ['careers'], queryFn: () => academicApi.listCareers() })
  const { data: specialRoles = [] } = useQuery({ queryKey: ['special-roles'], queryFn: specialRolesApi.list })

  const confirmMutation = useMutation({
    mutationFn: usersApi.confirm,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.username.includes(search.toLowerCase()) ||
      u.first_name.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && !u.is_confirmed) ||
      (filter === 'admin' && u.role === 'admin')
    return matchSearch && matchFilter
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} usuarios registrados</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" /> Crear usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        {(['all', 'pending', 'admin'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Admins'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Usuario</th>
                <th className="text-left px-5 py-3">Rol</th>
                <th className="text-left px-5 py-3">Académico</th>
                <th className="text-left px-5 py-3">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onConfirm={() => confirmMutation.mutate(u.id)}
                    onDelete={() => {
                      if (confirm(`¿Eliminar a ${u.username}?`)) deleteMutation.mutate(u.id)
                    }}
                    onEdit={() => setEditUser(u)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <UserFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        faculties={faculties}
        allCareers={allCareers}
        specialRoles={specialRoles}
        onSaved={() => {
          setCreateOpen(false)
          qc.invalidateQueries({ queryKey: ['users'] })
        }}
      />

      {/* Edit modal */}
      {editUser && (
        <UserEditModal
          user={editUser}
          open={!!editUser}
          onClose={() => setEditUser(null)}
          faculties={faculties}
          allCareers={allCareers}
          specialRoles={specialRoles}
          onSaved={() => {
            setEditUser(null)
            qc.invalidateQueries({ queryKey: ['users'] })
          }}
        />
      )}
    </div>
  )
}

// ── UserRow ───────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onConfirm,
  onDelete,
  onEdit,
}: {
  user: UserOut
  onConfirm: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {user.first_name} {user.last_name}
          </span>
          <span className="text-xs text-gray-500">@{user.username}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
          {user.role === 'admin' ? 'Admin' : 'Usuario'}
        </Badge>
      </td>
      <td className="px-5 py-3 text-xs text-gray-500">
        {user.faculty_name ? (
          <span>
            {user.faculty_name}
            {user.career_name && ` · ${user.career_name}`}
            {user.group_display && ` · ${user.group_display}`}
          </span>
        ) : user.special_role_name ? (
          <Badge variant="warning">{user.special_role_name}</Badge>
        ) : (
          '—'
        )}
      </td>
      <td className="px-5 py-3">
        {!user.is_confirmed ? (
          <Badge variant="warning">Pendiente</Badge>
        ) : !user.is_active ? (
          <Badge variant="danger">Desactivado</Badge>
        ) : (
          <Badge variant="success">Activo</Badge>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1 justify-end">
          {!user.is_confirmed && (
            <button
              onClick={onConfirm}
              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
              title="Confirmar"
            >
              <CheckCircle className="size-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Editar"
          >
            <Edit className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Create modal ──────────────────────────────────────────────────────────────

function UserFormModal({
  open,
  onClose,
  faculties,
  allCareers,
  specialRoles,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  faculties: { id: number; name: string }[]
  allCareers: { id: number; name: string; faculty_id: number }[]
  specialRoles: { id: number; name: string }[]
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    role: 'user' as UserRole, faculty_id: '', career_id: '', group_id: '', special_role_id: '',
  })
  const [error, setError] = useState('')
  const { data: groups = [] } = useQuery({
    queryKey: ['groups', form.career_id],
    queryFn: () => academicApi.listGroups(Number(form.career_id)),
    enabled: !!form.career_id,
  })
  const careers = allCareers.filter((c) => c.faculty_id === Number(form.faculty_id))

  const mutation = useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: onSaved,
    onError: (e: unknown) => {
      setError(extractErrorMessage(e))
    },
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title="Crear usuario" size="lg">
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nombre" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
          <Input label="Apellidos" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
        </div>
        <Input label="Usuario" value={form.username} onChange={(e) => set('username', e.target.value)} required />
        <Input label="Contraseña" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
        <Select label="Rol" value={form.role} onChange={(e) => set('role', e.target.value)}
          options={[{ value: 'user', label: 'Usuario' }, { value: 'admin', label: 'Administrador' }]} />
        <Select label="Facultad" value={form.faculty_id}
          onChange={(e) => { set('faculty_id', e.target.value); set('career_id', ''); set('group_id', '') }}
          options={faculties.map((f) => ({ value: f.id, label: f.name }))} placeholder="Sin facultad" />
        {form.faculty_id && (
          <Select label="Carrera" value={form.career_id}
            onChange={(e) => { set('career_id', e.target.value); set('group_id', '') }}
            options={careers.map((c) => ({ value: c.id, label: c.name }))} placeholder="Sin carrera" />
        )}
        {form.career_id && (
          <Select label="Grupo" value={form.group_id} onChange={(e) => set('group_id', e.target.value)}
            options={groups.map((g) => ({ value: g.id, label: g.display_name }))} placeholder="Sin grupo" />
        )}
        {specialRoles.length > 0 && (
          <Select label="Rol especial" value={form.special_role_id} onChange={(e) => set('special_role_id', e.target.value)}
            options={specialRoles.map((r) => ({ value: r.id, label: r.name }))} placeholder="Sin rol especial" />
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate({
            username: form.username, password: form.password,
            first_name: form.first_name, last_name: form.last_name,
            role: form.role,
            faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
            career_id: form.career_id ? Number(form.career_id) : null,
            group_id: form.group_id ? Number(form.group_id) : null,
            special_role_id: form.special_role_id ? Number(form.special_role_id) : null,
          })}>Crear</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function UserEditModal({
  user, open, onClose, faculties, allCareers, specialRoles, onSaved,
}: {
  user: UserOut; open: boolean; onClose: () => void
  faculties: { id: number; name: string }[]
  allCareers: { id: number; name: string; faculty_id: number }[]
  specialRoles: { id: number; name: string }[]
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    first_name: user.first_name, last_name: user.last_name,
    role: user.role, faculty_id: String(user.faculty_id ?? ''),
    career_id: String(user.career_id ?? ''), group_id: String(user.group_id ?? ''),
    special_role_id: String(user.special_role_id ?? ''),
    is_active: user.is_active, password: '',
  })
  const [error, setError] = useState('')
  const { data: groups = [] } = useQuery({
    queryKey: ['groups', form.career_id],
    queryFn: () => academicApi.listGroups(Number(form.career_id)),
    enabled: !!form.career_id,
  })
  const careers = allCareers.filter((c) => c.faculty_id === Number(form.faculty_id))
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: UserUpdate) => usersApi.update(user.id, data),
    onSuccess: onSaved,
    onError: (e: unknown) => {
      setError(extractErrorMessage(e))
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={`Editar @${user.username}`} size="lg">
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nombre" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
          <Input label="Apellidos" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
        </div>
        <Select label="Rol" value={form.role} onChange={(e) => set('role', e.target.value)}
          options={[{ value: 'user', label: 'Usuario' }, { value: 'admin', label: 'Administrador' }]} />
        <Select label="Estado" value={String(form.is_active)} onChange={(e) => set('is_active', e.target.value === 'true')}
          options={[{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Desactivado' }]} />
        <Select label="Facultad" value={form.faculty_id}
          onChange={(e) => { set('faculty_id', e.target.value); set('career_id', ''); set('group_id', '') }}
          options={faculties.map((f) => ({ value: f.id, label: f.name }))} placeholder="Sin facultad" />
        {form.faculty_id && (
          <Select label="Carrera" value={form.career_id}
            onChange={(e) => { set('career_id', e.target.value); set('group_id', '') }}
            options={careers.map((c) => ({ value: c.id, label: c.name }))} placeholder="Sin carrera" />
        )}
        {form.career_id && (
          <Select label="Grupo" value={form.group_id} onChange={(e) => set('group_id', e.target.value)}
            options={groups.map((g) => ({ value: g.id, label: g.display_name }))} placeholder="Sin grupo" />
        )}
        {specialRoles.length > 0 && (
          <Select label="Rol especial" value={form.special_role_id} onChange={(e) => set('special_role_id', e.target.value)}
            options={specialRoles.map((r) => ({ value: r.id, label: r.name }))} placeholder="Sin rol especial" />
        )}
        <Input label="Nueva contraseña (dejar vacío para no cambiar)" type="password"
          value={form.password} onChange={(e) => set('password', e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate({
            first_name: form.first_name, last_name: form.last_name,
            role: form.role as UserRole, is_active: form.is_active,
            faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
            career_id: form.career_id ? Number(form.career_id) : null,
            group_id: form.group_id ? Number(form.group_id) : null,
            special_role_id: form.special_role_id ? Number(form.special_role_id) : null,
            ...(form.password ? { password: form.password } : {}),
          })}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}
