<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { calendarMonths } from '@/api/oil'

interface MonthImage {
  key: string
  label: string
  url: string
  failed: boolean
}

const createMonths = (): MonthImage[] =>
  calendarMonths().map((item) => ({ ...item, failed: false }))

const months = ref<MonthImage[]>(createMonths())
const visibleMonths = computed(() => months.value.filter((item) => !item.failed))
const allFailed = computed(() => months.value.length > 0 && visibleMonths.value.length === 0)
const title = `${new Date().getFullYear()}年油价调整日历`

function markFailed(key: string) {
  const item = months.value.find((month) => month.key === key)
  if (item) item.failed = true
}

async function refresh() {
  months.value = createMonths()
}

onPullDownRefresh(async () => {
  await refresh()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="page">
    <view class="head card">
      <text class="title">{{ title }}</text>
      <text class="tips">调价日（调价时间为当日 24 时）</text>
    </view>

    <view v-if="allFailed" class="state card">
      <view class="state-mark">-</view>
      <text class="state-title">暂无调价日历</text>
      <text class="state-desc">当前年份的调价日历图片暂未发布，请稍后再试。</text>
      <button class="primary-button" @click="refresh">重新加载</button>
    </view>

    <view v-else class="months">
      <view v-for="item in visibleMonths" :key="item.key" class="month card">
        <image
          class="month-image"
          :src="item.url"
          mode="widthFix"
          :alt="`${item.label}油价调整日历`"
          @error="markFailed(item.key)"
        />
        <text class="month-label">{{ item.label }}</text>
      </view>
    </view>

    <text class="foot-note">数据来源：中国石化，日历图片按自然月发布。</text>
  </view>
</template>

<style scoped lang="scss">
.head {
  padding: 28rpx 30rpx;
  margin-bottom: 22rpx;
}

.title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text);
}

.tips {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: var(--muted);
}

.months {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.month {
  width: calc(50% - 10rpx);
  margin-bottom: 20rpx;
  overflow: hidden;
}

.month-image {
  display: block;
  width: 100%;
  min-height: 360rpx;
  background: #ffffff;
}

.month-label {
  display: block;
  padding: 18rpx 20rpx;
  font-size: 24rpx;
  color: #5a6a86;
  text-align: center;
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
