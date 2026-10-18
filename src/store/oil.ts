import { computed, reactive } from 'vue'
import { findArea, fetchHistoryOilPrice, fetchOilPrice } from '@/api/oil'
import { findProvince } from '@/api/provinces'
import {
  HISTORY_CACHE_TTL,
  TODAY_CACHE_TTL,
  isFresh,
  loadArea,
  loadLocation,
  readHistoryCache,
  readTodayCache,
  saveArea,
  saveLocation,
  writeHistoryCache,
  writeTodayCache
} from '@/api/storage'
import type { OilPricePayload, Province } from '@/shared/types'

interface OilState {
  provinceId: string
  provinceName: string
  todayDate: string
  todayAreas: OilPricePayload['areas']
  todayAreaId: string
  historyAreas: OilPricePayload['areas']
  historyAreaId: string
  todayLoading: boolean
  todayError: string
  todayStale: boolean
  historyLoading: boolean
  historyError: string
  historyStale: boolean
}

const state = reactive<OilState>({
  provinceId: '',
  provinceName: '',
  todayDate: '',
  todayAreas: [],
  todayAreaId: '',
  historyAreas: [],
  historyAreaId: '',
  todayLoading: false,
  todayError: '',
  todayStale: false,
  historyLoading: false,
  historyError: '',
  historyStale: false
})

const currentTodayArea = computed(() => findArea(state.todayAreas, state.todayAreaId))
const currentHistoryArea = computed(() =>
  findArea(state.historyAreas, state.historyAreaId)
)
const hasProvince = computed(() => !!state.provinceId)

function restoreLocation() {
  const saved = loadLocation()
  if (!saved) return false
  const province = findProvince(saved.id)
  state.provinceId = saved.id
  state.provinceName = province?.name || saved.name
  state.todayAreaId = saved.areaId || ''
  const area = loadArea()
  if (!state.todayAreaId && area?.areaId) state.todayAreaId = area.areaId
  return true
}

function adoptProvince(province: Province, areaId = '', areaName = '') {
  state.provinceId = String(province.id)
  state.provinceName = province.name
  state.todayAreas = []
  state.historyAreas = []
  state.todayAreaId = String(areaId || '')
  state.historyAreaId = ''
  state.todayError = ''
  state.historyError = ''
  saveLocation(province, areaId, areaName)
}

function chooseArea(areas: OilPricePayload['areas'], wanted: string) {
  const matched = wanted ? findArea(areas, wanted) : null
  return (matched || areas[0] || null)?.areaId || ''
}

async function loadToday(options: { keepArea?: boolean } = {}) {
  if (!state.provinceId) return
  const provinceId = state.provinceId
  const wantedArea = options.keepArea ? state.todayAreaId : ''
  const cache = readTodayCache(provinceId, wantedArea)

  if (cache) {
    state.todayAreas = cache.data.areas
    state.todayDate = cache.data.toDay
    state.provinceName = cache.data.provinceName || state.provinceName
    state.todayAreaId = chooseArea(cache.data.areas, wantedArea)
    state.todayStale = !isFresh(cache, TODAY_CACHE_TTL)
  }
  if (cache && isFresh(cache, TODAY_CACHE_TTL)) return

  state.todayLoading = true
  state.todayError = ''
  try {
    const data = await fetchOilPrice(provinceId)
    state.provinceName = data.provinceName || state.provinceName
    state.todayDate = data.toDay || state.todayDate
    state.todayAreas = data.areas
    state.todayAreaId = chooseArea(data.areas, wantedArea)
    state.todayStale = false
    const activeArea = findArea(data.areas, state.todayAreaId)
    writeTodayCache(provinceId, activeArea?.areaId || '', data)
  } catch (error) {
    state.todayError = (error as Error).message || '获取油价失败'
    state.todayStale = !!cache || state.todayAreas.length > 0
  } finally {
    state.todayLoading = false
  }
}

function syncHistoryArea() {
  state.historyAreaId = chooseArea(state.historyAreas, state.todayAreaId)
}

async function loadHistory(options: { force?: boolean } = {}) {
  if (!state.provinceId) return
  const provinceId = state.provinceId
  const wantedArea = state.todayAreaId
  const cache = readHistoryCache(provinceId)

  if (cache) {
    state.historyAreas = cache.data.areas
    state.historyAreaId = chooseArea(cache.data.areas, wantedArea)
    state.historyStale = !isFresh(cache, HISTORY_CACHE_TTL)
  }
  if (cache && isFresh(cache, HISTORY_CACHE_TTL) && !options.force) {
    state.historyLoading = false
    return
  }

  state.historyLoading = true
  state.historyError = ''
  try {
    const data = await fetchHistoryOilPrice(provinceId)
    state.historyAreas = data.areas
    state.historyAreaId = chooseArea(data.areas, wantedArea)
    state.historyStale = false
    writeHistoryCache(provinceId, data)
  } catch (error) {
    state.historyError = (error as Error).message || '获取历史油价失败'
    state.historyStale = !!cache || state.historyAreas.length > 0
  } finally {
    state.historyLoading = false
  }
}

async function selectTodayArea(areaId: string) {
  state.todayAreaId = areaId
  const area = findArea(state.todayAreas, areaId)
  if (area) saveArea(area.areaId, area.areaName)
  syncHistoryArea()
  const cache = readTodayCache(state.provinceId, areaId)
  if (cache) {
    state.todayAreas = cache.data.areas
    state.todayDate = cache.data.toDay
    state.todayStale = !isFresh(cache, TODAY_CACHE_TTL)
  }
  await loadToday({ keepArea: true })
}

async function selectHistoryArea(areaId: string) {
  state.historyAreaId = areaId
  await loadHistory()
}

export function useOilStore() {
  return {
    state,
    currentTodayArea,
    currentHistoryArea,
    hasProvince,
    restoreLocation,
    adoptProvince,
    loadToday,
    loadHistory,
    selectTodayArea,
    selectHistoryArea,
    syncHistoryArea
  }
}
