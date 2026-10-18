import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HISTORY_CACHE_TTL,
  TODAY_CACHE_TTL,
  isFresh,
  readHistoryCache,
  readTodayCache,
  writeHistoryCache,
  writeTodayCache
} from '../src/api/storage'
import type { OilPricePayload } from '../src/shared/types'

const store = new Map<string, unknown>()

vi.stubGlobal('uni', {
  getStorageSync: (key: string) => store.get(key) ?? '',
  setStorageSync: (key: string, value: unknown) => {
    store.set(key, value)
  }
})

const payload = (provinceName: string, areaName: string): OilPricePayload => ({
  provinceId: '51',
  provinceName,
  toDay: '2026年10月18日',
  priceDate: '',
  isFallback: false,
  areas: [
    {
      areaId: areaName,
      areaName,
      check: {},
      price: null,
      priceDate: '',
      isFallback: false,
      records: []
    }
  ]
})

describe('缓存隔离与过期判断', () => {
  beforeEach(() => store.clear())

  it('今日缓存按价区隔离', () => {
    writeTodayCache('51', '51003', payload('四川', '一价区'))
    writeTodayCache('51', '51004', payload('四川', '二价区'))
    expect(readTodayCache('51', '51003')?.data.areas[0].areaName).toBe('一价区')
    expect(readTodayCache('51', '51004')?.data.areas[0].areaName).toBe('二价区')
  })

  it('历史缓存按省份整体共享', () => {
    writeHistoryCache('51', payload('四川', '一价区'))
    expect(readHistoryCache('51')?.data.areas[0].areaName).toBe('一价区')
    expect(readHistoryCache('42')).toBeNull()
  })

  it('按各自 TTL 判断新鲜度', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)
    expect(isFresh({ savedAt: now - TODAY_CACHE_TTL + 1, data: null }, TODAY_CACHE_TTL)).toBe(true)
    expect(isFresh({ savedAt: now - TODAY_CACHE_TTL, data: null }, TODAY_CACHE_TTL)).toBe(false)
    expect(
      isFresh({ savedAt: now - HISTORY_CACHE_TTL + 1, data: null }, HISTORY_CACHE_TTL)
    ).toBe(true)
  })
})
