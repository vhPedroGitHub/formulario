export function Spinner({ className = 'size-6' }: { className?: string }) {
  return (
    <span
      className={`inline-block border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Spinner className="size-8" />
    </div>
  )
}
