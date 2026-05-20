# 神笔绘画复刻

当前神笔绘画 H5 复刻实现仍在：

```text
/Users/chenzhiyuan/work/codes/wmxs/h5-magicpen
```

这个目录先作为 `h5-app` 工作区中的 APP 登记位。后续迁移时建议按下面顺序进行：

1. 先把接口、登录、环境和代理逻辑切到 `../../common`。
2. 再把页面代码迁入当前目录。
3. 最后更新启动脚本和端口，确认原 `h5-magicpen` 不再被依赖。
