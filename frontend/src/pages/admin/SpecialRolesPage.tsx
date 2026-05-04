import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { specialRolesApi } from '@/api/specialRoles'
import { extractErrorMessage } from '@/api/client'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import type { SpecialRoleOut } from '@/types'

export function SpecialRolesPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<SpecialRoleOut | null>(null)

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['special-roles'],
    queryFn: specialRolesApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: specialRolesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['special-roles'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles Especiales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Roles para usuarios que no pertenecen a una facultad/carrera
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Nuevo rol
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {roles.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="size-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Sin roles especiales</p>
            <p className="text-sm text-gray-400 mt-1">Crea roles para categorizar usuarios especiales</p>
          </div>
        ) : (
          <div className="divide-y">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Tag className="size-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{role.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditRole(role)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el rol "${role.name}"?`)) deleteMutation.mutate(role.id)
                    }}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <RoleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); qc.invalidateQueries({ queryKey: ['special-roles'] }) }}
      />

      {/* Edit modal */}
      {editRole && (
        <RoleModal
          open={!!editRole}
          role={editRole}
          onClose={() => setEditRole(null)}
          onSaved={() => { setEditRole(null); qc.invalidateQueries({ queryKey: ['special-roles'] }) }}
        />
      )}
    </div>
  )
}

function RoleModal({
  open, onClose, onSaved, role,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; role?: SpecialRoleOut
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      role ? specialRolesApi.update(role.id, name) : specialRolesApi.create(name),
    onSuccess: onSaved,
    onError: (e: unknown) => setError(extractErrorMessage(e)),
  })

  return (
    <Modal open={open} onClose={onClose} title={role ? 'Editar rol' : 'Nuevo rol especial'} size="sm">
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}
      <div className="flex flex-col gap-4">
        <Input label="Nombre del rol" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Docente, Directivo..." />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>{role ? 'Guardar' : 'Crear'}</Button>
        </div>
      </div>
    </Modal>
  )
}
