<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{
  date: string
  provinceName: string
  loading?: boolean
}>()

const emit = defineEmits<{
  pick: []
}>()
</script>

<template>
  <view class="head-card">
    <view class="wave wave-a" />
    <view class="wave wave-b" />
    <view class="head-body">
      <view class="left">
        <view class="drop">
          <AppIcon name="price" :size="54" />
        </view>
        <view class="meta">
          <text class="date">今日油价：{{ date || '--' }}</text>
          <text class="province">{{ provinceName || '请选择省市' }}</text>
        </view>
      </view>
      <button class="solid" @click="emit('pick')">
        <AppIcon name="switch" :size="28" />
        <text>切换省市</text>
      </button>
    </view>
    <view v-if="loading" class="loading-bar" />
  </view>
</template>

<style scoped lang="scss">
.head-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-card);
  background: linear-gradient(135deg, var(--head-from), var(--head-to));
  box-shadow: 0 4rpx 24rpx rgba(85, 151, 254, 0.4);
}

.wave {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.09);
}

.wave-a {
  left: -12%;
  bottom: -78%;
  width: 78%;
  height: 150%;
}

.wave-b {
  right: -18%;
  bottom: -92%;
  width: 86%;
  height: 165%;
  background: rgba(255, 255, 255, 0.06);
}

.head-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 32rpx 30rpx;
}

.left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-width: 0;
}

.drop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 82rpx;
  height: 82rpx;
  color: #ffffff;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 2rpx rgba(255, 255, 255, 0.28) inset;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.86);
}

.province {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.solid {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: none;
  height: 60rpx;
  padding: 0 24rpx;
  font-size: 25rpx;
  font-weight: 600;
  color: #0459e6;
  border-radius: var(--radius-pill);
  background: #ffffff;
}

.loading-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4rpx;
  width: 40%;
  background: rgba(255, 255, 255, 0.9);
  animation: slide 1.1s ease-in-out infinite;
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}
</style>
