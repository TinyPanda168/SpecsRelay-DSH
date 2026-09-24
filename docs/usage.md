# 使用指南

[返回首页](../README.md) · 简体中文 | [English](usage.en.md)

## 快速安装

先安装并启动 [DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)，在客户端中连接并选中可用模型，然后运行：

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install
```

安装完成后**重启 DSH Desktop**。日常使用不需要浏览器扩展、Docker 或额外第三方服务。

<details>
<summary>便携版、自定义路径与只读检查</summary>

指定桌面应用路径：

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --app "/absolute/path/to/DSH Desktop.app"
```

只检查识别结果，不写入文件：

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --dry-run
```

</details>

### 支持的桌面客户端

仅支持 anywhere-labs DSH Desktop；其他 DSH 客户端和浏览器 WebUI 不在支持范围内。客户端必须已具备 SpecsRelay 所需的原生网页服务，安装插件不会为旧客户端补齐该能力。

安装识别、配置目录及窗口模式见 [DSH Desktop 集成说明](desktop-client-adapters.md)。

## 工作流程

**讨论 → 整理 → 确认 → 交给 Agent**

### 使用方式

先在 DSH 中打开或创建一个关联了 Workspace 的会话，点击侧栏底部的 **SpecsRelay** 图标。

1. **讨论想法**：在左侧 DeepSeek 网页登录，打开或继续你的对话。
2. **整理需求**：点击 **整理当前对话**，自动提炼完整多轮对话中的目标、约束、决定和验收标准。
3. **补齐问题**：如出现“需要你确认”，直接填写回答，或复制问题回原 DeepSeek 对话讨论，再点 **重新获取并整理**。复制不会自动发送；没有待确认项时跳过这一步。
4. **开始处理**：核对需求与项目目录，点击 **发送到 DSH 并开始处理**，启动对应 Agent。

### 核心特点

- **完整对话按需获取**，省去手动搬运上下文。
- **需求分析 Skill 已内置**，无需单独安装或配置。
- **左侧网页、右侧需求面板**，讨论和核对可以同时进行。

### 按内容选择整理方法

内置 Skill 会指导当前整理模型按需求内容选择和组合方法：简单修改保持简短；存在重要歧义时先问前置问题，每轮最多三个；复杂功能检查需求、验收和验证是否对应；出现修正或撤回时清理相关旧要求，同时保留未受影响的内容。输出前在同一次生成中做适度审查。

仍然只需点击 **整理当前对话**，无需选择框架、安装其他工具或新增 Key。修订会返回完整现行需求；目前不提供稳定需求编号或持久化的语义版本对比。原有格式修复和可选长对话增强可能产生额外模型调用。模型输出仍需核对，方法来源和验证范围见[实际采用记录](external-reference-watchlist.md#实际采用记录--2026-09-24)。更新插件后重启 DSH Desktop，以重新加载内置 Skill。

## 可选功能

### 可选的长对话增强

适合多轮讨论较长、需要找回早期决定的场景。整理模型先确定查找重点，Jev 筛选原文证据，再由原整理模型生成需求；你仍只需点击 **整理当前对话**。

- **默认关闭**，开启需自行配置 TypeSafe API Key。
- 开启后，达到 **24,000 字符**的对话自动增强；短对话直接整理。
- 规划或筛选失败时，回到完整原文整理；不改变 Coding Agent 主模型。

> **数据提示**：开启后会向 TypeSafe 发送对话片段，累计可能覆盖大部分对话。密钥遮蔽不保证移除所有敏感信息，请只对允许发送的对话启用。

[开启方法、筛选规则与高级参数 →](jev-features.md#长对话增强)

### 可选的会话接续分流

让 Jev 为 **接续会话** 选择辅助整理模型。它默认关闭，与长对话增强分别开启，使用同一个可选 Key；选择失败时沿用原路线，不改变 Coding Agent 主模型。

[配置方法与发送的数据 →](jev-features.md#会话接续分流)

### DSH 会话接续

当前会话较长时，点击输入区的 **接续会话**。确认后，SpecsRelay 将目标、已确认决定、进度和待核查事项交给**同一项目的新会话**。

旧会话保留；新 Agent 会先只读检查项目与未提交修改，再继续明确的下一步。

<details>
<summary>何时建议接续，以及接续后的检查</summary>

- 当前 Agent 空闲后，SpecsRelay 估算上下文占用。
- 接近模型上下文窗口的 80%，或观察到自动压缩时，按钮显示 **建议接续**；提示不会自动创建会话。
- 模型没有提供可信窗口信息时，仍可手动接续。
- 接续材料来自当前会话可用的内容，不能代替真实项目检查；有冲突或关键事实无法核实时，新 Agent 会停下来提问。
- 原会话不会被修改或归档。发送状态不明时不会自动重试，避免重复启动任务。

</details>

### 开发中的产品问题澄清

Agent 遇到需要你决定的问题时，可以回到 DeepSeek 继续讨论，再把结论带回原 DSH 会话：

1. 点击 **需求澄清**，核对并编辑建议问题。
2. 在左侧打开原 DeepSeek 对话，点击 **开始澄清**，自动发送你检查过的问题。
3. 讨论并明确最终选择后，点击 **读取刚才的讨论**，核对本次新增内容。
4. 将结果放入**原 DSH 会话的草稿**，由你手动发送后继续处理。

<details>
<summary>问题卡片、草稿保护与会话检查</summary>

- 此流程不创建子 Agent 或新 DSH 会话，也不会把 DeepSeek 的建议直接当成你的决定；未确定的问题仍需你回答。
- 只回收开始澄清后的新增消息，只写入原会话的空白草稿，不覆盖已有草稿或自动发送。
- 切换 DeepSeek 对话、修改原有消息或切换 DSH 项目时，会拒绝错误的回收结果。
- 如果 DSH 正在等待 `ask_user_question` 卡片，从侧栏打开 **需求澄清**，讨论后把最终答案复制回原问题卡片。SpecsRelay 不代你提交卡片；卡片结束后才能正常回写草稿。

</details>

## 数据与安全

### 什么内容会被读取和发送

- 仅在你点击 **整理当前对话**、**开始澄清** 或 **读取刚才的讨论** 后抓取网页内容；加载和调整窗口不会抓取。
- 需求整理、澄清与修订使用 DSH 已配置的模型。
- Jev 两项能力默认关闭；开启后的发送内容见 [Jev 数据说明](jev-features.md#发送给-typesafe-的数据)。

### 什么内容保存在本机

- 隔离的网页会话保留 DeepSeek 登录状态，SpecsRelay 不读取或保存账号密码。
- 对话、需求草稿、恢复记录和执行快照保存在 DSH 主机的本地 SpecsRelay 数据目录；浏览器存储仅作为兼容回退。
- 恢复历史快照只恢复草稿，不会重复启动 Agent。

<details>
<summary>原生网页隔离</summary>

DeepSeek 网页由沙箱化的 `WebContentsView` 承载。Node integration 和 preload 访问保持关闭，主 frame 导航仅允许 `https://chat.deepseek.com`。

</details>

## 本地开发

<details>
<summary>从源码加载插件与服务分工</summary>

```sh
pnpm dsh plugin --profile desktop add /absolute/path/to/SpecsRelay/plugins/dsh-deepseek
```

添加后重启 DSH Desktop。插件只在客户端提供模式与平台信号时注册界面入口。

`@specsrelay/dsh-deepseek` 使用 DSH Desktop 的 `desktopWebPanels` 服务。客户端负责原生网页、登录隔离、受控抓取与页面清理；插件负责需求整理、澄清和发送。

</details>

## 与相关项目的关系

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 提供 Agent、模型、会话和插件系统；SpecsRelay 通过插件安装，不修改核心运行时。
- [DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) 提供桌面能力，是本插件唯一支持的社区客户端。
- 本仓库只包含 DSH 插件发行文件；浏览器扩展是另一个版本。

## 特别感谢

感谢 DeepSeek Harness、DSH Desktop 和 [AI Chat Exporter](https://github.com/TheBluCoder/AI-chat-exporter)。第三方代码与许可证见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。

## License

[MIT License](../LICENSE)。DeepSeek 是 DeepSeek AI 的商标；本项目与 DeepSeek 官方不存在隶属关系，也未获得其背书。
