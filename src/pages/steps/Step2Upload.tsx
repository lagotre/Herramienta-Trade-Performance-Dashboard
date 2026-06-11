import { useApp } from '../../context/AppContext'

export default function Step2Upload() {
  const { goToStep } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900">Carga de datos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Sube tu archivo de ventas en Excel o CSV. Luego mapearás las columnas al esquema de análisis.
        </p>
      </div>

      {/* Upload zone */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors p-12 text-center mb-4 cursor-pointer group">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 18V6M9 11L14 6L19 11M5 22H23" stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700 mb-1">Arrastra tu archivo aquí</p>
        <p className="text-slate-400 text-sm mb-4">o haz clic para seleccionar</p>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          Formatos admitidos: .xlsx, .xls, .csv
        </span>
      </div>

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
          Dataset sintético con ~12 SKUs, 5 canales y 3 meses para explorar todas las funcionalidades
        </p>
      </div>

      {/* Column mapping preview (coming soon) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="7" stroke="#d97706" strokeWidth="1.25" fill="none" />
          <path d="M9 5.5V9.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="12" r="0.75" fill="#d97706" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-900">Mapeo de columnas — Fase 1</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Tras cargar el archivo, podrás asignar cada columna de tu Excel al esquema interno
            de la herramienta. La detección es automática por nombre de columna.
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
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
