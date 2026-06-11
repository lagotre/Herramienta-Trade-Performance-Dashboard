import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { parseFile, autoDetectMapping, applyMapping, sampleValues } from '../../lib/parser'
import { runHealthChecks } from '../../lib/healthCheck'
import { CANONICAL_FIELDS } from '../../types'
import type { ParseResult, ColumnMapping } from '../../types'

type Stage = 'idle' | 'parsing' | 'mapping' | 'error'

const ACCEPTED_EXTS = ['xlsx', 'xls', 'csv']

// ─── Column mapping table ──────────────────────────────────────────────────────

function MappingTable({
  parseResult,
  mapping,
  onChange,
}: {
  parseResult: ParseResult
  mapping: ColumnMapping
  onChange: (m: ColumnMapping) => void
}) {
  const { headers, rows } = parseResult
  const NONE = '__none__'

  const set = (key: keyof ColumnMapping, val: string) =>
    onChange({ ...mapping, [key]: val === NONE ? undefined : val })

  const required = CANONICAL_FIELDS.filter(f => f.required)
  const optional = CANONICAL_FIELDS.filter(f => !f.required)

  const renderRow = (f: typeof CANONICAL_FIELDS[number]) => {
    const current = mapping[f.key] ?? NONE
    const preview = current !== NONE ? sampleValues(rows, current) : []

    return (
      <tr key={f.key} className="border-b border-slate-100 last:border-0">
        <td className="py-3 pr-4 w-40">
          <span className="text-sm font-medium text-slate-700">{f.label}</span>
          {f.required && <span className="text-red-500 ml-1 text-xs">*</span>}
        </td>
        <td className="py-3 pr-4 w-56">
          <select
            value={current}
            onChange={e => set(f.key, e.target.value)}
            className={[
              'w-full rounded-lg border text-sm px-3 py-2 outline-none transition-colors',
              current !== NONE
                ? 'border-blue-300 bg-blue-50 text-slate-800 focus:border-blue-500'
                : f.required
                ? 'border-red-200 bg-red-50 text-slate-500'
                : 'border-slate-200 bg-slate-50 text-slate-400',
            ].join(' ')}
          >
            <option value={NONE}>{f.required ? '— seleccionar —' : 'No incluido'}</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </td>
        <td className="py-3">
          {preview.length > 0 ? (
            <span className="text-xs text-slate-400 font-mono">
              {preview.join(' · ')}
            </span>
          ) : (
            <span className="text-xs text-slate-300 italic">sin muestra</span>
          )}
        </td>
      </tr>
    )
  }

  const missingRequired = required.filter(f => !mapping[f.key])

  return (
    <div>
      {missingRequired.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="#ef4444" strokeWidth="1.25" fill="none" />
            <path d="M8 5V8.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.75" fill="#ef4444" />
          </svg>
          <p className="text-xs text-red-700">
            Falta mapear:{' '}
            <strong>{missingRequired.map(f => f.label).join(', ')}</strong>
          </p>
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm bg-white">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">Campo interno</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 pr-4">Columna en tu archivo</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 pr-4">Valores de muestra</th>
            </tr>
          </thead>
          <tbody className="divide-y-0">
            <tr className="bg-slate-50/60">
              <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Campos requeridos
              </td>
            </tr>
            {required.map(renderRow)}
            <tr className="bg-slate-50/60">
              <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-200">
                Campos opcionales
              </td>
            </tr>
            {optional.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Step2Upload() {
  const { goToStep, setAnalysisData } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [errorMsg, setErrorMsg] = useState('')

  const processFile = async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ACCEPTED_EXTS.includes(ext)) {
      setErrorMsg(`Formato no admitido (.${ext}). Usa .xlsx, .xls o .csv.`)
      setStage('error')
      return
    }
    setFile(f)
    setStage('parsing')
    setErrorMsg('')
    try {
      const result = await parseFile(f)
      if (result.totalRows === 0) throw new Error('El archivo no contiene filas de datos.')
      const detected = autoDetectMapping(result.headers)
      setParseResult(result)
      setMapping(detected)
      setStage('mapping')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al leer el archivo.')
      setStage('error')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  const handleConfirmMapping = () => {
    if (!parseResult) return
    const requiredMissing = CANONICAL_FIELDS.filter(f => f.required && !mapping[f.key])
    if (requiredMissing.length > 0) return
    const rows = applyMapping(parseResult.rows, mapping)
    const report = runHealthChecks(rows, mapping)
    setAnalysisData(rows, report)
    goToStep(3)
  }

  const resetToIdle = () => {
    setStage('idle')
    setFile(null)
    setParseResult(null)
    setMapping({})
    setErrorMsg('')
  }

  const requiredMapped = CANONICAL_FIELDS.filter(f => f.required && mapping[f.key]).length
  const requiredTotal = CANONICAL_FIELDS.filter(f => f.required).length
  const allRequiredMapped = requiredMapped === requiredTotal

  // ── IDLE / ERROR ─────────────────────────────────────────────────────────────
  if (stage === 'idle' || stage === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900">Carga de datos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Sube tu archivo de ventas en Excel o CSV. Detectaremos las columnas automáticamente.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          onChange={handleInputChange}
          aria-label="Seleccionar archivo de ventas"
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          className={[
            'rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all mb-4 outline-none select-none',
            dragActive ? 'border-blue-500 bg-blue-50' :
            stage === 'error' ? 'border-red-300 bg-red-50 hover:border-red-400' :
            'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50',
          ].join(' ')}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${stage === 'error' ? 'bg-red-100' : 'bg-blue-50'}`}>
            {stage === 'error' ? (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="11" stroke="#ef4444" strokeWidth="1.75" fill="none" />
                <path d="M14 9V15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="14" cy="19.5" r="1.25" fill="#ef4444" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 18V6M9 11L14 6L19 11M5 22H23" stroke={dragActive ? '#2563eb' : '#3b82f6'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {stage === 'error' ? (
            <>
              <p className="font-semibold text-red-600 mb-1">Error al leer el archivo</p>
              <p className="text-red-500 text-sm mb-3">{errorMsg}</p>
              <span className="text-xs text-red-400">Haz clic para intentar con otro archivo</span>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-700 mb-1">
                {dragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
              </p>
              <p className="text-slate-400 text-sm mb-4">
                o{' '}
                <span className="text-blue-600 font-medium underline underline-offset-2">
                  haz clic para buscar en tu computador
                </span>
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                Formatos admitidos: .xlsx, .xls, .csv
              </span>
            </>
          )}
        </div>

        {/* Demo button */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 shrink-0">o prueba con</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <button className="flex items-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors w-full justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" fill="none" />
              <path d="M6 8L8 10L11 6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Cargar datos de ejemplo (Angel Moda Jeans)
          </button>
          <p className="text-xs text-slate-400 text-center">
            Dataset sintético · ~12 SKUs · 5 canales · 3 meses · incluye filas sucias
          </p>
        </div>

        <div className="flex justify-between">
          <button onClick={() => goToStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Atrás
          </button>
          <button disabled className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed">
            Continuar
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    )
  }

  // ── PARSING ──────────────────────────────────────────────────────────────────
  if (stage === 'parsing') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col items-center justify-center min-h-80">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10" stroke="#dbeafe" strokeWidth="3" />
            <path d="M14 4a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700 mb-1">Leyendo archivo…</p>
        <p className="text-slate-400 text-sm">{file?.name}</p>
      </div>
    )
  }

  // ── MAPPING ──────────────────────────────────────────────────────────────────
  if (stage === 'mapping' && parseResult) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mapeo de columnas</h1>
            <p className="text-slate-500 text-sm mt-1">
              Detectamos las columnas automáticamente. Revisa y ajusta si es necesario.
            </p>
          </div>
          <button onClick={resetToIdle} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 shrink-0 mt-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Cambiar archivo
          </button>
        </div>

        {/* File badge */}
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="1" width="14" height="16" rx="2" stroke="#16a34a" strokeWidth="1.25" fill="none" />
            <path d="M5 9L8 12L13 7" stroke="#16a34a" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">{parseResult.fileName}</p>
            <p className="text-xs text-green-600">
              {parseResult.totalRows.toLocaleString('es-CO')} filas · {parseResult.headers.length} columnas detectadas
            </p>
          </div>
          <span className="shrink-0 text-xs text-green-600 bg-green-100 px-2.5 py-1 rounded-full font-medium">
            {requiredMapped}/{requiredTotal} requeridos
          </span>
        </div>

        {/* Mapping table */}
        <MappingTable parseResult={parseResult} mapping={mapping} onChange={setMapping} />

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <button onClick={resetToIdle} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Cambiar archivo
          </button>
          <button
            onClick={handleConfirmMapping}
            disabled={!allRequiredMapped}
            className={[
              'flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm',
              allRequiredMapped
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            ].join(' ')}
          >
            Analizar datos
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    )
  }

  return null
}
