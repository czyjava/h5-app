# 神笔绘画 APP 测试账号映射

> 用于 APK-H5 自动化对齐、模拟器登录态准备和后台短信验证码查询。验证码、token、密码等一次性或敏感凭据不得写入本文档。

| APP | 产品标识 | 包名 | 测试手机号 | 后台短信记录筛选条件 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 神笔绘画 | `magicpen` | `com.wanmeixiangsu.android.magicpen` | `99900000089` | 应用名 `magicpen`、平台 `android`、发送成功、创建时间晚于本次触发登录时间 | 每个 APP 独立使用固定手机号；验证码发送后最多轮询 3 分钟，超时再重新发送 |

## 使用约定

- 登录 APP 时先在模拟器触发手机号验证码登录，再到后台短信记录页按测试手机号查询。
- 后台短信记录地址：`https://admin.wanmeixiangsu.cn/auth.wanmeixiangsu.cn/#header=auth!main%2Faside1&aside=auth!app%2Fsms-send-record%2Findex%2Flist`
- 短信记录可能延迟入库；查询时每 10-15 秒刷新/搜索一次，3 分钟内未出现再触发重新发送。
- 只将验证码用于当次 APP 回填，不记录验证码明文，不在报告、日志、session 或 commit message 中输出。
