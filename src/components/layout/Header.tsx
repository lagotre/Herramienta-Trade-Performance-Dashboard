import { useApp } from '../../context/AppContext'

export default function Header() {
  const { activeProject, goHome } = useApp()

  return (
    <header className="h-14 bg-[#0f2035] flex items-center px-5 gap-4 shrink-0 shadow-sm z-10">
      <button
        onClick={goHome}
        className="flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="white" />
            <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.7" />
            <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.7" />
            <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.5" />
          </svg>
        </div>
        <span className="font-semibold text-[15px] tracking-tight leading-none">
          Trade Performance
        </span>
      </button>

      {activeProject && (
        <>
          <span className="text-white/30 text-lg leading-none select-none">/</span>
          <span className="text-white/70 text-sm truncate max-w-xs">{activeProject.name}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="text-white/30 text-xs hidden sm:block">
          Todos los datos se procesan en tu navegador
        </span>
        <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          100% local
        </div>
      </div>
    </header>
  )
}
