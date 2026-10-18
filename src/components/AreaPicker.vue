<script setup lang="ts">
import type { PriceArea } from '@/shared/types'

defineProps<{
  areas: PriceArea[]
  currentId: string
  tip?: string
}>()

const emit = defineEmits<{
  select: [areaId: string]
}>()
</script>

<template>
  <view class="area-block">
    <text v-if="tip" class="area-tip">{{ tip }}</text>
    <scroll-view class="area-scroll" scroll-x :show-scrollbar="false">
      <view class="area-list">
        <button
          v-for="item in areas"
          :key="item.areaId"
          class="area-chip"
          :class="{ current: String(item.areaId) === String(currentId) }"
          @click="emit('select', item.areaId)"
        >
          {{ item.areaName }}
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.area-block {
  margin-bottom: 22rpx;
}

.area-tip {
  display: block;
  margin-bottom: 14rpx;
  font-size: 25rpx;
  color: #595959;
}

.area-scroll {
  width: 100%;
  white-space: nowrap;
}

.area-list {
  display: inline-flex;
  gap: 16rpx;
  padding-bottom: 4rpx;
}

.area-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 152rpx;
  height: 62rpx;
  padding: 0 24rpx;
  font-size: 25rpx;
  font-weight: 600;
  color: var(--primary-deep);
  border-radius: var(--radius-chip);
  background: #ffffff;
  box-shadow: 0 2rpx 14rpx rgba(156, 162, 200, 0.28), 0 0 0 2rpx #5798fe inset;
}

.area-chip.current {
  color: #ffffff;
  background: linear-gradient(135deg, var(--head-from), var(--primary-deep));
  box-shadow: 0 3rpx 16rpx rgba(85, 151, 254, 0.42);
}
</style>
