import { useApp } from '../../context/AppContext'

const KPI_CARDS = [
  { label: 'Ventas totales', value: '—', sub: 'Sin datos', color: 'blue' },
  { label: 'Unidades vendidas', value: '—', sub: 'Sin datos', color: 'indigo' },
  { label: 'Margen bruto', value: '—', sub: 'Requiere columna margen', color: 'emerald' },
  { label: 'Crecimiento', value: '—', sub: 'Requiere ≥ 2 periodos', color: 'violet' },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-100 text-blue-600',
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  violet: 'bg-violet-50 border-violet-100 text-violet-600',
}

export default function Step4Summary() {
  const { goToStep } = useApp()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Resumen ejecutivo</h1>
          <p className="text-slate-500 text-sm mt-1">
            KPIs generales, tendencias y distribución por canal y categoría.
          </p>
        </div>
        <button
          onClick={() => goToStep(5)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          Análisis detallado
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${colorMap[kpi.color]}`}>
            <p className="text-xs font-medium opacity-70 mb-2">{kpi.label}</p>
            <p className="text-2xl font-bold opacity-90 mb-1">{kpi.value}</p>
            <p className="text-xs opacity-60">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ventas por canal</h3>
          <div className="h-44 flex items-center justify-center text-slate-300">
            <div className="text-center">
              <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <rect x="3" y="20" width="8" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="14" y="12" width="8" height="21" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="25" y="5" width="8" height="28" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <p className="text-xs">Carga datos para ver el gráfico</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top categorías por venta</h3>
          <div className="h-44 flex items-center justify-center text-slate-300">
            <div className="text-center">
              <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M18 4C18 4 32 18 18 32" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <p className="text-xs">Carga datos para ver el gráfico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Tendencia de ventas</h3>
        <div className="h-36 flex items-center justify-center text-slate-300">
          <div className="text-center">
            <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M3 28L12 18L20 22L33 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs">Requiere datos con fechas para mostrar tendencia</p>
          </div>
        </div>
      </div>
    </div>
  )
}
