import { FileText, Image, X, Download, CheckCircle2, Loader2 } from 'lucide-react'
import { formatFileSize } from '../../lib/validation'
import clsx from 'clsx'

interface FileItemProps {
  name: string
  size: number
  processedSize?: number
  status?: 'pending' | 'processing' | 'done' | 'error'
  errorMessage?: string
  downloadUrl?: string
  downloadName?: string
  onRemove?: () => void
  preview?: string
  type?: 'pdf' | 'image' | 'generic'
  index?: number
}

export default function FileItem({
  name,
  size,
  processedSize,
  status = 'pending',
  errorMessage,
  downloadUrl,
  downloadName,
  onRemove,
  preview,
  type = 'generic',
  index,
}: FileItemProps) {
  const savings =
    processedSize && processedSize < size
      ? Math.round(((size - processedSize) / size) * 100)
      : 0

  return (
    <div
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        status === 'done' && 'bg-emerald-50 border-emerald-200',
        status === 'error' && 'bg-red-50 border-red-200',
        status === 'processing' && 'bg-blue-50 border-blue-200',
        status === 'pending' && 'bg-gray-50 border-gray-200',
      )}
    >
      {/* Thumbnail or icon */}
      <div className="shrink-0">
        {preview && type === 'image' ? (
          <img
            src={preview}
            alt={name}
            className="w-10 h-10 object-cover rounded border border-gray-200"
          />
        ) : (
          <div
            className={clsx(
              'w-10 h-10 flex items-center justify-center rounded-lg',
              type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400',
            )}
          >
            {type === 'pdf' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Image className="w-5 h-5" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="text-xs font-mono text-gray-400 shrink-0">{index}.</span>
          )}
          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{formatFileSize(size)}</span>
          {processedSize && processedSize < size && (
            <>
              <span className="text-xs text-gray-300">→</span>
              <span className="text-xs text-gray-700 font-medium">{formatFileSize(processedSize)}</span>
              <span className="text-xs font-semibold text-emerald-600">-{savings}%</span>
            </>
          )}
          {errorMessage && (
            <span className="text-xs text-red-600 truncate">{errorMessage}</span>
          )}
        </div>
      </div>

      {/* Status / actions */}
      <div className="shrink-0 flex items-center gap-2">
        {status === 'processing' && (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        )}
        {status === 'done' && downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName ?? name}
            className="flex items-center justify-center w-7 h-7 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            aria-label={`Download ${name}`}
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}
        {status === 'done' && !downloadUrl && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
        {onRemove && status !== 'processing' && (
          <button
            onClick={onRemove}
            className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            aria-label={`Remove ${name}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
