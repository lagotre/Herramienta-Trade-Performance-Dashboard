import { useApp } from '../../context/AppContext'
import type { HealthIssue, HealthSeverity } from '../../types'

const SEVERITY_CONFIG: Record<HealthSeverity, { label: string; dot: string; badge: string; border: string; bg: string }> = {
  blocking: { label: 'Bloqueante', dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700 border-red-200',    border: 'border-red-200', bg: 'bg-red-50'    },
  warning:  { label: 'Advertencia', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200', border: 'border-amber-200', bg: 'bg-amber-50' },
  info:     { label: 'Informativo', dot: 'bg-blue-400',  badge: 'bg-blue-100 text-blue-700 border-blue-200',  border: 'border-blue-200', bg: 'bg-blue-50'   },
}

function IssueCard({ issue }: { issue: HealthIssue }) {
  const cfg = SEVERITY_CONFIG[issue.severity]

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${cfg.dot}`} />
          <p className="font-semibold text-slate-800 text-sm">{issue.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
            {issue.count}
          </span>
        </div>
      </div>

      {issue.detail && (
        <p className="text-sm text-slate-600 ml-5 mb-2">{issue.detail}</p>
      )}

      {issue.sample && issue.sample.length > 0 && (
        <div className="ml-5 flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs text-slate-400 mr-1">Muestra:</span>
          {issue.sample.map(s => (
            <span key={s} className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
              {s}
            </span>
          ))}
        </div>
      )}

      {issue.suggestions && issue.suggestions.length > 0 && (
        <div className="ml-5 mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left font-semibold text-slate-500 px-3 py-2">En tu archivo</th>
                <th className="text-left font-semibold text-slate-500 px-3 py-2">Sugerencia canónica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issue.suggestions.map(s => (
                <tr key={s.original}>
                  <td className="px-3 py-2 font-mono text-red-600">{s.original}</td>
                  <td className="px-3 py-2 font-mono text-green-700">{s.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Step3Health() {
  const { goToStep, healthReport, mappedRows } = useApp()

  // ── No data loaded yet ────────────────────────────────────────────────────────
  if (!healthReport || !mappedRows) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900">Salud de datos</h1>
          <p className="text-slate-500 text-sm mt-1">Revisamos la calidad de tu archivo antes de calcular métricas.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M13 2L3 7V13C3 18.5 7.5 23.5 13 25C18.5 23.5 23 18.5 23 13V7L13 2Z" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <p className="font-semibold text-slate-600 mb-1">Sin datos cargados</p>
          <p className="text-slate-400 text-sm mb-4">Carga y mapea un archivo en el paso anterior para ver el análisis.</p>
          <button onClick={() => goToStep(2)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ir a carga de datos →
          </button>
        </div>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  const { totalRows, issueCount, blockingCount, issues } = healthReport
  const blocking = issues.filter(i => i.severity === 'blocking')
  const warnings = issues.filter(i => i.severity === 'warning')
  const infos    = issues.filter(i => i.severity === 'info')
  const hasBlocking = blockingCount > 0
  const isClean = issueCount === 0

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Salud de datos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Revisamos la calidad del archivo antes de calcular métricas.
        </p>
      </div>

      {/* Summary banner */}
      <div className={[
        'rounded-2xl border p-4 mb-6 flex items-center gap-4',
        isClean   ? 'bg-green-50 border-green-200' :
        hasBlocking ? 'bg-red-50 border-red-200' :
                    'bg-amber-50 border-amber-200',
      ].join(' ')}>
        <div className={[
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          isClean ? 'bg-green-100' : hasBlocking ? 'bg-red-100' : 'bg-amber-100',
        ].join(' ')}>
          {isClean ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 5.5V10C3 14.5 6.5 18.5 10 20C13.5 18.5 17 14.5 17 10V5.5L10 2Z" stroke="#16a34a" strokeWidth="1.5" fill="none" />
              <path d="M7 10L9 12L13 8" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke={hasBlocking ? '#ef4444' : '#d97706'} strokeWidth="1.5" fill="none" />
              <path d="M10 7V11" stroke={hasBlocking ? '#ef4444' : '#d97706'} strokeWidth="1.75" strokeLinecap="round" />
              <circle cx="10" cy="13.5" r="0.875" fill={hasBlocking ? '#ef4444' : '#d97706'} />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${isClean ? 'text-green-800' : hasBlocking ? 'text-red-800' : 'text-amber-800'}`}>
            {isClean
              ? 'Datos en perfecto estado'
              : hasBlocking
              ? `${blockingCount} problema(s) bloqueante(s) encontrado(s)`
              : `${issueCount} advertencia(s) — puedes continuar`}
          </p>
          <p className={`text-xs mt-0.5 ${isClean ? 'text-green-600' : hasBlocking ? 'text-red-600' : 'text-amber-600'}`}>
            {totalRows.toLocaleString('es-CO')} filas analizadas
            {issueCount > 0 && ` · ${issueCount} issue(s) detectado(s)`}
            {hasBlocking && ' · Resuelve los problemas bloqueantes antes de continuar'}
          </p>
        </div>
        {!hasBlocking && (
          <div className="flex items-center gap-1 shrink-0">
            {[
              { count: blocking.length, color: 'bg-red-400' },
              { count: warnings.length, color: 'bg-amber-400' },
              { count: infos.length,    color: 'bg-blue-400' },
            ].map(({ count, color }, i) => (
              <span key={i} className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${count > 0 ? color : 'bg-slate-200 text-slate-400'}`}>
                {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Issues list */}
      {issueCount > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {blocking.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Bloqueantes — deben resolverse
              </p>
              <div className="flex flex-col gap-2">
                {blocking.map(i => <IssueCard key={i.id} issue={i} />)}
              </div>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-2">
                Advertencias — puedes continuar
              </p>
              <div className="flex flex-col gap-2">
                {warnings.map(i => <IssueCard key={i.id} issue={i} />)}
              </div>
            </div>
          )}
          {infos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-2">
                Informativos
              </p>
              <div className="flex flex-col gap-2">
                {infos.map(i => <IssueCard key={i.id} issue={i} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6">
        {(['blocking', 'warning', 'info'] as HealthSeverity[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${SEVERITY_CONFIG[s].dot}`} />
            <span className="text-xs text-slate-500">{SEVERITY_CONFIG[s].label}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={() => goToStep(2)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Atrás
        </button>
        <button
          onClick={() => goToStep(4)}
          disabled={hasBlocking}
          className={[
            'flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm',
            hasBlocking
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white',
          ].join(' ')}
        >
          {isClean ? 'Ver resumen ejecutivo' : hasBlocking ? 'Corrige errores primero' : 'Continuar con advertencias'}
          {!hasBlocking && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
      </div>
    </div>
  )
}
