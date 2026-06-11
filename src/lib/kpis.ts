import type { MappedRow } from '../types'

// ─── Formatting ───────────────────────────────────────────────────────────────

export const fmt = {
  money: (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n),
  number: (n: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n),
  pct: (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`,
  pctAbs: (n: number) => `${n.toFixed(1)}%`,
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function parseDate(s: string | null): Date | null {
  if (!s) return null
  let d = new Date(s)
  if (!isNaN(d.getTime())) return d
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const year = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])
    d = new Date(year, parseInt(m[2]) - 1, parseInt(m[1]))
    if (!isNaN(d.getTime())) return d
  }
  return null
}

export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTH_LABELS[month] ?? month} ${year}`
}

// ─── Core KPI summary ─────────────────────────────────────────────────────────

export interface KPISummary {
  totalVentas: number
  totalUnidades: number
  totalMargen: number | null
  margenPct: number | null
  precioPromedio: number
  ticketPromedio: number | null
  crecimientoVentas: number | null   // % MoM last two months
  crecimientoUnidades: number | null
  hasMargen: boolean
  hasInventario: boolean
  hasTransacciones: boolean
  hasCampana: boolean
  hasTienda: boolean
  periodos: string[]   // sorted month keys
  totalSKUs: number
  totalCategorias: number
  totalCanales: number
}

export function computeKPIs(rows: MappedRow[]): KPISummary {
  if (rows.length === 0) {
    return {
      totalVentas: 0, totalUnidades: 0, totalMargen: null, margenPct: null,
      precioPromedio: 0, ticketPromedio: null, crecimientoVentas: null,
      crecimientoUnidades: null, hasMargen: false, hasInventario: false,
      hasTransacciones: false, hasCampana: false, hasTienda: false,
      periodos: [], totalSKUs: 0, totalCategorias: 0, totalCanales: 0,
    }
  }

  const hasMargen = rows.some(r => r.margen !== null && r.margen !== undefined)
  const hasInventario = rows.some(r => r.inventario !== null && r.inventario !== undefined)
  const hasTransacciones = rows.some(r => r.num_transacciones !== null && r.num_transacciones !== undefined)
  const hasCampana = rows.some(r => r.campana !== null && r.campana !== undefined)
  const hasTienda = rows.some(r => r.tienda !== null && r.tienda !== undefined)

  const totalVentas = rows.reduce((s, r) => s + (r.venta ?? 0), 0)
  const totalUnidades = rows.reduce((s, r) => s + (r.unidades ?? 0), 0)
  const totalMargen = hasMargen ? rows.reduce((s, r) => s + (r.margen ?? 0), 0) : null
  const margenPct = totalMargen !== null && totalVentas > 0 ? (totalMargen / totalVentas) * 100 : null
  const precioPromedio = totalUnidades > 0 ? totalVentas / totalUnidades : 0
  const totalTransacciones = hasTransacciones ? rows.reduce((s, r) => s + (r.num_transacciones ?? 0), 0) : null
  const ticketPromedio = totalTransacciones && totalTransacciones > 0 ? totalVentas / totalTransacciones : null

  // Months for trend + growth
  const monthMap = new Map<string, { venta: number; unidades: number }>()
  for (const r of rows) {
    const d = parseDate(r.fecha)
    if (!d) continue
    const key = toMonthKey(d)
    const cur = monthMap.get(key) ?? { venta: 0, unidades: 0 }
    monthMap.set(key, { venta: cur.venta + (r.venta ?? 0), unidades: cur.unidades + (r.unidades ?? 0) })
  }
  const periodos = [...monthMap.keys()].sort()

  let crecimientoVentas: number | null = null
  let crecimientoUnidades: number | null = null
  if (periodos.length >= 2) {
    const last = monthMap.get(periodos[periodos.length - 1])!
    const prev = monthMap.get(periodos[periodos.length - 2])!
    if (prev.venta > 0) crecimientoVentas = ((last.venta - prev.venta) / prev.venta) * 100
    if (prev.unidades > 0) crecimientoUnidades = ((last.unidades - prev.unidades) / prev.unidades) * 100
  }

  const totalSKUs = new Set(rows.map(r => r.sku).filter(Boolean)).size
  const totalCategorias = new Set(rows.map(r => r.categoria).filter(Boolean)).size
  const totalCanales = new Set(rows.map(r => r.canal).filter(Boolean)).size

  return {
    totalVentas, totalUnidades, totalMargen, margenPct, precioPromedio, ticketPromedio,
    crecimientoVentas, crecimientoUnidades, hasMargen, hasInventario,
    hasTransacciones, hasCampana, hasTienda, periodos,
    totalSKUs, totalCategorias, totalCanales,
  }
}

// ─── Group by dimension ────────────────────────────────────────────────────────

export interface DimRow {
  key: string
  venta: number
  unidades: number
  margen: number | null
  margenPct: number | null
  participacion: number
  filas: number
}

export function groupByDimension(rows: MappedRow[], field: keyof MappedRow, topN = 10): DimRow[] {
  const totalVenta = rows.reduce((s, r) => s + (r.venta ?? 0), 0)
  const map = new Map<string, { venta: number; unidades: number; margen: number; filas: number }>()

  for (const r of rows) {
    const key = String(r[field] ?? '(sin valor)').trim() || '(sin valor)'
    const cur = map.get(key) ?? { venta: 0, unidades: 0, margen: 0, filas: 0 }
    map.set(key, {
      venta: cur.venta + (r.venta ?? 0),
      unidades: cur.unidades + (r.unidades ?? 0),
      margen: cur.margen + (r.margen ?? 0),
      filas: cur.filas + 1,
    })
  }

  const hasMargen = rows.some(r => r.margen !== null)

  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      venta: v.venta,
      unidades: v.unidades,
      margen: hasMargen ? v.margen : null,
      margenPct: hasMargen && v.venta > 0 ? (v.margen / v.venta) * 100 : null,
      participacion: totalVenta > 0 ? (v.venta / totalVenta) * 100 : 0,
      filas: v.filas,
    }))
    .sort((a, b) => b.venta - a.venta)
    .slice(0, topN)
}

// ─── Trend ────────────────────────────────────────────────────────────────────

export interface TrendPoint {
  mes: string
  key: string
  venta: number
  unidades: number
}

export function computeTrend(rows: MappedRow[]): TrendPoint[] {
  const map = new Map<string, { venta: number; unidades: number }>()
  for (const r of rows) {
    const d = parseDate(r.fecha)
    if (!d) continue
    const key = toMonthKey(d)
    const cur = map.get(key) ?? { venta: 0, unidades: 0 }
    map.set(key, { venta: cur.venta + (r.venta ?? 0), unidades: cur.unidades + (r.unidades ?? 0) })
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, mes: monthLabel(key), ...v }))
}

// ─── SKU table ────────────────────────────────────────────────────────────────

export interface SKURow {
  sku: string
  producto: string
  categoria: string
  canal: string
  venta: number
  unidades: number
  margen: number | null
  margenPct: number | null
  participacion: number
}

export function computeSKUTable(rows: MappedRow[], topN = 50): SKURow[] {
  const totalVenta = rows.reduce((s, r) => s + (r.venta ?? 0), 0)
  const hasMargen = rows.some(r => r.margen !== null)
  const map = new Map<string, { sku: string; producto: string; categoria: string; canal: string; venta: number; unidades: number; margen: number }>()

  for (const r of rows) {
    const key = r.sku ?? '(sin SKU)'
    const cur = map.get(key) ?? { sku: key, producto: r.producto ?? key, categoria: r.categoria ?? '—', canal: r.canal ?? '—', venta: 0, unidades: 0, margen: 0 }
    map.set(key, {
      ...cur,
      venta: cur.venta + (r.venta ?? 0),
      unidades: cur.unidades + (r.unidades ?? 0),
      margen: cur.margen + (r.margen ?? 0),
    })
  }

  return [...map.values()]
    .map(v => ({
      sku: v.sku,
      producto: v.producto,
      categoria: v.categoria,
      canal: v.canal,
      venta: v.venta,
      unidades: v.unidades,
      margen: hasMargen ? v.margen : null,
      margenPct: hasMargen && v.venta > 0 ? (v.margen / v.venta) * 100 : null,
      participacion: totalVenta > 0 ? (v.venta / totalVenta) * 100 : 0,
    }))
    .sort((a, b) => b.venta - a.venta)
    .slice(0, topN)
}
