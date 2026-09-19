import { createContext, useContext, useRef, useState, useCallback } from 'react'

const QuickAddContext = createContext(null)

export function QuickAddProvider({ children }) {
  const [state, setState] = useState({ handler: null, label: 'Add' })
  const idRef = useRef(0)

  // Call inside a useEffect on the active page: setQuickAdd(fn, 'Add task')
  // Returns an unregister function to call in the effect's cleanup.
  const setQuickAdd = useCallback((fn, label = 'Add') => {
    const id = ++idRef.current
    setState({ handler: fn, label, id })
    return () => {
      setState((prev) => (prev.id === id ? { handler: null, label: 'Add', id: null } : prev))
    }
  }, [])

  const trigger = useCallback(() => {
    state.handler?.()
  }, [state.handler])

  return (
    <QuickAddContext.Provider value={{ setQuickAdd, trigger, hasHandler: !!state.handler, label: state.label }}>
      {children}
    </QuickAddContext.Provider>
  )
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext)
  if (!ctx) throw new Error('useQuickAdd must be used within QuickAddProvider')
  return ctx
}
