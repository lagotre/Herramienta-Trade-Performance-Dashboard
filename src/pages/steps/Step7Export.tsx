import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import * as XLSX from 'xlsx'
import { useApp } from '../../context/AppContext'
import PrintReport from '../../components/PrintReport'
import { computeKPIs, groupByDimension, computeSKUTable, computeTrend } from '../../lib/kpis'
import { runInsights } from '../../lib/insights'

export default function Step7Export() {
  const { goToStep, mappedRows, activeProject } = useApp()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)
  const hasData = !!mappedRows && mappedRows.length > 0

  const generatedAt = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Informe-Trade-${activeProject?.name ?? 'Dashboard'}`,
    onBeforePrint: () => { setPdfLoading(true); return Promise.resolve() },
    onAfterPrint: () => setPdfLoading(false),
  })

  function downloadExcelRankings() {
    if (!mappedRows) return
    setExcelLoading(true)
    try {
      const skus  = computeSKUTable(mappedRows, 200)
      const canal = groupByDimension(mappedRows, 'canal', 50)
      const cat   = groupByDimension(mappedRows, 'categoria', 50)

      const wb = XLSX.utils.book_new()

      const skuWs = XLSX.utils.json_to_sheet(skus.map((r, i) => ({
        '#': i + 1,
        SKU: r.sku,
        Producto: r.producto,
        Categoría: r.categoria,
        Canal: r.canal,
        'Ventas (COP)': r.venta,
        Unidades: r.unidades,
        'Participación (%)': +r.participacion.toFixed(2),
        ...(r.margen !== null ? { 'Margen (COP)': r.margen, 'Margen (%)': r.margenPct !== null ? +r.margenPct.toFixed(2) : null } : {}),
      })))
      XLSX.utils.book_append_sheet(wb, skuWs, 'Ranking SKUs')

      const canalWs = XLSX.utils.json_to_sheet(canal.map((r, i) => ({
        '#': i + 1,
        Canal: r.key,
        'Ventas (COP)': r.venta,
        Unidades: r.unidades,
        'Participación (%)': +r.participacion.toFixed(2),
        ...(r.margen !== null ? { 'Margen (%)': r.margenPct !== null ? +r.margenPct.toFixed(2) : null } : {}),
      })))
      XLSX.utils.book_append_sheet(wb, canalWs, 'Canales')

      const catWs = XLSX.utils.json_to_sheet(cat.map((r, i) => ({
        '#': i + 1,
        Categoría: r.key,
        'Ventas (COP)': r.venta,
        Unidades: r.unidades,
        'Participación (%)': +r.participacion.toFixed(2),
      })))
      XLSX.utils.book_append_sheet(wb, catWs, 'Categorías')

      XLSX.writeFile(wb, `Rankings-${activeProject?.name ?? 'Trade'}.xlsx`)
    } finally {
      setExcelLoading(false)
    }
  }

  function downloadExcelSummary() {
    if (!mappedRows || !activeProject) return
    setSummaryLoading(true)
    try {
      const kpis    = computeKPIs(mappedRows)
      const insights = runInsights(mappedRows).filter(i => !i.skipped)
      const trend   = computeTrend(mappedRows)

      const wb = XLSX.utils.book_new()

      const kpiData = [
        ['Métrica', 'Valor'],
        ['Proyecto', activeProject.name],
        ['Período desde', activeProject.periodFrom ?? ''],
        ['Período hasta', activeProject.periodTo ?? ''],
        ['', ''],
        ['Ventas totales (COP)', kpis.totalVentas],
        ['Unidades vendidas', kpis.totalUnidades],
        ['Precio promedio / unidad (COP)', kpis.precioPromedio],
        ...(kpis.hasMargen && kpis.totalMargen !== null ? [
          ['Margen total (COP)', kpis.totalMargen],
          ['Margen (%)', kpis.margenPct !== null ? +kpis.margenPct.toFixed(2) : '—'],
        ] : []),
        ...(kpis.ticketPromedio !== null ? [['Ticket promedio (COP)', kpis.ticketPromedio]] : []),
        ['SKUs activos', kpis.totalSKUs],
        ['Categorías', kpis.totalCategorias],
        ['Canales', kpis.totalCanales],
        ['Crecimiento ventas MoM (%)', kpis.crecimientoVentas !== null ? +kpis.crecimientoVentas.toFixed(2) : 'N/A'],
        ['', ''],
        ['Generado el', generatedAt],
      ]
      const kpiWs = XLSX.utils.aoa_to_sheet(kpiData)
      XLSX.utils.book_append_sheet(wb, kpiWs, 'KPIs')

      if (trend.length > 0) {
        const trendWs = XLSX.utils.json_to_sheet(trend.map((p, i) => {
          const prev = trend[i - 1]
          const varPct = prev && prev.venta > 0 ? ((p.venta - prev.venta) / prev.venta) * 100 : null
          return { Mes: p.mes, 'Ventas (COP)': p.venta, Unidades: p.unidades, 'Var. Ventas (%)': varPct !== null ? +varPct.toFixed(2) : null }
        }))
        XLSX.utils.book_append_sheet(wb, trendWs, 'Tendencia')
      }

      const insightData = [
        ['Severidad', 'Título', 'Hallazgo', 'Acción sugerida'],
        ...insights.map(i => [i.severity.toUpperCase(), i.title, i.finding, i.action]),
      ]
      const insightWs = XLSX.utils.aoa_to_sheet(insightData)
      XLSX.utils.book_append_sheet(wb, insightWs, 'Hallazgos')

      XLSX.writeFile(wb, `Resumen-Ejecutivo-${activeProject.name}.xlsx`)
    } finally {
      setSummaryLoading(false)
    }
  }

  function downloadCSVActions() {
    if (!mappedRows) return
    setCsvLoading(true)
    try {
      const insights = runInsights(mappedRows).filter(i => !i.skipped)
      const rows = insights.map(i => ({
        Severidad: i.severity.toUpperCase(),
        Título: i.title,
        Hallazgo: i.finding,
        'Acción sugerida': i.action,
        'SKUs relacionados': i.data?.slice(0, 5).join(' | ') ?? '',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Acciones')
      XLSX.writeFile(wb, `Acciones-${activeProject?.name ?? 'Trade'}.csv`, { bookType: 'csv' })
    } finally {
      setCsvLoading(false)
    }
  }

  const options = [
    {
      id: 'pdf',
      icon: 'pdf',
      title: 'Informe ejecutivo completo (PDF)',
      desc: 'Dashboard de métricas, análisis de SKUs, tendencia y hallazgos. Generado por el navegador, 100% local.',
      cta: pdfLoading ? 'Generando…' : 'Exportar PDF',
      loading: pdfLoading,
      action: () => handlePrint(),
    },
    {
      id: 'excel-rankings',
      icon: 'excel',
      title: 'Rankings de SKUs (Excel)',
      desc: 'Hojas: Ranking SKUs · Canales · Categorías. Ordenados por venta descendente.',
      cta: excelLoading ? 'Generando…' : 'Descargar Excel',
      loading: excelLoading,
      action: downloadExcelRankings,
    },
    {
      id: 'excel-summary',
      icon: 'excel',
      title: 'Resumen ejecutivo (Excel)',
      desc: 'Hojas: KPIs · Tendencia mensual · Hallazgos con acciones sugeridas.',
      cta: summaryLoading ? 'Generando…' : 'Descargar Excel',
      loading: summaryLoading,
      action: downloadExcelSummary,
    },
    {
      id: 'csv-actions',
      icon: 'csv',
      title: 'Plan de acciones (CSV)',
      desc: 'Lista de hallazgos con severidad y acción sugerida, lista para seguimiento.',
      cta: csvLoading ? 'Generando…' : 'Descargar CSV',
      loading: csvLoading,
      action: downloadCSVActions,
    },
  ]

  const iconColors: Record<string, string> = {
    pdf: 'bg-red-50 text-red-500',
    excel: 'bg-green-50 text-green-600',
    csv: 'bg-blue-50 text-blue-500',
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900">Exportar informe</h1>
        <p className="text-slate-500 text-sm mt-1">
          Genera reportes listos para presentar. Todo se procesa en tu navegador, sin enviar datos a ningún servidor.
        </p>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <circle cx="9" cy="9" r="7" stroke="#d97706" strokeWidth="1.25" fill="none" />
            <path d="M9 5.5V9.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="12" r="0.75" fill="#d97706" />
          </svg>
          <p className="text-sm text-amber-700">Carga y analiza un archivo primero para habilitar las exportaciones.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {options.map(opt => (
          <div key={opt.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColors[opt.icon]}`}>
              {opt.icon === 'pdf' ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.25" fill="none" />
                  <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.25" fill="none" />
                  <path d="M3 7H17M3 11H17M3 15H17M10 2V18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{opt.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </div>
            <button
              onClick={opt.action}
              disabled={!hasData || opt.loading}
              className={[
                'shrink-0 text-sm font-medium px-4 py-2 rounded-lg transition-colors',
                hasData && !opt.loading
                  ? opt.icon === 'pdf'
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    : opt.icon === 'excel'
                    ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                  : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed',
              ].join(' ')}
            >
              {opt.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
          <circle cx="9" cy="9" r="7" stroke="#94a3b8" strokeWidth="1.25" fill="none" />
          <path d="M9 5.5V9.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="12" r="0.75" fill="#94a3b8" />
        </svg>
        <p className="text-xs text-slate-500">
          El PDF se genera vía la función de impresión del navegador (Ctrl+P / Cmd+P). Selecciona "Guardar como PDF"
          en el diálogo de impresión. Los archivos Excel y CSV se descargan directamente al equipo.
        </p>
      </div>

      <div className="flex justify-start">
        <button onClick={() => goToStep(6)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Atrás a Hallazgos
        </button>
      </div>

      {/* Hidden print area */}
      {hasData && activeProject && (
        <div style={{ display: 'none' }}>
          <PrintReport ref={printRef} rows={mappedRows} project={activeProject} generatedAt={generatedAt} />
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-report { display: block !important; }
        }
      `}</style>
    </div>
  )
}
