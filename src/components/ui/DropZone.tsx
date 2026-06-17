import { useDropzone } from 'react-dropzone'
import { Upload, FileUp } from 'lucide-react'
import clsx from 'clsx'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: Record<string, string[]>
  multiple?: boolean
  maxSize?: number
  label?: string
  sublabel?: string
  className?: string
  disabled?: boolean
}

export default function DropZone({
  onFiles,
  accept,
  multiple = false,
  maxSize = 52428800, // 50MB
  label,
  sublabel,
  className,
  disabled,
}: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop: onFiles,
    accept,
    multiple,
    maxSize,
    disabled,
  })

  const hasRejections = fileRejections.length > 0

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer outline-none',
        {
          'border-gray-200 hover:border-gray-300 hover:bg-gray-50': !isDragActive && !hasRejections && !disabled,
          'border-primary-400 bg-primary-50': isDragActive && !isDragReject,
          'border-red-400 bg-red-50': isDragReject || hasRejections,
          'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60': disabled,
        },
        className,
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-3">
        <div
          className={clsx(
            'w-12 h-12 flex items-center justify-center rounded-xl transition-colors',
            isDragActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400',
          )}
        >
          {isDragActive ? (
            <FileUp className="w-6 h-6" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700">
            {isDragActive
              ? 'Drop files here'
              : label ?? 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
            {sublabel ?? `or click to browse — max ${Math.round(maxSize / 1024 / 1024)}MB`}
          </p>
        </div>

        {hasRejections && (
          <div className="text-xs text-red-600 mt-1">
            {fileRejections[0]?.errors[0]?.message ?? 'File rejected'}
          </div>
        )}
      </div>
    </div>
  )
}
