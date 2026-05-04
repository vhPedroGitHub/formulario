import api from './client'
import type { ResponseOut, ResponseWithUserOut, ResponseCreate } from '@/types'

export const responsesApi = {
  submit: (formId: number, data: ResponseCreate) =>
    api.post<ResponseOut>(`/forms/${formId}/responses`, data).then((r) => r.data),

  updateMine: (formId: number, data: ResponseCreate) =>
    api.put<ResponseOut>(`/forms/${formId}/responses/me`, data).then((r) => r.data),

  getMine: (formId: number) =>
    api.get<ResponseOut>(`/forms/${formId}/responses/me`).then((r) => r.data),

  adminList: (formId: number) =>
    api
      .get<ResponseWithUserOut[]>(`/admin/forms/${formId}/responses`)
      .then((r) => r.data),

  uploadFile: (formId: number, fieldId: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api
      .post<{ stored_name: string; original_name: string; size: number }>(
        `/forms/${formId}/responses/upload/${fieldId}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((r) => r.data)
  },
}
