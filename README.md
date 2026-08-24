# SpecsRelay for DeepSeek

**把 DeepSeek 里聊清楚的想法，直接交给 DSH 项目继续做。**

SpecsRelay for DeepSeek 是一款面向 DSH 桌面客户端的开源需求交接插件。它在桌面端内打开真实、可登录的 DeepSeek 网页，并提供常驻的需求交接面板：用户点击一次即可获取当前完整多轮对话，复用 DSH 已配置的模型和内置需求分析 Skill，把讨论整理为结构化、可执行的开发需求，再发送到选定项目并启动 Agent。

SpecsRelay 不是另一个聊天工具，也不要求用户改变在 DeepSeek 中讨论方案的习惯。只有整理结果存在会影响实现的未确认问题时，它才会请用户补充；需求已经清晰时则直接进入发送。整个流程不需要浏览器扩展、手动复制粘贴、Docker、第三方平台，也不要求在 SpecsRelay 中再次填写 API Key。

_本项目由社区独立维护，不是 DeepSeek 官方产品，也不是任何桌面客户端的内置插件。_

> **当前兼容范围：SpecsRelay 目前只支持以下四款桌面客户端：** [anywhere-labs DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)、[Pilot Harness](https://github.com/op7418/pilot-harness)、[DataElement DSH Desktop](https://github.com/dataelement/dsh-desktop) 和 [myYangyunfan DSH Desktop](https://github.com/myYangyunfan/dsh_desktop)。其他 DSH 桌面客户端和普通浏览器 WebUI 暂不支持。

其中 anywhere-labs DSH Desktop 是当前面向普通用户的推荐选择；其余三个客户端的完整支持目前需要 SpecsRelay 配套构建。

简体中文 | [English](README.en.md)

<a href="https://www.producthunt.com/products/specsrelay-for-deepseek" target="_blank" rel="noopener noreferrer"><img alt="Product Hunt 发布日排名第 66 名" width="250" height="54" src="assets/product-hunt-rank-66.svg"></a>

![SpecsRelay 将 DeepSeek 对话整理为需求并发送到 DSH Agent](assets/specsrelay-dsh-hero.png)

[快速安装](#快速安装) · [工作流程](#工作流程) · [支持的桌面客户端](#支持的桌面客户端) · [数据与安全](#数据与安全)

## 为什么做 SpecsRelay

DeepSeek 网页适合把想法聊开、比较方案并逐步确认产品决定，DSH 则更适合进入本地项目、读取代码并持续实现。两者各自都能完成一部分工作，但中间通常还缺少一条可靠的交接链路：用户需要手动复制长对话、重新整理上下文、指出哪些决定已经确认，再告诉 Coding Agent 应该在哪个项目继续。

SpecsRelay 把这段重复工作收进 DSH 桌面端，但不替代两边原有能力：

- **DeepSeek 继续负责讨论。** 用户保留原网页的登录、历史会话和熟悉的对话体验。
- **SpecsRelay 负责形成需求。** 它抓取当前完整对话，提炼目标、约束、决定和验收标准，只在真正不清晰时请求补充。
- **DSH 继续负责实现。** 用户选择项目并确认后，需求直接进入对应会话，由 Agent 继续讨论或开始开发。

因此，SpecsRelay 不是新的模型平台，也不是通用网页抓取器；它是一条专门连接 **DeepSeek 网页对话与 DSH 项目执行** 的需求中继层。

## 工作流程

**DeepSeek 网页对话 → SpecsRelay 整理与澄清 → 选择 DSH 项目 → Agent 开始处理**

1. 在桌面客户端内登录 DeepSeek，像平时一样讨论产品、功能或技术方案。
2. 点击 **整理当前对话**。SpecsRelay 获取当前完整多轮对话，并通过 DSH 已配置的模型与 `specsrelay-requirement-analysis` Skill 自动整理需求。
3. 只有出现会影响产品结果的边界问题时，界面才会展示补充问题；没有待确认项时自动跳过。
4. 选择目标项目并确认发送。SpecsRelay 将最终需求交给该项目的 DSH 会话，并立即启动 Agent。

## 核心特点

| 能力 | 用户得到什么 |
| --- | --- |
| 真实 DeepSeek 网页 | 保留完整登录、历史会话和原网页交互，不是截图或画面流 |
| 完整上下文抓取 | 点击整理后自动获取当前多轮对话，不需要复制粘贴或安装浏览器扩展 |
| 需求整理与澄清 | 自动提炼目标、约束、已确认决定与验收标准，只在确有必要时提问 |
| 复用 DSH 模型 | 使用桌面客户端中已经可用的模型，不在 SpecsRelay 中重复配置 Key |
| 项目级交接 | 选择项目目录、核对最终需求，然后直接发送并启动对应 Agent |
| 一个安装入口 | 同一份插件和同一条安装命令适配多款 DSH 社区桌面客户端 |

## 快速安装

建议优先搭配 [anywhere-labs 开源的 DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) 使用。先安装并启动桌面客户端，再运行：

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install
```

统一安装器会识别本机已安装的受支持客户端，并把同一份 SpecsRelay 插件安装到正确的 DSH profile。安装完成后重启对应客户端。

便携版或非标准安装位置可以显式传入应用路径：

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --app "/absolute/path/to/DSH Desktop.app"
```

只检查识别结果、不写入任何文件：

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --dry-run
```

### 使用前需要

- 一款受支持并包含 SpecsRelay 原生网页 Host 的 DSH 桌面客户端。
- 客户端中已经连接并选中可用模型；SpecsRelay 不会额外索要模型 Key。
- 在 SpecsRelay 打开的 DeepSeek 网页中完成登录。

不需要浏览器扩展、开发者模式、Docker 或额外第三方服务。

## 支持的桌面客户端

SpecsRelay 只维护一份核心插件。安装器负责识别客户端、profile 和数据目录；各桌面端只通过适配器提供原生网页与目录选择能力，抓取、整理、澄清和发送逻辑保持一致。

| 客户端 | 当前状态 | 说明 |
| --- | --- | --- |
| [anywhere-labs DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) | **推荐** | 上游已提供 SpecsRelay 所需的原生网页 Host，适合普通用户优先选择 |
| [Pilot Harness](https://github.com/op7418/pilot-harness) | 已适配 | 当前需要使用包含原生 Host 的 SpecsRelay 配套构建 |
| [DataElement DSH Desktop](https://github.com/dataelement/dsh-desktop) | 已适配 | 当前需要使用包含进程桥的 SpecsRelay 配套构建 |
| [myYangyunfan DSH Desktop](https://github.com/myYangyunfan/dsh_desktop) | 已适配 | 支持本机后端；WSL 托管模式暂不支持原生网页 Host |

Pilot、DataElement 和 myYangyunfan 的公开安装包只有在合入对应原生 Host 后，才可以仅靠统一安装命令启用完整体验；当前应使用 SpecsRelay 配套源码构建。普通浏览器版 DSH WebUI 没有原生页面所有者，无法提供真实网页嵌入和后台对话抓取。

客户端识别规则、数据目录和原生桥差异见 [桌面客户端适配器](docs/desktop-client-adapters.md)。Pilot 的当前集成基线见 [Pilot Harness 本地集成记录](docs/pilot-harness-integration.md)。

## 使用方式

1. 在 DSH 中打开或创建一个已关联 Workspace 的会话。
2. 点击左侧栏底部的 SpecsRelay 图标。
3. 在左侧 DeepSeek 网页登录并打开要交接的对话。
4. 点击 **整理当前对话**，等待需求自动整理完成。
5. 如果出现补充问题，完成回答并重新整理；没有问题时这一环节不会出现。
6. 选择或核对项目目录，确认发送会启动 Agent，然后点击 **发送到 DSH 并开始处理**。

## 数据与安全

- DeepSeek 区域由真实、沙箱化的 `WebContentsView` 承载，不是截图或远程控制画面流。
- 隔离的原生 session 会保留 DeepSeek 登录状态；SpecsRelay 不读取或保存账号密码。
- Node integration 与 preload 访问保持关闭；主 frame 导航仅允许 `https://chat.deepseek.com`。
- 只有用户点击 **整理当前对话** 后才会执行 DOM 抓取；加载、显示和调整网页尺寸不会抓取内容。
- 当前对话、需求草稿、恢复记录与执行快照保存在 DSH 主机的本地 SpecsRelay 数据目录；浏览器存储仅作为兼容回退。随后再交给 DSH 已配置的模型整理，澄清和修订沿用同一模型链路。
- `specsrelay-requirement-analysis` Skill 内置在工作流中，不需要用户单独安装或配置。
- **发送到 DSH 并开始处理** 会通过 DSH 原生输入接口提交需求；恢复历史快照只恢复草稿，不会重复启动 Agent。

## 本地开发

```sh
pnpm dsh plugin --profile desktop add /absolute/path/to/SpecsRelay/plugins/dsh-deepseek
```

添加插件后重启 DSH Desktop。普通 WebUI 无法提供原生 DeepSeek 面板，会明确提示需要桌面客户端。

四个客户端共用 `@specsrelay/dsh-deepseek` 的需求整理与交接核心，但不会共用一套未经区分的桌面界面。插件根据宿主提供的稳定信号选择客户端适配：例如官方 DSH Desktop 的页脚入口会在共享动作行中贴底，保持紧邻“设置”，其他客户端保留各自适合的布局。桌面客户端仍分别实现 `desktopWebPanels` 服务或 SpecsRelay 进程桥，用于创建沙箱 `WebContentsView`、保持登录 partition、执行受控 DOM 抓取，以及在 DSH 子进程退出时清理页面。

## 与相关项目的关系

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 提供 Agent、模型、会话、Web UI 和插件系统。SpecsRelay 通过插件机制安装，不修改其核心运行时。
- [DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)、[Pilot Harness](https://github.com/op7418/pilot-harness)、[DataElement DSH Desktop](https://github.com/dataelement/dsh-desktop) 和 [myYangyunfan DSH Desktop](https://github.com/myYangyunfan/dsh_desktop) 是独立维护的社区桌面客户端。SpecsRelay 只是兼容它们，不属于这些项目的内置功能。
- 本仓库只包含 SpecsRelay 的 DSH 插件发行文件，不包含 SpecsRelay 浏览器扩展版本。

## 特别感谢

感谢 DeepSeek Harness 与各社区桌面客户端提供的插件基础、桌面能力和持续维护。也感谢 [AI Chat Exporter](https://github.com/TheBluCoder/AI-chat-exporter) 提供可参考的开源对话提取实现。第三方代码与许可证说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## License

本项目遵循 [MIT License](LICENSE)。DeepSeek 是 DeepSeek AI 的商标；SpecsRelay-DSH 是独立社区项目，与 DeepSeek 官方不存在隶属关系，也未获得其背书。
