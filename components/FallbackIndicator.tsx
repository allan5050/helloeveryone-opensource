'use client'

import { useState } from 'react'
import { AlertTriangle, Database, X, RefreshCw } from 'lucide-react'

interface FallbackIndicatorProps {
  isActive: boolean
  onToggle?: () => void
  onRetry?: () => void
}

export default function FallbackIndicator({ isActive, onToggle, onRetry }: FallbackIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!isActive) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all ${isExpanded ? 'w-80' : 'w-auto'}`}>
      <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-600" />
            {isExpanded && (
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-900">Demo Mode Active</h4>
                <p className="mt-1 text-xs text-orange-700">
                  Using local backup data. Database connection unavailable.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1 rounded bg-orange-600 px-2 py-1 text-xs font-medium text-white hover:bg-orange-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry Connection
                    </button>
                  )}
                  {onToggle && (
                    <button
                      onClick={onToggle}
                      className="flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
                    >
                      <Database className="h-3 w-3" />
                      Toggle Mode
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 rounded p-1 hover:bg-orange-100"
          >
            {isExpanded ? (
              <X className="h-4 w-4 text-orange-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}