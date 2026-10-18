<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import AreaPicker from '@/components/AreaPicker.vue'
import LocationHeader from '@/components/LocationHeader.vue'
import PriceCard from '@/components/PriceCard.vue'
import { oilTypesOf } from '@/api/provinces'
import { PROVINCES } from '@/shared/oil-data'
import { useOilStore } from '@/store/oil'
import type { Province } from '@/shared/types'

const store = useOilStore()
const pickerOpen = ref(false)
const initialized = ref(false)
const keyword = ref('')
const filteredProvinces = computed(() => {
  const target = keyword.value.trim()
  return target ? PROVINCES.filter((item) => item.name.includes(target)) : PROVINCES
})

const area = computed(() => store.currentTodayArea.value)
const check = computed(() => area.value?.check || {})
const price = computed(() => area.value?.price || null)
const types = computed(() => oilTypesOf(check.value))
const multiArea = computed(() => store.state.todayAreas.length > 1)
const hasAnyPrice = computed(() => !!price.value)
const fallbackDate = computed(() => area.value?.priceDate || '')
const areaDesc = computed(() => String(check.value.AREA_DESC || ''))
const showAreaDesc = computed(
  () => !!areaDesc.value && check.value.AREADESC_ISDISPLAY !== 'N'
)
const highlightFlag = computed(() => {
  const list = types.value.filter(
    (item) => price.value && price.value[item.priceField] != null
  )
  if (!list.length) return ''
  return (list.find((item) => item.flag === 'GAS_92') || list[0]).flag
})

async function selectProvince(province: Province) {
  store.adoptProvince(province)
  pickerOpen.value = false
  keyword.value = ''
  await store.loadToday()
}

async function selectArea(areaId: string) {
  await store.selectTodayArea(areaId)
}

async function retry() {
  await store.loadToday({ keepArea: true })
}

onLoad(() => {
  const restored = store.restoreLocation()
  if (!restored) pickerOpen.value = true
  initialized.value = true
})

onShow(async () => {
  if (!initialized.value || !store.state.provinceId) return
  await store.loadToday({ keepArea: true })
})

onPullDownRefresh(async () => {
  await store.loadToday({ keepArea: true })
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="page">
    <LocationHeader
      :date="store.state.todayDate"
      :province-name="store.state.provinceName"
      :loading="store.state.todayLoading"
      @pick="pickerOpen = true"
    />

    <view class="content">
      <template v-if="store.state.todayLoading && !store.state.todayAreas.length">
        <view v-for="n in 5" :key="n" class="skeleton card skeleton-card" />
      </template>

      <view v-else-if="store.state.todayError && !store.state.todayAreas.length" class="state card">
        <view class="state-mark">!</view>
        <text class="state-title">油价获取失败</text>
        <text class="state-desc">{{ store.state.todayError }}</text>
        <button class="primary-button" @click="retry">重新加载</button>
      </view>

      <view v-else-if="!store.hasProvince.value" class="state card">
        <view class="state-mark">油</view>
        <text class="state-title">还没有选择省市</text>
        <text class="state-desc">选择一次后会自动记住，下次进入直接显示该省份油价。</text>
        <button class="primary-button" @click="pickerOpen = true">选择省市</button>
      </view>

      <template v-else>
        <view v-if="store.state.todayStale" class="notice">
          <text>当前展示的是本地缓存，数据可能不是最新</text>
          <text class="notice-action" @click="retry">刷新</text>
        </view>

        <view v-if="showAreaDesc" class="tips card">{{ areaDesc }}</view>

        <AreaPicker
          v-if="multiArea"
          :areas="store.state.todayAreas"
          :current-id="store.state.todayAreaId"
          @select="selectArea"
        />

        <text
          v-if="area && area.areaName && multiArea"
          class="section-title area-name"
        >
          {{ area.areaName }}
        </text>

        <view class="price-list">
          <PriceCard
            v-for="item in types"
            :key="item.flag"
            :label="item.label"
            :unit="item.category"
            :measure="item.measure"
            :price="price ? price[item.priceField] : null"
            :status="price ? price[item.statusField] : null"
            :highlight="item.flag === highlightFlag"
          />
        </view>

        <text v-if="!hasAnyPrice" class="foot-note">
          注：当前油价暂未更新，请以加油站实际价格为准。
        </text>
        <template v-else>
          <view v-if="fallbackDate" class="fallback-note">
            该省市当期油价尚未发布，以上为 {{ fallbackDate }} 起执行的最近一次公布价格。
          </view>
          <text class="foot-note">
            数据来源：中国石化，仅供参考，实际以加油站挂牌价为准。
          </text>
        </template>
      </template>
    </view>

    <view v-if="pickerOpen" class="sheet-mask" @click.self="pickerOpen = false">
      <view class="sheet">
        <view class="sheet-head">
          <text class="sheet-title">选择省市查看油价</text>
          <button class="sheet-close" @click="pickerOpen = false">×</button>
        </view>
        <text class="sheet-hint">选择后将长期记住，下次进入直接打开该省份</text>
        <input
          v-model="keyword"
          class="sheet-search"
          type="text"
          placeholder="搜索省市"
          confirm-type="search"
        />
        <scroll-view class="province-scroll" scroll-y>
          <view class="province-grid">
            <button
              v-for="item in filteredProvinces"
              :key="item.id"
              class="province-button"
              :class="{ current: String(item.id) === String(store.state.provinceId) }"
              @click="selectProvince(item)"
            >
              {{ item.name }}
            </button>
          </view>
          <text v-if="!filteredProvinces.length" class="province-empty">
            没有找到匹配的省市
          </text>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.content {
  margin-top: 22rpx;
}

.skeleton-card {
  height: 108rpx;
  margin-bottom: 18rpx;
}

.area-name {
  margin-top: 4rpx;
}

.tips {
  margin-bottom: 24rpx;
  padding: 22rpx 26rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #656565;
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

.fallback-note {
  margin-top: 18rpx;
  padding: 16rpx 24rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #7a6432;
  border-radius: 14rpx;
  background: #fff8e6;
  box-shadow: 0 0 0 2rpx rgba(214, 178, 92, 0.35) inset;
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

.sheet-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  background: rgba(24, 44, 84, 0.42);
}

.sheet {
  width: 100%;
  max-height: 82vh;
  padding: 30rpx 28rpx calc(40rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: linear-gradient(to bottom, #bed7fd, #ddeafc 42%, #f4f8ff);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title {
  font-size: 31rpx;
  font-weight: 600;
  color: #353535;
}

.sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  font-size: 38rpx;
  color: #4a6ea8;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
}

.sheet-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #5a7398;
}

.sheet-search {
  height: 68rpx;
  margin-top: 20rpx;
  padding: 0 22rpx;
  font-size: 26rpx;
  border-radius: var(--radius-pill);
  background: #ffffff;
}

.province-scroll {
  max-height: 56vh;
  margin-top: 22rpx;
}

.province-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8rpx;
}

.province-button {
  width: calc(25% - 16rpx);
  height: 62rpx;
  margin: 0 8rpx 16rpx;
  font-size: 26rpx;
  color: #353535;
  border-radius: var(--radius-chip);
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(156, 159, 200, 0.4);
}

.province-button.current {
  color: #ffffff;
  background: var(--primary);
}

.province-empty {
  display: block;
  padding: 50rpx 0;
  font-size: 25rpx;
  color: #5a7398;
  text-align: center;
}

</style>
