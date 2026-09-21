# Product Hunt 提交文案中文对照

## 核心字段

**产品名称**

SpecsRelay for DeepSeek

**Tagline 英文原文**

Turn DeepSeek conversations into work your DSH Agent can run

**中文含义**

把 DeepSeek 对话变成 DSH Agent 可以继续执行的工作。

**主链接**

<https://github.com/TinyPanda168/SpecsRelay-DSH>

**Description 英文原文**

SpecsRelay is an open-source plugin for DSH Desktop by anywhere-labs. Capture a DeepSeek conversation, organize it with your existing DSH model, and send the confirmed requirement to a local project to start its Agent—without copy-paste or another API key.

**中文含义**

SpecsRelay 是一款适用于 anywhere-labs DSH Desktop 的开源插件：获取当前 DeepSeek 对话，复用已有 DSH 模型整理为清晰需求，再发送到正确的本地项目并启动 Agent；无需复制粘贴，也无需再次填写 API Key。

**价格**

免费

**状态**

已上线

**建议 Topics**

1. Developer Tools
2. AI Coding Agents
3. Open Source

## Maker 首评中文对照

大家好，我做 SpecsRelay，是因为我经常在 DeepSeek 中展开一个产品想法、比较不同方案并确认决定，但实现工作会继续发生在本地 DSH 项目中。真正麻烦的是中间的交接：复制很长的对话、重建上下文、区分已经确认的决定和模型建议，再告诉 Agent 应该在哪个项目继续。

SpecsRelay 把这段交接放进 anywhere-labs DSH Desktop。它打开真实的 DeepSeek 网页；只有点击“整理当前对话”时才获取当前完整对话；复用 DSH 中已经配置的模型形成可执行需求；只有缺少的决定会影响实现时才请求补充；最后把确认结果发送到选定项目并启动 Agent。

项目采用 MIT License 开源。这条链路不需要浏览器扩展、Docker、额外平台，也不需要再次填写 API Key。SpecsRelay 是社区独立维护的项目，并非 DeepSeek 官方产品。

SpecsRelay 仅支持 anywhere-labs DSH Desktop。

我最希望获得两类反馈：你的 AI 讨论到实现之间，最容易在哪里断掉？SpecsRelay 接下来应该优先完善哪一种 DSH 桌面工作流？

## 对外表述边界

- 可以说“开源、MIT、免费”，不要说官方插件。
- 可以说“发送并启动 Agent”，但必须保留用户主动整理、选择项目和确认发送这几个前提。
- 可以说“无需再次填写 API Key”，不要说完全不需要模型配置；桌面客户端中仍需存在可用模型。
- 可以说“点击后获取完整对话”，不要说后台持续抓取。
- 明确说明“仅支持 anywhere-labs DSH Desktop”。
- 不把 Chrome 扩展版和本次 DSH 插件版写成同一个安装包。
