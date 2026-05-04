import api from './client'
import type { LoginRequest, TokenResponse, SignupRequest } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  signup: (data: SignupRequest) =>
    api.post('/auth/signup', data).then((r) => r.data),

  logout: (refresh_token: string) =>
    api.post('/auth/logout', { refresh_token }),

  refresh: (refresh_token: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token }).then((r) => r.data),
}
