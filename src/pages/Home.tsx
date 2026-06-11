import * as XLSX from 'xlsx'
import { useApp } from '../context/AppContext'
import type { Project } from '../types'

const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-1',
    name: 'Análisis ventas mayo 2026 – Canal retail moda',
    client: 'Angel Moda Jeans',
    period: '1 mar. 2026 — 31 may. 2026',
    periodFrom: '2026-03-01',
    periodTo: '2026-05-31',
    currency: 'COP',
    businessType: 'Moda y textil',
    channels: ['Tienda Física', 'E-commerce', 'WhatsApp Business', 'Marketplace'],
    createdAt: '2026-05-01T10:00:00Z',
    lastOpenedAt: '2026-05-28T14:30:00Z',
    currentStep: 1,
  },
]

const HOW_IT_WORKS = [
  {
    num: '1',
    title: 'Descarga la plantilla',
    desc: 'Usa el archivo Excel con las columnas listas o adapta tu propio archivo.',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    dot: 'bg-violet-500',
  },
  {
    num: '2',
    title: 'Crea un proyecto',
    desc: 'Define nombre, cliente, período de análisis y canales de tu negocio.',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    dot: 'bg-blue-500',
  },
  {
    num: '3',
    title: 'Sube tu archivo',
    desc: 'Carga el Excel o CSV. La herramienta detecta automáticamente las columnas.',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    dot: 'bg-cyan-500',
  },
  {
    num: '4',
    title: 'Revisa la calidad',
    desc: 'Se identifican errores, canales mal escritos o SKUs sin categoría.',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    dot: 'bg-amber-500',
  },
  {
    num: '5',
    title: 'Analiza y exporta',
    desc: 'KPIs, gráficos, hallazgos accionables, PDF y Excel listos para presentar.',
    color: 'bg-green-50 border-green-200 text-green-700',
    dot: 'bg-green-500',
  },
]

const COLUMN_INFO = [
  { col: 'fecha',            req: true,  ex: '2026-03-15',       desc: 'Fecha de la venta (AAAA-MM-DD, DD/MM/AAAA o DD-MM-AAAA)' },
  { col: 'canal',            req: true,  ex: 'Tienda Física',    desc: 'Canal de venta: Tienda Física, E-commerce, WhatsApp Business, Marketplace, etc.' },
  { col: 'sku',              req: true,  ex: 'AM-JEAN-001',      desc: 'Código único del producto / referencia' },
  { col: 'categoria',        req: true,  ex: 'Jeans',            desc: 'Categoría del producto' },
  { col: 'unidades',         req: true,  ex: '12',               desc: 'Unidades vendidas (número entero)' },
  { col: 'venta',            req: true,  ex: '1440000',          desc: 'Ingreso monetario por la venta (sin símbolos, solo número)' },
  { col: 'tienda',           req: false, ex: 'Tienda Norte',     desc: 'Nombre del punto de venta (opcional)' },
  { col: 'subcategoria',     req: false, ex: 'Slim Fit',         desc: 'Subcategoría del producto (opcional)' },
  { col: 'marca',            req: false, ex: 'Angel Moda',       desc: 'Marca del producto (opcional)' },
  { col: 'producto',         req: false, ex: 'Jean Slim Azul',   desc: 'Nombre descriptivo del producto (opcional)' },
  { col: 'margen',           req: false, ex: '576000',           desc: 'Margen bruto en dinero. Si se omite, se ocultan los KPIs de rentabilidad.' },
  { col: 'campana',          req: false, ex: 'Promo Mayo',       desc: 'Nombre de la campaña o promoción (opcional)' },
  { col: 'inventario',       req: false, ex: '45',               desc: 'Unidades en inventario al momento del corte (opcional)' },
  { col: 'num_transacciones',req: false, ex: '8',                desc: 'Número de transacciones. Permite calcular ticket promedio (opcional).' },
]

const EXAMPLE_ROWS = [
  ['2026-03-15','Tienda Física','AM-JEAN-001','Jeans',12,1440000,576000,'Tienda Norte','Slim Fit','Angel Moda','Jean Slim Azul 32','Temporada Verano',48,8],
  ['2026-03-15','E-commerce',   'AM-JEAN-002','Jeans', 7, 910000,350000,'',           'Straight', 'Angel Moda','Jean Straight Negro 30','',              20,7],
  ['2026-03-20','WhatsApp Business','AM-JEAN-003','Jeans',5,650000,234000,'',         'Bootcut',  'Angel Moda','Jean Bootcut Azul 34','Promo WhatsApp', 15,5],
  ['2026-04-01','Marketplace',  'AM-JEAN-001','Jeans', 9,1080000,432000,'',           'Slim Fit', 'Angel Moda','Jean Slim Azul 32','Flash Sale',       30,9],
  ['2026-04-10','Tienda Física','AM-JEAN-004','Jeans', 3, 420000,126000,'Tienda Sur', 'Mom',      'Angel Moda','Jean Mom Blanco 28','',                10,3],
  ['2026-05-05','E-commerce',   'AM-JEAN-002','Jeans',11,1430000,572000,'',           'Straight', 'Angel Moda','Jean Straight Negro 30','Día de la Madre',25,11],
  ['2026-05-12','Tienda Física','AM-JEAN-005','Shorts', 6, 480000,192000,'Tienda Norte','Casual', 'Angel Moda','Short Casual Blanco S','',              18,6],
  ['2026-05-20','WhatsApp Business','AM-JEAN-003','Jeans',8,1040000,374400,'',        'Bootcut',  'Angel Moda','Jean Bootcut Azul 34','Promo Mayo',      22,8],
]

function downloadTemplate() {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Plantilla con datos de ejemplo
  const headers = COLUMN_INFO.map(c => c.col)
  const descRow  = COLUMN_INFO.map(c => c.desc)
  const exRow    = COLUMN_INFO.map(c => c.ex)

  const wsData: unknown[][] = [
    headers,
    descRow,
    exRow,
    ...EXAMPLE_ROWS,
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = COLUMN_INFO.map((_, i) => ({
    wch: i < 6 ? 18 : 22,
  }))

  // Row heights
  ws['!rows'] = [{ hpt: 20 }, { hpt: 36 }, { hpt: 18 }]

  // Mark required vs optional in the header row by cell notes (not all Excel readers show these,
  // but the second row (descriptions) already tells the user what's required)
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')

  // Sheet 2: Glosario de columnas
  const glosarioData: unknown[][] = [
    ['Columna', 'Requerida', 'Ejemplo', 'Descripción'],
    ...COLUMN_INFO.map(c => [c.col, c.req ? 'SÍ' : 'no', c.ex, c.desc]),
  ]
  const wsGlosario = XLSX.utils.aoa_to_sheet(glosarioData)
  wsGlosario['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, wsGlosario, 'Glosario de columnas')

  XLSX.writeFile(wb, 'Plantilla-Trade-Performance-Dashboard.xlsx')
}

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
      periodFrom: '',
      periodTo: '',
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

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
        <div className="flex flex-wrap gap-2 mt-4">
          {['100% privado — datos solo en tu navegador', 'Sube Excel o CSV', 'Hallazgos accionables automáticos', 'Exporta a PDF y Excel'].map(feat => (
            <span key={feat} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* ── Instructivo ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-500">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
            <path d="M8 5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.75" fill="currentColor" />
          </svg>
          <p className="text-sm font-semibold text-slate-700">Cómo funciona — 5 pasos</p>
        </div>

        <div className="grid grid-cols-5 gap-2 relative">
          {/* Connector line */}
          <div className="absolute top-4 left-[10%] right-[10%] h-px bg-slate-200 z-0 hidden md:block" />

          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center relative z-10">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold mb-2 bg-white ${step.color.includes('violet') ? 'border-violet-400 text-violet-700' : step.color.includes('blue') ? 'border-blue-400 text-blue-700' : step.color.includes('cyan') ? 'border-cyan-400 text-cyan-700' : step.color.includes('amber') ? 'border-amber-400 text-amber-700' : 'border-green-400 text-green-700'}`}>
                {step.num}
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-1 leading-tight">{step.title}</p>
              <p className="text-xs text-slate-400 leading-tight hidden md:block">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile: expanded list */}
        <div className="md:hidden mt-4 flex flex-col gap-2">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${step.color}`}>
              <span className="text-xs font-bold w-5 shrink-0 mt-0.5">{step.num}.</span>
              <div>
                <p className="text-xs font-semibold">{step.title}</p>
                <p className="text-xs opacity-75 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Plantilla + CTA row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {/* Template download card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="#16a34a" strokeWidth="1.25" fill="none" />
                <path d="M3 7H17M3 11H17M3 15H17M10 2V18" stroke="#16a34a" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Plantilla Excel lista para usar</p>
              <p className="text-xs text-slate-500 mt-0.5">
                14 columnas pre-configuradas con ejemplos y descripción de cada campo. Las columnas obligatorias están marcadas.
              </p>
            </div>
          </div>

          {/* Column pills */}
          <div className="flex flex-wrap gap-1">
            {COLUMN_INFO.filter(c => c.req).map(c => (
              <span key={c.col} className="text-xs font-mono bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded">
                {c.col}
              </span>
            ))}
            {COLUMN_INFO.filter(c => !c.req).map(c => (
              <span key={c.col} className="text-xs font-mono bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded">
                {c.col}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
            Verde = obligatorias ·
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mx-1" />
            Gris = opcionales (se degradan con gracia si no están)
          </p>

          <button
            onClick={downloadTemplate}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm mt-auto"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V11M5 8L8 11L11 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Descargar plantilla (.xlsx)
          </button>
        </div>

        {/* New project card */}
        <div className="bg-blue-600 rounded-2xl p-5 flex flex-col gap-3 text-white">
          <div>
            <p className="text-sm font-bold mb-1">¿Ya tienes tu archivo?</p>
            <p className="text-xs text-blue-200">
              Crea un proyecto, sube tu Excel o CSV y obtén KPIs, análisis por canal, hallazgos accionables y exportaciones en minutos.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs text-blue-100">
            {[
              'Auto-detección de columnas — no requiere formato exacto',
              'Revisa errores y canales mal escritos antes del análisis',
              '8 reglas de negocio calculadas automáticamente',
              'Exporta PDF ejecutivo y Excel en un clic',
            ].map(feat => (
              <div key={feat} className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 mt-0.5">
                  <path d="M2 6L5 9L10 3" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {feat}
              </div>
            ))}
          </div>

          <button
            onClick={handleNewProject}
            className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-700 text-sm font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm mt-auto"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nuevo proyecto
          </button>
        </div>
      </div>

      {/* ── Proyectos recientes ───────────────────────────────────────────────── */}
      {DEMO_PROJECTS.length > 0 && (
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
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
                      <div key={i} className={['h-1 w-4 rounded-full', i < project.currentStep - 1 ? 'bg-green-400' : i === project.currentStep - 1 ? 'bg-blue-400' : 'bg-slate-200'].join(' ')} />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Privacy note ─────────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1L2 4.5V9C2 12.866 5 16.1 9 17C13 16.1 16 12.866 16 9V4.5L9 1Z" stroke="#3b82f6" strokeWidth="1.25" fill="none" />
          <path d="M6 9L8 11L12 7" stroke="#3b82f6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-900">Tus datos, solo en tu navegador</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Ningún archivo ni dato se envía a servidores externos. Todo el procesamiento ocurre localmente en tu máquina.
          </p>
        </div>
      </div>
    </div>
  )
}
