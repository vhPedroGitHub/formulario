import api from './client'
import type { SpecialRoleOut } from '@/types'

export const specialRolesApi = {
  list: () => api.get<SpecialRoleOut[]>('/special-roles').then((r) => r.data),

  create: (name: string) =>
    api.post<SpecialRoleOut>('/special-roles', { name }).then((r) => r.data),

  update: (id: number, name: string) =>
    api.patch<SpecialRoleOut>(`/special-roles/${id}`, { name }).then((r) => r.data),

  delete: (id: number) => api.delete(`/special-roles/${id}`),
}
