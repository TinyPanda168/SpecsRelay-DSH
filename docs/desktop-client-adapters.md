# SpecsRelay 桌面客户端适配

支持 DeepSeek Harness 官方桌面端，以及 anywhere-labs 社区版 DSH Desktop。两者共用需求整理、增强、澄清和交接流程，分别连接各自的浏览器与会话接口；其他桌面分支及普通浏览器 WebUI 不在支持范围内。

| 客户端 | macOS 标识 | 网页能力 | 安装方式 |
| --- | --- | --- | --- |
| DeepSeek Harness 官方版 | `com.deepseek.dsh` | `window.dshDesktop.browser`，协议版本 1 | 应用内“插件”页面 |
| anywhere-labs 社区版 | `ai.deepseek.dsh.desktop` | `desktopWebPanels` | 内置 DSH CLI / 本仓库安装器 |

## 官方版

在应用的插件页面安装 `github:TinyPandaGame/SpecsRelay-DSH`，然后重启。官方应用管理 desktop profile；本仓库安装器识别官方 macOS 应用后只提示应用内安装，不执行社区 CLI。同机识别到两者时优先提示官方版，避免修改共享的 `~/.dsh`；显式 `--app` 指向社区版仍可安装社区插件。

插件直接调用官方浏览器 API，独立实现 `lib/official-browser-client.js` 适配层，没有复制或修改官方桌面核心。按项目获取网页租用、创建沙箱化 `webview`，关闭、加载失败、超时和延迟返回时释放租用。抓取和澄清发送前检查 DeepSeek 来源；Node integration、preload 和宿主安全策略保持不变。

网页嵌入左侧 DOM 容器，右侧保持 SpecsRelay 面板。侧栏入口独立排列在导入会话下方、更多上方，图标与文字跟随“更多”按钮的左边距。macOS 顶部预留 32 像素，Windows 按宿主布局预留 40 像素；图标同时适配官方 Regular 导出和社区版原有导出。官方会话通过 `retainedBy.mainView` 识别当前选择，项目连接与导航使用 `uiWorkspace`，交接及接续期间显式保留会话，等待接收结果后再报告发送成功。

验证基线：macOS Apple Silicon，官方 0.1.7-rc.2。真实网页加载、左右布局、标题栏与关闭重开已检查，真实整理模型调用通过。抓取、澄清与交接接口另有自动化测试；网站目前在未登录页显示使用环境提示，尚未完成登录后真实对话到 Agent 的端到端验收。官方 Windows/Linux 未实测，不据此承诺其他版本兼容。

## 社区版安装

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --app "/Applications/DSH Desktop.app"
```

macOS 以 `CFBundleIdentifier` 识别，Windows 读取解包后的应用元数据。应用名称相同不足以确认支持；`--dry-run` 只显示安装计划。安装到 `desktop` profile，默认 `DSH_HOME` 为 `~/.dsh`，可通过环境变量或 `--dsh-home` 指定。

安装器检查 `./web-panels` 导出和 `lib/web-panels.js`；缺失时停止，不修改应用。社区上游原版 2.0.13 与配套构建的区别见[修复说明](desktop-native-repair.md)。该补丁不适用于 DeepSeek 官方桌面端。

## 社区版原生网页与布局

左侧栏底部按“导入会话 → SpecsRelay → 手机连接 → 设置”排列（仅显示已启用的入口）。SpecsRelay 使用 `sidebar.footer.action` 插槽，排在会话导入入口之后。

DSH Desktop 的独立宿主进程也必须注册 `desktopWebPanels`；仅在 Electron 主进程中提供该服务不足以支持默认启动方式。SpecsRelay 使用此服务承载真实 DeepSeek 网页，不再提供其他客户端专用的子进程桥。网页启动失败时，具体原因由服务端返回，面板提示查看错误详情。

SpecsRelay 根据 DSH Desktop 提供的模式和平台信号注册界面入口。DeepSeek 网页始终在左侧，SpecsRelay 操作面板始终在右侧；右侧宽度随窗口调整，缩窄窗口不会切换成标签页。该布局同时适用于需求整理与需求澄清入口。

macOS 和 Windows 的增强模式中，弹层从 32 像素标题栏下方开始，高度限定为剩余内容区域。顶部安全区使用与工作区相同的主题背景色，覆盖完整窗口宽度；背景不接收鼠标事件，关闭弹层后恢复宿主原有外观。

兼容模式与扩展窗口的标题栏在 renderer 外，弹层不再额外增加顶部间距。DSH Desktop 将原生网页放在内容 renderer 上方、独立标题栏及其菜单下方，避免网页遮住窗口模式菜单。
