'use client'

import { useState } from 'react'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt: string
  fallbackText: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({
  src,
  alt,
  fallbackText,
  className = '',
  size = 'md'
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'h-16 w-16 text-xl',
    md: 'h-24 w-24 text-2xl',
    lg: 'h-32 w-32 text-3xl'
  }

  const getSizes = () => {
    switch (size) {
      case 'sm': return '64px'
      case 'md': return '96px'
      case 'lg': return '128px'
      default: return '96px'
    }
  }

  // Check if URL is an SVG (like dicebear avatars) - use unoptimized for these
  const isSvgUrl = src && (src.includes('.svg') || src.includes('dicebear.com'))

  return (
    <div className={`relative overflow-hidden rounded-full bg-gray-100 ${sizeClasses[size]} ${className}`}>
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={getSizes()}
          unoptimized={isSvgUrl}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 font-bold text-white">
          {fallbackText.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}