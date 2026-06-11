import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { runInsights } from '../../lib/insights'
import type { Insight } from '../../lib/insights'

const SEV_CONFIG = {
  alta:  { badge: 'bg-red-100 text-red-700 border-red-200',   dot: 'bg-red-500',   label: 'Alta' },
  media: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Media' },
  baja:  { badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400',  label: 'Baja' },
}

function InsightCard({ ins }: { ins: Insight }) {
  const cfg = SEV_CONFIG[ins.severity]
  const skipped = !!ins.skipped

  return (
    <div className={`rounded-xl border p-4 ${skipped ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${skipped ? 'bg-slate-300' : cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={`text-sm font-semibold ${skipped ? 'text-slate-400' : 'text-slate-800'}`}>{ins.title}</p>
            {!skipped && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label}
              </span>
            )}
            {skipped && (
              <span className="text-xs text-slate-400 italic">(sin datos suficientes)</span>
            )}
          </div>

          <p className={`text-sm mb-2 ${skipped ? 'text-slate-400' : 'text-slate-600'}`}>{ins.finding}</p>

          {!skipped && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                <path d="M7 2L2 4.5V7C2 10 4.5 12.5 7 13.5C9.5 12.5 12 10 12 7V4.5L7 2Z"
                  stroke="#2563eb" strokeWidth="1.25" fill="none" />
                <path d="M5 7L6.5 8.5L9 5.5" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs text-blue-700">{ins.action}</p>
            </div>
          )}

          {ins.data && ins.data.length > 0 && !skipped && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ins.data.slice(0, 6).map(d => (
                <span key={d} className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                  {d}
                </span>
              ))}
              {ins.data.length > 6 && (
                <span className="text-xs text-slate-400">+{ins.data.length - 6} más</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Step6Findings() {
  const { goToStep, mappedRows } = useApp()

  const insights = useMemo(() => mappedRows ? runInsights(mappedRows) : [], [mappedRows])

  if (!mappedRows) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="font-semibold text-slate-600 mb-1">Sin datos cargados</p>
          <p className="text-slate-400 text-sm mb-4">Los hallazgos se calculan automáticamente cuando cargas datos.</p>
          <button onClick={() => goToStep(2)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ir a carga de datos →
          </button>
        </div>
      </div>
    )
  }

  const active   = insights.filter(i => !i.skipped)
  const skipped  = insights.filter(i => !!i.skipped)
  const altas    = active.filter(i => i.severity === 'alta')
  const medias   = active.filter(i => i.severity === 'media')
  const bajas    = active.filter(i => i.severity === 'baja')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

      <div>
        <h1 className="text-xl font-bold text-slate-900">Hallazgos detectados</h1>
        <p className="text-slate-500 text-sm mt-1">
          {active.length} hallazgo(s) calculado(s) a partir de {insights.length} reglas · ordenados por severidad
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {altas.length > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            {altas.length} prioridad alta
          </div>
        )}
        {medias.length > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            {medias.length} prioridad media
          </div>
        )}
        {bajas.length > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            {bajas.length} prioridad baja
          </div>
        )}
      </div>

      {/* Insights */}
      {altas.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Prioridad alta — acción inmediata</p>
          {altas.map(i => <InsightCard key={i.id} ins={i} />)}
        </div>
      )}

      {medias.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Prioridad media — planificar</p>
          {medias.map(i => <InsightCard key={i.id} ins={i} />)}
        </div>
      )}

      {bajas.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Prioridad baja — monitoreo</p>
          {bajas.map(i => <InsightCard key={i.id} ins={i} />)}
        </div>
      )}

      {skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reglas sin datos suficientes</p>
          {skipped.map(i => <InsightCard key={i.id} ins={i} />)}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={() => goToStep(5)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Atrás
        </button>
        <button onClick={() => goToStep(7)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm">
          Exportar informe
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  )
}
