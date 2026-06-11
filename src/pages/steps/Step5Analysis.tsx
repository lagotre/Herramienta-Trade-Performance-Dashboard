import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { groupByDimension, computeTrend, computeSKUTable, fmt } from '../../lib/kpis'
import type { DimRow, SKURow } from '../../lib/kpis'

const TABS = ['SKUs', 'Categorías', 'Canales', 'Campañas', 'Tiendas', 'Tendencias'] as const
type Tab = typeof TABS[number]

function numFmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

function DimTable({ rows, hasMargen }: { rows: DimRow[]; hasMargen: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">#</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">Nombre</th>
            <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Ventas</th>
            <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Unidades</th>
            <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Partic.</th>
            {hasMargen && <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Margen%</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => (
            <tr key={row.key} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2.5 font-medium text-slate-800 text-xs">{row.key}</td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-700 text-xs">{fmt.money(row.venta)}</td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-500 text-xs">{fmt.number(row.unidades)}</td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.min(row.participacion, 100)}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">{row.participacion.toFixed(1)}%</span>
                </div>
              </td>
              {hasMargen && (
                <td className={`px-4 py-2.5 text-right text-xs font-mono ${(row.margenPct ?? 0) >= 20 ? 'text-green-600' : (row.margenPct ?? 0) >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
                  {row.margenPct !== null ? `${row.margenPct.toFixed(1)}%` : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SKUTable({ rows }: { rows: SKURow[] }) {
  const hasMargen = rows.some(r => r.margen !== null)
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {['#', 'SKU', 'Producto', 'Categoría', 'Canal', 'Ventas', 'Unid.', 'Partic.'].map(h => (
              <th key={h} className={`text-xs font-semibold text-slate-500 px-3 py-2.5 ${['#','SKU','Producto','Categoría','Canal'].includes(h) ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
            {hasMargen && <th className="text-right text-xs font-semibold text-slate-500 px-3 py-2.5">Mg%</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => (
            <tr key={row.sku} className="hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
              <td className="px-3 py-2 font-mono text-slate-700 text-xs">{row.sku}</td>
              <td className="px-3 py-2 text-slate-600 text-xs max-w-[140px] truncate">{row.producto}</td>
              <td className="px-3 py-2 text-slate-500 text-xs">{row.categoria}</td>
              <td className="px-3 py-2 text-slate-500 text-xs">{row.canal}</td>
              <td className="px-3 py-2 text-right font-mono text-slate-700 text-xs">{fmt.money(row.venta)}</td>
              <td className="px-3 py-2 text-right font-mono text-slate-500 text-xs">{fmt.number(row.unidades)}</td>
              <td className="px-3 py-2 text-right text-xs text-slate-500 font-mono">{row.participacion.toFixed(1)}%</td>
              {hasMargen && (
                <td className={`px-3 py-2 text-right text-xs font-mono ${(row.margenPct ?? 0) >= 20 ? 'text-green-600' : (row.margenPct ?? 0) >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
                  {row.margenPct !== null ? `${row.margenPct.toFixed(1)}%` : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyTab({ tab, onGoUpload }: { tab: Tab; onGoUpload: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
      <p className="font-semibold text-slate-500 mb-1">Sin datos para {tab}</p>
      <p className="text-slate-400 text-sm mb-4">
        {tab === 'Campañas' ? 'Requiere columna "campaña" en tu archivo.' :
         tab === 'Tiendas'  ? 'Requiere columna "tienda" en tu archivo.' :
         'Carga un archivo Excel o CSV para activar este análisis.'}
      </p>
      <button onClick={onGoUpload} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
        Ir a carga de datos →
      </button>
    </div>
  )
}

export default function Step5Analysis() {
  const { goToStep, mappedRows } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('SKUs')

  const skuRows    = useMemo(() => mappedRows ? computeSKUTable(mappedRows, 50) : [], [mappedRows])
  const catRows    = useMemo(() => mappedRows ? groupByDimension(mappedRows, 'categoria', 20) : [], [mappedRows])
  const canalRows  = useMemo(() => mappedRows ? groupByDimension(mappedRows, 'canal', 15) : [], [mappedRows])
  const campRows   = useMemo(() => mappedRows ? groupByDimension(mappedRows, 'campana', 15) : [], [mappedRows])
  const tiendaRows = useMemo(() => mappedRows ? groupByDimension(mappedRows, 'tienda', 20) : [], [mappedRows])
  const trend      = useMemo(() => mappedRows ? computeTrend(mappedRows) : [], [mappedRows])
  const hasMargen  = useMemo(() => !!mappedRows?.some(r => r.margen !== null), [mappedRows])

  if (!mappedRows) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <EmptyTab tab="SKUs" onGoUpload={() => goToStep(2)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header + tabs */}
      <div className="bg-white border-b border-slate-200 px-6 pt-6 pb-0">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">Análisis específicos</h1>
          <p className="text-slate-500 text-sm mt-1">Rendimiento por dimensión · {fmt.number(mappedRows.length)} registros</p>
        </div>
        <div className="flex gap-1" role="tablist">
          {TABS.map(tab => (
            <button key={tab} role="tab" aria-selected={tab === activeTab} onClick={() => setActiveTab(tab)}
              className={['px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all -mb-px',
                tab === activeTab ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300',
              ].join(' ')}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl space-y-4">

          {activeTab === 'SKUs' && (
            <>
              {skuRows.length > 0 ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Top SKUs por venta (bar chart)</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={skuRows.slice(0, 15)} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={numFmt} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="sku" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: unknown) => [fmt.money(v as number), 'Ventas']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
                        <Bar dataKey="venta" fill="#6366f1" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <SKUTable rows={skuRows} />
                </>
              ) : <EmptyTab tab="SKUs" onGoUpload={() => goToStep(2)} />}
            </>
          )}

          {activeTab === 'Categorías' && (
            <>
              {catRows.length > 0 ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Ventas por categoría</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={catRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="key" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: unknown) => [fmt.money(v as number), 'Ventas']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Bar dataKey="venta" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <DimTable rows={catRows} hasMargen={hasMargen} />
                </>
              ) : <EmptyTab tab="Categorías" onGoUpload={() => goToStep(2)} />}
            </>
          )}

          {activeTab === 'Canales' && (
            <>
              {canalRows.length > 0 ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Ventas por canal</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={canalRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="key" width={130} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: unknown) => [fmt.money(v as number), 'Ventas']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Bar dataKey="venta" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <DimTable rows={canalRows} hasMargen={hasMargen} />
                </>
              ) : <EmptyTab tab="Canales" onGoUpload={() => goToStep(2)} />}
            </>
          )}

          {activeTab === 'Campañas' && (
            <>
              {campRows.length > 0 && campRows[0].key !== '(sin valor)' ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Ventas por campaña</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={campRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="key" width={130} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: unknown) => [fmt.money(v as number), 'Ventas']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Bar dataKey="venta" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <DimTable rows={campRows} hasMargen={hasMargen} />
                </>
              ) : <EmptyTab tab="Campañas" onGoUpload={() => goToStep(2)} />}
            </>
          )}

          {activeTab === 'Tiendas' && (
            <>
              {tiendaRows.length > 0 && tiendaRows[0].key !== '(sin valor)' ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Ventas por tienda (top 15)</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={tiendaRows.slice(0, 15)} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="key" width={130} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: unknown) => [fmt.money(v as number), 'Ventas']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Bar dataKey="venta" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <DimTable rows={tiendaRows} hasMargen={hasMargen} />
                </>
              ) : <EmptyTab tab="Tiendas" onGoUpload={() => goToStep(2)} />}
            </>
          )}

          {activeTab === 'Tendencias' && (
            <>
              {trend.length >= 2 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Evolución mensual de ventas y unidades</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trend} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="venta" orientation="left" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="unidades" orientation="right" tickFormatter={numFmt} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v: unknown, name: unknown) => [(name as string) === 'venta' ? fmt.money(v as number) : fmt.number(v as number), (name as string) === 'venta' ? 'Ventas' : 'Unidades']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                      <Line yAxisId="venta" type="monotone" dataKey="venta" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} name="venta" />
                      <Line yAxisId="unidades" type="monotone" dataKey="unidades" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 3" name="unidades" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left font-semibold text-slate-500 px-4 py-2">Mes</th>
                          <th className="text-right font-semibold text-slate-500 px-4 py-2">Ventas</th>
                          <th className="text-right font-semibold text-slate-500 px-4 py-2">Unidades</th>
                          <th className="text-right font-semibold text-slate-500 px-4 py-2">Var. ventas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {trend.map((p, i) => {
                          const prev = trend[i - 1]
                          const varPct = prev && prev.venta > 0 ? ((p.venta - prev.venta) / prev.venta) * 100 : null
                          return (
                            <tr key={p.key} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-medium text-slate-700">{p.mes}</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-700">{fmt.money(p.venta)}</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-500">{fmt.number(p.unidades)}</td>
                              <td className={`px-4 py-2 text-right font-mono ${varPct === null ? 'text-slate-300' : varPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {varPct === null ? '—' : `${varPct >= 0 ? '+' : ''}${varPct.toFixed(1)}%`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                  <p className="font-semibold text-slate-500 mb-1">Se requieren ≥ 2 meses de datos</p>
                  <p className="text-slate-400 text-sm">Asegúrate de que tu archivo tenga fechas y al menos dos meses distintos.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="border-t border-slate-100 bg-white px-6 py-4 flex justify-between">
        <button onClick={() => goToStep(4)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M7 5L4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Atrás
        </button>
        <button onClick={() => goToStep(6)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm">
          Ver hallazgos
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  )
}
