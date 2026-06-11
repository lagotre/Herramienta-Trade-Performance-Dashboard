import React from 'react'
import { useApp } from '../../context/AppContext'
import { STEPS } from '../../types'
import type { StepId } from '../../types'

const StepIcon = ({ icon, completed }: { icon: string; completed: boolean }) => {
  if (completed) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  const icons: Record<string, React.ReactElement> = {
    folder: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M1 3.5C1 2.948 1.448 2.5 2 2.5H5.586L7 3.914h5C12.552 3.914 13 4.362 13 4.914V10.5C13 11.052 12.552 11.5 12 11.5H2C1.448 11.5 1 11.052 1 10.5V3.5Z" stroke="currentColor" strokeWidth="1.25" fill="none" />
      </svg>
    ),
    upload: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 9V2M4 5L7 2L10 5M2.5 11.5H11.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    shield: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1L1.5 3.5V7C1.5 10.142 4 12.5 7 13C10 12.5 12.5 10.142 12.5 7V3.5L7 1Z" stroke="currentColor" strokeWidth="1.25" fill="none" />
      </svg>
    ),
    chart: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1" y="8" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <rect x="5.5" y="5" width="3" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <rect x="10" y="2" width="3" height="11" rx="0.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
      </svg>
    ),
    analytics: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <path d="M7 1.5V7L10.5 10.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
    lightbulb: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1C4.791 1 3 2.791 3 5C3 6.38 3.69 7.601 4.75 8.357V10H9.25V8.357C10.31 7.601 11 6.38 11 5C11 2.791 9.209 1 7 1Z" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <path d="M5 12H9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
    download: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 2V9M4 6.5L7 9.5L10 6.5M2.5 11.5H11.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  }
  return icons[icon] ?? null
}

export default function StepNav() {
  const { currentStep, goToStep, activeProject } = useApp()

  const getStatus = (stepId: StepId) => {
    const maxCompleted = activeProject?.currentStep ?? 1
    if (stepId < currentStep && stepId < maxCompleted + 1) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  const canNavigate = (stepId: StepId) => {
    const maxCompleted = activeProject?.currentStep ?? 1
    return stepId <= maxCompleted || stepId === currentStep
  }

  return (
    <nav className="w-60 bg-[#0f2035] flex flex-col shrink-0 border-r border-white/5 overflow-y-auto">
      <div className="px-4 pt-5 pb-3">
        <p className="text-white/40 text-[11px] font-medium uppercase tracking-widest">
          Flujo de análisis
        </p>
      </div>
      <ol className="flex flex-col gap-0.5 px-2 pb-4">
        {STEPS.map((step) => {
          const status = getStatus(step.id)
          const navigable = canNavigate(step.id)
          const isCurrent = status === 'current'
          const isCompleted = status === 'completed'

          return (
            <li key={step.id}>
              <button
                onClick={() => navigable && goToStep(step.id)}
                disabled={!navigable}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'text-white/70 hover:bg-white/8 hover:text-white cursor-pointer'
                    : navigable
                    ? 'text-white/50 hover:bg-white/5 hover:text-white/70 cursor-pointer'
                    : 'text-white/25 cursor-not-allowed',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold',
                    isCurrent
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/40',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <StepIcon icon={step.icon} completed={true} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-tight truncate">{step.title}</p>
                  <p
                    className={[
                      'text-[11px] leading-tight mt-0.5 truncate',
                      isCurrent ? 'text-blue-100' : 'text-white/35',
                    ].join(' ')}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="mt-auto px-4 pb-5 pt-4 border-t border-white/5">
        <p className="text-white/25 text-[11px] leading-relaxed">
          Los datos permanecen en tu navegador. Ningún archivo se envía a servidores externos.
        </p>
      </div>
    </nav>
  )
}
