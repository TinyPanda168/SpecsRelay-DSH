# SpecsRelay for DeepSeek

**把 DeepSeek 里聊清楚的想法，直接交给 DSH 项目继续做。**

SpecsRelay for DeepSeek 是一款面向 DSH 桌面客户端的开源需求交接插件。它在桌面端内打开真实、可登录的 DeepSeek 网页，并提供常驻的需求交接面板：用户点击一次即可获取当前完整多轮对话，复用 DSH 已配置的模型和内置需求分析 Skill，把讨论整理为结构化、可执行的开发需求，再发送到选定项目并启动 Agent。

SpecsRelay 不是另一个聊天工具，也不要求用户改变在 DeepSeek 中讨论方案的习惯。只有整理结果存在会影响实现的未确认问题时，它才会请用户补充；需求已经清晰时则直接进入发送。默认流程不需要浏览器扩展、手动复制粘贴、Docker、第三方平台，也不要求在 SpecsRelay 中再次填写模型 API Key。只有用户主动开启可选的 Jev 长对话增强或会话接续分流时，才需要自行申请并配置 TypeSafe API Key。

_本项目由社区独立维护，不是 DeepSeek 官方产品，也不是任何桌面客户端的内置插件。_

> **支持范围：SpecsRelay 仅支持 [anywhere-labs DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)。** 其他 DSH 桌面客户端和普通浏览器 WebUI 不再提供兼容支持。

简体中文 | [English](README.en.md)

最近更新：**0.10.0（2026-09-21）** — [查看更新记录](CHANGELOG.md)，包含长对话增强、回网页继续澄清、桌面布局修复及支持范围调整。

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

### 可选的长对话增强

长对话增强嵌入 **整理当前对话** 内部：SpecsRelay 先获取完整网页对话；整理模型根据开头、最近讨论及本次澄清，确定目标、已确认决策、约束、验收标准、待确认问题这五类证据的查找重点；[Jev / TypeSafe System One](https://docs.typesafe.ai/agent-skill) 再分批判断原文片段是否有用，最后由原整理模型读取保留的证据并生成 Specs。Jev 负责找准信息，整理模型负责理解和写成需求。用户仍只点击一次，不需要选择压缩比例或处理单独的压缩步骤。

该能力默认关闭。用户需要自行申请 TypeSafe API Key，并在对应桌面客户端的 `$DSH_HOME/.env`（或启动 DSH 的环境变量）中同时设置；这个本地文件不要提交到项目仓库：

```sh
SPECSRELAY_JEV_LONG_CONTEXT=1
TYPESAFE_API_KEY=你的_TypeSafe_API_Key
```

`SPECSRELAY_JEV_API_KEY` 仍作为兼容别名。启用并配置 Key 后，达到 24,000 个字符的对话自动使用增强；短对话、没有 Key、未开启或角色标题无法可靠识别时，直接使用完整对话整理。规划或 Jev 请求失败、超时、返回无效时，也会丢弃本次所有筛选结果，回到完整原文整理。原有 400,000 字符导入上限及整理模型自身的上下文限制仍然适用。

筛选保留所有可识别的用户原话、角色标题和最近两条消息；只略去高置信判断为闲聊或无信息增量重复的助手片段，不确定内容保留。判断时同时提供相邻片段和前后用户发言的片段，帮助保留用户回复所指的方案。保留片段按原顺序交给整理模型，原始对话不被覆盖。常见密钥和本次 TypeSafe Key 在切片前遮蔽；筛选会向 TypeSafe 发送规划问题及分批原文片段，累计可能涉及大部分对话，包括作为相邻上下文的用户内容，不局限于旧分流功能的 1,600 字符摘录。遮蔽不等于移除所有敏感信息，请只对允许发送给 TypeSafe 的对话开启此功能。

把 `SPECSRELAY_JEV_LONG_CONTEXT` 改为 `0` 或移除即可关闭。它不选择整理模型，也不改变 Coding Agent 主模型。Jev 的中文筛选效果仍需用实际对话评估；当前自动化测试验证调用顺序、原文保留及失败回退，不代表真实模型准确率或节省比例。维护者可用 `SPECSRELAY_JEV_LONG_CONTEXT_MIN_CHARS`（1,000–400,000）、`SPECSRELAY_JEV_LONG_CONTEXT_TIMEOUT_MS`（100–60,000，默认 20,000）和 `SPECSRELAY_JEV_OMIT_PROBABILITY`（0.9–1，默认 0.98）调整触发长度、增强阶段总时限和保守剔除阈值；无效配置会明确报错。这些参数不需要普通用户设置。

### 可选的会话接续分流

原有 `SPECSRELAY_JEV_ROUTER=1` 现在仅用于 **接续会话** 的辅助模型选择，默认关闭，使用同一个可选 Key。它发送经过密钥遮蔽、最多 1,600 字符的任务摘录和候选模型说明；少于两个可用模型或请求失败时沿用原路线。这个开关不会开启长对话增强，需求整理也不再通过它选择模型。Key 通过 DSH 凭据服务或启动环境按次读取，不写入插件配置、工作区状态或日志。

### DSH 会话接续

在 DSH 中持续实现时，可以点击输入区的 **接续会话**。SpecsRelay 会在当前 Agent 空闲后估算上下文占用；接近已配置模型上下文窗口的 80%，或观察到当前会话已自动压缩上下文时，按钮会变成 **建议接续**。这些只是提示，不会自动创建会话；模型没有提供可信窗口信息时仍可手动接续。

用户确认后，SpecsRelay 从当前会话可用的对话内容整理目标、已确认决定、进度和待核查事项，在同一项目创建独立的新会话并发送接续材料。新 Agent 会先只读核对项目与未提交修改，有冲突或关键事实无法核实时停下来提问，再继续明确的下一步。旧会话不会被修改或归档；接续摘要也不代替对真实项目状态的检查。

### 开发中的产品问题澄清

如果 DSH 正在处理任务时遇到需要你决定的产品问题，点击当前会话输入区的 **需求澄清**。SpecsRelay 会给出可编辑的建议问题；你确认问题后，在左侧打开原 DeepSeek 对话并点击 **开始澄清**，问题会自动发送到这条原对话。讨论结束后点击 **读取刚才的讨论**，SpecsRelay 只带回这次开始澄清后新增的消息，供你检查，再放入**同一个 DSH 会话的草稿**。你手动确认并发送后，Agent 才会继续处理。

这个可选流程不创建子 Agent 或新 DSH 会话，也不会自动把 DeepSeek 的建议当成你的决定。请在 DeepSeek 中明确说出最终选择；如果仍未确定，DSH 应继续向你提问。切换到另一条 DeepSeek 对话、修改原有消息，或切换 DSH 项目时，SpecsRelay 会拒绝错误的回收结果。

如果 DSH 正在等待 `ask_user_question` 问题卡片，普通输入框暂时不可用。此时可从侧栏 SpecsRelay 的 **需求澄清** 入口完成讨论，再把你确认的最终答案复制回原会话的问题卡片；SpecsRelay 不会替你提交卡片。卡片结束后，普通草稿回写才可用。

## 核心特点

| 能力 | 用户得到什么 |
| --- | --- |
| 真实 DeepSeek 网页 | 保留完整登录、历史会话和原网页交互，不是截图或画面流 |
| 完整上下文抓取 | 点击整理后自动获取当前多轮对话，不需要复制粘贴或安装浏览器扩展 |
| 需求整理与澄清 | 自动提炼目标、约束、已确认决定与验收标准，只在确有必要时提问 |
| 复用 DSH 模型 | 使用桌面客户端中已经可用的模型，不在 SpecsRelay 中重复配置 Key |
| 可选长对话增强 | 配置并开启 Jev 后，长对话自动筛选证据再整理；短对话直接整理，失败时回到完整原文 |
| 项目级交接 | 选择项目目录、核对最终需求，然后直接发送并启动对应 Agent |
| 开发中双向澄清 | 把 DSH 遇到的产品问题带回原 DeepSeek 对话讨论，只将新增内容放回原 DSH 会话草稿 |
| 一个安装入口 | 自动识别 DSH Desktop，将插件安装到对应配置目录 |

## 快速安装

建议优先搭配 [anywhere-labs 开源的 DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) 使用。先安装并启动桌面客户端，再运行：

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install
```

安装器只识别本机的 DSH Desktop，并把 SpecsRelay 安装到它的 `desktop` profile。安装完成后重启 DSH Desktop。

便携版或非标准安装位置可以显式传入应用路径：

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --app "/absolute/path/to/DSH Desktop.app"
```

只检查识别结果、不写入任何文件：

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --dry-run
```

### 使用前需要

- 包含 SpecsRelay 原生网页 Host 的 anywhere-labs DSH Desktop。
- 客户端中已经连接并选中可用模型；SpecsRelay 不会额外索要模型 Key。
- 在 SpecsRelay 打开的 DeepSeek 网页中完成登录。

默认流程不需要浏览器扩展、开发者模式、Docker 或额外第三方服务。Jev 长对话增强和会话接续分流是可选的第三方能力，分别开启，不影响未开启用户。

## 支持的桌面客户端

SpecsRelay 仅支持 [anywhere-labs DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)，macOS 应用标识为 `ai.deepseek.dsh.desktop`。安装器只向该客户端的 `desktop` profile 安装插件。

客户端需要包含可用的 `desktopWebPanels` 原生网页服务。安装插件不会为缺少该服务的旧客户端补充宿主能力。安装识别、数据目录和窗口布局说明见 [DSH Desktop 集成](docs/desktop-client-adapters.md)。

## 使用方式

1. 在 DSH 中打开或创建一个已关联 Workspace 的会话。
2. 点击左侧栏底部的 SpecsRelay 图标。
3. 在左侧 DeepSeek 网页登录并打开要交接的对话。
4. 点击 **整理当前对话**，等待需求自动整理完成。
5. 如果出现“需要你确认”，可以复制问题到左侧 DeepSeek 原对话继续讨论，再点“重新获取并整理”；也可以直接在 SpecsRelay 填写回答并继续整理。复制不会自动发送问题。没有待确认问题时这一环节不会出现。
6. 选择或核对项目目录，确认发送会启动 Agent，然后点击 **发送到 DSH 并开始处理**。

## 数据与安全

- DeepSeek 区域由真实、沙箱化的 `WebContentsView` 承载，不是截图或远程控制画面流。
- 隔离的原生 session 会保留 DeepSeek 登录状态；SpecsRelay 不读取或保存账号密码。
- Node integration 与 preload 访问保持关闭；主 frame 导航仅允许 `https://chat.deepseek.com`。
- 只有用户点击 **整理当前对话**、**开始澄清** 或 **读取刚才的讨论** 后才会执行 DOM 抓取；加载、显示和调整网页尺寸不会抓取内容。
- 当前对话、需求草稿、恢复记录与执行快照保存在 DSH 主机的本地 SpecsRelay 数据目录；浏览器存储仅作为兼容回退。随后再交给 DSH 已配置的模型整理，澄清和修订沿用同一模型链路。
- Jev 能力默认关闭。长对话增强开启后会发送经常见密钥遮蔽的规划问题和分批对话原文；会话接续分流仅发送短摘录及候选模型说明。两者都不会主动读取项目文件或工具结果；但用户粘贴进网页对话的内容可能包含这些信息。Key 只用于鉴权，不作为筛选证据发送。
- `specsrelay-requirement-analysis` Skill 内置在工作流中，不需要用户单独安装或配置。
- **发送到 DSH 并开始处理** 会通过 DSH 原生输入接口提交需求；恢复历史快照只恢复草稿，不会重复启动 Agent。
- **接续会话** 只在用户确认后整理并发送；发送状态不明时不会再次自动提交，以免重复启动任务。
- **需求澄清** 只把经用户检查的问题自动发送到当前打开的原 DeepSeek 对话；回收时只取新增对话，并且只写入原 DSH 会话的空白草稿，不自动发送或覆盖已有草稿。

## 本地开发

```sh
pnpm dsh plugin --profile desktop add /absolute/path/to/SpecsRelay/plugins/dsh-deepseek
```

添加插件后重启 DSH Desktop。SpecsRelay 只在 DSH Desktop 提供的模式与平台信号下注册界面入口。

`@specsrelay/dsh-deepseek` 使用 DSH Desktop 的 `desktopWebPanels` 服务承载真实网页。DSH Desktop 负责创建沙箱 `WebContentsView`、保持登录 partition、执行受控 DOM 抓取，以及清理原生页面；SpecsRelay 负责需求整理、澄清和发送。

## 与相关项目的关系

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 提供 Agent、模型、会话、Web UI 和插件系统。SpecsRelay 通过插件机制安装，不修改其核心运行时。
- [DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) 是独立维护的社区桌面客户端，也是 SpecsRelay 唯一支持的桌面客户端。SpecsRelay 通过插件安装，不属于该项目的内置功能。
- 本仓库只包含 SpecsRelay 的 DSH 插件发行文件，不包含 SpecsRelay 浏览器扩展版本。

## 特别感谢

感谢 DeepSeek Harness 与 DSH Desktop 提供的插件基础、桌面能力和持续维护。也感谢 [AI Chat Exporter](https://github.com/TheBluCoder/AI-chat-exporter) 提供可参考的开源对话提取实现。第三方代码与许可证说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## License

本项目遵循 [MIT License](LICENSE)。DeepSeek 是 DeepSeek AI 的商标；SpecsRelay-DSH 是独立社区项目，与 DeepSeek 官方不存在隶属关系，也未获得其背书。
