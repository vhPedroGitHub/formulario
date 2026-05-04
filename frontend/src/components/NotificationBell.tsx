import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { clsx } from 'clsx'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 30_000,
  })

  const unread = notifications.filter((n) => !n.is_read).length

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 size-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-medium">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm text-gray-900">Notificaciones</h3>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Sin notificaciones</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={clsx(
                      'px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors',
                      !n.is_read && 'bg-indigo-50/50'
                    )}
                    onClick={() => !n.is_read && markRead.mutate(n.id)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="size-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      )}
                      <div className={clsx(!n.is_read ? '' : 'ml-4')}>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
