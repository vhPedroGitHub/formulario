import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { formsApi } from '@/api/forms'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Plus, FileText, Trash2, Eye, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function AdminFormListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['admin-forms'],
    queryFn: formsApi.adminList,
  })

  const deleteMutation = useMutation({
    mutationFn: formsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-forms'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formularios</h1>
          <p className="text-sm text-gray-500 mt-1">{forms.length} formularios creados</p>
        </div>
        <Link to="/admin/forms/create">
          <Button>
            <Plus className="size-4" /> Nuevo formulario
          </Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sin formularios</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Crea tu primer formulario para comenzar</p>
          <Link to="/admin/forms/create">
            <Button size="sm">
              <Plus className="size-4" /> Crear formulario
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Formulario</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Respuestas</th>
                  <th className="text-left px-5 py-3">Creado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => {
                  const now = new Date()
                  const isClosed = form.end_date && new Date(form.end_date) < now
                  const isPending = form.start_date && new Date(form.start_date) > now

                  return (
                    <tr key={form.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{form.title}</span>
                          {form.description && (
                            <span className="text-xs text-gray-400 truncate max-w-xs">
                              {form.description}
                            </span>
                          )}
                          <div className="flex gap-1.5 mt-1">
                            {form.is_anonymous && <Badge variant="info">Anónimo</Badge>}
                            {form.is_editable && <Badge variant="warning">Editable</Badge>}
                            <Badge variant="default">{form.fields.length} campos</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {isClosed ? (
                          <Badge variant="danger">Cerrado</Badge>
                        ) : isPending ? (
                          <Badge variant="warning">Pendiente</Badge>
                        ) : (
                          <Badge variant="success">Activo</Badge>
                        )}
                      </td>
                      <td className="text-right px-5 py-3 font-medium text-gray-700">
                        {form.total_responses}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {format(new Date(form.created_at), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            to={`/admin/forms/${form.id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                            title="Ver respuestas"
                          >
                            <Eye className="size-4" />
                          </Link>
                          <button
                            onClick={() => navigate(`/admin/forms/${form.id}/edit`)}
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                            title="Editar formulario"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar "${form.title}"?`))
                                deleteMutation.mutate(form.id)
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
