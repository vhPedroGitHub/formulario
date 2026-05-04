import api from './client'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export const reportsApi = {
  downloadPdf: (formId: number) => {
    const token = localStorage.getItem('access_token')
    // Return URL for direct download
    return `${BASE_URL}/admin/forms/${formId}/report?token=${token}`
  },

  fetchPdf: async (formId: number): Promise<Blob> => {
    const r = await api.get(`/admin/forms/${formId}/report`, {
      responseType: 'blob',
    })
    return r.data as Blob
  },
}
