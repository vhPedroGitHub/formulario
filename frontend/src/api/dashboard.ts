import api from './client'
import type { DashboardStats, FormParticipation } from '@/types'

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  participation: () =>
    api.get<FormParticipation[]>('/dashboard/participation').then((r) => r.data),
}
