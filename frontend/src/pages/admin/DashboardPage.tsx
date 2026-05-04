import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import { PageLoader } from '@/components/ui/Spinner'
import { Users, FileText, CheckCircle, ClipboardList, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
  href?: string
}

function StatCard({ label, value, icon: Icon, color, bg, href }: StatCardProps) {
  const inner = (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`size-12 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`size-6 ${color}`} />
        </div>
      </div>
    </div>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
  })
  const { data: participation = [] } = useQuery({
    queryKey: ['dashboard-participation'],
    queryFn: dashboardApi.participation,
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total usuarios"
          value={stats?.total_users ?? 0}
          icon={Users}
          color="text-indigo-600"
          bg="bg-indigo-50"
          href="/admin/users"
        />
        <StatCard
          label="Pendientes confirmación"
          value={stats?.pending_confirmation ?? 0}
          icon={AlertCircle}
          color="text-amber-600"
          bg="bg-amber-50"
          href="/admin/users?filter=pending"
        />
        <StatCard
          label="Formularios activos"
          value={stats?.active_forms ?? 0}
          icon={CheckCircle}
          color="text-green-600"
          bg="bg-green-50"
          href="/admin/forms"
        />
        <StatCard
          label="Total respuestas"
          value={stats?.total_responses ?? 0}
          icon={ClipboardList}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* Participation table */}
      {participation.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-3">
            <FileText className="size-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Participación por formulario</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Formulario</th>
                  <th className="text-right px-6 py-3">Audiencia</th>
                  <th className="text-right px-6 py-3">Respuestas</th>
                  <th className="text-right px-6 py-3">Participación</th>
                </tr>
              </thead>
              <tbody>
                {participation.map((p) => (
                  <tr key={p.form_id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link
                        to={`/admin/forms/${p.form_id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {p.form_title}
                      </Link>
                    </td>
                    <td className="text-right px-6 py-3 text-gray-600">{p.total_audience}</td>
                    <td className="text-right px-6 py-3 text-gray-600">{p.total_responses}</td>
                    <td className="text-right px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(p.participation_pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-700 w-12 text-right">
                          {p.participation_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
