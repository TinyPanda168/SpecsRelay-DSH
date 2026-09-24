# SpecsRelay for DeepSeek Harness

简体中文 | [English](README.en.md)

**把 DeepSeek 对话变成开发需求，交给 DSH Agent 执行。**

适用于 [DeepSeek Harness 官方桌面端](https://github.com/deepseek-ai/DeepSeek-Harness)及 [anywhere-labs 社区版 DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)，省去手动复制长对话、重新解释需求的过程。

<a href="https://www.producthunt.com/products/specsrelay-for-deepseek" target="_blank" rel="noopener noreferrer"><img alt="Product Hunt 发布日排名第 66 名" width="250" height="54" src="assets/product-hunt-rank-66.svg"></a>

![SpecsRelay 将 DeepSeek 对话整理为需求并发送到 DSH Agent](assets/specsrelay-dsh-hero.png)

## 核心能力

- **一键整理**：从完整对话中提炼目标、约束和验收标准，按内容选用澄清、覆盖检查与修订梳理。
- **增强服务可切换**：长对话可选关闭、Jev 或自备 Laya 服务，筛选后由原整理模型生成需求。
- **随时澄清**：把待确认问题带回 DeepSeek，讨论后继续开发。
- **接续长任务**：整理当前进度，交给同一项目的新会话。
- **复用已有模型**：默认使用 DSH 已配置的模型，无需重复填 Key。

增强默认关闭。在侧栏展开“长对话增强”即可选择服务并保存；Jev 需要 TypeSafe Key，Laya 填写已启动的服务地址与可选模型名称。失败时使用完整对话整理。Jev 的会话接续分流另行开启。[配置与数据说明](docs/jev-features.md)

## 快速安装

**DeepSeek Harness 官方桌面端**：先配置可用的 DSH 模型，在应用的 **插件** 页面安装 `github:TinyPandaGame/SpecsRelay-DSH`，然后重启。官方版使用内置浏览器接口，不需要社区版的原生网页补丁。

**anywhere-labs 社区版 DSH Desktop**：客户端仍须具备 `desktopWebPanels`，见[修复与升级检查](docs/desktop-native-repair.md)。运行：

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --app "/Applications/DSH Desktop.app"
```

安装后重启。[支持版本与安装详情](docs/usage.md#快速安装)

## 怎么用

1. 打开侧栏 **SpecsRelay**，登录 DeepSeek 并讨论想法。
2. 点击 **整理当前对话**，核对需求、补充待确认问题。
3. 选择项目，点击 **发送到 DSH 并开始处理**。

## 文档

[使用指南](docs/usage.md) · [可选增强配置（Jev / Laya）](docs/jev-features.md) · [数据与安全](docs/usage.md#数据与安全) · [更新记录](CHANGELOG.md)

[外部来源更新与借鉴清单](docs/external-reference-watchlist.md)：记录跟踪来源、版本基线和按需采用判断。

[MIT 开源](LICENSE) · 独立社区插件，非 DeepSeek 官方产品。
