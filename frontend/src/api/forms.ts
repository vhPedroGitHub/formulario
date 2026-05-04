import api from './client'
import type { FormOut, FormListOut, FormCreate } from '@/types'

export const formsApi = {
  // Admin
  adminList: () => api.get<FormOut[]>('/admin/forms').then((r) => r.data),

  adminGet: (id: number) =>
    api.get<FormOut>(`/admin/forms/${id}`).then((r) => r.data),

  create: (data: FormCreate) =>
    api.post<FormOut>('/forms', data).then((r) => r.data),

  update: (id: number, data: FormCreate) =>
    api.put<FormOut>(`/admin/forms/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/admin/forms/${id}`),

  // User
  listMy: () => api.get<FormListOut[]>('/forms').then((r) => r.data),

  get: (id: number) => api.get<FormOut>(`/forms/${id}`).then((r) => r.data),
}
