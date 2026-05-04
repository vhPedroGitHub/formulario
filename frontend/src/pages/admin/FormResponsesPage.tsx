import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formsApi } from '@/api/forms'
import { responsesApi } from '@/api/responses'
import { reportsApi } from '@/api/reports'
import { academicApi } from '@/api/academic'
import { usersApi } from '@/api/users'
import { specialRolesApi } from '@/api/specialRoles'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import {
  ArrowLeft, Download, Users, FileText, Calendar,
  Globe, Building2, GraduationCap, UsersRound, User, Shield, ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ResponseWithUserOut, FormFieldOut, AudienceEntryOut, FacultyOut, CareerOut, GroupOut, UserOut, SpecialRoleOut } from '@/types'

export function FormResponsesPage() {
  const { id } = useParams<{ id: string }>()
  const formId = Number(id)
  const navigate = useNavigate()

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ['admin-form', formId],
    queryFn: () => formsApi.adminGet(formId),
  })

  const { data: responses = [], isLoading: respLoading } = useQuery({
    queryKey: ['admin-responses', formId],
    queryFn: () => responsesApi.adminList(formId),
  })

  // ── Datos de referencia para resolver audiencia ───────────────────────────
  const hasCareerOrFacultyOrGroup = form?.audience.some(
    (a) => a.target_type === 'faculty' || a.target_type === 'career' || a.target_type === 'group',
  ) ?? false
  const hasGroupAudience = form?.audience.some((a) => a.target_type === 'group') ?? false
  const hasUserAudience = form?.audience.some((a) => a.target_type === 'user') ?? false
  const hasRoleAudience = form?.audience.some((a) => a.target_type === 'special_role') ?? false

  const { data: faculties = [] } = useQuery({
    queryKey: ['faculties'],
    queryFn: academicApi.listFaculties,
    enabled: hasCareerOrFacultyOrGroup,
  })
  const { data: careers = [] } = useQuery({
    queryKey: ['careers-all'],
    queryFn: () => academicApi.listCareers(),
    enabled: hasCareerOrFacultyOrGroup,
  })
  const { data: allGroups = [] } = useQuery({
    queryKey: ['groups-all'],
    queryFn: academicApi.listAllGroups,
    enabled: hasGroupAudience,
  })
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    enabled: hasUserAudience,
  })
  const { data: specialRoles = [] } = useQuery({
    queryKey: ['special-roles'],
    queryFn: specialRolesApi.list,
    enabled: hasRoleAudience,
  })

  const facultyMap = useMemo(
    () => Object.fromEntries(faculties.map((f: FacultyOut) => [f.id, f])) as Record<number, FacultyOut>,
    [faculties],
  )
  const careerMap = useMemo(
    () => Object.fromEntries(careers.map((c: CareerOut) => [c.id, c])) as Record<number, CareerOut>,
    [careers],
  )
  const groupMap = useMemo(
    () => Object.fromEntries(allGroups.map((g: GroupOut) => [g.id, g])) as Record<number, GroupOut>,
    [allGroups],
  )
  const userMap = useMemo(
    () => Object.fromEntries(users.map((u: UserOut) => [u.id, u])) as Record<number, UserOut>,
    [users],
  )
  const roleMap = useMemo(
    () => Object.fromEntries(specialRoles.map((r: SpecialRoleOut) => [r.id, r])) as Record<number, SpecialRoleOut>,
    [specialRoles],
  )

  const handleDownloadPdf = async () => {
    try {
      const blob = await reportsApi.fetchPdf(formId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${form?.title ?? formId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al generar el reporte PDF')
    }
  }

  if (formLoading || respLoading) return <PageLoader />
  if (!form) return <Alert variant="error">Formulario no encontrado</Alert>

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/admin/forms')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="size-4" /> Volver
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{form.title}</h1>
            {form.description && <p className="text-sm text-gray-500 whitespace-pre-wrap">{form.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {form.is_anonymous && <Badge variant="info">Anónimo</Badge>}
              {form.is_editable && <Badge variant="warning">Editable</Badge>}
              <Badge variant="default">{form.fields.length} campos</Badge>
              <Badge variant="default">{responses.length} respuestas</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
              {form.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Inicio: {format(new Date(form.start_date), 'dd MMM yyyy HH:mm', { locale: es })}
                </span>
              )}
              {form.end_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Cierre: {format(new Date(form.end_date), 'dd MMM yyyy HH:mm', { locale: es })}
                </span>
              )}
              <span className="flex items-center gap-1">
                Creado por @{form.creator_username}
              </span>
            </div>
          </div>
          <Button onClick={handleDownloadPdf} variant="outline" size="sm" className="shrink-0 self-start">
            <Download className="size-4" /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* Audience */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Users className="size-4" /> Audiencia ({form.audience.length})
        </h2>
        <div className="flex flex-col gap-2">
          {form.audience.map((a) => (
            <AudienceRow
              key={a.id}
              entry={a}
              facultyMap={facultyMap}
              careerMap={careerMap}
              groupMap={groupMap}
              userMap={userMap}
              roleMap={roleMap}
            />
          ))}
        </div>
      </div>

      {/* Responses */}
      {responses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="size-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sin respuestas todavía</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {!form.is_anonymous && (
                    <th className="text-left px-5 py-3 sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e5e7eb]">
                      Usuario
                    </th>
                  )}
                  {form.fields.map((f) => (
                    <th key={f.id} className="text-left px-4 py-3 max-w-40">
                      <span className="truncate block">{f.label}</span>
                    </th>
                  ))}
                  <th className="text-left px-5 py-3">Enviado</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <ResponseRow
                    key={r.id}
                    response={r}
                    fields={form.fields}
                    anonymous={form.is_anonymous}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── AudienceRow ───────────────────────────────────────────────────────────────

interface AudienceRowProps {
  entry: AudienceEntryOut
  facultyMap: Record<number, FacultyOut>
  careerMap: Record<number, CareerOut>
  groupMap: Record<number, GroupOut>
  userMap: Record<number, UserOut>
  roleMap: Record<number, SpecialRoleOut>
}

function AudienceRow({ entry, facultyMap, careerMap, groupMap, userMap, roleMap }: AudienceRowProps) {
  type Crumb = { label: string; muted?: boolean }
  let icon: React.ReactNode
  let crumbs: Crumb[] = []
  let colorClass = 'bg-gray-50 border-gray-200'

  switch (entry.target_type) {
    case 'all': {
      icon = <Globe className="size-4 text-blue-500" />
      crumbs = [{ label: 'Todos los usuarios' }]
      colorClass = 'bg-blue-50 border-blue-200'
      break
    }
    case 'faculty': {
      const fac = entry.target_id != null ? facultyMap[entry.target_id] : undefined
      icon = <Building2 className="size-4 text-indigo-500" />
      crumbs = [
        { label: 'Facultad', muted: true },
        { label: fac?.name ?? `#${entry.target_id}` },
      ]
      colorClass = 'bg-indigo-50 border-indigo-200'
      break
    }
    case 'career': {
      const car = entry.target_id != null ? careerMap[entry.target_id] : undefined
      const fac = car ? facultyMap[car.faculty_id] : undefined
      icon = <GraduationCap className="size-4 text-violet-500" />
      crumbs = [
        { label: fac?.name ?? '…', muted: true },
        { label: car?.name ?? `#${entry.target_id}` },
      ]
      colorClass = 'bg-violet-50 border-violet-200'
      break
    }
    case 'group': {
      const grp = entry.target_id != null ? groupMap[entry.target_id] : undefined
      const car = grp ? careerMap[grp.career_id] : undefined
      const fac = car ? facultyMap[car.faculty_id] : undefined
      icon = <UsersRound className="size-4 text-emerald-500" />
      crumbs = [
        { label: fac?.name ?? '…', muted: true },
        { label: car?.name ?? '…', muted: true },
        { label: grp ? `Grupo ${grp.display_name} · Año ${grp.year}` : `#${entry.target_id}` },
      ]
      colorClass = 'bg-emerald-50 border-emerald-200'
      break
    }
    case 'user': {
      const usr = entry.target_id != null ? userMap[entry.target_id] : undefined
      icon = <User className="size-4 text-amber-500" />
      crumbs = usr
        ? [{ label: `${usr.first_name} ${usr.last_name}`, muted: true }, { label: `@${usr.username}` }]
        : [{ label: `Usuario #${entry.target_id}` }]
      colorClass = 'bg-amber-50 border-amber-200'
      break
    }
    case 'special_role': {
      const role = entry.target_id != null ? roleMap[entry.target_id] : undefined
      icon = <Shield className="size-4 text-rose-500" />
      crumbs = [
        { label: 'Rol especial', muted: true },
        { label: role?.name ?? `#${entry.target_id}` },
      ]
      colorClass = 'bg-rose-50 border-rose-200'
      break
    }
  }

  return (
    <div className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm ${colorClass}`}>
      {icon}
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="size-3.5 text-gray-400 shrink-0" />}
          <span className={c.muted ? 'text-gray-500' : 'font-medium text-gray-900'}>
            {c.label}
          </span>
        </span>
      ))}
    </div>
  )
}

// ── ResponseRow ───────────────────────────────────────────────────────────────

function ResponseRow({
  response, fields, anonymous,
}: {
  response: ResponseWithUserOut; fields: FormFieldOut[]; anonymous: boolean
}) {
  const answerMap: Record<number, unknown> = {}
  response.answers.forEach((a) => (answerMap[a.field_id] = a.value))

  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
      {!anonymous && (
        <td className="px-5 py-3 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e5e7eb]">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {response.first_name} {response.last_name}
            </span>
            <span className="text-xs text-gray-500">@{response.username}</span>
            {response.faculty_name && (
              <span className="text-xs text-gray-400">
                {response.faculty_name}
                {response.career_name && ` · ${response.career_name}`}
                {response.group_display && ` · ${response.group_display}`}
              </span>
            )}
          </div>
        </td>
      )}
      {fields.map((f) => {
        const val = answerMap[f.id]
        const display =
          val === undefined || val === null || val === ''
            ? '—'
            : Array.isArray(val)
            ? (val as string[]).join(', ')
            : String(val)
        return (
          <td key={f.id} className="px-4 py-3 text-gray-700 max-w-40">
            <span className="block truncate" title={display}>
              {display}
            </span>
          </td>
        )
      })}
      <td className="px-5 py-3 text-xs text-gray-500">
        {format(new Date(response.submitted_at), 'dd/MM/yyyy HH:mm', { locale: es })}
      </td>
    </tr>
  )
}
