import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formsApi } from '@/api/forms'
import { PageLoader } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { ClipboardList, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/store/auth'

export function UserDashboardPage() {
  const { user } = useAuthStore()
  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ['my-forms'],
    queryFn: formsApi.listMy,
  })

  const pending = forms.filter((f) => !f.has_responded)
  const done = forms.filter((f) => f.has_responded)

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.first_name} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.faculty_name
            ? `${user.faculty_name} · ${user.career_name ?? ''} · ${user.group_display ?? ''}`
            : user?.special_role_name ?? 'Sin asignación académica'}
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          Error al cargar formularios
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="size-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{done.length}</p>
              <p className="text-xs text-gray-500">Completados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending forms */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="size-4" /> Pendientes de respuesta
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((form) => (
              <Link
                key={form.id}
                to={`/forms/${form.id}`}
                className="bg-white rounded-xl border border-indigo-200 p-5 hover:border-indigo-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{form.title}</h3>
                      {form.is_anonymous && (
                        <Badge variant="info">Anónimo</Badge>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 whitespace-pre-line">{form.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      {form.end_date && (
                        <span>
                          Cierra:{' '}
                          {format(new Date(form.end_date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      )}
                      <span>{form.total_responses} respuestas</span>
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-gray-400 group-hover:text-indigo-600 shrink-0 transition-colors mt-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Completed forms */}
      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle className="size-4 text-green-500" /> Completados
          </h2>
          <div className="flex flex-col gap-3">
            {done.map((form) => (
              <Link
                key={form.id}
                to={`/forms/${form.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-700 truncate">{form.title}</h3>
                      <Badge variant="success">Respondido</Badge>
                      {form.is_editable && <Badge variant="info">Editable</Badge>}
                    </div>
                    {form.description && (
                      <p className="text-sm text-gray-400 line-clamp-1 whitespace-pre-line">{form.description}</p>
                    )}
                  </div>
                  {form.is_editable && (
                    <ArrowRight className="size-5 text-gray-400 group-hover:text-indigo-600 shrink-0 transition-colors mt-0.5" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {forms.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <ClipboardList className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sin formularios disponibles</p>
          <p className="text-sm text-gray-400 mt-1">
            Cuando el administrador publique formularios para tu grupo aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  )
}
