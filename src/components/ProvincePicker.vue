<script setup lang="ts">
import { computed, ref } from 'vue'
import { PROVINCES } from '@/shared/oil-data'
import type { Province } from '@/shared/types'

const props = defineProps<{
  open: boolean
  currentId: string
}>()

const emit = defineEmits<{
  close: []
  select: [province: Province]
}>()

const keyword = ref('')

const filtered = computed(() => {
  const target = keyword.value.trim()
  if (!target) return PROVINCES
  return PROVINCES.filter((item) => item.name.includes(target))
})

function choose(province: Province) {
  keyword.value = ''
  emit('select', province)
}
</script>

<template>
  <view v-if="open" class="sheet-mask" @click.self="emit('close')">
    <view class="sheet">
      <view class="sheet-head">
        <text class="sheet-title">选择省市查看油价</text>
        <button class="close" @click="emit('close')">×</button>
      </view>
      <text class="hint">选择后将长期记住，下次进入直接打开该省份</text>
      <input
        v-model="keyword"
        class="search"
        type="text"
        placeholder="搜索省市"
        confirm-type="search"
      />
      <scroll-view class="grid-scroll" scroll-y>
        <view class="grid">
          <button
            v-for="item in filtered"
            :key="item.id"
            class="province"
            :class="{ current: String(item.id) === String(props.currentId) }"
            @click="choose(item)"
          >
            {{ item.name }}
          </button>
        </view>
        <text v-if="!filtered.length" class="no-result">没有找到匹配的省市</text>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.sheet-mask {
  position: fixed;
  inset: 0;
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

.close {
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

.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #5a7398;
}

.search {
  height: 68rpx;
  margin-top: 20rpx;
  padding: 0 22rpx;
  font-size: 26rpx;
  border-radius: var(--radius-pill);
  background: #ffffff;
}

.grid-scroll {
  max-height: 56vh;
  margin-top: 22rpx;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8rpx;
}

.province {
  width: calc(25% - 16rpx);
  margin: 0 8rpx 16rpx;
  height: 62rpx;
  font-size: 26rpx;
  color: #353535;
  border-radius: var(--radius-chip);
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(156, 159, 200, 0.4);
}

.province.current {
  color: #ffffff;
  background: var(--primary);
}

.no-result {
  display: block;
  padding: 50rpx 0;
  font-size: 25rpx;
  color: #5a7398;
  text-align: center;
}
</style>
