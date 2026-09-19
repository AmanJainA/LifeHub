export function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-accent text-onaccent hover:brightness-110 font-semibold',
    ghost: 'bg-transparent text-text border border-border hover:bg-surface-2',
    teal: 'bg-teal text-onaccent hover:brightness-110 font-semibold',
    danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
    subtle: 'bg-surface-2 text-text hover:bg-surface-3',
  }
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-muted mb-1">{label}</span>}
      <input
        className={`w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-muted/60 focus:border-accent outline-none ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-muted mb-1">{label}</span>}
      <select
        className={`w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text focus:border-accent outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-muted mb-1">{label}</span>}
      <textarea
        className={`w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-muted/60 focus:border-accent outline-none ${className}`}
        {...props}
      />
    </label>
  )
}

export function Pill({ children, tone = 'muted' }) {
  const tones = {
    muted: 'bg-surface-3 text-muted',
    accent: 'bg-accent/15 text-accent',
    teal: 'bg-teal/15 text-teal',
    danger: 'bg-danger/15 text-danger',
    success: 'bg-success/15 text-success',
  }
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto mb-0 sm:mb-0 animate-[fadeIn_0.15s_ease-out]`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-text w-8 h-8 rounded-full hover:bg-surface-2">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="text-3xl mb-3 opacity-70">{icon}</div>
      <p className="font-display text-base font-semibold">{title}</p>
      {subtitle && <p className="text-sm text-muted mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-14">
      <div className="w-6 h-6 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
    </div>
  )
}
