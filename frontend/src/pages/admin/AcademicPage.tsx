import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { academicApi } from '@/api/academic'
import { extractErrorMessage } from '@/api/client'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Plus, Edit, Trash2, ChevronRight, GraduationCap, BookOpen } from 'lucide-react'
import type { FacultyOut, CareerOut } from '@/types'

export function AcademicPage() {
  const qc = useQueryClient()
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyOut | null>(null)
  const [selectedCareer, setSelectedCareer] = useState<CareerOut | null>(null)
  const [facultyModal, setFacultyModal] = useState<'create' | 'edit' | null>(null)
  const [careerModal, setCareerModal] = useState<'create' | 'edit' | null>(null)
  const [groupModal, setGroupModal] = useState(false)
  const [editFaculty, setEditFaculty] = useState<FacultyOut | null>(null)
  const [editCareer, setEditCareer] = useState<CareerOut | null>(null)

  const { data: faculties = [], isLoading } = useQuery({
    queryKey: ['faculties'],
    queryFn: academicApi.listFaculties,
  })

  const { data: careers = [] } = useQuery({
    queryKey: ['careers', selectedFaculty?.id],
    queryFn: () => academicApi.listCareers(selectedFaculty!.id),
    enabled: !!selectedFaculty,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups', selectedCareer?.id],
    queryFn: () => academicApi.listGroups(selectedCareer!.id),
    enabled: !!selectedCareer,
  })

  const deleteFaculty = useMutation({
    mutationFn: academicApi.deleteFaculty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculties'] })
      if (selectedFaculty) setSelectedFaculty(null)
    },
  })

  const deleteCareer = useMutation({
    mutationFn: academicApi.deleteCareer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['careers', selectedFaculty?.id] })
      setSelectedCareer(null)
    },
  })

  const deleteGroup = useMutation({
    mutationFn: academicApi.deleteGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', selectedCareer?.id] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión Académica</h1>
        <p className="text-sm text-gray-500 mt-1">Administra facultades, carreras y grupos</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Faculties */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <GraduationCap className="size-4" /> Facultades
            </div>
            <button
              onClick={() => setFacultyModal('create')}
              className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="size-4 text-gray-600" />
            </button>
          </div>
          <div className="divide-y">
            {faculties.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">Sin facultades</p>
            )}
            {faculties.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFaculty(f)
                  setSelectedCareer(null)
                }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  selectedFaculty?.id === f.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-sm text-gray-800 flex-1 truncate">{f.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditFaculty(f); setFacultyModal('edit') }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400"
                  >
                    <Edit className="size-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`¿Eliminar facultad "${f.name}"?`)) deleteFaculty.mutate(f.id)
                    }}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="size-3" />
                  </button>
                  <ChevronRight className="size-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Careers */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <BookOpen className="size-4" /> Carreras
              {selectedFaculty && (
                <span className="text-xs font-normal text-gray-400 truncate max-w-24">
                  — {selectedFaculty.name}
                </span>
              )}
            </div>
            {selectedFaculty && (
              <button
                onClick={() => setCareerModal('create')}
                className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="size-4 text-gray-600" />
              </button>
            )}
          </div>
          <div className="divide-y">
            {!selectedFaculty && (
              <p className="text-center text-sm text-gray-400 py-6">Selecciona una facultad</p>
            )}
            {selectedFaculty && careers.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">Sin carreras</p>
            )}
            {careers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCareer(c)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  selectedCareer?.id === c.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm text-gray-800 truncate">{c.name}</span>
                  <span className="text-xs text-gray-400">
                    {c.duration_years} años · {c.groups_per_year} grupos/año
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditCareer(c); setCareerModal('edit') }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400"
                  >
                    <Edit className="size-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`¿Eliminar carrera "${c.name}"?`)) deleteCareer.mutate(c.id)
                    }}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="size-3" />
                  </button>
                  <ChevronRight className="size-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              Grupos
              {selectedCareer && (
                <span className="text-xs font-normal text-gray-400 truncate max-w-24">
                  — {selectedCareer.name}
                </span>
              )}
            </div>
            {selectedCareer && (
              <button
                onClick={() => setGroupModal(true)}
                className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="size-4 text-gray-600" />
              </button>
            )}
          </div>
          <div className="divide-y">
            {!selectedCareer && (
              <p className="text-center text-sm text-gray-400 py-6">Selecciona una carrera</p>
            )}
            {selectedCareer && groups.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">Sin grupos</p>
            )}
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-800">{g.display_name}</span>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${g.display_name}"?`)) deleteGroup.mutate(g.id)
                  }}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Faculty modals */}
      <FacultyModal
        open={facultyModal === 'create'}
        onClose={() => setFacultyModal(null)}
        onSaved={() => { setFacultyModal(null); qc.invalidateQueries({ queryKey: ['faculties'] }) }}
      />
      {editFaculty && (
        <FacultyModal
          open={facultyModal === 'edit'}
          faculty={editFaculty}
          onClose={() => { setFacultyModal(null); setEditFaculty(null) }}
          onSaved={() => { setFacultyModal(null); setEditFaculty(null); qc.invalidateQueries({ queryKey: ['faculties'] }) }}
        />
      )}

      {/* Career modals */}
      {selectedFaculty && (
        <CareerModal
          open={careerModal === 'create'}
          facultyId={selectedFaculty.id}
          onClose={() => setCareerModal(null)}
          onSaved={() => { setCareerModal(null); qc.invalidateQueries({ queryKey: ['careers', selectedFaculty.id] }) }}
        />
      )}
      {editCareer && selectedFaculty && (
        <CareerModal
          open={careerModal === 'edit'}
          career={editCareer}
          facultyId={selectedFaculty.id}
          onClose={() => { setCareerModal(null); setEditCareer(null) }}
          onSaved={(updated) => {
            setCareerModal(null)
            setEditCareer(null)
            qc.invalidateQueries({ queryKey: ['careers', selectedFaculty.id] })
            // Si la carrera editada es la que está seleccionada, actualizar su estado
            // para que GroupModal refleje los nuevos duration_years inmediatamente
            if (selectedCareer?.id === updated.id) setSelectedCareer(updated)
          }}
        />
      )}

      {selectedCareer && (
        <GroupModal
          open={groupModal}
          career={selectedCareer}
          onClose={() => setGroupModal(false)}
          onSaved={() => { setGroupModal(false); qc.invalidateQueries({ queryKey: ['groups', selectedCareer.id] }) }}
        />
      )}
    </div>
  )
}

// ── Faculty modal ─────────────────────────────────────────────────────────────

function FacultyModal({
  open, onClose, onSaved, faculty,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; faculty?: FacultyOut
}) {
  const [name, setName] = useState(faculty?.name ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      faculty ? academicApi.updateFaculty(faculty.id, name) : academicApi.createFaculty(name),
    onSuccess: onSaved,
    onError: (e: unknown) => setError(extractErrorMessage(e)),
  })

  return (
    <Modal open={open} onClose={onClose} title={faculty ? 'Editar facultad' : 'Nueva facultad'} size="sm">
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {faculty ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Career modal ──────────────────────────────────────────────────────────────

function CareerModal({
  open, onClose, onSaved, facultyId, career,
}: {
  open: boolean; onClose: () => void; onSaved: (updated: CareerOut) => void; facultyId: number; career?: CareerOut
}) {
  const [form, setForm] = useState({
    name: career?.name ?? '',
    duration_years: String(career?.duration_years ?? 4),
    groups_per_year: String(career?.groups_per_year ?? 2),
  })
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () =>
      career
        ? academicApi.updateCareer(career.id, {
            name: form.name,
            duration_years: Number(form.duration_years),
          })
        : academicApi.createCareer(facultyId, {
            name: form.name,
            duration_years: Number(form.duration_years),
            groups_per_year: Number(form.groups_per_year),
          }),
    onSuccess: (updated) => onSaved(updated),
    onError: (e: unknown) => setError(extractErrorMessage(e)),
  })

  return (
    <Modal open={open} onClose={onClose} title={career ? 'Editar carrera' : 'Nueva carrera'} size="sm">
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <Input label="Duración (años)" type="number" min={1} max={10} value={form.duration_years}
          onChange={(e) => set('duration_years', e.target.value)} required />
        {!career && (
          <>
            <Input label="Grupos por año" type="number" min={1} max={20} value={form.groups_per_year}
              onChange={(e) => set('groups_per_year', e.target.value)} required />
            <p className="text-xs text-gray-500 -mt-2">
              Se generarán {Number(form.duration_years) * Number(form.groups_per_year)} grupos automáticamente.
            </p>
          </>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {career ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Group modal ───────────────────────────────────────────────────────────────

function GroupModal({
  open, onClose, onSaved, career,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; career: CareerOut
}) {
  const [year, setYear] = useState('1')
  const [error, setError] = useState('')

  const yearOptions = Array.from({ length: career.duration_years }, (_, i) => ({
    value: i + 1,
    label: `Año ${i + 1}`,
  }))

  const mutation = useMutation({
    mutationFn: () => academicApi.addGroup(career.id, Number(year)),
    onSuccess: () => { setYear('1'); setError(''); onSaved() },
    onError: (e: unknown) => setError(extractErrorMessage(e)),
  })

  return (
    <Modal open={open} onClose={onClose} title="Agregar grupo" size="sm">
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}
      <div className="flex flex-col gap-4">
        <Select
          label="Año"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          options={yearOptions}
          required
        />
        <p className="text-xs text-gray-500 -mt-2">
          Se asignará el siguiente número de grupo disponible para ese año.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Agregar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
