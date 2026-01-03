import { useCallback } from 'react'

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Simple console-based toast implementation
    // In a full implementation, this would show a toast notification UI
    if (options.variant === 'destructive') {
      console.error(`[Toast Error] ${options.title}: ${options.description}`)
    } else {
      console.log(`[Toast] ${options.title}: ${options.description}`)
    }
  }, [])

  return { toast }
}
