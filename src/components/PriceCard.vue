<script setup lang="ts">
import { computed } from 'vue'
import { deltaClass, formatDelta, formatPrice } from '@/api/provinces'
import type { PriceValue } from '@/shared/types'

const props = defineProps<{
  label: string
  unit: string
  measure: string
  price: PriceValue
  status: PriceValue
  highlight?: boolean
}>()

const priceText = computed(() => formatPrice(props.price))
const deltaText = computed(() => formatDelta(props.status))
const missing = computed(() => priceText.value === '-')
const sign = computed(() => {
  const num = Number(props.status)
  return Number.isNaN(num) || num === 0 ? '' : num > 0 ? 'up' : 'down'
})
</script>

<template>
  <view class="price-card card" :class="{ 'is-highlight': highlight }">
    <view class="left">
      <text class="label">{{ label }}</text>
      <text class="unit">{{ unit }}</text>
    </view>
    <view class="right">
      <template v-if="!missing">
        <text v-if="deltaText" class="delta" :class="[deltaClass(status), sign]">
          {{ deltaText }}
        </text>
        <text class="price">{{ priceText }}</text>
        <text class="price-unit">({{ measure }})</text>
      </template>
      <view v-else class="missing">
        <text>数据未更新</text>
        <text class="missing-tip">以油站实际价格为准</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.price-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 108rpx;
  padding: 0 28rpx;
  margin-bottom: 18rpx;
}

.price-card.is-highlight {
  box-shadow: 0 0 0 3rpx var(--primary) inset, var(--shadow);
}

.left {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  min-width: 0;
}

.label {
  font-size: 38rpx;
  color: var(--text);
}

.unit {
  font-size: 24rpx;
  color: var(--muted);
}

.right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.delta {
  min-width: 64rpx;
  font-size: 23rpx;
  text-align: right;
}

.price {
  min-width: 110rpx;
  font-size: 38rpx;
  font-weight: 600;
  color: var(--text);
  text-align: center;
}

.price-unit {
  font-size: 24rpx;
  color: var(--muted-strong);
}

.missing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 24rpx;
  line-height: 1.4;
  color: var(--muted-strong);
}

.missing-tip {
  font-size: 21rpx;
  color: #b6b2b2;
}
</style>
