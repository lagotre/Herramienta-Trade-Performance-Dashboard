import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppView, StepId, Project, AppContext as IAppContext } from '../types'

const AppCtx = createContext<IAppContext | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('home')
  const [currentStep, setCurrentStep] = useState<StepId>(1)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const goHome = () => {
    setView('home')
    setActiveProject(null)
    setCurrentStep(1)
  }

  const goToStep = (step: StepId) => {
    setCurrentStep(step)
  }

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

  return (
    <AppCtx.Provider
      value={{ view, currentStep, activeProject, goHome, goToStep, openProject, createProject }}
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
