import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { computeKPIs, groupByDimension, computeTrend, computeSKUTable, fmt } from '../../lib/kpis'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

function numFmt(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

function KPICard({ label, value, sub, color = 'blue', trend, trendLabel }: {
  label: string; value: string; sub?: string; color?: 'blue' | 'green' | 'amber' | 'slate'
  trend?: number | null; trendLabel?: string
}) {
  const cls = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    slate: 'bg-slate-50 border-slate-100 text-slate-600',
  }[color]
  const up = trend != null && trend > 0
  const dn = trend != null && trend < 0
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      {trend != null && (
        <p className={`text-xs font-medium mt-1.5 ${up ? 'text-green-600' : dn ? 'text-red-500' : 'text-slate-400'}`}>
          {up ? '▲' : dn ? '▼' : '='} {Math.abs(trend).toFixed(1)}% {trendLabel ?? 'MoM'}
        </p>
      )}
    </div>
  )
}

export default function Step4Summary() {
  const { goToStep, mappedRows, activeProject } = useApp()

  const kpis    = useMemo(() => mappedRows ? computeKPIs(mappedRows) : null, [mappedRows])
  const byCanal = useMemo(() => mappedRows ? groupByDimension(mappedRows, 'canal', 8) : [], [mappedRows])
  const byCat   = useMemo(() => mappedRows ? groupByDimension(mappedRows, 'categoria', 8) : [], [mappedRows])
  const trend   = useMemo(() => mappedRows ? computeTrend(mappedRows) : [], [mappedRows])
  const topSKUs = useMemo(() => mappedRows ? computeSKUTable(mappedRows, 10) : [], [mappedRows])

  if (!mappedRows || !kpis) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="font-semibold text-slate-600 mb-1">Sin datos cargados</p>
          <p className="text-slate-400 text-sm mb-4">Completa los pasos anteriores para ver el resumen.</p>
          <button onClick={() => goToStep(2)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ir a carga de datos →
          </button>
        </div>
      </div>
    )
  }

  const periodStr = activeProject?.periodFrom && activeProject.periodTo
    ? ` · ${new Date(activeProject.periodFrom + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })} – ${new Date(activeProject.periodTo + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}`
    : ''

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

      <div>
        <h1 className="text-xl font-bold text-slate-900">Resumen ejecutivo</h1>
        <p className="text-slate-500 text-sm mt-1">
          {activeProject?.name} · {fmt.number(mappedRows.length)} registros{periodStr}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Ventas totales" value={fmt.money(kpis.totalVentas)}
          sub={`${fmt.number(kpis.totalUnidades)} unidades`} color="blue" trend={kpis.crecimientoVentas} />
        <KPICard label="Precio prom./unid." value={fmt.money(kpis.precioPromedio)} color="slate" />
        {kpis.hasMargen && kpis.totalMargen !== null && (
          <KPICard label="Margen total" value={fmt.money(kpis.totalMargen)}
            sub={kpis.margenPct !== null ? `${kpis.margenPct.toFixed(1)}% s/ ventas` : undefined} color="green" />
        )}
        {kpis.ticketPromedio !== null && (
          <KPICard label="Ticket promedio" value={fmt.money(kpis.ticketPromedio)} color="amber" />
        )}
        <KPICard label="SKUs activos" value={fmt.number(kpis.totalSKUs)}
          sub={`${kpis.totalCategorias} categorías`} color="slate" />
        <KPICard label="Canales" value={fmt.number(kpis.totalCanales)}
          sub={`${kpis.periodos.length} periodo(s)`} color="slate" />
        {kpis.crecimientoUnidades !== null && (
          <KPICard label="Crec. unidades" value={fmt.pct(kpis.crecimientoUnidades)}
            trend={kpis.crecimientoUnidades} color={kpis.crecimientoUnidades >= 0 ? 'green' : 'amber'} />
        )}
      </div>

      {/* Bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {byCanal.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Ventas por canal</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCanal} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="key" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => [fmt.money(v as number), 'Ventas']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="venta" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {byCat.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Top categorías</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCat} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="key" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => [fmt.money(v as number), 'Ventas']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="venta" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trend */}
      {trend.length >= 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Tendencia mensual</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={numFmt} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: unknown, name: unknown) => [(name as string) === 'venta' ? fmt.money(v as number) : fmt.number(v as number), (name as string) === 'venta' ? 'Ventas' : 'Unidades']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend formatter={v => v === 'venta' ? 'Ventas' : 'Unidades'} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="venta" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="unidades" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top SKUs */}
      {topSKUs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Top 10 SKUs por venta</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['#', 'SKU / Producto', 'Categoría', 'Ventas', 'Unid.', 'Partic.'].map(h => (
                    <th key={h} className={`text-xs font-semibold text-slate-500 px-4 py-2.5 ${h === '#' || h === 'SKU / Producto' || h === 'Categoría' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                  {topSKUs[0]?.margen !== null && (
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Margen%</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topSKUs.map((row, i) => (
                  <tr key={row.sku} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800 text-xs">{row.sku}</p>
                      {row.producto !== row.sku && <p className="text-slate-400 text-xs mt-0.5">{row.producto}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{row.categoria}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700 text-xs">{fmt.money(row.venta)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500 text-xs">{fmt.number(row.unidades)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.min(row.participacion, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 font-mono w-10 text-right">{row.participacion.toFixed(1)}%</span>
                      </div>
                    </td>
                    {row.margen !== null && (
                      <td className={`px-4 py-2.5 text-right text-xs font-mono ${(row.margenPct ?? 0) >= 20 ? 'text-green-600' : (row.margenPct ?? 0) >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
                        {row.margenPct !== null ? `${row.margenPct.toFixed(1)}%` : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Channel participation strip */}
      {byCanal.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Participación de canales</p>
          <div className="flex rounded-full overflow-hidden h-5 mb-3">
            {byCanal.map((c, i) => (
              <div key={c.key} style={{ width: `${c.participacion}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                title={`${c.key}: ${c.participacion.toFixed(1)}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {byCanal.map((c, i) => (
              <div key={c.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-xs text-slate-600">{c.key}</span>
                <span className="text-xs text-slate-400">{c.participacion.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={() => goToStep(3)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Atrás
        </button>
        <button onClick={() => goToStep(5)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm">
          Ver análisis detallado
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  )
}
