'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/contexts/AuthContext'

interface PhotoUploadProps {
  currentPhotoUrl?: string
  onPhotoChange: (url: string | null) => void
  className?: string
}

export function PhotoUpload({
  currentPhotoUrl,
  onPhotoChange,
  className = '',
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { user } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image under 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = e => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    if (!user) return

    setIsUploading(true)
    try {
      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      onPhotoChange(data.publicUrl)
      setPreviewUrl(null)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removePhoto = async () => {
    if (!currentPhotoUrl || !user) return

    setIsUploading(true)
    try {
      const oldPath = currentPhotoUrl.split('/').pop()
      if (oldPath) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${oldPath}`])
      }
      onPhotoChange(null)
    } catch (error) {
      console.error('Error removing photo:', error)
      alert('Failed to remove photo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const displayUrl = previewUrl || currentPhotoUrl

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="text-lg font-medium text-gray-900">Profile Photo</label>

      <div className="flex flex-col items-center space-y-4">
        {/* Photo Display */}
        <div className="relative h-32 w-32 sm:h-40 sm:w-40">
          {displayUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={displayUrl}
                alt="Profile photo"
                fill
                sizes="(max-width: 640px) 8rem, 10rem"
                className="rounded-full border-4 border-gray-200 object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-dashed border-gray-300 bg-gray-50">
              <div className="text-center">
                <svg
                  className="mx-auto mb-2 h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="text-sm text-gray-500">Add Photo</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
          </button>

          {currentPhotoUrl && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={isUploading}
              className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <p className="max-w-xs text-center text-xs text-gray-500">
          Upload a clear photo of yourself. Max file size: 5MB. Supported
          formats: JPG, PNG, WebP
        </p>
      </div>
    </div>
  )
}
