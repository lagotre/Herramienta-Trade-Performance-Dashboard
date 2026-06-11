export type AppView = 'home' | 'workflow'

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type StepStatus = 'completed' | 'current' | 'pending'

export interface StepDef {
  id: StepId
  title: string
  subtitle: string
  icon: string
}

export interface Project {
  id: string
  name: string
  client: string
  period: string
  periodFrom: string
  periodTo: string
  currency: string
  businessType: string
  channels: string[]
  createdAt: string
  lastOpenedAt: string
  currentStep: StepId
}

// ─── Raw / parsed data ────────────────────────────────────────────────────────

export type RawRow = Record<string, string | number | boolean | null | undefined>

export interface ParseResult {
  headers: string[]
  rows: RawRow[]
  fileName: string
  totalRows: number
}

export const CANONICAL_FIELDS = [
  { key: 'fecha',             label: 'Fecha',              required: true  },
  { key: 'canal',             label: 'Canal',              required: true  },
  { key: 'categoria',         label: 'Categoría',          required: true  },
  { key: 'sku',               label: 'SKU / Código',       required: true  },
  { key: 'unidades',          label: 'Unidades',           required: true  },
  { key: 'venta',             label: 'Venta ($)',          required: true  },
  { key: 'tienda',            label: 'Tienda',             required: false },
  { key: 'subcategoria',      label: 'Subcategoría',       required: false },
  { key: 'marca',             label: 'Marca',              required: false },
  { key: 'producto',          label: 'Nombre producto',    required: false },
  { key: 'margen',            label: 'Margen ($)',         required: false },
  { key: 'precio_promedio',   label: 'Precio promedio',    required: false },
  { key: 'campana',           label: 'Campaña',            required: false },
  { key: 'inventario',        label: 'Inventario',         required: false },
  { key: 'num_transacciones', label: 'N° transacciones',   required: false },
] as const

export type CanonicalKey = typeof CANONICAL_FIELDS[number]['key']

export type ColumnMapping = Partial<Record<CanonicalKey, string>>

export interface MappedRow {
  fecha: string | null
  canal: string | null
  tienda: string | null
  categoria: string | null
  subcategoria: string | null
  marca: string | null
  sku: string | null
  producto: string | null
  unidades: number | null
  venta: number | null
  margen: number | null
  precio_promedio: number | null
  campana: string | null
  inventario: number | null
  num_transacciones: number | null
  _rowIndex: number
}

// ─── Health checks ─────────────────────────────────────────────────────────────

export type HealthSeverity = 'blocking' | 'warning' | 'info'

export interface HealthIssue {
  id: string
  title: string
  severity: HealthSeverity
  count: number
  detail?: string
  sample?: string[]
  suggestions?: Array<{ original: string; suggestion: string }>
}

export interface HealthReport {
  totalRows: number
  issueCount: number
  blockingCount: number
  issues: HealthIssue[]
  checkedAt: string
}

// ─── App context ───────────────────────────────────────────────────────────────

export interface AppContext {
  view: AppView
  currentStep: StepId
  activeProject: Project | null
  mappedRows: MappedRow[] | null
  healthReport: HealthReport | null
  goHome: () => void
  goToStep: (step: StepId) => void
  openProject: (project: Project) => void
  createProject: (project: Project) => void
  setAnalysisData: (rows: MappedRow[], report: HealthReport) => void
}

// ─── Navigation ────────────────────────────────────────────────────────────────

export const STEPS: StepDef[] = [
  { id: 1, title: 'Crear proyecto',    subtitle: 'Nombre, empresa y configuración', icon: 'folder'    },
  { id: 2, title: 'Carga de datos',    subtitle: 'Subir Excel o CSV',               icon: 'upload'    },
  { id: 3, title: 'Salud de datos',    subtitle: 'Validación y limpieza',           icon: 'shield'    },
  { id: 4, title: 'Resumen ejecutivo', subtitle: 'KPIs y métricas clave',           icon: 'chart'     },
  { id: 5, title: 'Análisis específicos', subtitle: 'SKUs, canales, campañas',     icon: 'analytics' },
  { id: 6, title: 'Hallazgos',         subtitle: 'Insights accionables',            icon: 'lightbulb' },
  { id: 7, title: 'Exportar',          subtitle: 'PDF, Excel y reportes',           icon: 'download'  },
]
