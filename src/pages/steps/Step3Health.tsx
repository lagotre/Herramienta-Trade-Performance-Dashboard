import { useApp } from '../../context/AppContext'

const CHECKS_PREVIEW = [
  { label: 'SKUs sin categoría', count: '—', severity: 'warning' },
  { label: 'Filas duplicadas', count: '—', severity: 'warning' },
  { label: 'Canales mal escritos', count: '—', severity: 'warning' },
  { label: 'Fechas no parseables', count: '—', severity: 'blocking' },
  { label: 'Ventas negativas o vacías', count: '—', severity: 'blocking' },
  { label: 'Categorías sin margen', count: '—', severity: 'info' },
]

export default function Step3Health() {
  const { goToStep } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900">Salud de datos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Revisamos la calidad de tu archivo antes de calcular métricas. Puedes continuar con advertencias; los errores bloqueantes deben resolverse.
        </p>
      </div>

      {/* Empty state — no data loaded yet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Verificaciones</h2>
          <span className="text-xs text-slate-400">Sin datos cargados</span>
        </div>
        <div className="divide-y divide-slate-100">
          {CHECKS_PREVIEW.map(check => (
            <div key={check.label} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={[
                  'w-2 h-2 rounded-full',
                  check.severity === 'blocking' ? 'bg-slate-300' :
                  check.severity === 'warning' ? 'bg-slate-300' : 'bg-slate-200',
                ].join(' ')} />
                <span className="text-sm text-slate-500">{check.label}</span>
              </div>
              <span className="text-xs font-mono text-slate-300">{check.count}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Carga un archivo en el paso anterior para ver los resultados de validación.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6">
        {[
          { color: 'bg-red-400', label: 'Bloqueante' },
          { color: 'bg-amber-400', label: 'Advertencia' },
          { color: 'bg-blue-400', label: 'Informativo' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => goToStep(2)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atrás
        </button>
        <button
          onClick={() => goToStep(4)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Continuar al dashboard
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
