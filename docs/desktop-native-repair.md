# 社区版 DSH Desktop 原生网页修复与升级检查

本页只适用于 anywhere-labs 社区客户端；DeepSeek 官方桌面端使用另一套内置浏览器接口，无须此补丁。

SpecsRelay 的左右分栏需要桌面宿主提供 `desktopWebPanels`。2026-09-24 检查的anywhere-labs 社区上游 DSH Desktop 2.0.13 安装包没有该服务；此前可用的本地配套版本包含额外的原生网页实现。覆盖安装社区上游原版会移除这部分实现，重试或重新安装 SpecsRelay 插件不能恢复它。

## 配套源码补丁

[2.0.13 配套补丁](desktop-patches/dsh-desktop-2.0.13-native-web-panels.patch) 基于 [anywhere-labs/deepseek-harness-desktop v2.0.13](https://github.com/anywhere-labs/deepseek-harness-desktop/tree/v2.0.13)，固定提交 `a7825021a227bc5776525996fc5a794b23d707ac`。补丁由本项目维护，尚不代表上游正式版本已包含这项能力；不包含凭据、用户会话或模型配置。

补丁同时覆盖 Stable/Beta 源码：注册 `desktopWebPanels`、通过隔离宿主 RPC 调用 Electron 的 WebContentsView、保留独立会话分区、限定 HTTPS 导航来源、按窗口缩放和标题栏偏移定位网页，并把兼容模式菜单置于网页之上。它不修改 DeepSeek Harness 核心子模块。

在该提交的新工作树中执行 `git apply --check`，再应用补丁；不要把它盲目应用到其他版本。使用桌面仓库规定的 `corepack yarn install --immutable` 安装依赖，先构建 `dsh-community-market`，再构建 Stable/Beta。按该仓库流程生成本机安装包；替换应用前保留原应用备份，保留现有 DSH_HOME 和用户数据目录。

## 验收与升级

1. Stable/Beta 均通过 `typecheck`、`check:desktop-variants` 以及 `web-panels`、`host-runtime-bridge`、`electron-runtime`、`host-process-integration`、`plugin` 相关测试。隔离宿主测试依赖先完成构建，测试会实际启动独立 Host 并等待原生面板调用。
2. `package` 与 `verify-packaged-runtime` 测试检查导出和构建产物；打包流程继续检查实际安装包所需的运行时文件。
3. 对最终安装路径执行 `npx --yes github:TinyPandaGame/SpecsRelay-DSH install --dry-run`。安装器检查 `./web-panels` 导出及对应文件，不修改配置；直接运行 `dsh plugin add` 会绕过这个预检。
4. 启动实际客户端，打开 SpecsRelay，验证 DeepSeek 加载、左网页右面板，以及兼容模式顶部菜单显示在网页上方。此过程不要求调用需求模型或发送 Agent 任务。

后续社区上游更新仍可能覆盖配套实现。在上游正式包含该服务之前，每次升级都需要针对新版本重新适配并重复上述验收；仅看版本号不能证明兼容。本补丁不禁用上游更新，也不会自动改写新安装的应用。

## 本次构建验证（2026-09-24）

Stable 的相关行为与打包测试 263 项通过，Beta 267 项通过；两边各有一项现有平台测试跳过。两边类型检查、184 个共享源码的一致性检查通过。插件安装与适配器相关测试 19 项通过，补丁可在干净的固定上游提交应用并逐文件重现全部 32 项源码改动。

本机安装的是 macOS Apple Silicon 配套构建，保留 2.0.13 版本号。安装包的原生能力预检、Electron fuse 检查、实际打包运行时 smoke 与本地签名校验均通过；尚未实测 Windows，也未发布官方签名安装包。

实际客户端验收通过：真实 DeepSeek 欢迎页及输入框正常加载，左右布局正常，兼容模式菜单完整位于网页上方，原有需求保留，启动失败与“不支持客户端”提示消失。验收没有发送网页消息、调用整理模型或启动 Agent。

该上游版本的本机目录打包有额外准备步骤：禁用安装脚本时需执行 Electron 的 `install.js`，恢复随包 uv 二进制的执行权限，并清理复制 Electron 分发包后残留的 `default_app.asar` 示例。通用 `--dir` 收尾钩子无法推断架构时，本次针对实际 `dist/mac-arm64` 产物显式调用原有 `afterAllArtifactBuild`，继续运行相同 fuse 和运行时检查，再重新本地签名；没有跳过失败校验或修改 Harness 核心。

## English

Stock DSH Desktop 2.0.13 inspected on 2026-09-24 lacks `desktopWebPanels`. The previously working local companion included extra native-page code, which is lost when a stock installation replaces it. Updating the SpecsRelay plugin cannot supply missing Electron capabilities.

The linked source patch targets exactly upstream commit `a7825021a227bc5776525996fc5a794b23d707ac`. It covers both desktop channels, isolated Host RPC, native views, persistent page sessions, HTTPS navigation restrictions and compatibility-menu stacking. It is a community-maintained patch, not an upstream release, and contains no user credentials or session data. Build and validate it using the desktop repository's supported workflow, back up the application before replacement and retain the existing user-data directories.

After each desktop update, rerun the installer with `--dry-run` against the installed application, then verify native-page loading and menu stacking in the real UI. Direct `dsh plugin add` bypasses the installer preflight. The patch neither disables updates nor automatically modifies replacement installations.
