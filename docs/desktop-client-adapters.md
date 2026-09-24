# SpecsRelay 与 DSH Desktop 集成

SpecsRelay 仅支持 anywhere-labs DSH Desktop。安装器、界面入口和原生网页集成均以这一客户端为目标；其他 DSH 桌面客户端及普通浏览器 WebUI 不在支持范围内。

## 安装入口

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install
```

安装器只识别 DSH Desktop。macOS 以 `CFBundleIdentifier` 为准，Windows 读取解包后的应用元数据；应用名称相同不代表受支持。非标准路径可增加 `--app <path>`，`--dry-run` 只显示识别和安装计划。

| 项目 | 值 |
| --- | --- |
| macOS 应用标识 | `ai.deepseek.dsh.desktop` |
| 安装 profile | `desktop` |
| 默认 DSH_HOME | `~/.dsh`，可通过 `DSH_HOME` 或 `--dsh-home` 指定 |
| 应用资源布局 | `app` 或 `app.asar.unpacked` |
| 原生网页服务 | DSH Desktop 提供的 `desktopWebPanels` |

安装器通过应用内置的 DSH 命令安装插件，不修改客户端可执行文件。客户端本身必须包含可用的原生网页服务。

安装器还检查应用包的 `./web-panels` 导出与 `lib/web-panels.js` 文件。仅应用标识或版本号匹配不足以通过；缺少能力时，真实安装与 `--dry-run` 都会停止。该检查不替代实际启动验证。官方 2.0.13 与配套修复版的区别及源码补丁见[修复说明](desktop-native-repair.md)。

## 原生网页与布局

左侧栏底部按“导入会话 → SpecsRelay → 手机连接 → 设置”排列（仅显示已启用的入口）。SpecsRelay 使用 `sidebar.footer.action` 插槽，排在会话导入入口之后。

DSH Desktop 的独立宿主进程也必须注册 `desktopWebPanels`；仅在 Electron 主进程中提供该服务不足以支持默认启动方式。SpecsRelay 使用此服务承载真实 DeepSeek 网页，不再提供其他客户端专用的子进程桥。网页启动失败时，具体原因由服务端返回，面板提示查看错误详情。

SpecsRelay 根据 DSH Desktop 提供的模式和平台信号注册界面入口。DeepSeek 网页始终在左侧，SpecsRelay 操作面板始终在右侧；右侧宽度随窗口调整，缩窄窗口不会切换成标签页。该布局同时适用于需求整理与需求澄清入口。

macOS 和 Windows 的增强模式中，弹层从 32 像素标题栏下方开始，高度限定为剩余内容区域。顶部安全区使用与工作区相同的主题背景色，覆盖完整窗口宽度；背景不接收鼠标事件，关闭弹层后恢复宿主原有外观。

兼容模式与扩展窗口的标题栏在 renderer 外，弹层不再额外增加顶部间距。DSH Desktop 将原生网页放在内容 renderer 上方、独立标题栏及其菜单下方，避免网页遮住窗口模式菜单。
