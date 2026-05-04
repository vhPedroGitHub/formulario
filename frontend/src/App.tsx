import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { UserDashboardPage } from '@/pages/user/DashboardPage'
import { FormDetailPage } from '@/pages/user/FormDetailPage'
import { AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { AdminFormListPage } from '@/pages/admin/FormListPage'
import { FormCreatePage } from '@/pages/admin/FormCreatePage'
import { FormResponsesPage } from '@/pages/admin/FormResponsesPage'
import { AcademicPage } from '@/pages/admin/AcademicPage'
import { SpecialRolesPage } from '@/pages/admin/SpecialRolesPage'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => console.error('[QueryCache]', error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => console.error('[MutationCache]', error),
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* User routes */}
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/forms/:id" element={<FormDetailPage />} />

              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/forms" element={<AdminFormListPage />} />
                <Route path="/admin/forms/create" element={<FormCreatePage />} />
                <Route path="/admin/forms/:id/edit" element={<FormCreatePage />} />
                <Route path="/admin/forms/:id" element={<FormResponsesPage />} />
                <Route path="/admin/academic" element={<AcademicPage />} />
                <Route path="/admin/special-roles" element={<SpecialRolesPage />} />
              </Route>
            </Route>
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
