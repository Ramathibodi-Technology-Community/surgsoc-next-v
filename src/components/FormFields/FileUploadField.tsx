'use client'

import { useState, useRef } from 'react'

interface FileUploadFieldProps {
  label: string
  accept?: string // e.g., "image/*", ".pdf,.doc"
  maxSize?: number // in MB
  value?: string // URL or file ID
  onChange: (fileUrl: string) => void
  required?: boolean
}

export default function FileUploadField({
  label,
  accept,
  maxSize = 10,
  value,
  onChange,
  required
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setError(null)
    setUploading(true)

    try {
      // In a real implementation, we would upload to Payload media collection here.
      // For this prototype/MVP, we'll create a blob URL just to show it works visually.
      // In Phase 3 or later, we should implement the actual upload endpoint.

      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create mock URL
      const mockUrl = URL.createObjectURL(file)
      onChange(mockUrl)
    } catch (err) {
      console.error('File upload error:', err)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <label className="block text-base-9 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          error ? 'border-red-500 bg-red-500/5' : 'border-base-3 hover:border-primary-1 bg-base-2'
        }`}
      >
        {value ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>File uploaded successfully</span>
            </div>

            {/* Preview if image */}
            {value.startsWith('blob:') && (
                <div className="mt-2 text-xs text-base-5 truncate max-w-xs mx-auto">
                    {/* We can't easily see the filename from blob URL, but it's fine for now */}
                    Preview not available
                </div>
            )}

            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-500 hover:text-red-600 hover:underline font-medium"
            >
              Remove File
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary-1 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-base-6 text-sm">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-base-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <label
                  htmlFor={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
                  className="cursor-pointer px-4 py-2 bg-primary-1 text-white rounded-lg hover:bg-primary-2 transition-colors font-medium shadow-sm"
                >
                  Choose File
                </label>
                <p className="text-xs text-base-5 mt-1">
                  Supported formats: {accept || 'All files'} (Max: {maxSize}MB)
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
