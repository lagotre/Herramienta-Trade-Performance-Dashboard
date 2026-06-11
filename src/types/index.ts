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
  currency: string
  businessType: string
  channels: string[]
  createdAt: string
  lastOpenedAt: string
  currentStep: StepId
}

export interface AppContext {
  view: AppView
  currentStep: StepId
  activeProject: Project | null
  goHome: () => void
  goToStep: (step: StepId) => void
  openProject: (project: Project) => void
  createProject: (project: Project) => void
}

export const STEPS: StepDef[] = [
  {
    id: 1,
    title: 'Crear proyecto',
    subtitle: 'Nombre, empresa y configuración',
    icon: 'folder',
  },
  {
    id: 2,
    title: 'Carga de datos',
    subtitle: 'Subir Excel o CSV',
    icon: 'upload',
  },
  {
    id: 3,
    title: 'Salud de datos',
    subtitle: 'Validación y limpieza',
    icon: 'shield',
  },
  {
    id: 4,
    title: 'Resumen ejecutivo',
    subtitle: 'KPIs y métricas clave',
    icon: 'chart',
  },
  {
    id: 5,
    title: 'Análisis específicos',
    subtitle: 'SKUs, canales, campañas',
    icon: 'analytics',
  },
  {
    id: 6,
    title: 'Hallazgos',
    subtitle: 'Insights accionables',
    icon: 'lightbulb',
  },
  {
    id: 7,
    title: 'Exportar',
    subtitle: 'PDF, Excel y reportes',
    icon: 'download',
  },
]
