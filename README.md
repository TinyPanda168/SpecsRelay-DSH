# SpecsRelay for DeepSeek Harness（Jev 增强）

简体中文 | [English](README.en.md)

**把 DeepSeek 对话变成开发需求，交给 DSH Agent 执行。**

适用于 [anywhere-labs DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)，省去手动复制长对话、重新解释需求的过程。

<a href="https://www.producthunt.com/products/specsrelay-for-deepseek" target="_blank" rel="noopener noreferrer"><img alt="Product Hunt 发布日排名第 66 名" width="250" height="54" src="assets/product-hunt-rank-66.svg"></a>

![SpecsRelay 将 DeepSeek 对话整理为需求并发送到 DSH Agent](assets/specsrelay-dsh-hero.png)

## 核心能力

- **一键整理**：从完整对话中提炼目标、约束和验收标准。
- **Jev 可选增强**：筛选长对话中的关键证据，为接续会话选择辅助整理模型。
- **随时澄清**：把待确认问题带回 DeepSeek，讨论后继续开发。
- **接续长任务**：整理当前进度，交给同一项目的新会话。
- **复用已有模型**：默认使用 DSH 已配置的模型，无需重复填 Key。

Jev 两项能力默认关闭；开启需 TypeSafe API Key，并会向 TypeSafe 发送相关对话内容。[配置与数据说明](docs/jev-features.md)

## 快速安装

先安装并启动 DSH Desktop、配置可用模型，再运行：

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install
```

安装后重启客户端。[安装要求与自定义路径](docs/usage.md#快速安装)

## 怎么用

1. 打开侧栏 **SpecsRelay**，登录 DeepSeek 并讨论想法。
2. 点击 **整理当前对话**，核对需求、补充待确认问题。
3. 选择项目，点击 **发送到 DSH 并开始处理**。

## 文档

[使用指南](docs/usage.md) · [可选 Jev 增强（默认关闭）](docs/jev-features.md) · [数据与安全](docs/usage.md#数据与安全) · [0.10.0 更新记录](CHANGELOG.md)

[MIT 开源](LICENSE) · 独立社区插件，仅支持 anywhere-labs DSH Desktop，非 DeepSeek 官方产品。
