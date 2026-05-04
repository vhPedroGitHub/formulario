import api from './client'
import type { UserOut, UserCreate, UserUpdate } from '@/types'

export const usersApi = {
  list: (confirmed?: boolean) =>
    api
      .get<UserOut[]>('/users', { params: confirmed !== undefined ? { confirmed } : {} })
      .then((r) => r.data),

  me: () => api.get<UserOut>('/users/me').then((r) => r.data),

  get: (id: number) => api.get<UserOut>(`/users/${id}`).then((r) => r.data),

  create: (data: UserCreate) => api.post<UserOut>('/users', data).then((r) => r.data),

  update: (id: number, data: UserUpdate) =>
    api.patch<UserOut>(`/users/${id}`, data).then((r) => r.data),

  confirm: (id: number) =>
    api.patch<UserOut>(`/users/${id}/confirm`).then((r) => r.data),

  delete: (id: number) => api.delete(`/users/${id}`),
}
