import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppView, StepId, Project, MappedRow, HealthReport, AppContext as IAppContext } from '../types'

const AppCtx = createContext<IAppContext | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('home')
  const [currentStep, setCurrentStep] = useState<StepId>(1)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [mappedRows, setMappedRows] = useState<MappedRow[] | null>(null)
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)

  const goHome = () => {
    setView('home')
    setActiveProject(null)
    setCurrentStep(1)
    setMappedRows(null)
    setHealthReport(null)
  }

  const goToStep = (step: StepId) => setCurrentStep(step)

  const openProject = (project: Project) => {
    setActiveProject(project)
    setCurrentStep(project.currentStep)
    setView('workflow')
  }

  const createProject = (project: Project) => {
    setActiveProject(project)
    setCurrentStep(1)
    setView('workflow')
  }

  const setAnalysisData = (rows: MappedRow[], report: HealthReport) => {
    setMappedRows(rows)
    setHealthReport(report)
  }

  return (
    <AppCtx.Provider
      value={{
        view, currentStep, activeProject, mappedRows, healthReport,
        goHome, goToStep, openProject, createProject, setAnalysisData,
      }}
    >
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
