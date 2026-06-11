import { useState } from 'react'
import { useApp } from '../../context/AppContext'

const TABS = ['SKUs', 'Categorías', 'Canales', 'Campañas', 'Tiendas', 'Tendencias'] as const
type Tab = typeof TABS[number]

export default function Step5Analysis() {
  const { goToStep } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('SKUs')

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav */}
      <div className="bg-white border-b border-slate-200 px-6 pt-6 pb-0">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Análisis específicos</h1>
            <p className="text-slate-500 text-sm mt-1">
              Explora el rendimiento por dimensión. Usa los filtros globales para acotar el análisis.
            </p>
          </div>
        </div>

        {/* Global filters bar */}
        <div className="flex items-center gap-2 pb-4 flex-wrap">
          <span className="text-xs text-slate-400 mr-1">Filtros:</span>
          {['Periodo', 'Canal', 'Categoría', 'Marca', 'Campaña'].map(f => (
            <button key={f} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
              {f}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={tab === activeTab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all -mb-px',
                tab === activeTab
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                <circle cx="13" cy="13" r="10" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                <path d="M13 7V13L17 17" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-semibold text-slate-600 mb-1">
              Análisis de {activeTab} disponible con datos cargados
            </p>
            <p className="text-slate-400 text-sm mb-5">
              Carga un archivo Excel o CSV en el paso 2 para ver tablas, gráficos y rankings de {activeTab.toLowerCase()}.
            </p>
            <button
              onClick={() => goToStep(2)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ir a carga de datos →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
