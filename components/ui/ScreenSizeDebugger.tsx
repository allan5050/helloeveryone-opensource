'use client'

import { useEffect, useState } from 'react'

import { useIsMobile } from '@/hooks/useIsMobile'

export default function ScreenSizeDebugger() {
  const isMobile = useIsMobile()
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)

    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed left-0 top-0 z-[100] rounded-br-lg bg-black bg-opacity-75 p-2 text-xs text-white">
      <div>
        Size: {screenSize.width}x{screenSize.height}
      </div>
      <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
      <div className="block sm:hidden">Mobile Nav: ✅</div>
      <div className="hidden sm:block">Desktop View: ✅</div>
    </div>
  )
}
