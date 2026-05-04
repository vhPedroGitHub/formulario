import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  Tag,
  LogOut,
  BookOpen,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Panel' },
  { to: '/admin/forms', icon: FileText, label: 'Formularios' },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/academic', icon: GraduationCap, label: 'Académico' },
  { to: '/admin/special-roles', icon: Tag, label: 'Roles Especiales' },
]

const userLinks = [
  { to: '/dashboard', icon: BookOpen, label: 'Mis Formularios' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const links = isAdmin ? adminLinks : userLinks

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <aside className="flex flex-col w-60 bg-white border-r border-gray-200 h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="size-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">UniForm</span>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <Icon className="size-4" />
            {label}
            <ChevronRight className="size-3 ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
          {user?.role === 'admin' && (
            <span className="mt-1 inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:flex md:shrink-0 md:min-h-screen">
        <SidebarContent />
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="relative z-50 flex min-h-full">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
