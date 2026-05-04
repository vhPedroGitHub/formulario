import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { clsx } from 'clsx'

type Variant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  variant?: Variant
  title?: string
  children: React.ReactNode
  className?: string
}

const config: Record<Variant, { icon: React.ElementType; classes: string }> = {
  error: { icon: XCircle, classes: 'bg-red-50 border-red-200 text-red-800' },
  success: { icon: CheckCircle, classes: 'bg-green-50 border-green-200 text-green-800' },
  warning: { icon: AlertCircle, classes: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  info: { icon: Info, classes: 'bg-blue-50 border-blue-200 text-blue-800' },
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { icon: Icon, classes } = config[variant]
  return (
    <div className={clsx('flex gap-3 rounded-lg border p-4 text-sm', classes, className)}>
      <Icon className="size-5 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
