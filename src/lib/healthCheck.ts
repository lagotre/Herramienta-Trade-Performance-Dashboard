import type { MappedRow, HealthReport, HealthIssue, ColumnMapping } from '../types'

const CANONICAL_CHANNELS = [
  'Tienda Física', 'E-commerce', 'WhatsApp Business', 'Marketplace',
  'Redes Sociales', 'Email/CRM', 'Supermercados', 'Grandes superficies',
  'Mayoristas', 'Canal tradicional', 'Tiendas de conveniencia', 'Superetes',
]

function norm(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function channelScore(raw: string, canonical: string): number {
  const a = norm(raw)
  const b = norm(canonical)
  if (a === b) return 1
  if (b.includes(a) || a.includes(b)) return 0.8
  const wordsA = a.split(/\s+/)
  const wordsB = b.split(/\s+/)
  const overlap = wordsA.filter(w => wordsB.includes(w)).length
  if (overlap > 0) return 0.6
  return 0
}

function suggestChannel(raw: string): string | null {
  let best = { ch: '', score: 0 }
  for (const ch of CANONICAL_CHANNELS) {
    const score = channelScore(raw, ch)
    if (score > best.score) best = { ch, score }
  }
  return best.score >= 0.6 ? best.ch : null
}

export function runHealthChecks(rows: MappedRow[], mapping: ColumnMapping): HealthReport {
  const issues: HealthIssue[] = []

  // 1. Ventas negativas o vacías (BLOCKING)
  const nullSales = rows.filter(r => r.venta === null || r.venta === undefined)
  const negSales = rows.filter(r => typeof r.venta === 'number' && r.venta < 0)
  if (nullSales.length > 0 || negSales.length > 0) {
    issues.push({
      id: 'bad-sales',
      title: 'Ventas negativas o vacías',
      severity: 'blocking',
      count: nullSales.length + negSales.length,
      detail: [
        negSales.length > 0 && `${negSales.length} fila(s) con venta negativa`,
        nullSales.length > 0 && `${nullSales.length} fila(s) con venta vacía`,
      ].filter(Boolean).join(' · '),
    })
  }

  // 2. Fechas no reconocidas (BLOCKING)
  if (mapping.fecha) {
    const badDates = rows.filter(r => {
      if (!r.fecha) return true
      const d = new Date(r.fecha)
      return isNaN(d.getTime())
    })
    if (badDates.length > 0) {
      issues.push({
        id: 'bad-dates',
        title: 'Fechas no reconocidas',
        severity: 'blocking',
        count: badDates.length,
        detail: `${badDates.length} fila(s) con fecha vacía o en formato no reconocido.`,
      })
    }
  }

  // 3. SKUs sin categoría (WARNING)
  const missingCat = rows.filter(r => r.sku && !r.categoria)
  if (missingCat.length > 0) {
    const sample = [...new Set(missingCat.map(r => r.sku ?? ''))].filter(Boolean).slice(0, 5)
    issues.push({
      id: 'missing-category',
      title: 'SKUs sin categoría',
      severity: 'warning',
      count: missingCat.length,
      sample,
      detail: `${missingCat.length} fila(s) tienen SKU pero no tienen categoría asignada.`,
    })
  }

  // 4. Canales no reconocidos (WARNING)
  const uniqueChannels = [...new Set(rows.map(r => r.canal).filter((c): c is string => Boolean(c)))]
  const channelIssues: Array<{ original: string; suggestion: string }> = []
  for (const ch of uniqueChannels) {
    const isCanonical = CANONICAL_CHANNELS.some(c => norm(c) === norm(ch))
    if (!isCanonical) {
      const suggestion = suggestChannel(ch)
      channelIssues.push({ original: ch, suggestion: suggestion ?? '(sin sugerencia)' })
    }
  }
  if (channelIssues.length > 0) {
    issues.push({
      id: 'channel-names',
      title: 'Canales no reconocidos',
      severity: 'warning',
      count: channelIssues.length,
      suggestions: channelIssues,
      detail: `${channelIssues.length} valor(es) de canal no están en la lista canónica.`,
    })
  }

  // 5. Filas duplicadas (WARNING)
  const keyCount = new Map<string, number>()
  for (const r of rows) {
    const key = [r.sku, r.fecha, r.canal, r.tienda].map(v => v ?? '').join('||')
    keyCount.set(key, (keyCount.get(key) ?? 0) + 1)
  }
  const dupRows = [...keyCount.values()].filter(c => c > 1).reduce((s, c) => s + (c - 1), 0)
  if (dupRows > 0) {
    issues.push({
      id: 'duplicates',
      title: 'Filas duplicadas',
      severity: 'warning',
      count: dupRows,
      detail: `${dupRows} fila(s) parecen duplicadas (mismo SKU + fecha + canal + tienda).`,
    })
  }

  // 6. SKUs con venta cero (INFO)
  const zeroSalesSkus = [...new Set(
    rows.filter(r => r.sku && (r.venta === 0)).map(r => r.sku ?? '')
  )].filter(Boolean)
  if (zeroSalesSkus.length > 0) {
    issues.push({
      id: 'zero-sales',
      title: 'SKUs con venta = 0',
      severity: 'info',
      count: zeroSalesSkus.length,
      sample: zeroSalesSkus.slice(0, 5),
      detail: `${zeroSalesSkus.length} SKU(s) con venta exactamente en cero.`,
    })
  }

  // 7. Categorías sin margen (INFO, solo si la columna margen existe)
  if (mapping.margen) {
    const catsNoMargin = [...new Set(
      rows.filter(r => r.categoria && r.margen === null).map(r => r.categoria ?? '')
    )].filter(Boolean)
    if (catsNoMargin.length > 0) {
      issues.push({
        id: 'missing-margin',
        title: 'Categorías sin datos de margen',
        severity: 'info',
        count: catsNoMargin.length,
        sample: catsNoMargin.slice(0, 5),
        detail: `${catsNoMargin.length} categoría(s) tienen filas sin valor de margen.`,
      })
    }
  }

  const blockingCount = issues.filter(i => i.severity === 'blocking').length
  return {
    totalRows: rows.length,
    issueCount: issues.length,
    blockingCount,
    issues,
    checkedAt: new Date().toISOString(),
  }
}
