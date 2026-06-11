import { AppProvider, useApp } from './context/AppContext'
import AppShell from './components/layout/AppShell'
import Home from './pages/Home'
import Step1Project from './pages/steps/Step1Project'
import Step2Upload from './pages/steps/Step2Upload'
import Step3Health from './pages/steps/Step3Health'
import Step4Summary from './pages/steps/Step4Summary'
import Step5Analysis from './pages/steps/Step5Analysis'
import Step6Findings from './pages/steps/Step6Findings'
import Step7Export from './pages/steps/Step7Export'

const STEP_PAGES = {
  1: Step1Project,
  2: Step2Upload,
  3: Step3Health,
  4: Step4Summary,
  5: Step5Analysis,
  6: Step6Findings,
  7: Step7Export,
} as const

function Router() {
  const { view, currentStep } = useApp()

  if (view === 'home') return <Home />

  const StepPage = STEP_PAGES[currentStep]
  return <StepPage />
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <Router />
      </AppShell>
    </AppProvider>
  )
}
