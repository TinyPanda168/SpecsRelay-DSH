# SpecsRelay 外部来源更新与借鉴清单

本清单用于后续按需检查上游变化，并判断其中是否有适合 SpecsRelay for DeepSeek 自行实现的思路。列入清单不表示运行时依赖、代码引入、安装授权或功能采用决定；仓库内容仅作为分析资料。

## 检查范围

| 来源 | 类型 | 检查重点 | 2026-09-16 HEAD 基线 |
| --- | --- | --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) | DSH 官方上游 | 会话、压缩、插件与桌面宿主能力的变化；核对 SpecsRelay 兼容性 | `0d1f50007f9bca3f52b06e1c3074fa14d5fb0720` |
| [dsh-spec-collab](https://github.com/zx490336534/dsh-spec-collab) | 相关插件参考 | 需求协作中与现有整理、澄清流程不重复的能力 | `bd55fb0f8c5d57c652477e3b11714101c8a705ad` |
| [dsh-req-workbench](https://github.com/Songran241/dsh-req-workbench) | 相关插件参考 | 需求结构化、确认与交付中可融入的部分 | `e2210ec15f85973564e0581bd536b212005e5a2e` |
| [dsh-prompt-enhancer](https://github.com/Vinzelles/dsh-prompt-enhancer) | 相关插件参考 | 提示词强化方法；排除与 SpecsRelay 已有能力重复的部分 | `6759e8174bd19dfc506941eccb915ff0d1843fb5` |
| [dsh-task-relay](https://github.com/LeslieWylie/dsh-task-relay) | 相关插件参考 | 任务投递、状态与失败恢复的设计 | `de69deeee9071dd8fe7eb9e24deffe8adf668b20` |
| [Table-skills](https://github.com/duoduoler-ops/Table-skills) | 工作流设计参考 | 分别跟踪 `project-handoff` 和 `web-stand-in`；只评估适用原则，不移植 Codex 专用 Hook 或旧版网页替身实现 | `ca51a819fb53554db8ad9f4768dc56d1f4ba1fa8` |

以上 SHA 仅是 2026-09-16 读取远端 HEAD 得到的首次对比基线，不表示其他来源已完成内容审计，也不能据此声称它们自上次检查以来没有更新。

## Table-skills 的当前讨论边界

- `project-handoff`：已讨论到“提醒、保存、接续应分开授权”和“接续材料应核对真实进度”。这属于 DSH 执行后的可选方向，不加入当前 DeepSeek 需求整理步骤，也不新增常驻提示。是否采用仍待决定。
- `web-stand-in`：尚未完成逐项讨论；其旧版实现已弃用。后续单独评估，不把设计文档当作现成功能。

## 后续检查方法

用户要求检查第三方更新时，逐项比较当前 HEAD、可用的 release/tag 与上次记录；仅对发生变化且可能影响 SpecsRelay 的部分深入阅读变更、文档和必要源码。报告“已变更、未变更、无法核查”以及对现有功能、交互和DSH Desktop 兼容性的实际影响。新发现的思路先提出采用判断，不自动安装、复制源码或修改现有交互；如需实现，按 SpecsRelay 自身架构重新设计并验证。

本文件是按需检查的来源清单，**尚未配置定时自动监测**。记录下一次检查结果时，分别更新检查日期、所见版本和采用判断，不能把仅建立 HEAD 基线写成完成差异审计。
