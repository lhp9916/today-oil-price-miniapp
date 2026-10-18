<script setup lang="ts">
withDefaults(
  defineProps<{
    name: 'price' | 'history' | 'calendar' | 'refresh' | 'empty' | 'locate' | 'switch' | 'close'
    size?: number
  }>(),
  { size: 36 }
)
</script>

<template>
  <view class="icon" :style="{ width: `${size}rpx`, height: `${size}rpx` }">
    <view v-if="name === 'price'" class="drop" :style="{ width: `${size * 0.58}rpx`, height: `${size * 0.58}rpx` }" />
    <view v-else-if="name === 'refresh'" class="refresh" :style="{ width: `${size * 0.7}rpx`, height: `${size * 0.7}rpx` }" />
    <view v-else-if="name === 'empty'" class="empty" :style="{ width: `${size * 0.7}rpx`, height: `${size * 0.7}rpx` }" />
    <view v-else-if="name === 'locate'" class="pin" :style="{ width: `${size * 0.5}rpx`, height: `${size * 0.62}rpx` }" />
    <view v-else-if="name === 'switch'" class="switch" :style="{ width: `${size * 0.7}rpx`, height: `${size * 0.7}rpx` }" />
    <view v-else-if="name === 'close'" class="close" :style="{ width: `${size * 0.62}rpx`, height: `${size * 0.62}rpx` }" />
    <view v-else-if="name === 'history'" class="history" :style="{ width: `${size * 0.7}rpx`, height: `${size * 0.7}rpx` }" />
    <view v-else class="calendar" :style="{ width: `${size * 0.7}rpx`, height: `${size * 0.7}rpx` }" />
  </view>
</template>

<style scoped lang="scss">
.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.drop {
  border-radius: 50% 50% 50% 8%;
  background: currentColor;
  transform: rotate(-45deg);
}

.refresh {
  border: 3rpx solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  position: relative;
}

.refresh::after {
  content: '';
  position: absolute;
  right: -2rpx;
  top: -2rpx;
  width: 0;
  height: 0;
  border-left: 7rpx solid currentColor;
  border-top: 4rpx solid transparent;
  border-bottom: 4rpx solid transparent;
}

.empty {
  border: 3rpx dashed currentColor;
  border-radius: 12rpx;
}

.pin {
  border: 3rpx solid currentColor;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  position: relative;
}

.pin::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.switch {
  border: 3rpx solid currentColor;
  border-radius: 50%;
  position: relative;
}

.switch::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 12%;
  height: 76%;
  border-left: 2rpx solid currentColor;
}

.close {
  position: relative;
}

.close::before,
.close::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  border-top: 3rpx solid currentColor;
}

.close::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.history {
  border: 3rpx solid currentColor;
  border-radius: 8rpx;
  position: relative;
}

.history::after {
  content: '';
  position: absolute;
  left: 15%;
  right: 15%;
  top: 50%;
  border-top: 3rpx solid currentColor;
  box-shadow: 0 -12rpx 0 currentColor, 0 12rpx 0 currentColor;
}

.calendar {
  border: 3rpx solid currentColor;
  border-radius: 8rpx;
  position: relative;
}

.calendar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 25%;
  border-top: 3rpx solid currentColor;
}
</style>
