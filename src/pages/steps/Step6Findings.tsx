import { useApp } from '../../context/AppContext'

const RULES_PREVIEW = [
  { id: 1, title: 'Concentración (Pareto)', desc: 'Top 20% de SKUs con ≥80% de ventas', severity: 'alta' },
  { id: 2, title: 'SKUs ganadores', desc: 'Top decil por venta y margen sobre la mediana', severity: 'media' },
  { id: 3, title: 'SKUs lentos / cola muerta', desc: 'Cuartil inferior o ventas cero en el periodo', severity: 'alta' },
  { id: 4, title: 'Categoría en caída', desc: 'Crecimiento < −10% mes a mes (requiere ≥2 periodos)', severity: 'alta' },
  { id: 5, title: 'Sobredependencia de canal', desc: 'Un canal concentra >60% de las ventas', severity: 'media' },
  { id: 6, title: 'Trampa de margen', desc: 'Alto volumen pero margen % bajo la mediana', severity: 'media' },
  { id: 7, title: 'Campaña sin impacto', desc: 'Uplift de campaña vs. baseline comparable', severity: 'baja' },
  { id: 8, title: 'Inventario en riesgo', desc: 'Alto inventario + baja rotación', severity: 'alta' },
]

const severityColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-amber-100 text-amber-700 border-amber-200',
  baja: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function Step6Findings() {
  const { goToStep } = useApp()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900">Hallazgos detectados</h1>
        <p className="text-slate-500 text-sm mt-1">
          El motor de reglas analiza tus datos y genera insights accionables, priorizados por severidad.
        </p>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Reglas activas</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
            8 reglas configuradas
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {RULES_PREVIEW.map(rule => (
            <div key={rule.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-bold text-slate-400">
                {rule.id}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600">{rule.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{rule.desc}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${severityColors[rule.severity]}`}>
                {rule.severity}
              </span>
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" title="Sin datos" />
            </div>
          ))}
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Los hallazgos aparecerán aquí una vez cargues y valides un archivo de ventas.
          </p>
        </div>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="6" r="5" stroke="#7c3aed" strokeWidth="1.25" fill="none" />
          <path d="M6.5 11V14H11.5V11" stroke="#7c3aed" strokeWidth="1.25" strokeLinejoin="round" fill="none" />
          <path d="M9 12H9.01" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div>
          <p className="text-sm font-medium text-violet-900">Hallazgos con umbrales configurables</p>
          <p className="text-xs text-violet-700 mt-0.5">
            Cada regla tiene umbrales ajustables. Por ejemplo, puedes cambiar el criterio de
            "caída de categoría" de −10% a −5% según el contexto del negocio.
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => goToStep(5)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atrás
        </button>
        <button
          onClick={() => goToStep(7)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Exportar
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
