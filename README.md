# 今日油价微信小程序

基于现有今日油价 uTools 插件与 H5 改造的微信小程序。首版包含今日油价、历史油价和调价日历三个页签，直接请求已部署的 `https://oil.bigpeng.site` 反代，不包含自建 Node 服务、云函数或自动定位。

## 功能

- 今日油价：各标号当前价格、涨跌幅度、92 号高亮、多价区切换
- 历史油价：近一年全部调价记录，日期列固定、油品列横向滚动
- 调价日历：当月及后续两个月，未发布月份自动隐藏
- 省市与价区记忆：保存在小程序本地存储
- 分级缓存：今日 10 分钟，历史 6 小时；离线时展示缓存并提示
- 当期缺失兜底：使用最近一次已公布价格并标注生效日期

## 技术栈

- uni-app + Vue 3 + Vite + TypeScript
- 微信小程序目标
- 无自动定位权限、无第三方统计 SDK

## 开发

```bash
npm install
npm run dev:mp-weixin
npm test
npm run type-check
```

开发产物位于 `dist/dev/mp-weixin`，用微信开发者工具导入该目录。

## 构建

```bash
npm run build:mp-weixin
```

产物位于 `dist/build/mp-weixin`。微信开发者工具应直接导入该目录，不要导入仓库根目录；根目录是 uni-app 源码工程，不是小程序运行时目录。构建会生成 `dist/build/mp-weixin/project.config.json`，AppID 与项目设置以该产物配置为准。

## 接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `POST` | `/yjkqiantai/data/switchProvince` | 切换省份并下发 SESSION |
| `GET` | `/yjkqiantai/data/initMainData` | 获取数据日期 |
| `GET` | `/yjkqiantai/data/initOilPrice` | 获取近一年历史调价 |
| `GET` | `/yjkqiantai/oilImages/YYYYMM.png` | 调价日历图片 |

`switchProvince` 与 `initOilPrice` 必须串行；后者需要带上前者响应中的 `SESSION`。小程序没有浏览器自动 Cookie 机制，`SESSION` 仅保存在内存，冷启动重新建立。

## 发布前配置

1. 在微信公众平台把 `https://oil.bigpeng.site` 同时加入 `request` 与 `downloadFile` 合法域名。
2. 把 `src/manifest.json` 的 `mp-weixin.appid` 替换为正式小程序 AppID，然后重新构建；产物 `project.config.json` 会自动使用该 AppID。
3. 日历图片当前直连 `https://cx.sinopecsales.com/yjkqiantai/oilImages/`。发布前需把该域名加入 `downloadFile` 合法域名，或将图片路径补到自有反代后再切回自有域名。
4. 在微信开发者工具中完成真机预览、体验版上传与审核。

当前 `oil.bigpeng.site` 的日历图片路径返回 404，因此日历图片暂时直连中石化源站。正式发布要二选一：配置上游域名合法域名，或修复自有反代图片路径。具体见 `docs/RELEASE.md`。

## 说明

- 数据来源中国石化公开接口，仅供参考，实际以加油站挂牌价为准
- 首版首次进入直接弹出省市选择，不申请位置权限
- 不修改现有 uTools 插件和 H5 工程
