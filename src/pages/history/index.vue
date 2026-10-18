<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import AreaPicker from '@/components/AreaPicker.vue'
import ProvincePicker from '@/components/ProvincePicker.vue'
import { colorClass, formatPrice, measureLabels, oilTypesOf } from '@/api/provinces'
import { useOilStore } from '@/store/oil'
import type { Province } from '@/shared/types'

const store = useOilStore()
const pickerOpen = ref(false)
const initialized = ref(false)

const area = computed(() => store.currentHistoryArea.value)
const check = computed(() => area.value?.check || {})
const records = computed(() => area.value?.records || [])
const types = computed(() => oilTypesOf(check.value))
const units = computed(() => measureLabels(types.value))
const multiArea = computed(() => store.state.historyAreas.length > 1)
const priceTableWidth = computed(() => types.value.length * 150)

async function selectProvince(province: Province) {
  store.adoptProvince(province)
  pickerOpen.value = false
  await store.loadToday()
  await store.loadHistory({ force: true })
}

async function selectArea(areaId: string) {
  await store.selectHistoryArea(areaId)
}

async function retry() {
  await store.loadHistory({ force: true })
}

onLoad(async () => {
  const restored = store.restoreLocation()
  if (!restored) pickerOpen.value = true
  else if (!store.state.todayAreas.length) await store.loadToday()
  initialized.value = true
})

onShow(async () => {
  if (!initialized.value || !store.state.provinceId) return
  await store.loadHistory()
})

onPullDownRefresh(async () => {
  await store.loadHistory({ force: true })
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="page">
    <view class="head card">
      <view class="head-left">
        <view class="drop">油</view>
        <view class="head-meta">
          <text class="head-province">{{ store.state.provinceName || '请选择省市' }}</text>
          <text class="head-date">历史油价（近一年）</text>
        </view>
      </view>
      <button class="head-switch" @click="pickerOpen = true">切换省市</button>
    </view>

    <view class="content">
      <template v-if="store.state.historyLoading && !store.state.historyAreas.length">
        <view class="skeleton card skeleton-tall" />
        <view class="skeleton card skeleton-tall" />
      </template>

      <view v-else-if="store.state.historyError && !store.state.historyAreas.length" class="state card">
        <view class="state-mark">!</view>
        <text class="state-title">历史油价获取失败</text>
        <text class="state-desc">{{ store.state.historyError }}</text>
        <button class="primary-button" @click="retry">重新加载</button>
      </view>

      <view v-else-if="!store.hasProvince.value" class="state card">
        <view class="state-mark">油</view>
        <text class="state-title">还没有选择省市</text>
        <text class="state-desc">先选择省市，才能查看对应的近一年历史油价。</text>
        <button class="primary-button" @click="pickerOpen = true">选择省市</button>
      </view>

      <template v-else>
        <view v-if="store.state.historyStale" class="notice">
          <text>当前展示的是本地缓存，数据可能不是最新</text>
          <text class="notice-action" @click="retry">刷新</text>
        </view>

        <AreaPicker
          v-if="multiArea"
          :areas="store.state.historyAreas"
          :current-id="store.state.historyAreaId"
          :tip="`点击查看${store.state.provinceName}各价区历史油价`"
          @select="selectArea"
        />

        <view class="table-head">
          <text class="head-area">{{ area?.areaName || store.state.provinceName }}</text>
          <text class="head-title">历史油价（近一年）</text>
          <text class="head-unit">单位：{{ units.join('、') }}</text>
        </view>

        <view v-if="records.length" class="table card">
          <view class="fixed-col">
            <text class="td date-col thead">调价日期</text>
            <text
              v-for="row in records"
              :key="`date-${row.STR_START_DATE}-${row.PERIOD_ID}`"
              class="td date-col"
            >
              {{ row.STR_START_DATE }}
            </text>
          </view>
          <scroll-view class="price-scroll" scroll-x>
            <view class="price-table" :style="{ width: `${priceTableWidth}rpx` }">
              <view class="price-row thead">
                <text v-for="item in types" :key="item.flag" class="td">
                  {{ item.label }}
                </text>
              </view>
              <view
                v-for="row in records"
                :key="`price-${row.STR_START_DATE}-${row.PERIOD_ID}`"
                class="price-row"
              >
                <text
                  v-for="item in types"
                  :key="item.flag"
                  class="td"
                  :class="colorClass(row[`${item.priceField}_COLOR`])"
                >
                  {{ formatPrice(row[item.priceField]) }}
                </text>
              </view>
            </view>
          </scroll-view>
        </view>

        <view v-else class="state card">
          <view class="state-mark">-</view>
          <text class="state-title">暂无历史调价记录</text>
          <text class="state-desc">该价区暂未提供近一年调价数据。</text>
        </view>
      </template>
    </view>

    <ProvincePicker
      :open="pickerOpen"
      :current-id="store.state.provinceId"
      @close="pickerOpen = false"
      @select="selectProvince"
    />
  </view>
</template>

<style scoped lang="scss">
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 26rpx 28rpx;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.drop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 74rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--head-from), var(--primary-deep));
}

.head-meta {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
  min-width: 0;
}

.head-province {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--text);
}

.head-date {
  font-size: 23rpx;
  color: var(--muted);
}

.head-switch {
  flex: none;
  height: 58rpx;
  padding: 0 22rpx;
  font-size: 24rpx;
  color: #ffffff;
  border-radius: var(--radius-pill);
  background: var(--primary);
}

.content {
  margin-top: 22rpx;
}

.skeleton-tall {
  height: 480rpx;
  margin-bottom: 20rpx;
}

.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
  padding: 18rpx 24rpx;
  font-size: 23rpx;
  color: #7a6432;
  border-radius: 14rpx;
  background: #fff8e6;
}

.notice-action {
  flex: none;
  color: #b07916;
  text-decoration: underline;
}

.table-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 20rpx 24rpx;
  color: #ffffff;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  background: linear-gradient(135deg, #5697ff, #4d8bfa);
}

.head-area {
  font-size: 28rpx;
  font-weight: 600;
  white-space: nowrap;
}

.head-title {
  flex: 1;
  font-size: 26rpx;
  text-align: center;
}

.head-unit {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.88);
}

.table {
  display: flex;
  overflow: hidden;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
}

.fixed-col {
  flex: none;
  width: 250rpx;
}

.price-scroll {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.price-table {
  min-width: 100%;
}

.price-row {
  display: flex;
  border-bottom: 2rpx solid #f5f9ff;
}

.price-row.thead,
.date-col.thead {
  background: #eef4ff;
}

.td {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 150rpx;
  min-height: 76rpx;
  padding: 0 10rpx;
  font-size: 24rpx;
  color: #a8a4a4;
}

.price-row.thead .td,
.date-col.thead {
  font-weight: 600;
  color: #5a6a86;
}

.date-col {
  width: 250rpx;
  color: #494848;
  background: #ffffff;
}

.state-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 100rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--primary);
  border-radius: 50%;
  background: #eaf2ff;
}
</style>
