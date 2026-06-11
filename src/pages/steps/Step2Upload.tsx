import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'

type FileStatus = 'idle' | 'ready' | 'error'

const ACCEPTED_EXTS = ['xlsx', 'xls', 'csv']

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Step2Upload() {
  const { goToStep } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<FileStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const processFile = (f: File | null) => {
    if (!f) return
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ACCEPTED_EXTS.includes(ext)) {
      setStatus('error')
      setErrorMsg(`Formato no admitido (.${ext}). Usa .xlsx, .xls o .csv.`)
      setFile(null)
      return
    }
    setFile(f)
    setStatus('ready')
    setErrorMsg('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0] ?? null)
    // reset so the same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    processFile(e.dataTransfer.files?.[0] ?? null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => setDragActive(false)

  const clearFile = () => {
    setFile(null)
    setStatus('idle')
    setErrorMsg('')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900">Carga de datos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Sube tu archivo de ventas en Excel o CSV. Luego mapearás las columnas al esquema de
          análisis.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Seleccionar archivo de ventas"
      />

      {/* Upload zone */}
      {status !== 'ready' ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            'rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all mb-4 outline-none',
            dragActive
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : status === 'error'
              ? 'border-red-300 bg-red-50 hover:border-red-400'
              : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50',
          ].join(' ')}
        >
          <div
            className={[
              'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors',
              dragActive
                ? 'bg-blue-100'
                : status === 'error'
                ? 'bg-red-100'
                : 'bg-blue-50',
            ].join(' ')}
          >
            {status === 'error' ? (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="11" stroke="#ef4444" strokeWidth="1.75" fill="none" />
                <path d="M14 9V15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="14" cy="19" r="1" fill="#ef4444" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path
                  d="M14 18V6M9 11L14 6L19 11M5 22H23"
                  stroke={dragActive ? '#2563eb' : '#3b82f6'}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {status === 'error' ? (
            <>
              <p className="font-semibold text-red-600 mb-1">Formato no admitido</p>
              <p className="text-red-500 text-sm mb-3">{errorMsg}</p>
              <span className="text-xs text-red-400">Haz clic para intentar con otro archivo</span>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-700 mb-1">
                {dragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
              </p>
              <p className="text-slate-400 text-sm mb-4">
                o <span className="text-blue-600 font-medium underline underline-offset-2">haz clic para buscar en tu computador</span>
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                Formatos admitidos: .xlsx, .xls, .csv
              </span>
            </>
          )}
        </div>
      ) : (
        /* File ready state */
        <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-5 mb-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="3" y="2" width="16" height="18" rx="2" stroke="#16a34a" strokeWidth="1.5" fill="none" />
              <path d="M7 11L10 14L15 9" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-green-800 text-sm truncate">{file?.name}</p>
            <p className="text-green-600 text-xs mt-0.5">{formatSize(file?.size ?? 0)} · listo para procesar</p>
          </div>
          <button
            onClick={clearFile}
            className="shrink-0 text-green-600 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
            title="Quitar archivo"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Demo data button */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 shrink-0">o prueba con</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <button className="flex items-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors w-full justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" fill="none" />
            <path d="M6 8L8 10L11 6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cargar datos de ejemplo (Angel Moda Jeans)
        </button>
        <p className="text-xs text-slate-400 text-center">
          Dataset sintético · ~12 SKUs · 5 canales · 3 meses · incluye filas sucias para ver el
          tablero de salud de datos
        </p>
      </div>

      {/* Column mapping note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="7" stroke="#d97706" strokeWidth="1.25" fill="none" />
          <path d="M9 5.5V9.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="12" r="0.75" fill="#d97706" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-900">Mapeo de columnas — Fase 1</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Tras cargar el archivo, podrás asignar cada columna de tu Excel al esquema interno de
            la herramienta. La detección es automática por nombre de columna.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => goToStep(1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atrás
        </button>
        <button
          onClick={() => goToStep(3)}
          disabled={status !== 'ready'}
          className={[
            'flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm',
            status === 'ready'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed',
          ].join(' ')}
        >
          Continuar
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
