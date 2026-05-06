import { useState, useRef, useCallback } from 'react'
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadProfilePhoto, deleteProfilePhoto } from '../hooks/useApi'

export type ProfilePhotoUploaderProps = {
  userId: number
  currentPhoto?: string | null
  onUploadComplete?: (url: string) => void
  onDeleteComplete?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function ProfilePhotoUploader({
  userId,
  currentPhoto,
  onUploadComplete,
  onDeleteComplete,
  className = '',
  size = 'md',
  disabled = false,
}: ProfilePhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16 md:w-20 md:h-20 text-xs',
    md: 'w-24 h-24 md:w-32 md:h-32 text-sm',
    lg: 'w-20 h-20 md:w-28 md:h-28 text-base',
  }

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload an image (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      setError(null)
      setSuccess(null)

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload the file
      setIsUploading(true)
      try {
        const result = await uploadProfilePhoto(userId, file)
        setSuccess('Profile photo updated!')
        onUploadComplete?.(result.url)
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError('Failed to upload. Please try again.')
        setPreview(null)
      } finally {
        setIsUploading(false)
      }
    },
    [userId, onUploadComplete]
  )

  const handleClickUpload = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileChange(file)
      }
    },
    [handleFileChange, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(false)
  }, [disabled])

  const handleDelete = async () => {
    if (!currentPhoto || disabled) return
    
    try {
      await deleteProfilePhoto(userId)
      setPreview(null)
      onDeleteComplete?.()
      setSuccess('Profile photo removed!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to delete. Please try again.')
    }
  }

  const displayImage = preview || currentPhoto

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-4 border-slate-200
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : ''}
          ${error ? 'border-red-500' : ''}
          ${success ? 'border-green-500' : ''}
          transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-indigo-100
          ${!displayImage && !disabled ? 'cursor-pointer' : disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={displayImage ? undefined : handleClickUpload}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {displayImage ? (
          <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className={`${size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12 md:w-16 md:h-16' : 'w-12 h-12 md:w-16 md:h-16'} text-indigo-300`}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {(isDragging || !displayImage) && (
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center
              ${isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
              transition-opacity duration-300`}
          >
            <div className="text-center text-white">
              {isDragging ? (
                <>
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Drop your photo</p>
                </>
              ) : !displayImage ? (
                <>
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload photo</p>
                </>
              ) : null}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
          </div>
        )}
      </div>

      {displayImage && !isUploading && (
        <div className="flex items-center gap-1.5 mt-2">
          <button
            onClick={() => { if (!disabled) fileInputRef.current?.click() }}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full
                       hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Camera className="w-3 h-3" />
            Change
          </button>
          <button
            onClick={handleDelete}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 text-xs font-medium rounded-full
                       hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-red-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-2 flex items-center gap-1.5 text-green-600 text-xs">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}
