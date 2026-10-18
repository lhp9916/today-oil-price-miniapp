# 发布与部署说明

## 1. 合法域名

在微信公众平台「开发管理 → 开发设置 → 服务器域名」中配置：

| 类型 | 域名 |
| --- | --- |
| request 合法域名 | `https://oil.bigpeng.site` |
| downloadFile 合法域名 | `https://oil.bigpeng.site` |

`oil.bigpeng.site` 必须使用 HTTPS，且证书域名与请求域名一致。当前证书为 `Let's Encrypt`，有效期至 2027-01-15，需在到期前续签。

## 2. AppID

当前工程使用空 AppID，构建产物会回落到 `touristappid`，便于游客模式导入。正式发布前只需替换 `src/manifest.json` 的 `mp-weixin.appid`，然后重新构建；不要手动改产物文件。

## 3. 日历图片

当前代码中的日历图片直连 `https://cx.sinopecsales.com/yjkqiantai/oilImages/`，测试号关闭合法域名校验后可直接显示。正式发布前需要把 `https://cx.sinopecsales.com` 加入 `downloadFile` 合法域名。

如果希望改回自有域名，先确认线上以下地址可用：

```bash
curl -I https://oil.bigpeng.site/yjkqiantai/oilImages/202610.png
```

期望结果：

```text
HTTP/2 200
content-type: image/png
```

只有在以上地址返回 `200 image/png` 后，才把 `src/api/oil.ts` 的 `CALENDAR_ORIGIN` 切回 `https://oil.bigpeng.site`。

## 4. 隐私说明草稿

本小程序不申请位置权限，不采集手机号、通讯录、相册等个人信息。仅在本地保存用户选择的省市、价区和油价缓存，用于下次打开时恢复展示。网络请求仅用于获取中国石化公开油价数据与调价日历图片。

## 5. 审核步骤

1. 运行 `npm run build:mp-weixin`。
2. 微信开发者工具导入 `dist/build/mp-weixin`。
3. 真机预览今日、历史、日历三个页签。
4. 上传体验版，检查合法域名与图片加载。
5. 在公众平台提交审核，说明数据来源与免责声明。

## 6. 验收清单

- [ ] 首次进入弹出省市选择，不申请定位
- [ ] 湖北等单价区正常显示
- [ ] 四川等多价区可切换
- [ ] 历史日期列固定，油品列可横向滚动
- [ ] 日历图片正常显示，404 月份自动隐藏
- [ ] 断网时有缓存展示缓存并提示，无缓存显示错误与重试
- [ ] 冷启动恢复上次省市与价区
