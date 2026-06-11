import type { MappedRow } from '../types'
import { parseDate, toMonthKey, groupByDimension } from './kpis'

export interface Insight {
  id: string
  title: string
  severity: 'alta' | 'media' | 'baja'
  finding: string      // 1-sentence finding with the real number
  action: string       // suggested business action
  skipped?: string     // reason if rule was skipped (missing column, etc.)
  data?: string[]      // sample SKUs/categories
}

export interface InsightThresholds {
  paretoTopPct: number
  paretoSalesPct: number
  channelConcentrationPct: number
  categoryDeclinePct: number
  winnerDecilePct: number
  slowBottomPct: number
  marginTrapTopPct: number
  inventoryRiskThreshold: number
}

export const DEFAULT_THRESHOLDS: InsightThresholds = {
  paretoTopPct: 0.20,
  paretoSalesPct: 0.80,
  channelConcentrationPct: 0.60,
  categoryDeclinePct: -0.10,
  winnerDecilePct: 0.90,
  slowBottomPct: 0.25,
  marginTrapTopPct: 0.75,
  inventoryRiskThreshold: 2.0,  // days of stock threshold for "slow"
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

// ─── Rule 1: Pareto / Concentración ───────────────────────────────────────────

function paretoInsight(rows: MappedRow[], t: InsightThresholds): Insight {
  const bySkuMap = new Map<string, number>()
  for (const r of rows) {
    const k = r.sku ?? '(sin SKU)'
    bySkuMap.set(k, (bySkuMap.get(k) ?? 0) + (r.venta ?? 0))
  }
  const skus = [...bySkuMap.entries()].sort((a, b) => b[1] - a[1])
  const totalVenta = skus.reduce((s, [, v]) => s + v, 0)
  const topN = Math.ceil(skus.length * t.paretoTopPct)
  const topVenta = skus.slice(0, topN).reduce((s, [, v]) => s + v, 0)
  const topPct = totalVenta > 0 ? topVenta / totalVenta : 0

  if (topPct >= t.paretoSalesPct) {
    return {
      id: 'pareto',
      title: 'Alta concentración de ventas (Pareto)',
      severity: 'alta',
      finding: `${topN} SKU(s) (el ${Math.round(t.paretoTopPct * 100)}% del portafolio) generan el ${(topPct * 100).toFixed(0)}% de las ventas. Riesgo de dependencia.`,
      action: 'Diversifica el portafolio activo. Evalúa si los SKUs de cola agregan valor o solo complejidad operativa.',
      data: skus.slice(0, topN).map(([k]) => k),
    }
  }
  return {
    id: 'pareto',
    title: 'Concentración de ventas (Pareto)',
    severity: 'baja',
    finding: `El top ${Math.round(t.paretoTopPct * 100)}% de SKUs concentra el ${(topPct * 100).toFixed(0)}% de las ventas. Distribución saludable.`,
    action: 'Mantén el balance del portafolio y sigue monitoreando la concentración mes a mes.',
  }
}

// ─── Rule 2: SKUs ganadores ────────────────────────────────────────────────────

function winnersInsight(rows: MappedRow[], t: InsightThresholds): Insight {
  const bySkuMap = new Map<string, { venta: number; margen: number; n: number }>()
  const hasMargen = rows.some(r => r.margen !== null)

  for (const r of rows) {
    const k = r.sku ?? '(sin SKU)'
    const cur = bySkuMap.get(k) ?? { venta: 0, margen: 0, n: 0 }
    bySkuMap.set(k, { venta: cur.venta + (r.venta ?? 0), margen: cur.margen + (r.margen ?? 0), n: cur.n + 1 })
  }

  const skus = [...bySkuMap.entries()].sort((a, b) => b[1].venta - a[1].venta)
  const ventas = skus.map(([, v]) => v.venta)
  const ventaThreshold = percentile(ventas, t.winnerDecilePct)

  const topByVenta = skus.filter(([, v]) => v.venta >= ventaThreshold)

  if (!hasMargen) {
    return {
      id: 'winners',
      title: 'SKUs con mejor desempeño',
      severity: 'baja',
      finding: `${topByVenta.length} SKU(s) están en el top decil por venta: ${topByVenta.slice(0, 3).map(([k]) => k).join(', ')}${topByVenta.length > 3 ? '...' : ''}.`,
      action: 'Asegura disponibilidad permanente y visibilidad en góndola para estos SKUs clave.',
      data: topByVenta.map(([k]) => k),
    }
  }

  const margenPcts = skus.map(([, v]) => v.venta > 0 ? v.margen / v.venta : 0)
  const medianMargenPct = median(margenPcts)
  const winners = topByVenta.filter(([, v]) => v.venta > 0 && (v.margen / v.venta) > medianMargenPct)

  return {
    id: 'winners',
    title: 'SKUs ganadores (volumen + margen)',
    severity: 'baja',
    finding: `${winners.length} SKU(s) combinan alto volumen (top ${100 - Math.round(t.winnerDecilePct * 100)}%) y margen por encima de la mediana (${(medianMargenPct * 100).toFixed(1)}%): ${winners.slice(0, 3).map(([k]) => k).join(', ')}${winners.length > 3 ? '...' : ''}.`,
    action: 'Prioriza estos SKUs en activaciones de trade, negoción de espacio en góndola y presupuesto de campaña.',
    data: winners.map(([k]) => k),
  }
}

// ─── Rule 3: SKUs lentos / cola muerta ────────────────────────────────────────

function slowSkusInsight(rows: MappedRow[], t: InsightThresholds): Insight {
  const bySkuMap = new Map<string, { unidades: number; venta: number }>()
  for (const r of rows) {
    const k = r.sku ?? '(sin SKU)'
    const cur = bySkuMap.get(k) ?? { unidades: 0, venta: 0 }
    bySkuMap.set(k, { unidades: cur.unidades + (r.unidades ?? 0), venta: cur.venta + (r.venta ?? 0) })
  }

  const skus = [...bySkuMap.entries()]
  const unidades = skus.map(([, v]) => v.unidades)
  const bottomThreshold = percentile(unidades, t.slowBottomPct)
  const zeroSales = skus.filter(([, v]) => v.venta === 0 || v.unidades === 0)
  const slowSkus = skus.filter(([, v]) => v.unidades > 0 && v.unidades <= bottomThreshold && !zeroSales.find(([k]) => k === v.toString()))

  const allSlow = [...new Set([...zeroSales.map(([k]) => k), ...slowSkus.map(([k]) => k)])]

  if (allSlow.length === 0) {
    return {
      id: 'slow-skus',
      title: 'SKUs lentos / cola muerta',
      severity: 'baja',
      finding: 'No se detectaron SKUs con baja rotación en el periodo analizado.',
      action: 'Continúa monitoreando la rotación mensualmente para detectar SKUs en riesgo tempranamente.',
    }
  }

  return {
    id: 'slow-skus',
    title: 'SKUs lentos / cola muerta',
    severity: 'alta',
    finding: `${allSlow.length} SKU(s) están en el cuartil inferior de rotación o con venta cero: ${allSlow.slice(0, 3).join(', ')}${allSlow.length > 3 ? ` y ${allSlow.length - 3} más` : ''}.`,
    action: 'Considera liquidar o relanzar estos SKUs. Evalúa una acción de flash sale o negociar con el canal para mejorar su ubicación en góndola.',
    data: allSlow,
  }
}

// ─── Rule 4: Categoría en caída ───────────────────────────────────────────────

function categoryDeclineInsight(rows: MappedRow[], t: InsightThresholds): Insight {
  const monthCatMap = new Map<string, Map<string, number>>()

  for (const r of rows) {
    const d = parseDate(r.fecha)
    if (!d || !r.categoria) continue
    const mes = toMonthKey(d)
    if (!monthCatMap.has(mes)) monthCatMap.set(mes, new Map())
    const catMap = monthCatMap.get(mes)!
    catMap.set(r.categoria, (catMap.get(r.categoria) ?? 0) + (r.venta ?? 0))
  }

  const meses = [...monthCatMap.keys()].sort()
  if (meses.length < 2) {
    return {
      id: 'category-decline',
      title: 'Categorías en caída',
      severity: 'baja',
      skipped: 'Requiere al menos 2 periodos (meses) de datos para calcular crecimiento.',
      finding: 'No se puede calcular crecimiento con un solo periodo de datos.',
      action: 'Carga un archivo con al menos 2 meses de datos para activar este análisis.',
    }
  }

  const lastMes = meses[meses.length - 1]
  const prevMes = meses[meses.length - 2]
  const lastMap = monthCatMap.get(lastMes)!
  const prevMap = monthCatMap.get(prevMes)!

  const declining: Array<{ cat: string; growth: number }> = []
  for (const [cat, lastVenta] of lastMap) {
    const prevVenta = prevMap.get(cat) ?? 0
    if (prevVenta > 0) {
      const growth = (lastVenta - prevVenta) / prevVenta
      if (growth < t.categoryDeclinePct) declining.push({ cat, growth })
    }
  }

  declining.sort((a, b) => a.growth - b.growth)

  if (declining.length === 0) {
    return {
      id: 'category-decline',
      title: 'Categorías en caída',
      severity: 'baja',
      finding: `Ninguna categoría muestra caída mayor al ${Math.abs(t.categoryDeclinePct * 100).toFixed(0)}% MoM en el último periodo.`,
      action: 'Buen desempeño general. Monitorea la tendencia en las próximas semanas.',
    }
  }

  const worst = declining[0]
  return {
    id: 'category-decline',
    title: 'Categorías en caída',
    severity: 'alta',
    finding: `${declining.length} categoría(s) con caída > ${Math.abs(t.categoryDeclinePct * 100).toFixed(0)}% MoM: ${declining.slice(0, 3).map(d => `${d.cat} (${(d.growth * 100).toFixed(1)}%)`).join(', ')}. Peor caso: ${worst.cat} con ${(worst.growth * 100).toFixed(1)}%.`,
    action: 'Investiga las causas: ¿problemas de abastecimiento, actividad de la competencia o cambio en el comportamiento del consumidor? Diseña un plan de recuperación con el equipo de categoría.',
    data: declining.map(d => d.cat),
  }
}

// ─── Rule 5: Sobredependencia de canal ────────────────────────────────────────

function channelDependenceInsight(rows: MappedRow[], t: InsightThresholds): Insight {
  const byCanal = groupByDimension(rows, 'canal', 20)
  const dominant = byCanal.find(c => c.participacion >= t.channelConcentrationPct * 100)

  if (!dominant) {
    return {
      id: 'channel-dependence',
      title: 'Dependencia de canal',
      severity: 'baja',
      finding: `Ningún canal supera el ${Math.round(t.channelConcentrationPct * 100)}% de participación. Canal más grande: ${byCanal[0]?.key ?? 'N/A'} con ${byCanal[0]?.participacion.toFixed(1) ?? 0}%.`,
      action: 'Distribución de canales saludable. Sigue fortaleciendo los canales emergentes.',
    }
  }

  return {
    id: 'channel-dependence',
    title: 'Sobredependencia de canal',
    severity: 'media',
    finding: `El canal "${dominant.key}" concentra el ${dominant.participacion.toFixed(1)}% de las ventas totales. Alta dependencia de un solo canal.`,
    action: `Diversifica los canales de distribución. Evalúa activamente ${byCanal.filter(c => c.key !== dominant.key).slice(0, 2).map(c => c.key).join(' y ')} como canales estratégicos de crecimiento.`,
  }
}

// ─── Rule 6: Trampa de margen ─────────────────────────────────────────────────

function marginTrapInsight(rows: MappedRow[], t: InsightThresholds): Insight {
  const hasMargen = rows.some(r => r.margen !== null)
  if (!hasMargen) {
    return {
      id: 'margin-trap',
      title: 'Trampa de margen',
      severity: 'baja',
      skipped: 'Requiere columna de margen.',
      finding: 'No se puede evaluar sin datos de margen.',
      action: 'Añade la columna de margen a tu archivo de ventas para activar este análisis.',
    }
  }

  const bySkuMap = new Map<string, { venta: number; margen: number }>()
  for (const r of rows) {
    const k = r.sku ?? '(sin SKU)'
    const cur = bySkuMap.get(k) ?? { venta: 0, margen: 0 }
    bySkuMap.set(k, { venta: cur.venta + (r.venta ?? 0), margen: cur.margen + (r.margen ?? 0) })
  }

  const skus = [...bySkuMap.entries()]
  const ventas = skus.map(([, v]) => v.venta)
  const margenPcts = skus.map(([, v]) => v.venta > 0 ? v.margen / v.venta : 0)
  const ventaQ3 = percentile(ventas, t.marginTrapTopPct)
  const medianMargen = median(margenPcts)

  const traps = skus.filter(([, v]) => {
    const mp = v.venta > 0 ? v.margen / v.venta : 0
    return v.venta >= ventaQ3 && mp < medianMargen
  })

  if (traps.length === 0) {
    return {
      id: 'margin-trap',
      title: 'Trampa de margen',
      severity: 'baja',
      finding: 'No se detectaron SKUs con alto volumen y bajo margen simultáneamente.',
      action: 'Estructura de margen saludable. Continúa monitoreando la rentabilidad por SKU.',
    }
  }

  return {
    id: 'margin-trap',
    title: 'Trampa de margen',
    severity: 'media',
    finding: `${traps.length} SKU(s) tienen alto volumen de ventas pero margen por debajo de la mediana (${(medianMargen * 100).toFixed(1)}%): ${traps.slice(0, 3).map(([k]) => k).join(', ')}.`,
    action: 'Revisa la estructura de precios y costos de estos SKUs. Considera negociar mejores condiciones con el proveedor o ajustar el precio de venta al canal.',
    data: traps.map(([k]) => k),
  }
}

// ─── Rule 7: Campaña sin impacto ──────────────────────────────────────────────

function campaignImpactInsight(rows: MappedRow[]): Insight {
  const hasCampana = rows.some(r => r.campana)
  if (!hasCampana) {
    return {
      id: 'campaign-impact',
      title: 'Impacto de campaña',
      severity: 'baja',
      skipped: 'No hay columna de campaña en los datos.',
      finding: 'No se detectaron campañas en los datos cargados.',
      action: 'Añade una columna "Campaña" a tu archivo para activar el análisis de uplift.',
    }
  }

  const conCampana = rows.filter(r => r.campana)
  const sinCampana = rows.filter(r => !r.campana)

  if (conCampana.length === 0 || sinCampana.length === 0) {
    return {
      id: 'campaign-impact',
      title: 'Impacto de campaña',
      severity: 'baja',
      finding: 'Datos de campaña insuficientes para comparar.',
      action: 'Se necesitan datos con y sin campaña en el mismo periodo para calcular el uplift.',
    }
  }

  const avgConCampana = conCampana.reduce((s, r) => s + (r.venta ?? 0), 0) / conCampana.length
  const avgSinCampana = sinCampana.reduce((s, r) => s + (r.venta ?? 0), 0) / sinCampana.length
  const uplift = avgSinCampana > 0 ? ((avgConCampana - avgSinCampana) / avgSinCampana) * 100 : 0
  const campaigns = [...new Set(conCampana.map(r => r.campana).filter(Boolean) as string[])]

  if (uplift > 10) {
    return {
      id: 'campaign-impact',
      title: 'Campaña con impacto positivo',
      severity: 'baja',
      finding: `Las filas con campaña muestran un promedio de venta ${uplift.toFixed(1)}% mayor vs. filas sin campaña (señal direccional, no incremental pura). Campañas activas: ${campaigns.slice(0, 3).join(', ')}.`,
      action: 'Escala las campañas con mayor uplift. Documenta la mecánica para replicarla en los próximos periodos.',
    }
  }

  return {
    id: 'campaign-impact',
    title: 'Campaña sin impacto claro',
    severity: 'media',
    finding: `Las filas con campaña muestran solo ${uplift.toFixed(1)}% más de venta promedio vs. baseline (señal direccional). Campañas: ${campaigns.slice(0, 3).join(', ')}.`,
    action: 'Evalúa el diseño y mecánica de las campañas activas. Considera ajustar el incentivo al shopper o el canal de activación.',
  }
}

// ─── Rule 8: Inventario en riesgo ─────────────────────────────────────────────

function inventoryRiskInsight(rows: MappedRow[], _t: InsightThresholds): Insight {
  const hasInventario = rows.some(r => r.inventario !== null && r.inventario !== undefined)
  if (!hasInventario) {
    return {
      id: 'inventory-risk',
      title: 'Inventario en riesgo',
      severity: 'baja',
      skipped: 'Requiere columna de inventario.',
      finding: 'No se puede calcular rotación sin datos de inventario.',
      action: 'Añade la columna de inventario a tu archivo para activar este análisis.',
    }
  }

  const bySkuMap = new Map<string, { unidades: number; inventario: number; sku: string }>()
  for (const r of rows) {
    const k = r.sku ?? '(sin SKU)'
    const cur = bySkuMap.get(k) ?? { unidades: 0, inventario: 0, sku: k }
    bySkuMap.set(k, { sku: k, unidades: cur.unidades + (r.unidades ?? 0), inventario: Math.max(cur.inventario, r.inventario ?? 0) })
  }

  const skuData = [...bySkuMap.values()].filter(v => v.inventario > 0)
  const inventarios = skuData.map(v => v.inventario)
  const invQ3 = percentile(inventarios, 0.75)
  const rotaciones = skuData.map(v => v.unidades > 0 ? v.inventario / v.unidades : Infinity)
  const medianRot = median(rotaciones.filter(r => r !== Infinity))

  const atRisk = skuData.filter(v => v.inventario >= invQ3 && (v.unidades === 0 || v.inventario / v.unidades > medianRot * 2))

  if (atRisk.length === 0) {
    return {
      id: 'inventory-risk',
      title: 'Inventario en riesgo',
      severity: 'baja',
      finding: 'No se detectaron SKUs con alto inventario y baja rotación simultáneamente.',
      action: 'Niveles de inventario saludables. Mantén el monitoreo mensual.',
    }
  }

  return {
    id: 'inventory-risk',
    title: 'Inventario en riesgo de obsolescencia',
    severity: 'alta',
    finding: `${atRisk.length} SKU(s) tienen inventario alto (cuartil superior) combinado con baja rotación: ${atRisk.slice(0, 3).map(v => v.sku).join(', ')}.`,
    action: 'Diseña una acción de liquidación (descuento por volumen, combo, flash sale) antes de que el inventario se venza o quede obsoleto. Coordina con logística para redistribuir entre canales.',
    data: atRisk.map(v => v.sku),
  }
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export function runInsights(rows: MappedRow[], thresholds = DEFAULT_THRESHOLDS): Insight[] {
  if (rows.length === 0) return []
  return [
    paretoInsight(rows, thresholds),
    winnersInsight(rows, thresholds),
    slowSkusInsight(rows, thresholds),
    categoryDeclineInsight(rows, thresholds),
    channelDependenceInsight(rows, thresholds),
    marginTrapInsight(rows, thresholds),
    campaignImpactInsight(rows),
    inventoryRiskInsight(rows, thresholds),
  ]
}
