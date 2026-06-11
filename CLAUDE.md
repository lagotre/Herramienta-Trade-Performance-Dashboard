# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trade Performance Dashboard** — a 100% client-side web app for trade marketing, category management, and sales professionals. Users upload Excel/CSV sales files and get KPIs, automated insights, and exportable reports. All processing happens in the browser; data never leaves the user's machine.

The UI is entirely in **Spanish** using trade marketing terminology (sell-out, rotación, participación, ticket, margen, góndola, canal). Target user is a non-technical commercial analyst or trade marketer.

GitHub: `https://github.com/lagotre/Herramienta-Trade-Performance-Dashboard.git`  
Deploy target: Vercel (static, auto-deploy on push to `main`)

## Stack

- **React 18 + Vite + TypeScript** — no SSR, pure SPA
- **Tailwind CSS** — clean, executive visual tone; no generic UI kits
- **SheetJS** — Excel parsing and export
- **papaparse** — CSV parsing
- **recharts** — all charts
- **idb or dexie** — IndexedDB for project persistence (degrades to in-memory with a notice if storage is unavailable)
- **react-to-print** — PDF export via browser print dialog

No backend, no auth, no server-side API, no external integrations.

## Development Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server
npm run build        # build to dist/ (output for Vercel)
npm run preview      # preview production build locally
npm run lint         # lint
```

Build output goes to `dist/`. Vercel is configured for `vite build`.

## Architecture

### Data Flow

```
File upload → Column mapping → Data health check → KPI engine → Insights engine → Dashboard views → Export
```

### Canonical Data Model

The app normalizes all uploaded data to this internal schema before any computation:

| Field | Type | Required | Notes |
|---|---|---|---|
| `fecha` | Date | Yes | Normalized to ISO |
| `canal` | string | Yes | Normalized against canonical list |
| `tienda` | string | No | Point of sale |
| `categoria` | string | Yes | |
| `subcategoria` | string | No | |
| `marca` | string | No | |
| `sku` | string | Yes | |
| `producto` | string | No | |
| `unidades` | number | Yes | |
| `venta` | number | Yes | Revenue in money |
| `margen` | number | No | If absent, hide profitability KPIs with tooltip |
| `precio_promedio` | number | No | Computed as `venta/unidades` if absent |
| `campana` | string | No | Promotion/campaign |
| `inventario` | number | No | If absent, show velocity instead of rotation |
| `num_transacciones` | number | No | If absent, hide ticket promedio |

**Graceful degradation is critical**: a missing optional column must never break the dashboard. Hide the relevant KPI/insight with an explanatory tooltip.

### KPI Formulas

- **Ventas ($)**: `Σ venta`
- **Unidades**: `Σ unidades`
- **Margen ($)**: `Σ margen` (only if column exists)
- **Margen %**: `Margen $ ÷ Ventas $`
- **Precio promedio**: `Ventas $ ÷ Unidades`
- **Ticket promedio**: `Ventas $ ÷ num_transacciones` (only if column exists)
- **Participación (share)**: segment's `venta ÷ venta total` by dimension
- **Crecimiento**: MoM comparison when ≥2 distinct periods exist; show "requiere histórico" and allow loading a base-period file otherwise. Never fabricate growth with a single period.
- **Rotación**: `Unidades ÷ Inventario promedio` (if inventory exists), else **Velocidad de venta** = `Unidades ÷ días del periodo`

### Insights Engine

Rule-based engine with **configurable thresholds** (editable config object). Each insight is an actionable phrase with severity (alta / media / baja) and the exact supporting data point.

8 minimum rules:
1. **Concentración (Pareto)**: top 20% SKUs ≥ 80% sales → dependency risk
2. **SKUs ganadores**: top decile by `venta $` AND `margen %` above median
3. **SKUs lentos / cola muerta**: bottom quartile by units, zero-sales in period, or below-threshold rotation
4. **Categoría en caída**: MoM growth < −10% (configurable, requires ≥2 periods)
5. **Sobredependencia de canal**: single channel > 60% (configurable) of sales
6. **Trampa de margen**: top quartile by volume but below-median margin %
7. **Campaña sin impacto**: uplift of `campana` rows vs. comparable baseline — copy must clearly label this a directional signal, not pure incrementality
8. **Inventario en riesgo**: high inventory + low rotation (requires inventory column)

Each insight ends with a business-language suggested action (e.g., "Diseñar flash sale en WhatsApp Business para liquidar SKUs de cola").

### App Flow (7 Steps)

1. **Crear proyecto** — name, company/client, period, currency, business type, channels → saved to IndexedDB
2. **Carga de datos** — upload Excel/CSV + "Cargar datos de ejemplo" button; column mapping screen (auto-detect by name, user can reassign via dropdowns — this is the most UX-sensitive screen)
3. **Salud de datos** — validation dashboard with blocking / warning severity; user can proceed
4. **Resumen ejecutivo** — KPI cards + charts (Ventas, Unidades, Margen, Crecimiento, Top categorías, Top canales, Top SKUs)
5. **Análisis específicos** — tabs: SKUs / Categorías / Canales / Campañas / Tiendas / Tendencias; global filters: periodo, canal, categoría, marca, campaña
6. **Hallazgos detectados** — prioritized insights from the engine
7. **Exportar** — PDF (executive summary via react-to-print), Excel (rankings/tables via SheetJS)

### Data Health Checks (Step 3)

- SKUs without `categoria` (count + sample)
- Duplicate rows (same `sku + fecha + canal + tienda`)
- Misspelled channels — normalize against canonical list: `Tienda Física`, `E-commerce`, `WhatsApp Business`, `Marketplace`, `Redes Sociales`, `Email/CRM`; suggest merges for variants like "Whatsapp", "WA", etc. (user approves or edits)
- Unparseable or inconsistent dates
- Negative or empty `venta`
- Categories without margin
- Campaigns without identification

### Demo Dataset

A synthetic "Angel Moda Jeans" dataset (Colombian women's jeans brand) is wired to the "Cargar datos de ejemplo" button:
- ~12 denim SKUs, 5 channels (2 Tiendas Físicas, E-commerce, WhatsApp Business, Marketplace)
- 3 months of data (March–May 2026) with some campaigns
- Intentionally dirty rows: one misspelled channel, one SKU without category, one negative sale — for the data health check to catch

### v2 Hook (do not implement yet)

Leave the architecture open for a future feature where insights are sent to the Anthropic API to be narrated as executive recommendations in the voice of a trade marketing consultant.

## Build Phases

Phases are built one at a time with a review checkpoint between each:

| Phase | Scope |
|---|---|
| 0 | Vite + TS + Tailwind scaffold, base layout, tab navigation, empty states, initial git push |
| 1 | Data ingestion: upload + parse + column mapping + demo data button |
| 2 | Data health dashboard (validations) |
| 3 | KPI engine + executive summary dashboard |
| 4 | Analysis tabs + global filters |
| 5 | Insights engine |
| 6 | Exports (PDF + Excel) |
| 7 | Polish: error/empty states, Spanish copy, accessibility, responsive, README |

Each phase ends with a git commit and push to `main`.

## Acceptance Criteria

- Load demo dataset → see KPIs, 6 analysis tabs, and ≥5 actionable insights with zero console errors
- Upload an Excel with different column names → column mapping works; missing optional columns degrade gracefully
- Data health check catches the misspelled channel, SKU without category, and negative sale from the demo
- Export executive summary to PDF and a ranking to Excel
- Close and reopen browser → project is still there (IndexedDB persistence)
- All UI is in Spanish with trade marketing terminology
