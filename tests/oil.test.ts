import { describe, expect, it } from 'vitest'
import {
  applyLatestPrice,
  calendarMonths,
  hasUsablePrice,
  normalizeHistory,
  normalizeToday
} from '../src/api/oil'
import { findProvinceByName, formatPrice } from '../src/api/provinces'
import type { RawOilResponse } from '../src/shared/types'

const baseCheck = {
  PROVINCE_ID: 51,
  PROVINCE_NAME: '四川',
  AREA_ID: 51000,
  AREA_NAME: '四川',
  GAS_92: 'Y',
  GAS_95: 'Y',
  GAS_98: 'N',
  CHAI_0: 'Y'
}

const multiAreaResponse: RawOilResponse = {
  data: {
    provinceCheck: baseCheck,
    area: [
      {
        areaCheck: { ...baseCheck, AREA_ID: 51003, AREA_NAME: '一价区' },
        areaData: { GAS_92: 8.7, GAS_95: 9.3, CHECHAI_0: 8.34, GAS_92_STATUS: 0.32 }
      },
      {
        areaCheck: { ...baseCheck, AREA_ID: 51004, AREA_NAME: '二价区' },
        areaData: { GAS_92: 8.8, GAS_95: 9.4, CHECHAI_0: 8.44 }
      }
    ]
  }
}

const singleAreaResponse: RawOilResponse = {
  data: {
    provinceCheck: baseCheck,
    provinceData: { GAS_92: 8.1, GAS_95: 8.6, CHECHAI_0: 7.9 }
  }
}

const missingResponse: RawOilResponse = {
  data: {
    provinceCheck: baseCheck,
    provinceData: null,
    area: []
  }
}

describe('hasUsablePrice', () => {
  it('只有包含数字价格字段才算有数据', () => {
    expect(hasUsablePrice({ GAS_92: 8.7 })).toBe(true)
    expect(hasUsablePrice({ GAS_92: null })).toBe(false)
    expect(hasUsablePrice({})).toBe(false)
    expect(hasUsablePrice(null)).toBe(false)
    expect(hasUsablePrice([])).toBe(false)
  })
})

describe('normalizeToday', () => {
  it('多价区省份展开为多个价区', () => {
    const data = normalizeToday(multiAreaResponse, '2026年10月17日')
    expect(data.toDay).toBe('2026年10月17日')
    expect(data.provinceName).toBe('四川')
    expect(data.areas).toHaveLength(2)
    expect(data.areas[0]).toMatchObject({
      areaId: '51003',
      areaName: '一价区',
      price: { GAS_92: 8.7 }
    })
  })

  it('单价区省份合成单个价区', () => {
    const data = normalizeToday(singleAreaResponse)
    expect(data.areas).toHaveLength(1)
    expect(data.areas[0].areaId).toBe('51000')
    expect(data.areas[0].price).toEqual({ GAS_92: 8.1, GAS_95: 8.6, CHECHAI_0: 7.9 })
  })

  it('当期缺失时 price 为 null，但仍保留价区以便兜底', () => {
    const data = normalizeToday(missingResponse)
    expect(data.areas).toHaveLength(1)
    expect(data.areas[0].price).toBeNull()
  })
})

describe('normalizeHistory', () => {
  it('areaData 数组按价区归一记录', () => {
    const data = normalizeHistory({
      data: {
        provinceCheck: baseCheck,
        area: [
          {
            areaCheck: { ...baseCheck, AREA_ID: 51003, AREA_NAME: '一价区' },
            areaData: [
              { STR_START_DATE: '2026-10-15', GAS_92: 8.7 },
              { STR_START_DATE: '2026-09-24', GAS_92: 8.38 }
            ]
          }
        ]
      }
    })
    expect(data.areas[0].records).toHaveLength(2)
    expect(data.areas[0].records[0].STR_START_DATE).toBe('2026-10-15')
  })

  it('provinceData 单对象归一为一条记录', () => {
    const data = normalizeHistory({
      data: {
        provinceCheck: baseCheck,
        provinceData: { STR_START_DATE: '2026-10-15', GAS_92: 8.7 }
      }
    })
    expect(data.areas).toHaveLength(1)
    expect(data.areas[0].records).toHaveLength(1)
  })

  it('provinceData 数组逐条归一', () => {
    const data = normalizeHistory({
      data: {
        provinceCheck: baseCheck,
        provinceData: [
          { STR_START_DATE: '2026-10-15', GAS_92: 8.7 },
          { STR_START_DATE: '2026-09-24', GAS_92: 8.38 }
        ]
      }
    })
    expect(data.areas[0].records).toHaveLength(2)
  })

  it('无数据时返回空记录而不是报错', () => {
    const data = normalizeHistory({ data: { provinceCheck: baseCheck, area: [] } })
    expect(data.areas[0].records).toEqual([])
  })
})

describe('applyLatestPrice', () => {
  const today = normalizeToday(missingResponse, '2026年10月17日')
  const history = normalizeHistory({
    data: {
      provinceCheck: baseCheck,
      area: [
        {
          areaCheck: { ...baseCheck, AREA_ID: 51000, AREA_NAME: '四川' },
          areaData: [
            {
              STR_START_DATE: '2026-09-24',
              GAS_92: 7.85,
              GAS_92_STATUS: 0.21,
              GAS_95_STATUS: -0.18
            },
            { STR_START_DATE: '2026-08-27', GAS_92: 7.64 }
          ]
        }
      ]
    }
  })

  it('用最近一条调价记录补齐当期价格', () => {
    const result = applyLatestPrice(today, history)
    expect(result.isFallback).toBe(true)
    expect(result.priceDate).toBe('2026-09-24')
    expect(result.areas[0].price?.GAS_92).toBe(7.85)
    expect(result.areas[0].priceDate).toBe('2026-09-24')
  })

  it('清零历史记录的 *_STATUS，避免误当今日涨跌', () => {
    const result = applyLatestPrice(today, history)
    expect(result.areas[0].price?.GAS_92_STATUS).toBe(0)
    expect(result.areas[0].price?.GAS_95_STATUS).toBe(0)
  })

  it('已有当期价格时不覆盖', () => {
    const filled = normalizeToday(singleAreaResponse, '2026年10月17日')
    const result = applyLatestPrice(filled, history)
    expect(result.isFallback).toBe(false)
    expect(result.areas[0].price?.GAS_92).toBe(8.1)
  })
})

describe('province matching and formatting', () => {
  it('匹配中文与英文别名', () => {
    expect(findProvinceByName('湖北')?.id).toBe('42')
    expect(findProvinceByName('广西壮族自治区')?.id).toBe('45')
    expect(findProvinceByName('Hubei')?.id).toBe('42')
  })

  it('0 与空值显示为 -', () => {
    expect(formatPrice(0)).toBe('-')
    expect(formatPrice(null)).toBe('-')
    expect(formatPrice(8.7)).toBe('8.70')
  })
})

describe('calendarMonths', () => {
  it('日历图片直连中石化源站并按月份生成', () => {
    const list = calendarMonths(new Date(2026, 9, 18), 3)
    expect(list.map((item) => item.key)).toEqual(['202610', '202611', '202612'])
    expect(list[0].url).toBe(
      'https://cx.sinopecsales.com/yjkqiantai/oilImages/202610.png'
    )
  })
})
