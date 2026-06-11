import { useApp } from '../../context/AppContext'

const EXPORT_OPTIONS = [
  {
    id: 'pdf',
    title: 'Resumen ejecutivo (PDF)',
    desc: 'Dashboard completo con KPIs, gráficos y hallazgos, listo para presentar.',
    icon: 'pdf',
    cta: 'Exportar PDF',
    disabled: true,
  },
  {
    id: 'excel-rankings',
    title: 'Rankings de SKUs (Excel)',
    desc: 'Tabla completa de SKUs ordenada por venta, unidades y margen.',
    icon: 'excel',
    cta: 'Descargar Excel',
    disabled: true,
  },
  {
    id: 'excel-summary',
    title: 'Resumen para cliente (Excel)',
    desc: 'Hoja de resumen ejecutivo con KPIs y hallazgos principales.',
    icon: 'excel',
    cta: 'Descargar Excel',
    disabled: true,
  },
  {
    id: 'csv-actions',
    title: 'Lista de acciones (CSV)',
    desc: 'Hallazgos con acción sugerida y severidad, listos para seguimiento.',
    icon: 'csv',
    cta: 'Descargar CSV',
    disabled: true,
  },
]

const iconColors: Record<string, string> = {
  pdf: 'bg-red-50 text-red-500',
  excel: 'bg-green-50 text-green-600',
  csv: 'bg-blue-50 text-blue-500',
}

export default function Step7Export() {
  const { goToStep } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900">Exportar</h1>
        <p className="text-slate-500 text-sm mt-1">
          Genera reportes listos para presentar a clientes o equipos directivos.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {EXPORT_OPTIONS.map(opt => (
          <div
            key={opt.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColors[opt.icon]}`}>
              {opt.icon === 'pdf' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.25" fill="none" />
                  <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              )}
              {(opt.icon === 'excel' || opt.icon === 'csv') && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.25" fill="none" />
                  <path d="M3 7H17M3 11H17M3 15H17M10 2V18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{opt.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </div>
            <button
              disabled={opt.disabled}
              className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
            >
              {opt.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="7" stroke="#94a3b8" strokeWidth="1.25" fill="none" />
          <path d="M9 5.5V9.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="12" r="0.75" fill="#94a3b8" />
        </svg>
        <p className="text-xs text-slate-500">
          Las exportaciones estarán disponibles una vez hayas cargado datos y completado el análisis.
          El PDF se genera directamente en tu navegador usando la función de impresión.
        </p>
      </div>

      <div className="flex justify-start">
        <button
          onClick={() => goToStep(6)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atrás a Hallazgos
        </button>
      </div>
    </div>
  )
}
