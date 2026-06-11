import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { RawRow, ParseResult, ColumnMapping, CanonicalKey, MappedRow } from '../types'

// ─── File parsing ─────────────────────────────────────────────────────────────

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file)
  throw new Error(`Formato no admitido: .${ext}`)
}

async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        const headers = (result.meta.fields ?? []).filter(Boolean)
        const rows = result.data as RawRow[]
        resolve({ headers, rows, fileName: file.name, totalRows: rows.length })
      },
      error: (err) => reject(new Error(err.message)),
    })
  })
}

async function parseXLSX(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: null,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  })
  const headers = rows.length > 0 ? Object.keys(rows[0] as object) : []
  return { headers, rows, fileName: file.name, totalRows: rows.length }
}

// ─── Auto-detection ────────────────────────────────────────────────────────────

const COLUMN_ALIASES: Record<CanonicalKey, string[]> = {
  fecha: ['fecha', 'date', 'dia', 'día', 'fecha venta', 'fecha de venta', 'periodo', 'period'],
  canal: ['canal', 'channel', 'canal de venta', 'tipo de canal', 'tipo canal'],
  tienda: ['tienda', 'store', 'punto de venta', 'pdv', 'local', 'sucursal', 'establecimiento'],
  categoria: ['categoria', 'categoría', 'category', 'cat', 'linea', 'línea', 'familia'],
  subcategoria: ['subcategoria', 'subcategoría', 'sub categoria', 'subfamilia'],
  marca: ['marca', 'brand', 'fabricante', 'proveedor'],
  sku: ['sku', 'codigo', 'código', 'cod', 'code', 'ref', 'referencia', 'item', 'id', 'producto_id', 'codigo producto'],
  producto: ['producto', 'descripcion', 'descripción', 'nombre producto', 'nombre', 'name', 'articulo', 'artículo', 'desc'],
  unidades: ['unidades', 'units', 'qty', 'cantidad', 'vol', 'volumen', 'cajas', 'piezas', 'unids', 'cant'],
  venta: ['venta', 'ventas', 'sales', 'valor', 'monto', 'importe', 'total', 'valor venta', 'ingresos', 'revenue', 'valor total'],
  margen: ['margen', 'margin', 'utilidad', 'ganancia', 'profit', 'margen bruto', 'utilidad bruta'],
  precio_promedio: ['precio promedio', 'precio_promedio', 'precio', 'price', 'pvp', 'precio de venta', 'precio unit'],
  campana: ['campaña', 'campaign', 'promo', 'promocion', 'promoción', 'campana', 'activacion'],
  inventario: ['inventario', 'inventory', 'stock', 'existencias', 'disponible', 'inv'],
  num_transacciones: ['transacciones', 'num_transacciones', 'tickets', 'orders', 'pedidos', 'facturas', 'boletas', 'n transacciones'],
}

function norm(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const normHeaders = headers.map(norm)
  const used = new Set<string>()

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [CanonicalKey, string[]][]) {
    for (const alias of aliases) {
      const na = norm(alias)
      const idx = normHeaders.findIndex(h => !used.has(headers[normHeaders.indexOf(h)]) && (h === na || h.startsWith(na) || na.startsWith(h)))
      if (idx >= 0) {
        mapping[field] = headers[idx]
        used.add(headers[idx])
        break
      }
    }
  }

  return mapping
}

// ─── Mapping application ───────────────────────────────────────────────────────

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const cleaned = String(val).replace(/[$\s,]/g, '').replace(/[()]/g, (c) => c === '(' ? '-' : '')
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

function toStr(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' ? null : s
}

export function applyMapping(rows: RawRow[], mapping: ColumnMapping): MappedRow[] {
  return rows.map((row, i) => ({
    fecha: mapping.fecha ? toStr(row[mapping.fecha]) : null,
    canal: mapping.canal ? toStr(row[mapping.canal]) : null,
    tienda: mapping.tienda ? toStr(row[mapping.tienda]) : null,
    categoria: mapping.categoria ? toStr(row[mapping.categoria]) : null,
    subcategoria: mapping.subcategoria ? toStr(row[mapping.subcategoria]) : null,
    marca: mapping.marca ? toStr(row[mapping.marca]) : null,
    sku: mapping.sku ? toStr(row[mapping.sku]) : null,
    producto: mapping.producto ? toStr(row[mapping.producto]) : null,
    unidades: mapping.unidades ? toNum(row[mapping.unidades]) : null,
    venta: mapping.venta ? toNum(row[mapping.venta]) : null,
    margen: mapping.margen ? toNum(row[mapping.margen]) : null,
    precio_promedio: mapping.precio_promedio ? toNum(row[mapping.precio_promedio]) : null,
    campana: mapping.campana ? toStr(row[mapping.campana]) : null,
    inventario: mapping.inventario ? toNum(row[mapping.inventario]) : null,
    num_transacciones: mapping.num_transacciones ? toNum(row[mapping.num_transacciones]) : null,
    _rowIndex: i,
  }))
}

export function sampleValues(rows: RawRow[], column: string, n = 3): string[] {
  return rows
    .map(r => toStr(r[column]))
    .filter((v): v is string => v !== null && v !== '')
    .slice(0, n)
}
