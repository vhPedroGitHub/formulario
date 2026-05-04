import api from './client'
import type { NotificationOut } from '@/types'

export const notificationsApi = {
  list: () => api.get<NotificationOut[]>('/notifications').then((r) => r.data),

  markRead: (id: number) =>
    api.patch<NotificationOut>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => api.patch('/notifications/read-all'),
}
