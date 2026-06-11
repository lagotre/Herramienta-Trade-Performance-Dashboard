import { useApp } from '../../context/AppContext'
import Header from './Header'
import StepNav from './StepNav'
import type { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  const { view } = useApp()
  const inWorkflow = view === 'workflow'

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex flex-1 min-h-0">
        {inWorkflow && <StepNav />}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
