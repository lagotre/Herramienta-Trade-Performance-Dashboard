import React from 'react'
import type { MappedRow, Project } from '../types'
import { computeKPIs, groupByDimension, computeTrend, computeSKUTable, fmt } from '../lib/kpis'
import { runInsights } from '../lib/insights'
import type { KPISummary, DimRow, TrendPoint, SKURow } from '../lib/kpis'
import type { Insight } from '../lib/insights'

interface PrintReportProps {
  rows: MappedRow[]
  project: Project
  generatedAt: string
}

const SEV_LABEL: Record<string, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' }

const PrintReport = React.forwardRef<HTMLDivElement, PrintReportProps>(({ rows, project, generatedAt }, ref) => {
  const kpis: KPISummary   = computeKPIs(rows)
  const byCanal: DimRow[]  = groupByDimension(rows, 'canal', 10)
  const byCat: DimRow[]    = groupByDimension(rows, 'categoria', 10)
  const trend: TrendPoint[] = computeTrend(rows)
  const topSKUs: SKURow[]  = computeSKUTable(rows, 20)
  const insights: Insight[] = runInsights(rows).filter(i => !i.skipped)

  const periodStr = project.periodFrom && project.periodTo
    ? `${new Date(project.periodFrom + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })} – ${new Date(project.periodTo + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`
    : 'Período no especificado'

  return (
    <div ref={ref} className="print-report" style={{ fontFamily: 'system-ui, sans-serif', color: '#1e293b', background: '#fff', padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Cover ── */}
      <div style={{ marginBottom: 36, borderBottom: '3px solid #0f2035', paddingBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Informe ejecutivo · Trade Performance Dashboard
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f2035', marginBottom: 4 }}>{project.name}</h1>
            <p style={{ fontSize: 13, color: '#475569' }}>{periodStr}</p>
            {project.channels && project.channels.length > 0 && (
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Canales: {project.channels.join(', ')}</p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>Generado el</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{generatedAt}</p>
            <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 6 }}>100% procesado localmente · Sin envío de datos</p>
          </div>
        </div>
      </div>

      {/* ── 1. Dashboard KPIs ── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f2035', borderLeft: '4px solid #3b82f6', paddingLeft: 10, marginBottom: 16 }}>
          1. Dashboard de métricas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Ventas totales', value: fmt.money(kpis.totalVentas) },
            { label: 'Unidades vendidas', value: fmt.number(kpis.totalUnidades) },
            { label: 'Precio prom / unidad', value: fmt.money(kpis.precioPromedio) },
            ...(kpis.hasMargen && kpis.totalMargen !== null ? [
              { label: 'Margen total', value: fmt.money(kpis.totalMargen) },
              { label: 'Margen %', value: kpis.margenPct !== null ? `${kpis.margenPct.toFixed(1)}%` : '—' },
            ] : []),
            ...(kpis.ticketPromedio !== null ? [{ label: 'Ticket promedio', value: fmt.money(kpis.ticketPromedio) }] : []),
            { label: 'SKUs activos', value: fmt.number(kpis.totalSKUs) },
            { label: 'Categorías', value: fmt.number(kpis.totalCategorias) },
            { label: 'Canales', value: fmt.number(kpis.totalCanales) },
            ...(kpis.crecimientoVentas !== null ? [{ label: 'Crec. ventas MoM', value: fmt.pct(kpis.crecimientoVentas) }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{kpi.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#0f2035' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Canal table */}
        {byCanal.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Ventas por canal</p>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Canal', 'Ventas', 'Unidades', 'Participación', ...(kpis.hasMargen ? ['Margen%'] : [])].map(h => (
                    <th key={h} style={{ textAlign: h === 'Canal' ? 'left' : 'right', padding: '6px 10px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCanal.map((r, i) => (
                  <tr key={r.key} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '5px 10px', fontWeight: 500 }}>{r.key}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.money(r.venta)}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.number(r.unidades)}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{r.participacion.toFixed(1)}%</td>
                    {kpis.hasMargen && <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{r.margenPct !== null ? `${r.margenPct.toFixed(1)}%` : '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Category table */}
        {byCat.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Ventas por categoría</p>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Categoría', 'Ventas', 'Unidades', 'Participación'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Categoría' ? 'left' : 'right', padding: '6px 10px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCat.map((r, i) => (
                  <tr key={r.key} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '5px 10px', fontWeight: 500 }}>{r.key}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.money(r.venta)}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.number(r.unidades)}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{r.participacion.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Trend table */}
        {trend.length >= 2 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Tendencia mensual</p>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Mes', 'Ventas', 'Unidades', 'Var. ventas'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Mes' ? 'left' : 'right', padding: '6px 10px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trend.map((p, i) => {
                  const prev = trend[i - 1]
                  const varPct = prev && prev.venta > 0 ? ((p.venta - prev.venta) / prev.venta) * 100 : null
                  return (
                    <tr key={p.key} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '5px 10px', fontWeight: 500 }}>{p.mes}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.money(p.venta)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.number(p.unidades)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace', color: varPct === null ? '#94a3b8' : varPct >= 0 ? '#16a34a' : '#dc2626' }}>
                        {varPct === null ? '—' : `${varPct >= 0 ? '+' : ''}${varPct.toFixed(1)}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* ── 2. Top SKUs ── */}
      {topSKUs.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f2035', borderLeft: '4px solid #10b981', paddingLeft: 10, marginBottom: 16 }}>
            2. Análisis de SKUs (top {Math.min(topSKUs.length, 20)})
          </h2>
          <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['#', 'SKU', 'Producto', 'Categoría', 'Canal', 'Ventas', 'Unidades', 'Partic.', ...(topSKUs[0]?.margen !== null ? ['Mg%'] : [])].map(h => (
                  <th key={h} style={{ textAlign: ['#','SKU','Producto','Categoría','Canal'].includes(h) ? 'left' : 'right', padding: '6px 8px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topSKUs.slice(0, 20).map((r, i) => (
                <tr key={r.sku} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding: '4px 8px', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace', fontWeight: 600 }}>{r.sku}</td>
                  <td style={{ padding: '4px 8px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.producto}</td>
                  <td style={{ padding: '4px 8px', color: '#64748b' }}>{r.categoria}</td>
                  <td style={{ padding: '4px 8px', color: '#64748b' }}>{r.canal}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.money(r.venta)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt.number(r.unidades)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{r.participacion.toFixed(1)}%</td>
                  {r.margen !== null && (
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', color: (r.margenPct ?? 0) >= 20 ? '#16a34a' : (r.margenPct ?? 0) >= 10 ? '#d97706' : '#dc2626' }}>
                      {r.margenPct !== null ? `${r.margenPct.toFixed(1)}%` : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── 3. Insights / Hallazgos ── */}
      {insights.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f2035', borderLeft: '4px solid #f59e0b', paddingLeft: 10, marginBottom: 16 }}>
            3. Hallazgos e insights
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map((ins, idx) => (
              <div key={ins.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', background: ins.severity === 'alta' ? '#fff7f7' : ins.severity === 'media' ? '#fffbeb' : '#f0f9ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: ins.severity === 'alta' ? '#fee2e2' : ins.severity === 'media' ? '#fef3c7' : '#dbeafe', color: ins.severity === 'alta' ? '#b91c1c' : ins.severity === 'media' ? '#b45309' : '#1d4ed8', padding: '2px 8px', borderRadius: 99 }}>
                    {SEV_LABEL[ins.severity]}
                  </span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f2035' }}>{idx + 1}. {ins.title}</p>
                </div>
                <p style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>{ins.finding}</p>
                <p style={{ fontSize: 11, color: '#1d4ed8', background: '#eff6ff', borderRadius: 6, padding: '6px 10px' }}>
                  <strong>Acción sugerida:</strong> {ins.action}
                </p>
                {ins.data && ins.data.length > 0 && (
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    SKUs/elementos: {ins.data.slice(0, 8).join(', ')}{ins.data.length > 8 ? ` +${ins.data.length - 8}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: '#94a3b8' }}>Trade Performance Dashboard · Todos los datos procesados localmente</p>
        <p style={{ fontSize: 10, color: '#cbd5e1' }}>{generatedAt}</p>
      </div>
    </div>
  )
})

PrintReport.displayName = 'PrintReport'
export default PrintReport
