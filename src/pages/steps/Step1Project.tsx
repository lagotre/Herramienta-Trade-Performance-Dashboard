import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { Project } from '../../types'

const CURRENCIES = ['COP', 'USD', 'MXN', 'PEN', 'CLP', 'ARS', 'BRL']

const BUSINESS_TYPES = [
  'Alimentos y bebidas',
  'Snacks y confitería',
  'Moda y textil',
  'Cuidado personal',
  'Hogar',
  'Tecnología',
  'Farmacia',
  'Otro',
]

const AVAILABLE_CHANNELS = [
  'Supermercados',
  'Grandes superficies',
  'Mayoristas',
  'Canal tradicional',
  'Tiendas de conveniencia',
  'Superetes',
  'Tienda Física',
  'E-commerce',
  'WhatsApp Business',
  'Marketplace',
  'Redes Sociales',
  'Email/CRM',
]

const formatPeriod = (from: string, to: string) => {
  if (!from && !to) return ''
  const fmt = (d: string) =>
    d
      ? new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '…'
  return `${fmt(from)} — ${fmt(to)}`
}

export default function Step1Project() {
  const { activeProject, goToStep, createProject } = useApp()

  const [form, setForm] = useState({
    name: activeProject?.name ?? '',
    client: activeProject?.client ?? '',
    periodFrom: activeProject?.periodFrom ?? '',
    periodTo: activeProject?.periodTo ?? '',
    currency: activeProject?.currency ?? 'COP',
    businessType: activeProject?.businessType ?? '',
    channels: activeProject?.channels ?? ([] as string[]),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggle = (channel: string) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(channel)
        ? f.channels.filter(c => c !== channel)
        : [...f.channels, channel],
    }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'El nombre del proyecto es requerido'
    if (!form.client.trim()) e.client = 'El nombre de empresa o cliente es requerido'
    if (!form.periodFrom) e.period = 'Selecciona la fecha de inicio del periodo'
    else if (!form.periodTo) e.period = 'Selecciona la fecha de fin del periodo'
    else if (form.periodTo < form.periodFrom) e.period = 'La fecha de fin debe ser posterior al inicio'
    if (form.channels.length === 0) e.channels = 'Selecciona al menos un canal'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const project: Project = {
      id: activeProject?.id ?? `proj-${Date.now()}`,
      name: form.name,
      client: form.client,
      periodFrom: form.periodFrom,
      periodTo: form.periodTo,
      period: formatPeriod(form.periodFrom, form.periodTo),
      currency: form.currency,
      businessType: form.businessType,
      channels: form.channels,
      createdAt: activeProject?.createdAt ?? new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      currentStep: 2,
    }
    createProject(project)
    goToStep(2)
  }

  const inputBase =
    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors'
  const inputOk = 'border-slate-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  const inputErr = 'border-red-300 bg-red-50 focus:border-red-400'

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900">Crear proyecto</h1>
        <p className="text-slate-500 text-sm mt-1">
          Define el contexto de tu análisis. Podrás editar esto más adelante.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 flex flex-col gap-5">

          {/* Project name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre del proyecto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Análisis ventas mayo 2026 – Snacks retail"
              className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Client / company */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Empresa o cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              placeholder="Ej: Grupo Diforma"
              className={`${inputBase} ${errors.client ? inputErr : inputOk}`}
            />
            {errors.client && <p className="text-xs text-red-500 mt-1">{errors.client}</p>}
          </div>

          {/* Period (date range) + Currency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Periodo de análisis <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Desde</label>
                <input
                  type="date"
                  value={form.periodFrom}
                  max={form.periodTo || undefined}
                  onChange={e => setForm(f => ({ ...f, periodFrom: e.target.value }))}
                  className={`${inputBase} ${errors.period ? inputErr : inputOk}`}
                />
              </div>
              <span className="text-slate-300 mt-5 shrink-0">—</span>
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Hasta</label>
                <input
                  type="date"
                  value={form.periodTo}
                  min={form.periodFrom || undefined}
                  onChange={e => setForm(f => ({ ...f, periodTo: e.target.value }))}
                  className={`${inputBase} ${errors.period ? inputErr : inputOk}`}
                />
              </div>
              <div className="w-24 mt-5">
                <select
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                >
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {form.periodFrom && form.periodTo && !errors.period && (
              <p className="text-xs text-blue-600 mt-1.5">
                {formatPeriod(form.periodFrom, form.periodTo)}
              </p>
            )}
            {errors.period && <p className="text-xs text-red-500 mt-1">{errors.period}</p>}
          </div>

          {/* Business type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tipo de negocio
            </label>
            <select
              value={form.businessType}
              onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
            >
              <option value="">Seleccionar…</option>
              {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Canales a analizar <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CHANNELS.map(ch => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggle(ch)}
                  className={[
                    'px-3.5 py-1.5 rounded-full text-sm border transition-all',
                    form.channels.includes(ch)
                      ? 'bg-blue-600 border-blue-600 text-white font-medium'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400',
                  ].join(' ')}
                >
                  {ch}
                </button>
              ))}
            </div>
            {errors.channels && <p className="text-xs text-red-500 mt-2">{errors.channels}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Continuar
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
