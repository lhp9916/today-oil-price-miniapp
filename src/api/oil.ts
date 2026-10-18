import { findProvince } from './provinces'
import { request, sessionCookie } from './request'
import type {
  AreaCheck,
  CalendarMonth,
  OilPricePayload,
  PriceArea,
  PriceRecord,
  RawArea,
  RawOilResponse,
  RawProvinceScope
} from '@/shared/types'

export const OIL_ORIGIN = 'https://oil.bigpeng.site'
const DATA_PATH = '/yjkqiantai/data'
// 反代站点尚未把图片路径转发到上游，日历图片暂时直连中石化源站。
const CALENDAR_ORIGIN = 'https://cx.sinopecsales.com'
const CALENDAR_PATH = '/yjkqiantai/oilImages'
const REFERER = `${OIL_ORIGIN}/`

const PRICE_FIELDS = [
  'GAS_89',
  'GAS_92',
  'GAS_95',
  'GAS_98',
  'E92',
  'E95',
  'E98',
  'AIPAO_GAS_95',
  'AIPAO_GAS_98',
  'AIPAO_GAS_E92',
  'AIPAO_GAS_E95',
  'AIPAO_GAS_E98',
  'CHECHAI_0',
  'CHECHAI_10',
  'CHAI_20',
  'CHAI_35',
  'CHAI_ZYK',
  'LNG',
  'L_CNG',
  'CNG'
]

export function hasUsablePrice(payload: unknown): payload is PriceRecord {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false
  const record = payload as PriceRecord
  return PRICE_FIELDS.some((key) => typeof record[key] === 'number')
}

function areaList(scope: RawProvinceScope, fallbackName: string) {
  const rawAreas = Array.isArray(scope.area) ? scope.area : []
  if (rawAreas.length) {
    return rawAreas.map((item: RawArea) => ({
      areaId: item.areaCheck?.AREA_ID,
      areaName: item.areaCheck?.AREA_NAME || fallbackName,
      check: item.areaCheck || {},
      payload: item.areaData
    }))
  }
  const check = scope.provinceCheck || {}
  return [
    {
      areaId: check.AREA_ID,
      areaName: fallbackName || check.PROVINCE_NAME || '',
      check,
      payload: scope.provinceData
    }
  ]
}

function toAreaId(value: unknown) {
  return value != null ? String(value) : ''
}

export function normalizeToday(json: RawOilResponse, toDay = ''): OilPricePayload {
  const data = json.data || {}
  const check = data.provinceCheck || {}
  const provinceName = check.PROVINCE_NAME || ''
  return {
    toDay: toDay || json.toDay || '',
    provinceId: toAreaId(check.PROVINCE_ID),
    provinceName,
    priceDate: '',
    isFallback: false,
    areas: areaList(data, provinceName).map((area) => ({
      areaId: toAreaId(area.areaId),
      areaName: area.areaName,
      check: area.check,
      price: hasUsablePrice(area.payload) ? area.payload : null,
      priceDate: '',
      isFallback: false,
      records: []
    }))
  }
}

function historyRecords(payload: unknown): PriceRecord[] {
  if (Array.isArray(payload)) return payload as PriceRecord[]
  return payload && typeof payload === 'object' ? [payload as PriceRecord] : []
}

export function normalizeHistory(json: RawOilResponse): OilPricePayload {
  const data = json.data || {}
  const check = data.provinceCheck || {}
  const provinceName = check.PROVINCE_NAME || ''
  return {
    toDay: json.toDay || '',
    provinceId: toAreaId(check.PROVINCE_ID),
    provinceName,
    priceDate: '',
    isFallback: false,
    areas: areaList(data, provinceName).map((area) => ({
      areaId: toAreaId(area.areaId),
      areaName: area.areaName,
      check: area.check,
      price: null,
      priceDate: '',
      isFallback: false,
      records: historyRecords(area.payload)
    }))
  }
}

export function applyLatestPrice(
  today: OilPricePayload,
  history: OilPricePayload
): OilPricePayload {
  const byArea = new Map(history.areas.map((area) => [area.areaId, area]))
  let dataDate = ''

  const areas = today.areas.map((area) => {
    if (hasUsablePrice(area.price)) return area
    const matched = byArea.get(area.areaId)
    const latest = matched?.records[0]
    if (!latest) return area

    const date = String(latest.STR_START_DATE || latest.queryDate || '')
    if (date && !dataDate) dataDate = date

    const price: PriceRecord = { ...latest }
    Object.keys(price).forEach((key) => {
      if (key.endsWith('_STATUS')) price[key] = 0
    })

    return {
      ...area,
      areaName: area.areaName || matched?.areaName || '',
      check: Object.keys(area.check).length ? area.check : matched?.check || {},
      price,
      priceDate: date,
      isFallback: true
    }
  })

  return { ...today, areas, priceDate: dataDate, isFallback: !!dataDate }
}

interface ProvinceSession {
  json: RawOilResponse
  cookie: string
}

async function loadProvince(provinceId: string): Promise<ProvinceSession> {
  const response = await request<RawOilResponse>(
    `${OIL_ORIGIN}${DATA_PATH}/switchProvince`,
    {
      method: 'POST',
      data: { provinceId },
      header: {
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/json, text/plain, */*',
        Referer: REFERER,
        'X-Requested-With': 'XMLHttpRequest'
      }
    }
  )
  const check: AreaCheck | undefined = response.data?.data?.provinceCheck
  if (!check || check.PROVINCE_ID == null || !check.PROVINCE_NAME) {
    throw new Error('未找到该省市数据，请重新选择')
  }
  return { json: response.data, cookie: sessionCookie(response.headers) }
}

async function loadServerDate() {
  try {
    const response = await request<{ toDay?: string }>(
      `${OIL_ORIGIN}${DATA_PATH}/initMainData`,
      {
        header: {
          Accept: 'application/json, text/plain, */*',
          Referer: REFERER,
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    )
    return response.data?.toDay || ''
  } catch {
    return ''
  }
}

async function loadHistoryRaw(cookie: string) {
  const response = await request<RawOilResponse>(
    `${OIL_ORIGIN}${DATA_PATH}/initOilPrice`,
    {
      header: {
        Accept: 'application/json, text/plain, */*',
        Referer: REFERER,
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: cookie
      }
    }
  )
  return response.data
}

function decorate(payload: OilPricePayload): OilPricePayload {
  const provinceId = String(payload.provinceId || '')
  const provinceName =
    payload.provinceName || findProvince(provinceId)?.name || '未知地区'
  return {
    ...payload,
    provinceId,
    provinceName,
    areas: payload.areas.map((area) => ({
      ...area,
      areaId: area.areaId != null ? String(area.areaId) : '',
      areaName: area.areaName || provinceName,
      check: area.check || {},
      price: area.price || null,
      records: area.records || []
    }))
  }
}

export async function fetchOilPrice(provinceId: string) {
  const [{ json, cookie }, toDay] = await Promise.all([
    loadProvince(provinceId),
    loadServerDate()
  ])
  const today = normalizeToday(json, toDay)
  const missing = today.areas.length === 0 || today.areas.every((area) => !area.price)
  if (!missing) return decorate(today)

  try {
    const history = normalizeHistory(await loadHistoryRaw(cookie))
    return decorate(applyLatestPrice(today, history))
  } catch {
    return decorate(today)
  }
}

export async function fetchHistoryOilPrice(provinceId: string) {
  const { cookie } = await loadProvince(provinceId)
  return decorate(normalizeHistory(await loadHistoryRaw(cookie)))
}

export function calendarMonths(date = new Date(), count = 3): CalendarMonth[] {
  const list: CalendarMonth[] = []
  for (let i = 0; i < count; i += 1) {
    const cursor = new Date(date.getFullYear(), date.getMonth() + i, 1)
    const year = cursor.getFullYear()
    const month = cursor.getMonth() + 1
    const key = `${year}${String(month).padStart(2, '0')}`
    list.push({
      key,
      year,
      month,
      label: `${year}年${month}月`,
      url: `${CALENDAR_ORIGIN}${CALENDAR_PATH}/${key}.png`
    })
  }
  return list
}

export function findArea(areas: PriceArea[], areaId: string) {
  return areas.find((item) => String(item.areaId) === String(areaId)) || null
}
