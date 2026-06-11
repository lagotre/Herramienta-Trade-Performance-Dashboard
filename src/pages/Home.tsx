import { useApp } from '../context/AppContext'
import type { Project } from '../types'

const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-1',
    name: 'Análisis ventas mayo 2026 – Canal retail moda',
    client: 'Angel Moda Jeans',
    period: 'Mar – May 2026',
    currency: 'COP',
    businessType: 'Moda',
    channels: ['Tienda Física', 'E-commerce', 'WhatsApp Business', 'Marketplace'],
    createdAt: '2026-05-01T10:00:00Z',
    lastOpenedAt: '2026-05-28T14:30:00Z',
    currentStep: 1,
  },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Home() {
  const { createProject, openProject } = useApp()

  const handleNewProject = () => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: '',
      client: '',
      period: '',
      currency: 'COP',
      businessType: '',
      channels: [],
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      currentStep: 1,
    }
    createProject(newProject)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
              <rect x="12" y="2" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="2" y="12" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="12" y="12" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 leading-tight">
              Trade Performance Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              Mide el desempeño comercial por SKU, categoría, canal y campaña
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-5">
          {['100% privado — tus datos nunca salen del navegador', 'Sube Excel o CSV', 'Hallazgos accionables automáticos', 'Exporta a PDF y Excel'].map(feat => (
            <span key={feat} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6L5 9L10 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* New project CTA */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handleNewProject}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nuevo proyecto
        </button>
        <p className="text-slate-400 text-sm">o abre un proyecto guardado</p>
      </div>

      {/* Projects list */}
      {DEMO_PROJECTS.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Proyectos recientes
          </h2>
          <div className="flex flex-col gap-2">
            {DEMO_PROJECTS.map(project => (
              <button
                key={project.id}
                onClick={() => openProject(project)}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M2 5C2 4.448 2.448 4 3 4H7.172L8.586 5.414H15C15.552 5.414 16 5.862 16 6.414V13C16 13.552 15.552 14 15 14H3C2.448 14 2 13.552 2 13V5Z" stroke="#3b82f6" strokeWidth="1.25" fill="none" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{project.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {project.client} · {project.period} · Paso {project.currentStep} de 7
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{formatDate(project.lastOpenedAt)}</p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className={[
                          'h-1 w-4 rounded-full',
                          i < project.currentStep - 1
                            ? 'bg-green-400'
                            : i === project.currentStep - 1
                            ? 'bg-blue-400'
                            : 'bg-slate-200',
                        ].join(' ')}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 7C3 6.448 3.448 6 4 6H9.172L11 7.828H20C20.552 7.828 21 8.276 21 8.828V19C21 19.552 20.552 20 20 20H4C3.448 20 3 19.552 3 19V7Z" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <p className="font-semibold text-slate-600 mb-1">Sin proyectos aún</p>
          <p className="text-slate-400 text-sm">Crea tu primer análisis de ventas</p>
        </div>
      )}

      {/* Privacy note */}
      <div className="mt-10 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M9 1L2 4.5V9C2 12.866 5 16.1 9 17C13 16.1 16 12.866 16 9V4.5L9 1Z" stroke="#3b82f6" strokeWidth="1.25" fill="none" />
          <path d="M6 9L8 11L12 7" stroke="#3b82f6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-900">Tus datos, solo en tu navegador</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Ningún archivo ni dato se envía a servidores externos. Todo el procesamiento ocurre
            localmente en tu máquina con tecnología IndexedDB.
          </p>
        </div>
      </div>
    </div>
  )
}
