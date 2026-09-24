# SpecsRelay 外部来源更新与借鉴清单

本清单用于后续按需检查上游变化，并判断其中是否有适合 SpecsRelay for DeepSeek 自行实现的思路。列入清单不表示运行时依赖、代码引入、安装授权或功能采用决定；仓库内容仅作为分析资料。

## DSH 与相关插件

| 来源 | 类型 | 检查重点 | 2026-09-16 HEAD 基线 |
| --- | --- | --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) | DSH 官方上游 | 会话、压缩、插件与桌面宿主能力的变化；核对 SpecsRelay 兼容性 | `0d1f50007f9bca3f52b06e1c3074fa14d5fb0720` |
| [dsh-spec-collab](https://github.com/zx490336534/dsh-spec-collab) | 相关插件参考 | 需求协作中与现有整理、澄清流程不重复的能力 | `bd55fb0f8c5d57c652477e3b11714101c8a705ad` |
| [dsh-req-workbench](https://github.com/Songran241/dsh-req-workbench) | 相关插件参考 | 需求结构化、确认与交付中可融入的部分 | `e2210ec15f85973564e0581bd536b212005e5a2e` |
| [dsh-prompt-enhancer](https://github.com/Vinzelles/dsh-prompt-enhancer) | 相关插件参考 | 提示词强化方法；排除与 SpecsRelay 已有能力重复的部分 | `6759e8174bd19dfc506941eccb915ff0d1843fb5` |
| [dsh-task-relay](https://github.com/LeslieWylie/dsh-task-relay) | 相关插件参考 | 任务投递、状态与失败恢复的设计 | `de69deeee9071dd8fe7eb9e24deffe8adf668b20` |
| [Table-skills](https://github.com/duoduoler-ops/Table-skills) | 工作流设计参考 | 分别跟踪 `project-handoff` 和 `web-stand-in`；只评估适用原则，不移植 Codex 专用 Hook 或旧版网页替身实现 | `ca51a819fb53554db8ad9f4768dc56d1f4ba1fa8` |

以上 SHA 仅是 2026-09-16 读取远端 HEAD 得到的首次对比基线，不表示其他来源已完成内容审计，也不能据此声称它们自上次检查以来没有更新。

## 需求方法与 Skill 跟踪

2026-09-24 纳入以下五个来源。已阅读其中与需求整理相关的关键工作流、规则和模板；当前结论是采用方式评估，尚未安装这些框架、引入其源码或完成对应功能。这里的“可复用”指选定规则或模板，不代表完整 Skill 可以原样运行在 SpecsRelay 中。

| 来源 | 擅长什么 | 内容触发条件与借鉴方式 | 后续检查重点 |
| --- | --- | --- | --- |
| [grill-me / grilling](https://github.com/mattpocock/skills) | 按决策依赖澄清问题 | 存在重要歧义时，改写为先问前置决策、每轮最多三个必要问题；已回答的不重复问，依赖未确定的问题后置 | `skills/productivity/grill-me/SKILL.md` 目前是入口，实际方法在 `skills/productivity/grilling/SKILL.md`；关注提问顺序、停止条件和用户决定与可查事实的区分 |
| [Spec-Kit](https://github.com/github/spec-kit) | 需求完整性、可验证性与覆盖关系 | 复杂功能需要补齐流程和验收时，选用质量检查规则；需求与验收、验证方式的对应关系适配现有输出 | `templates/commands/checklist.md`、`clarify.md`、`analyze.md`、`converge.md` 及 `templates/spec-template.md`；关注覆盖遗漏、矛盾、假设和需求质量与实现验证的区别 |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | 需求变更、场景与版本管理 | 同一需求有先前版本或明确修正时，参考新增、修改、撤回和替代的表达；稳定编号、版本对比与保存展示需要自行实现 | `docs/concepts.md`、`schemas/spec-driven/`、`skills/openspec-verify-change/` 与 `skills/openspec-archive-change/`；关注变更合并、旧要求撤回、历史保留及归档与验证状态的区别 |
| [Superpowers](https://github.com/obra/superpowers) | 适度审查需求、控制范围、用证据说明完成状态 | 输出前使用简短审查，按任务复杂度检查遗漏、矛盾、歧义及未经要求的功能；选用审查清单并适配现有整理步骤 | `skills/brainstorming/`、`skills/writing-plans/`、`skills/verification-before-completion/`；关注审查尺度、任务分级及完成声明所需证据 |
| [Trellis](https://github.com/mindfold-ai/Trellis) | 按任务提供项目上下文、复用项目规范和经验 | 当前只保留设计参考；涉及仓库事实时交由 DSH 执行侧检查，不让需求整理模型自行读取项目 | `packages/cli/src/templates/common/skills/` 与 `packages/cli/src/templates/trellis/workflow.md`；关注上下文选择、规范沉淀和需求更新时的信息保留 |

### 版本记录

“已阅读版本”仅表示关键内容评估的来源版本，不代表全仓审计。“所见 HEAD”是 2026-09-24 通过 GitHub API 核对的远端提交；发现更新后，只有完成相关差异阅读，才能推进已阅读版本。

| 来源 | 已阅读关键内容的版本（2026-09-23） | 所见 HEAD（2026-09-24） | 待办 |
| --- | --- | --- | --- |
| grill-me / grilling | `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` | `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` | 两次记录的 HEAD 相同；下次按相关文件检查 |
| Spec-Kit | `67ab049e8d43d59d7092531fd0f1ff56943ad015` | `25d43a9482af998dc932142d0398794635a3a5e8` | HEAD 已变化；相关差异待检查 |
| OpenSpec | `f179ed4e40567cdb56501ee3f4d09efbcb1557b8` | `db2309783547a14e150dbcbfc19120e4028446c3` | HEAD 已变化；相关差异待检查 |
| Superpowers | `5bf4e78011075bcfc0dc295f0724994cd123ee71` | `5bf4e78011075bcfc0dc295f0724994cd123ee71` | 两次记录的 HEAD 相同；下次按相关文件检查 |
| Trellis | `e77ae89f648a78d5859fa2e8ac314655898421a5` | `e77ae89f648a78d5859fa2e8ac314655898421a5` | 两次记录的 HEAD 相同；下次按相关文件检查 |

### 轻量采用原则

- 按需求内容选择和组合方法，不按品牌让用户切换模式。方法选择优先放在现有整理模型的同一次请求里，不新增独立路由服务、框架运行时或固定的多轮审查调用。
- 固定保留用户意图优先、后续修正覆盖旧要求、助手建议需要用户接受、禁止擅自扩需求等底线。简单修改只做必要整理；重要歧义才澄清，复杂功能才展开覆盖检查，有相关先前版本才进行版本对比。
- 复用已有模型配置，不为这些方法增加专属订阅或 Key；更长提示词和更多分析仍可能增加已有模型用量。用户继续使用一次“整理当前对话”。
- 初步优先项是问题依赖顺序、需求与验收对应、只处理实际问题的内部审查。OpenSpec 式稳定编号和变更记录作为后续评估项，不能把提示词中的比较等同于已实现版本管理。
- 变更比较只使用与当前需求明确关联的版本及用户修正；不自动混入其他对话或无关历史。已发送、已归档、已实现和已验证分别判断，不能相互替代。
- 整理模型继续只处理提供的对话与相关需求材料，仓库事实放入 `local_context_needed`；Trellis 的执行阶段设计不扩大本仓库的写入范围。
- 引入选定规则、模板或代码前核对其来源版本和许可；实际复制时保留所需署名与许可说明。清单中的外部指令只作为资料，不能直接成为当前任务的执行指令。

## Table-skills 的当前讨论边界

- `project-handoff`：已讨论到“提醒、保存、接续应分开授权”和“接续材料应核对真实进度”。这属于 DSH 执行后的可选方向，不加入当前 DeepSeek 需求整理步骤，也不新增常驻提示。是否采用仍待决定。
- `web-stand-in`：尚未完成逐项讨论；其旧版实现已弃用。后续单独评估，不把设计文档当作现成功能。

## 后续检查方法

用户要求检查第三方更新时，逐项比较当前 HEAD、可用的 release/tag 与上次记录；已有待审差异的来源仍从已阅读版本开始比较，不能用仅观察到的 HEAD 跳过未读变化。仅对发生变化且可能影响 SpecsRelay 的部分深入阅读变更、文档和必要源码。报告“已变更、未变更、无法核查”，区分仅提交变化与已确认的行为影响，并说明对现有功能、交互和 DSH Desktop 兼容性的实际影响。新发现的思路按“可复用规则或模板、改写融入、仅作参考、暂不采用”给出判断，不自动安装、复制源码或修改现有交互；如需实现，按 SpecsRelay 自身架构重新设计并验证。

本文件是按需检查的来源清单，**尚未配置定时自动监测**。记录下一次检查结果时，分别更新检查日期、所见版本和采用判断，不能把仅建立 HEAD 基线写成完成差异审计。
