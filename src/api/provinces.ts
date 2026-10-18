import { OIL_TYPES, PROVINCES } from '@/shared/oil-data'
import type { AreaCheck, PriceValue } from '@/shared/types'

export const findProvince = (id: string) =>
  PROVINCES.find((item) => String(item.id) === String(id)) || null

const normalize = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, '')

export const findProvinceByName = (name: unknown) => {
  const target = String(name || '').trim()
  if (!target) return null

  const direct = PROVINCES.find(
    (item) => item.name === target || target.startsWith(item.name)
  )
  if (direct) return direct

  const included = PROVINCES.find((item) => target.includes(item.name))
  if (included) return included

  const key = normalize(target)
  return (
    PROVINCES.find((item) =>
      (item.alias || []).some((alias) => normalize(alias) === key)
    ) || null
  )
}

const enabled = (check: AreaCheck | null | undefined, flag: string) =>
  !!check && check[flag] === 'Y'

export const oilTypesOf = (check: AreaCheck | null | undefined) =>
  OIL_TYPES.filter((item) => enabled(check, item.flag))

export const measureLabels = (types: typeof OIL_TYPES) => {
  const set = new Set(types.map((item) => item.measure))
  return Array.from(set)
}

export const formatPrice = (value: PriceValue) => {
  if (value == null || value === '' || Number(value) === 0) return '-'
  const num = Number(value)
  return Number.isNaN(num) ? '-' : num.toFixed(2)
}

export const formatDelta = (value: PriceValue) => {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num) || num === 0) return ''
  return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
}

export const deltaClass = (value: PriceValue) => {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num) || num === 0) return ''
  return num > 0 ? 'delta-up' : 'delta-down'
}

export const colorClass = (color: unknown) => {
  if (color === 'red') return 'cell-up'
  if (color === 'blue') return 'cell-down'
  return ''
}
