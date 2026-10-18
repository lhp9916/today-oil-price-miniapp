import type { CachedPayload, OilPricePayload, Province } from '@/shared/types'

const KEY_LOCATION = 'oil-price/location'
const KEY_AREA = 'oil-price/area'
const KEY_TODAY_CACHE = 'oil-price/cache/today'
const KEY_HISTORY_CACHE = 'oil-price/cache/history'

export const TODAY_CACHE_TTL = 10 * 60 * 1000
export const HISTORY_CACHE_TTL = 6 * 60 * 60 * 1000

export interface SavedLocation {
  id: string
  name: string
  areaId: string
  areaName: string
}

export function saveLocation(province: Province, areaId = '', areaName = '') {
  const payload: SavedLocation = {
    id: String(province.id),
    name: province.name,
    areaId: String(areaId || ''),
    areaName: areaName || ''
  }
  try {
    uni.setStorageSync(KEY_LOCATION, payload)
    return true
  } catch {
    return false
  }
}

export function loadLocation(): SavedLocation | null {
  try {
    const saved = uni.getStorageSync(KEY_LOCATION) as SavedLocation | ''
    return saved && saved.id ? saved : null
  } catch {
    return null
  }
}

export function saveArea(areaId: string, areaName: string) {
  try {
    uni.setStorageSync(KEY_AREA, { areaId: String(areaId), areaName })
  } catch {
    /* 存储失败不阻塞主流程 */
  }
}

export function loadArea() {
  try {
    const saved = uni.getStorageSync(KEY_AREA) as
      | { areaId?: string; areaName?: string }
      | ''
    return saved && saved.areaId ? saved : null
  } catch {
    return null
  }
}

type CacheBucket<T> = Record<string, CachedPayload<T>>

function readBucket<T>(key: string): CacheBucket<T> {
  try {
    const value = uni.getStorageSync(key) as CacheBucket<T> | ''
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function writeBucket<T>(key: string, bucket: CacheBucket<T>) {
  try {
    uni.setStorageSync(key, bucket)
  } catch {
    /* 缓存失败不影响实时数据展示 */
  }
}

function areaKey(provinceId: string, areaId: string) {
  return `${provinceId}:${areaId || 'default'}`
}

function readCached<T>(key: string, provinceId: string, areaId: string) {
  const bucket = readBucket<T>(key)
  return bucket[areaKey(provinceId, areaId)] || null
}

function writeCached<T>(key: string, provinceId: string, areaId: string, data: T) {
  const bucket = readBucket<T>(key)
  bucket[areaKey(provinceId, areaId)] = { savedAt: Date.now(), data }
  writeBucket(key, bucket)
}

export function readTodayCache(provinceId: string, areaId: string) {
  return readCached<OilPricePayload>(KEY_TODAY_CACHE, provinceId, areaId)
}

export function writeTodayCache(provinceId: string, areaId: string, data: OilPricePayload) {
  writeCached(KEY_TODAY_CACHE, provinceId, areaId, data)
}

export function readHistoryCache(provinceId: string) {
  return readCached<OilPricePayload>(KEY_HISTORY_CACHE, provinceId, '')
}

export function writeHistoryCache(provinceId: string, data: OilPricePayload) {
  writeCached(KEY_HISTORY_CACHE, provinceId, '', data)
}

export function isFresh(cache: CachedPayload<unknown> | null, ttl: number) {
  return !!cache && Date.now() - cache.savedAt < ttl
}
