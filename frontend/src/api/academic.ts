import api from './client'
import type { FacultyOut, CareerOut, GroupOut } from '@/types'

export const academicApi = {
  // Faculties
  listFaculties: () => api.get<FacultyOut[]>('/faculties').then((r) => r.data),

  createFaculty: (name: string) =>
    api.post<FacultyOut>('/faculties', { name }).then((r) => r.data),

  updateFaculty: (id: number, name: string) =>
    api.patch<FacultyOut>(`/faculties/${id}`, { name }).then((r) => r.data),

  deleteFaculty: (id: number) => api.delete(`/faculties/${id}`),

  // Careers
  listCareers: (facultyId?: number) =>
    facultyId
      ? api.get<CareerOut[]>(`/faculties/${facultyId}/careers`).then((r) => r.data)
      : api.get<CareerOut[]>('/careers').then((r) => r.data),

  createCareer: (
    facultyId: number,
    data: { name: string; duration_years: number; groups_per_year: number }
  ) =>
    api
      .post<CareerOut>(`/faculties/${facultyId}/careers`, data)
      .then((r) => r.data),

  updateCareer: (
    id: number,
    data: { name?: string; duration_years?: number; groups_per_year?: number }
  ) => api.patch<CareerOut>(`/careers/${id}`, data).then((r) => r.data),

  deleteCareer: (id: number) => api.delete(`/careers/${id}`),

  // Groups
  listGroups: (careerId: number) => api.get<GroupOut[]>(`/careers/${careerId}/groups`).then((r) => r.data),
  listAllGroups: () => api.get<GroupOut[]>('/groups').then((r) => r.data),
  addGroup: (careerId: number, year: number) => api.post<GroupOut>(`/careers/${careerId}/groups`, { year }).then((r) => r.data),
  deleteGroup: (groupId: number) => api.delete(`/groups/${groupId}`),
}
