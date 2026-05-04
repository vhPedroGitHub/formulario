import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formsApi } from '@/api/forms'
import { academicApi } from '@/api/academic'
import { specialRolesApi } from '@/api/specialRoles'
import { usersApi } from '@/api/users'
import { extractErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import type { FormCreate, FormOut, FormFieldIn, FormFieldOut, AudienceEntryIn, AudienceEntryOut, FieldType, AudienceTargetType } from '@/types'

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'radio', label: 'Selección única' },
  { value: 'checkbox', label: 'Selección múltiple' },
  { value: 'scale', label: 'Escala (1-10)' },
  { value: 'file', label: 'Archivo adjunto' },
]

function newField(): FormFieldIn {
  return { type: 'text', label: '', is_required: false, help_text: '', options: [] }
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fieldOutToIn(f: FormFieldOut): FormFieldIn {
  return {
    type: f.type,
    label: f.label,
    help_text: f.help_text ?? '',
    is_required: f.is_required,
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
    conditional_logic: f.conditional_logic ?? null,
  }
}

type AudienceSelType = {
  type: AudienceTargetType
  facultyId?: number
  careerId?: number
  groupId?: number
  userId?: number
  roleId?: number
}

function audienceOutToSel(entry: AudienceEntryOut): AudienceSelType {
  switch (entry.target_type) {
    case 'all': return { type: 'all' }
    case 'faculty': return { type: 'faculty', facultyId: entry.target_id ?? undefined }
    case 'user': return { type: 'user', userId: entry.target_id ?? undefined }
    case 'special_role': return { type: 'special_role', roleId: entry.target_id ?? undefined }
    case 'career': return { type: 'career', careerId: entry.target_id ?? undefined }
    case 'group': return { type: 'group', groupId: entry.target_id ?? undefined }
    default: return { type: entry.target_type }
  }
}

// ── Page entry point ──────────────────────────────────────────────────────────

export function FormCreatePage() {
  const { id } = useParams()
  const formId = id ? parseInt(id) : undefined

  if (!formId) {
    return <FormEditor />
  }
  return <FormEditorLoader formId={formId} />
}

function FormEditorLoader({ formId }: { formId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-form', formId],
    queryFn: () => formsApi.adminGet(formId),
    staleTime: 0, // Always fresh for edit
  })

  if (isLoading) return <PageLoader />
  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="error">No se pudo cargar el formulario.</Alert>
      </div>
    )
  }

  return <FormEditor initialData={data} formId={formId} />
}

// ── Main editor ───────────────────────────────────────────────────────────────

function FormEditor({ initialData, formId }: { initialData?: FormOut; formId?: number }) {
  const isEdit = !!formId
  const navigate = useNavigate()
  const qc = useQueryClient()

  // ── General info state (initialized from existing data if editing) ──
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [isAnonymous, setIsAnonymous] = useState(initialData?.is_anonymous ?? false)
  const [isEditable, setIsEditable] = useState(initialData?.is_editable ?? false)
  const [startDate, setStartDate] = useState(toDatetimeLocal(initialData?.start_date))
  const [endDate, setEndDate] = useState(toDatetimeLocal(initialData?.end_date))

  // ── Fields state ──
  const [fields, setFields] = useState<FormFieldIn[]>(() =>
    initialData ? initialData.fields.map(fieldOutToIn) : [newField()]
  )

  const [error, setError] = useState('')

  // ── Reference data queries ──
  const { data: faculties = [] } = useQuery({ queryKey: ['faculties'], queryFn: academicApi.listFaculties })
  const { data: allCareers = [] } = useQuery({ queryKey: ['careers'], queryFn: () => academicApi.listCareers() })
  const { data: specialRoles = [] } = useQuery({ queryKey: ['special-roles'], queryFn: specialRolesApi.list })
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() })
  const { data: allGroups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: academicApi.listAllGroups,
    // Only fetch if editing and there are group-type audiences
    enabled: isEdit && (initialData?.audience.some((a) => a.target_type === 'group') ?? false),
  })

  // ── Audience state ──
  // Start with a simplified version from the stored data (career/group cascade resolved below)
  const [audienceSelections, setAudienceSelections] = useState<AudienceSelType[]>(() => {
    if (!initialData) return [{ type: 'all' }]
    return initialData.audience.map(audienceOutToSel)
  })

  // Refine career/group audience entries with cascade (facultyId, careerId) once reference data loads
  const audienceRefined = useRef(!isEdit) // already correct for create mode
  useEffect(() => {
    if (audienceRefined.current || !initialData) return
    const needsCareers = initialData.audience.some((a) => ['career', 'group'].includes(a.target_type))
    const needsGroups = initialData.audience.some((a) => a.target_type === 'group')
    if (needsCareers && allCareers.length === 0) return
    if (needsGroups && allGroups.length === 0) return

    audienceRefined.current = true
    setAudienceSelections(
      initialData.audience.map((entry) => {
        switch (entry.target_type) {
          case 'career': {
            const career = allCareers.find((c) => c.id === entry.target_id)
            return { type: 'career', careerId: entry.target_id ?? undefined, facultyId: career?.faculty_id }
          }
          case 'group': {
            const group = allGroups.find((g) => g.id === entry.target_id)
            const career = group ? allCareers.find((c) => c.id === group.career_id) : undefined
            return {
              type: 'group',
              groupId: entry.target_id ?? undefined,
              careerId: group?.career_id,
              facultyId: career?.faculty_id,
            }
          }
          default:
            return audienceOutToSel(entry)
        }
      })
    )
  }, [initialData, allCareers, allGroups])

  // ── Field helpers ──
  const updateField = (i: number, patch: Partial<FormFieldIn>) =>
    setFields((f) => f.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))

  const addOption = (i: number) =>
    setFields((f) =>
      f.map((x, idx) => (idx === i ? { ...x, options: [...(x.options ?? []), ''] } : x))
    )

  const updateOption = (fi: number, oi: number, val: string) =>
    setFields((f) =>
      f.map((x, idx) =>
        idx === fi ? { ...x, options: (x.options ?? []).map((o, j) => (j === oi ? val : o)) } : x
      )
    )

  const removeOption = (fi: number, oi: number) =>
    setFields((f) =>
      f.map((x, idx) =>
        idx === fi ? { ...x, options: (x.options ?? []).filter((_, j) => j !== oi) } : x
      )
    )

  const removeField = (i: number) => setFields((f) => f.filter((_, idx) => idx !== i))

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: FormCreate) => formsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-forms'] })
      navigate('/admin/forms')
    },
    onError: (e: unknown) => setError(extractErrorMessage(e, 'Error al crear el formulario')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormCreate) => formsApi.update(formId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-forms'] })
      qc.invalidateQueries({ queryKey: ['admin-form', formId] })
      navigate('/admin/forms')
    },
    onError: (e: unknown) => setError(extractErrorMessage(e, 'Error al guardar el formulario')),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  // ── Build audience payload ──
  const buildAudience = (): AudienceEntryIn[] =>
    audienceSelections.map((sel) => {
      if (sel.type === 'all') return { target_type: 'all' }
      if (sel.type === 'faculty') return { target_type: 'faculty', target_id: sel.facultyId }
      if (sel.type === 'career') return { target_type: 'career', target_id: sel.careerId }
      if (sel.type === 'group') return { target_type: 'group', target_id: sel.groupId }
      if (sel.type === 'user') return { target_type: 'user', target_id: sel.userId }
      if (sel.type === 'special_role') return { target_type: 'special_role', target_id: sel.roleId }
      return { target_type: sel.type }
    })

  // ── Submit ──
  const handleSubmit = () => {
    setError('')
    if (!title.trim()) { setError('El título es requerido'); return }
    if (fields.length === 0) { setError('Agrega al menos un campo'); return }
    if (fields.some((f) => !f.label.trim())) { setError('Todos los campos deben tener etiqueta'); return }

    const totalResponses = initialData?.total_responses ?? 0
    if (isEdit && totalResponses > 0) {
      const plural = totalResponses === 1 ? 'respuesta' : 'respuestas'
      if (!confirm(
        `Este formulario tiene ${totalResponses} ${plural}. Guardar los cambios eliminará permanentemente todos los datos de respuesta recolectados.\n\n¿Deseas continuar?`
      )) return
    }

    const payload: FormCreate = {
      title,
      description,
      is_anonymous: isAnonymous,
      is_editable: isEditable,
      start_date: startDate || null,
      end_date: endDate || null,
      audience: buildAudience(),
      fields: fields.map((f, i) => ({
        ...f,
        order: i,
        options: ['radio', 'checkbox'].includes(f.type) ? (f.options ?? []) : undefined,
      })),
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const totalResponses = initialData?.total_responses ?? 0

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/admin/forms')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="size-4" /> Volver
      </button>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Editar formulario' : 'Crear formulario'}
      </h1>

      {/* Warning banner when editing a form with existing responses */}
      {isEdit && totalResponses > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Este formulario tiene <strong>{totalResponses}</strong> {totalResponses === 1 ? 'respuesta' : 'respuestas'}.
            Guardar los cambios eliminará permanentemente todos los datos de respuesta recolectados.
          </p>
        </div>
      )}

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* General info */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Información general
        </h2>
        <div className="flex flex-col gap-4">
          <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea label="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha de inicio (opcional)" type="datetime-local" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Fecha de cierre (opcional)" type="datetime-local" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                className="accent-indigo-600" />
              <span className="text-sm text-gray-700">Anónimo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isEditable} onChange={(e) => setIsEditable(e.target.checked)}
                className="accent-indigo-600" />
              <span className="text-sm text-gray-700">Editable</span>
            </label>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Audiencia
          </h2>
          <Button
            size="sm" variant="outline"
            onClick={() => setAudienceSelections((a) => [...a, { type: 'all' }])}
          >
            <Plus className="size-3.5" /> Añadir
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {audienceSelections.map((sel, i) => (
            <AudienceSelector
              key={i}
              sel={sel}
              index={i}
              faculties={faculties}
              allCareers={allCareers}
              specialRoles={specialRoles}
              users={users}
              onChange={(patch) =>
                setAudienceSelections((a) =>
                  a.map((x, idx) => (idx === i ? { ...x, ...patch } : x))
                )
              }
              onRemove={
                audienceSelections.length > 1
                  ? () => setAudienceSelections((a) => a.filter((_, idx) => idx !== i))
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      {/* Fields */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Campos ({fields.length})
          </h2>
          <Button size="sm" variant="outline" onClick={() => setFields((f) => [...f, newField()])}>
            <Plus className="size-3.5" /> Campo
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          {fields.map((field, i) => (
            <FieldEditor
              key={i}
              field={field}
              index={i}
              total={fields.length}
              onChange={(patch) => updateField(i, patch)}
              onRemove={() => removeField(i)}
              onAddOption={() => addOption(i)}
              onUpdateOption={(oi, val) => updateOption(i, oi, val)}
              onRemoveOption={(oi) => removeOption(i, oi)}
              onMoveUp={i > 0 ? () => setFields((f) => { const n = [...f]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n }) : undefined}
              onMoveDown={i < fields.length - 1 ? () => setFields((f) => { const n = [...f]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n }) : undefined}
              allFields={fields}
            />
          ))}
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate('/admin/forms')}>Cancelar</Button>
        <Button loading={isPending} onClick={handleSubmit} size="lg">
          {isEdit ? 'Guardar cambios' : 'Crear formulario'}
        </Button>
      </div>
    </div>
  )
}

// ── Audience Selector ─────────────────────────────────────────────────────────

interface AudienceSelectorProps {
  sel: AudienceSelType
  index: number
  faculties: { id: number; name: string }[]
  allCareers: { id: number; name: string; faculty_id: number }[]
  specialRoles: { id: number; name: string }[]
  users: { id: number; username: string; first_name: string; last_name: string }[]
  onChange: (p: Partial<AudienceSelType>) => void
  onRemove?: () => void
}

function AudienceSelector({ sel, faculties, allCareers, specialRoles, users, onChange, onRemove }: AudienceSelectorProps) {
  const { data: groups = [] } = useQuery({
    queryKey: ['groups', sel.careerId],
    queryFn: () => academicApi.listGroups(sel.careerId!),
    enabled: !!sel.careerId,
  })
  const careers = allCareers.filter((c) => c.faculty_id === (sel.facultyId ?? 0))

  const typeLabels: Record<AudienceTargetType, string> = {
    all: 'Todos', faculty: 'Por facultad', career: 'Por carrera',
    group: 'Por grupo', user: 'Usuario específico', special_role: 'Por rol especial',
  }

  return (
    <div className="flex gap-2 items-start p-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex-1 flex flex-col gap-2">
        <Select
          value={sel.type}
          onChange={(e) => onChange({ type: e.target.value as AudienceTargetType, facultyId: undefined, careerId: undefined, groupId: undefined, userId: undefined, roleId: undefined })}
          options={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))}
          label=""
        />
        {sel.type === 'faculty' && (
          <Select value={String(sel.facultyId ?? '')} onChange={(e) => onChange({ facultyId: Number(e.target.value) })}
            options={faculties.map((f) => ({ value: f.id, label: f.name }))} placeholder="Seleccionar..." label="" />
        )}
        {sel.type === 'career' && (
          <>
            <Select value={String(sel.facultyId ?? '')} onChange={(e) => onChange({ facultyId: Number(e.target.value), careerId: undefined })}
              options={faculties.map((f) => ({ value: f.id, label: f.name }))} placeholder="Facultad..." label="" />
            {sel.facultyId && (
              <Select value={String(sel.careerId ?? '')} onChange={(e) => onChange({ careerId: Number(e.target.value) })}
                options={careers.map((c) => ({ value: c.id, label: c.name }))} placeholder="Carrera..." label="" />
            )}
          </>
        )}
        {sel.type === 'group' && (
          <>
            <Select value={String(sel.facultyId ?? '')} onChange={(e) => onChange({ facultyId: Number(e.target.value), careerId: undefined, groupId: undefined })}
              options={faculties.map((f) => ({ value: f.id, label: f.name }))} placeholder="Facultad..." label="" />
            {sel.facultyId && (
              <Select value={String(sel.careerId ?? '')} onChange={(e) => onChange({ careerId: Number(e.target.value), groupId: undefined })}
                options={careers.map((c) => ({ value: c.id, label: c.name }))} placeholder="Carrera..." label="" />
            )}
            {sel.careerId && (
              <Select value={String(sel.groupId ?? '')} onChange={(e) => onChange({ groupId: Number(e.target.value) })}
                options={groups.map((g) => ({ value: g.id, label: g.display_name }))} placeholder="Grupo..." label="" />
            )}
          </>
        )}
        {sel.type === 'user' && (
          <Select value={String(sel.userId ?? '')} onChange={(e) => onChange({ userId: Number(e.target.value) })}
            options={users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name} (@${u.username})` }))}
            placeholder="Seleccionar usuario..." label="" />
        )}
        {sel.type === 'special_role' && (
          <Select value={String(sel.roleId ?? '')} onChange={(e) => onChange({ roleId: Number(e.target.value) })}
            options={specialRoles.map((r) => ({ value: r.id, label: r.name }))} placeholder="Seleccionar rol..." label="" />
        )}
      </div>
      {onRemove && (
        <button onClick={onRemove} className="p-1.5 rounded text-red-400 hover:bg-red-50 transition-colors mt-1">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}

// ── Field Editor ──────────────────────────────────────────────────────────────

interface FieldEditorProps {
  field: FormFieldIn
  index: number
  total: number
  onChange: (patch: Partial<FormFieldIn>) => void
  onRemove: () => void
  onAddOption: () => void
  onUpdateOption: (i: number, val: string) => void
  onRemoveOption: (i: number) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  allFields: FormFieldIn[]
}

function FieldEditor({
  field, index, total, onChange, onRemove, onAddOption, onUpdateOption, onRemoveOption,
  onMoveUp, onMoveDown, allFields,
}: FieldEditorProps) {
  const [expanded, setExpanded] = useState(true)
  const hasOptions = ['radio', 'checkbox'].includes(field.type)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="size-4 text-gray-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-700 block truncate">
            {index + 1}. {field.label || 'Sin título'}
          </span>
          <div className="flex gap-2 mt-0.5 flex-wrap">
            <Badge variant="default" className="text-xs">{field.type}</Badge>
            {field.is_required && <Badge variant="danger" className="text-xs">Requerido</Badge>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={!onMoveUp} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
            <ChevronUp className="size-4 text-gray-500" />
          </button>
          <button onClick={onMoveDown} disabled={!onMoveDown} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
            <ChevronDown className="size-4 text-gray-500" />
          </button>
          <button onClick={onRemove} disabled={total === 1} className="p-1 rounded hover:bg-red-50 disabled:opacity-30">
            <Trash2 className="size-4 text-red-400" />
          </button>
        </div>
        {expanded ? <ChevronUp className="size-4 text-gray-400 shrink-0" /> : <ChevronDown className="size-4 text-gray-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Etiqueta" value={field.label} onChange={(e) => onChange({ label: e.target.value })} required />
            <Select label="Tipo" value={field.type}
              onChange={(e) => onChange({ type: e.target.value as FieldType, options: [] })}
              options={fieldTypes} />
          </div>
          <Input label="Texto de ayuda (opcional)" value={field.help_text ?? ''}
            onChange={(e) => onChange({ help_text: e.target.value })} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={field.is_required}
              onChange={(e) => onChange({ is_required: e.target.checked })}
              className="accent-indigo-600" />
            <span className="text-sm text-gray-700">Campo requerido</span>
          </label>

          {/* Options for radio/checkbox */}
          {hasOptions && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Opciones</p>
              <div className="flex flex-col gap-2">
                {(field.options ?? []).map((opt, oi) => (
                  <div key={oi} className="flex gap-2">
                    <input
                      type="text" value={opt} placeholder={`Opción ${oi + 1}`}
                      onChange={(e) => onUpdateOption(oi, e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                    />
                    <button onClick={() => onRemoveOption(oi)}
                      className="p-1.5 rounded text-red-400 hover:bg-red-50">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <button onClick={onAddOption}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 py-1">
                  <Plus className="size-4" /> Añadir opción
                </button>
              </div>
            </div>
          )}

          {/* Conditional logic */}
          <ConditionalLogicEditor
            field={field}
            allFields={allFields}
            currentIndex={index}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  )
}

// ── Conditional Logic Editor ──────────────────────────────────────────────────

function ConditionalLogicEditor({
  field, allFields, currentIndex, onChange,
}: {
  field: FormFieldIn; allFields: FormFieldIn[]; currentIndex: number; onChange: (p: Partial<FormFieldIn>) => void
}) {
  const [enabled, setEnabled] = useState(!!field.conditional_logic)
  const prevFields = allFields.slice(0, currentIndex).filter((f) => ['radio', 'checkbox', 'text'].includes(f.type))

  if (prevFields.length === 0) return null

  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer mb-2">
        <input type="checkbox" checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked)
            if (!e.target.checked) onChange({ conditional_logic: null })
          }}
          className="accent-indigo-600" />
        <span className="text-sm text-gray-700">Mostrar condicionalmente</span>
      </label>
      {enabled && (
        <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-xs text-blue-700 font-medium">Mostrar si:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={String(field.conditional_logic?.field_id ?? '')}
              onChange={(e) => onChange({ conditional_logic: { ...(field.conditional_logic ?? { operator: 'equals', value: '' }), field_id: Number(e.target.value) } })}
              options={prevFields.map((f) => ({ value: allFields.indexOf(f), label: f.label || `Campo ${allFields.indexOf(f) + 1}` }))}
              placeholder="Campo..." label="" />
            <Select value={field.conditional_logic?.operator ?? 'equals'}
              onChange={(e) => onChange({ conditional_logic: { ...(field.conditional_logic ?? { field_id: 0, value: '' }), operator: e.target.value as 'equals' | 'not_equals' | 'contains' } })}
              options={[{ value: 'equals', label: 'es igual a' }, { value: 'not_equals', label: 'no es igual a' }, { value: 'contains', label: 'contiene' }]}
              label="" />
            <input type="text" placeholder="Valor..."
              value={String(field.conditional_logic?.value ?? '')}
              onChange={(e) => onChange({ conditional_logic: { ...(field.conditional_logic ?? { field_id: 0, operator: 'equals' as const }), value: e.target.value } })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
      )}
    </div>
  )
}
