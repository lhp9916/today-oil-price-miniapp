export type PriceValue = number | string | null | undefined

export interface Province {
  id: string
  name: string
  alias?: string[]
}

export interface AreaCheck {
  AREA_ID?: number | string
  AREA_NAME?: string
  AREA_DESC?: string
  AREADESC_ISDISPLAY?: string
  PROVINCE_ID?: number | string
  PROVINCE_NAME?: string
  [key: string]: unknown
}

export type PriceRecord = Record<string, PriceValue>

export interface RawArea {
  areaCheck?: AreaCheck
  areaData?: unknown
}

export interface RawProvinceScope {
  provinceCheck?: AreaCheck
  provinceData?: unknown
  area?: RawArea[]
}

export interface RawOilResponse {
  data?: RawProvinceScope
  toDay?: string
  provinceId?: number | string
}

export interface PriceArea {
  areaId: string
  areaName: string
  check: AreaCheck
  price: PriceRecord | null
  priceDate: string
  isFallback: boolean
  records: PriceRecord[]
}

export interface OilPricePayload {
  provinceId: string
  provinceName: string
  toDay: string
  priceDate: string
  isFallback: boolean
  areas: PriceArea[]
}

export interface CalendarMonth {
  key: string
  year: number
  month: number
  label: string
  url: string
}

export interface CachedPayload<T> {
  savedAt: number
  data: T
}
