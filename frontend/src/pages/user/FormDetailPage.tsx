import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { formsApi } from '@/api/forms'
import { responsesApi } from '@/api/responses'
import { extractErrorMessage } from '@/api/client'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import { ArrowLeft, Send, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FormFieldOut, ConditionalLogic } from '@/types'

function isFieldVisible(field: FormFieldOut, answers: Record<number, unknown>, allFields: FormFieldOut[]): boolean {
  if (!field.conditional_logic) return true
  const cond = field.conditional_logic as ConditionalLogic
  // cond.field_id is the array index of the referenced field, not its DB id
  const referencedField = allFields[cond.field_id]
  if (!referencedField) return true
  const val = answers[referencedField.id]
  const valStr = String(val ?? '')
  const condVal = cond.value

  if (cond.operator === 'equals') {
    return Array.isArray(condVal) ? condVal.includes(valStr) : valStr === String(condVal)
  }
  if (cond.operator === 'not_equals') {
    return Array.isArray(condVal) ? !condVal.includes(valStr) : valStr !== String(condVal)
  }
  if (cond.operator === 'contains') {
    return valStr.toLowerCase().includes(String(condVal).toLowerCase())
  }
  return true
}

export function FormDetailPage() {
  const { id } = useParams<{ id: string }>()
  const formId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formsApi.get(formId),
  })

  const { data: myResponse, isLoading: respLoading } = useQuery({
    queryKey: ['my-response', formId],
    queryFn: () => responsesApi.getMine(formId),
    retry: false,
    throwOnError: false,
  })

  const [answers, setAnswers] = useState<Record<number, unknown>>({})
  const [fileUploads, setFileUploads] = useState<Record<number, File>>({})
  const [editMode, setEditMode] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Pre-fill with existing response
  useEffect(() => {
    if (myResponse?.answers) {
      const map: Record<number, unknown> = {}
      myResponse.answers.forEach((a) => (map[a.field_id] = a.value))
      setAnswers(map)
    }
  }, [myResponse])

  const isEditing = editMode || !myResponse

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Upload files first
      for (const [fieldIdStr, file] of Object.entries(fileUploads)) {
        const fieldId = Number(fieldIdStr)
        const result = await responsesApi.uploadFile(formId, fieldId, file)
        setAnswers((prev) => ({ ...prev, [fieldId]: result.stored_name }))
      }
      // Only include answers for visible fields
      const visibleFields = form!.fields.filter((f) => isFieldVisible(f, answers, form!.fields))
      const visibleIds = new Set(visibleFields.map((f) => f.id))
      const payload = {
        answers: Object.entries(answers)
          .filter(([k]) => visibleIds.has(Number(k)))
          .map(([k, v]) => ({ field_id: Number(k), value: v })),
        form_version: form!.version,
      }
      if (myResponse && form?.is_editable) {
        return responsesApi.updateMine(formId, payload)
      }
      return responsesApi.submit(formId, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-response', formId] })
      qc.invalidateQueries({ queryKey: ['my-forms'] })
      setEditMode(false)
      setSubmitError('')
    },
    onError: (err: unknown) => {
      setSubmitError(extractErrorMessage(err, 'Error al enviar'))
    },
  })

  const setAnswer = (fieldId: number, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  if (formLoading || respLoading) return <PageLoader />
  if (!form) return <Alert variant="error">Formulario no encontrado</Alert>

  const hasResponded = !!myResponse
  const formWasEdited = hasResponded && myResponse.form_version && form.version !== myResponse.form_version
  const showForm = isEditing || !hasResponded

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{form.title}</h1>
            {hasResponded && form.is_editable && !editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="shrink-0"
              >
                <Edit className="size-4" />
                Editar
              </Button>
            )}
          </div>
          {form.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{form.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {form.is_anonymous && <Badge variant="info">Anónimo</Badge>}
            {form.is_editable && <Badge variant="warning">Editable</Badge>}
            {form.end_date && (
              <Badge variant="default">
                Cierra: {format(new Date(form.end_date), 'dd MMM yyyy', { locale: es })}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Already responded - view mode */}
      {hasResponded && !showForm && (
        formWasEdited ? (
          <Alert variant="warning" className="mb-4">
            El formulario fue modificado después de tu respuesta. Debes enviar una nueva respuesta.
          </Alert>
        ) : (
          <Alert variant="success" className="mb-4">
            Ya respondiste este formulario.{' '}
            {form.is_editable ? 'Puedes editar tu respuesta.' : ''}
          </Alert>
        )
      )}

      {/* Form fields */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          {submitError && (
            <Alert variant="error" className="mb-4">
              {submitError}
            </Alert>
          )}
          <div className="flex flex-col gap-5">
            {form.fields
              .filter((f) => isFieldVisible(f, answers, form.fields))
              .map((field) => (
                <FormField
                  key={field.id}
                  field={field}
                  value={answers[field.id]}
                  onChange={(v) => setAnswer(field.id, v)}
                  onFileChange={(file) => setFileUploads((p) => ({ ...p, [field.id]: file }))}
                  readOnly={!isEditing}
                />
              ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t">
            {editMode && (
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
            )}
            <Button
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
            >
              <Send className="size-4" />
              {hasResponded ? 'Guardar cambios' : 'Enviar respuesta'}
            </Button>
          </div>
        </div>
      )}

      {/* View-only filled response */}
      {hasResponded && !editMode && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Tu respuesta
          </h2>
          <div className="flex flex-col gap-4">
            {form.fields.map((field) => {
              const val = answers[field.id]
              if (val === undefined || val === null || val === '') return null
              return (
                <div key={field.id}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{field.label}</p>
                  <p className="text-sm text-gray-900">
                    {Array.isArray(val) ? (val as string[]).join(', ') : String(val)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Field renderer ────────────────────────────────────────────────────────────

interface FormFieldProps {
  field: FormFieldOut
  value: unknown
  onChange: (v: unknown) => void
  onFileChange: (f: File) => void
  readOnly?: boolean
}

function FormField({ field, value, onChange, onFileChange, readOnly }: FormFieldProps) {
  const strVal = value !== undefined && value !== null ? String(value) : ''
  const arrVal: string[] = Array.isArray(value) ? (value as string[]) : []

  return (
    <div>
      <label className="text-sm font-medium text-gray-800 block mb-1">
        {field.label}
        {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {field.help_text && (
        <p className="text-xs text-gray-500 mb-2">{field.help_text}</p>
      )}

      {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
        <Input
          type={field.type}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          required={field.is_required}
          disabled={readOnly}
          label=""
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          required={field.is_required}
          disabled={readOnly}
          label=""
        />
      )}

      {field.type === 'radio' && field.options && (
        <div className="flex flex-col gap-2">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name={`field-${field.id}`}
                value={opt}
                checked={strVal === opt}
                onChange={() => onChange(opt)}
                disabled={readOnly}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && field.options && (
        <div className="flex flex-col gap-2">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                value={opt}
                checked={arrVal.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...arrVal, opt])
                  else onChange(arrVal.filter((v) => v !== opt))
                }}
                disabled={readOnly}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'scale' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">1</span>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => !readOnly && onChange(n)}
              disabled={readOnly}
              className={`size-9 rounded-lg text-sm font-medium border transition-colors ${
                Number(value) === n
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {n}
            </button>
          ))}
          <span className="text-xs text-gray-400">10</span>
        </div>
      )}

      {field.type === 'file' && (
        <div>
          {!readOnly ? (
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFileChange(file)
              }}
              className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          ) : (
            <p className="text-sm text-gray-700">{strVal || '—'}</p>
          )}
        </div>
      )}
    </div>
  )
}
