import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileUp, ClipboardPaste } from 'lucide-react'
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

function matchesAccept(file: File, accept?: Record<string, string[]>): boolean {
  if (!accept) return true
  const name = file.name.toLowerCase()
  return Object.entries(accept).some(([mime, exts]) => {
    const mimeOk = mime.endsWith('/*') ? file.type.startsWith(mime.slice(0, -1)) : file.type === mime
    return mimeOk || exts.some(ext => name.endsWith(ext.toLowerCase()))
  })
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
  const [pasted, setPasted] = useState(false)

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop: onFiles,
    accept,
    multiple,
    maxSize,
    disabled,
  })

  // Ctrl/Cmd+V pastes files straight from the clipboard (e.g. a screenshot)
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const files = Array.from(e.clipboardData?.files ?? []).filter(
        f => f.size <= maxSize && matchesAccept(f, accept),
      )
      if (files.length === 0) return
      e.preventDefault()
      onFiles(multiple ? files : files.slice(0, 1))
      setPasted(true)
      window.setTimeout(() => setPasted(false), 700)
    },
    [accept, maxSize, multiple, onFiles],
  )

  useEffect(() => {
    if (disabled) return
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [disabled, handlePaste])

  const hasRejections = fileRejections.length > 0
  const dragging = isDragActive && !isDragReject

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'group relative border-2 rounded-xl p-10 text-center cursor-pointer outline-none transition-all duration-300',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        {
          'border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/40':
            !isDragActive && !hasRejections && !disabled && !pasted,
          'border-transparent bg-primary-50 scale-[1.01] dz-ants': dragging,
          'border-dashed border-red-400 bg-red-50': isDragReject || hasRejections,
          'border-emerald-400 bg-emerald-50 scale-[1.01]': pasted,
          'border-dashed border-gray-100 bg-gray-50 cursor-not-allowed opacity-60': disabled,
        },
        className,
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {dragging && <span className="absolute inset-0 rounded-xl bg-primary-400/40 animate-ping" />}
          <div
            className={clsx(
              'relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300',
              dragging
                ? 'bg-primary-600 text-white scale-110 -rotate-6 shadow-lg shadow-primary-600/30'
                : 'bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600 group-hover:-translate-y-1',
            )}
          >
            {dragging ? <FileUp className="w-6 h-6 animate-pop" /> : <Upload className="w-6 h-6" />}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700">
            {dragging ? 'Drop to start' : label ?? 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
            {sublabel ?? `or click to browse — max ${Math.round(maxSize / 1024 / 1024)}MB`}
          </p>
        </div>

        {!disabled && !hasRejections && !isDragActive && (
          <p className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ClipboardPaste className="w-3 h-3" />
            or paste with <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-white font-mono text-[10px]">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-white font-mono text-[10px]">V</kbd>
          </p>
        )}

        {hasRejections && (
          <div className="text-xs text-red-600 mt-1 animate-slide-up">
            {fileRejections[0]?.errors[0]?.message ?? 'File rejected'}
          </div>
        )}
      </div>
    </div>
  )
}
