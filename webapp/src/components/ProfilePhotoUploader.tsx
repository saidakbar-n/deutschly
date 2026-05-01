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
}

export function ProfilePhotoUploader({
  userId,
  currentPhoto,
  onUploadComplete,
  onDeleteComplete,
  className = '',
  size = 'md',
}: ProfilePhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-20 h-20 text-xs',
    md: 'w-32 h-32 text-sm',
    lg: 'w-48 h-48 text-base',
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
    fileInputRef.current?.click()
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileChange(file)
      }
    },
    [handleFileChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDelete = async () => {
    if (!currentPhoto) return
    
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
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Upload input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      {/* Photo container */}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-4 border-slate-200  
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : ''}
          ${error ? 'border-red-500' : ''}
          ${success ? 'border-green-500' : ''}
          transition-all duration-300 cursor-pointer shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-indigo-100`}
        onClick={handleClickUpload}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Image display */}
        {displayImage ? (
          <img
            src={displayImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Camera className={`w-${size === 'sm' ? '8' : size === 'md' ? '12' : '16'} h-${size === 'sm' ? '8' : size === 'md' ? '12' : '16'} mx-auto mb-2`} />
              <p className="font-medium text-slate-500">
                {size === 'lg' ? 'Upload Photo' : 'Add'}
              </p>
            </div>
          </div>
        )}

        {/* Overlay for hover/drag state */}
        {(isDragging || !displayImage) && (
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center 
              ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
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

        {/* Delete button (when photo exists) */}
        {displayImage && !isDragging && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full 
                      flex items-center justify-center shadow-lg hover:bg-white 
                      transition-colors text-slate-600 hover:text-red-500"
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Upload button overlay (when photo exists) */}
        {displayImage && !isDragging && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 rounded-full 
                      flex items-center justify-center shadow-lg hover:bg-indigo-700 
                      transition-colors text-white"
            title="Change photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        {/* Loading indicator */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
          </div>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}
