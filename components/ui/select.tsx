'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement>
  selectedLabel: string
  setSelectedLabel: (label: string) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

export function Select({ value = '', onValueChange = () => {}, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedLabel, setSelectedLabel] = React.useState('')
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <SelectContext.Provider value={{
      value,
      onValueChange,
      open,
      setOpen,
      triggerRef,
      selectedLabel,
      setSelectedLabel
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')

  return (
    <button
      ref={context.triggerRef}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => context.setOpen(!context.open)}
      type="button"
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export function SelectValue({ placeholder = 'Select...' }: { placeholder?: string }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within Select')

  return (
    <span className="block truncate">
      {context.selectedLabel || placeholder}
    </span>
  )
}

export function SelectContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectContent must be used within Select')

  // Store items for label lookup
  React.useEffect(() => {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.value === context.value) {
        context.setSelectedLabel(child.props.children)
      }
    })
  }, [context.value, children, context])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const dropdown = target.closest('.select-dropdown')
      const trigger = context.triggerRef.current

      if (!dropdown && trigger && !trigger.contains(target)) {
        context.setOpen(false)
      }
    }

    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [context.open, context])

  if (!context.open) return null

  return (
    <div className={`select-dropdown absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child as React.ReactElement<any>)
        }
        return child
      })}
    </div>
  )
}

export function SelectItem({
  value,
  className = '',
  children
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within Select')

  const isSelected = context.value === value

  const handleClick = () => {
    context.onValueChange(value)
    context.setSelectedLabel(children as string)
    context.setOpen(false)
  }

  return (
    <div
      className={`relative cursor-pointer select-none py-2 px-3 ${
        isSelected ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
      } hover:bg-gray-50 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}