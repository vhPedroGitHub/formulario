// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
}

// ── User ──────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'user'

export interface UserOut {
  id: number
  username: string
  first_name: string
  last_name: string
  role: UserRole
  faculty_id?: number | null
  career_id?: number | null
  group_id?: number | null
  special_role_id?: number | null
  is_confirmed: boolean
  is_active: boolean
  created_at: string
  faculty_name?: string | null
  career_name?: string | null
  group_display?: string | null
  special_role_name?: string | null
}

export interface UserCreate {
  username: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  faculty_id?: number | null
  career_id?: number | null
  group_id?: number | null
  special_role_id?: number | null
}

export interface UserUpdate {
  first_name?: string
  last_name?: string
  role?: UserRole
  faculty_id?: number | null
  career_id?: number | null
  group_id?: number | null
  special_role_id?: number | null
  is_active?: boolean
  password?: string
}

export interface SignupRequest {
  username: string
  password: string
  first_name: string
  last_name: string
  faculty_id?: number | null
  career_id?: number | null
  group_id?: number | null
  special_role_id?: number | null
}

// ── Academic ──────────────────────────────────────────────────────────────────
export interface FacultyOut {
  id: number
  name: string
}

export interface CareerOut {
  id: number
  name: string
  faculty_id: number
  faculty_name?: string | null
  duration_years: number
  groups_per_year: number
  created_at: string
}

export interface GroupOut {
  id: number
  career_id: number
  year: number
  group_number: number
  display_name: string
}

// ── Special Roles ─────────────────────────────────────────────────────────────
export interface SpecialRoleOut {
  id: number
  name: string
}

// ── Forms ─────────────────────────────────────────────────────────────────────
export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'scale'
  | 'file'
  | 'table'

export type AudienceTargetType =
  | 'all'
  | 'faculty'
  | 'career'
  | 'group'
  | 'user'
  | 'special_role'

export interface ConditionalLogic {
  field_id: number
  operator: 'equals' | 'not_equals' | 'contains'
  value: string | string[]
}

export interface FormFieldOut {
  id: number
  form_id: number
  order: number
  type: FieldType
  label: string
  help_text?: string | null
  is_required: boolean
  options?: string[] | null
  conditional_logic?: ConditionalLogic | null
}

export interface AudienceEntryOut {
  id: number
  target_type: AudienceTargetType
  target_id?: number | null
}

export interface FormOut {
  id: number
  title: string
  description?: string | null
  is_anonymous: boolean
  is_editable: boolean
  start_date?: string | null
  end_date?: string | null
  created_at: string
  created_by: number
  creator_username?: string | null
  version: number
  audience: AudienceEntryOut[]
  fields: FormFieldOut[]
  total_responses: number
}

export interface FormListOut {
  id: number
  title: string
  description?: string | null
  is_anonymous: boolean
  is_editable: boolean
  start_date?: string | null
  end_date?: string | null
  created_at: string
  total_responses: number
  has_responded: boolean
}

// ── Form Create ───────────────────────────────────────────────────────────────
export interface AudienceEntryIn {
  target_type: AudienceTargetType
  target_id?: number | null
}

export interface FormFieldIn {
  order?: number
  type: FieldType
  label: string
  help_text?: string
  is_required: boolean
  options?: string[]
  conditional_logic?: ConditionalLogic | null
}

export interface FormCreate {
  title: string
  description?: string
  is_anonymous: boolean
  is_editable: boolean
  start_date?: string | null
  end_date?: string | null
  audience: AudienceEntryIn[]
  fields: FormFieldIn[]
}

// ── Responses ─────────────────────────────────────────────────────────────────
export interface AnswerOut {
  field_id: number
  value: unknown
}

export interface ResponseOut {
  id: number
  form_id: number
  user_id: number
  submitted_at: string
  updated_at: string
  form_version?: number | null
  answers: AnswerOut[]
}

export interface ResponseWithUserOut extends ResponseOut {
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  faculty_name?: string | null
  career_name?: string | null
  group_display?: string | null
}

export interface ResponseCreate {
  answers: AnswerOut[]
  form_version?: number
}

// ── Notifications ─────────────────────────────────────────────────────────────
export interface NotificationOut {
  id: number
  user_id: number
  title: string
  message?: string | null
  is_read: boolean
  created_at: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_users: number
  pending_confirmation: number
  total_forms: number
  active_forms: number
  total_responses: number
}

export interface FormParticipation {
  form_id: number
  form_title: string
  total_audience: number
  total_responses: number
  participation_pct: number
}
