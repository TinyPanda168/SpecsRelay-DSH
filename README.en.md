# SpecsRelay for DeepSeek

**Turn a DeepSeek discussion into work a DSH project can continue immediately.**

SpecsRelay for DeepSeek is an open-source requirement handoff plugin for DSH desktop clients. It opens the real, sign-in-capable DeepSeek website inside the desktop application and keeps a requirement handoff panel beside it. With one action, SpecsRelay captures the complete current multi-turn conversation, uses the model already configured in DSH and the bundled requirement-analysis Skill to create an actionable requirement, then sends the confirmed result to a selected project and starts its Agent.

SpecsRelay is not another chat client and does not ask users to change how they discuss a solution in DeepSeek. Clarification appears only when an unresolved decision would materially affect implementation; clear requirements proceed directly to delivery. The workflow requires no browser extension, manual copy and paste, Docker service, third-party platform, or second API Key entry inside SpecsRelay.

_This is an independently maintained community project. It is not an official DeepSeek product or a built-in feature of any desktop client._

> **Current compatibility scope: SpecsRelay supports only these four desktop clients:** [DSH Desktop by anywhere-labs](https://github.com/anywhere-labs/deepseek-harness-desktop), [Pilot Harness](https://github.com/op7418/pilot-harness), [DataElement DSH Desktop](https://github.com/dataelement/dsh-desktop), and [myYangyunfan DSH Desktop](https://github.com/myYangyunfan/dsh_desktop). Other DSH desktop clients and the ordinary browser-based WebUI are not currently supported.

DSH Desktop by anywhere-labs is the current recommendation for regular users. Complete support in the other three clients currently requires a SpecsRelay companion build.

[简体中文](README.md) | English

<a href="https://www.producthunt.com/products/specsrelay?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-specsrelay" target="_blank" rel="noopener noreferrer"><img alt="SpecsRelay - Turn AI chats into reviewed tasks for local coding agents | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1228503&amp;theme=light&amp;t=1787459593479"></a>
<a href="https://www.producthunt.com/products/specsrelay-for-deepseek" target="_blank" rel="noopener noreferrer"><img alt="Product Hunt launch rank number 66" src="https://img.shields.io/badge/Product%20Hunt%20Launch-%2366-FF6154?logo=producthunt&amp;logoColor=white"></a>

![SpecsRelay organizes a DeepSeek conversation and sends it to a DSH Agent](assets/specsrelay-dsh-hero.png)

[Quick install](#quick-install) · [Workflow](#workflow) · [Supported desktop clients](#supported-desktop-clients) · [Data and security](#data-and-security)

## Why SpecsRelay exists

DeepSeek Web is well suited to exploring an idea, comparing directions, and gradually confirming product decisions. DSH is better suited to opening a local project, reading its code, and continuing implementation. Both handle part of the job, but the transition between them is usually manual: users copy a long conversation, reconstruct its context, identify which decisions are final, and tell a Coding Agent which project should continue the work.

SpecsRelay moves that repetitive handoff into the DSH desktop experience without replacing either side:

- **DeepSeek remains the discussion space.** Users keep the original website, sign-in, conversation history, and familiar interaction.
- **SpecsRelay forms the requirement.** It captures the complete current conversation, extracts goals, constraints, decisions, and acceptance criteria, and asks only when something material is unclear.
- **DSH remains the implementation space.** After the user selects a project and confirms delivery, the requirement enters the corresponding session so the Agent can continue the discussion or start development.

SpecsRelay is therefore neither a new model platform nor a general-purpose web scraper. It is a requirement relay built specifically between **DeepSeek Web conversations and DSH project execution**.

## Workflow

**DeepSeek Web conversation → SpecsRelay organization and clarification → DSH project selection → Agent starts**

1. Sign in to DeepSeek inside the desktop client and discuss a product, feature, or technical direction as usual.
2. Select **Organize current conversation**. SpecsRelay captures the complete current conversation and uses the DSH-configured model plus the `specsrelay-requirement-analysis` Skill to organize it.
3. Clarification appears only when a missing decision would affect the result. This step is skipped when the requirement is already clear.
4. Select the target project and confirm delivery. SpecsRelay sends the final requirement to that project's DSH session and starts the Agent.

## Highlights

| Capability | What it provides |
| --- | --- |
| Real DeepSeek website | Full sign-in, conversation history, and native website interaction—not a screenshot or video stream |
| Complete context capture | Captures the current multi-turn conversation on demand without copy and paste or a browser extension |
| Requirement organization | Extracts goals, constraints, confirmed decisions, and acceptance criteria, asking only material questions |
| Reuses the DSH model | Uses the model already available in the desktop client instead of requesting another Key in SpecsRelay |
| Project-aware delivery | Select a project, review the final requirement, then send it directly and start the corresponding Agent |
| One installation entry | The same bundle and command adapt to several community DSH desktop clients |

## Quick install

For the simplest setup, use [DSH Desktop by anywhere-labs](https://github.com/anywhere-labs/deepseek-harness-desktop). Install and start the desktop client first, then run:

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install
```

The unified installer detects supported clients on the machine and installs the same SpecsRelay bundle into the correct DSH profile. Restart the detected clients when installation completes.

Portable or non-standard installations can provide an application path explicitly:

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --app "/absolute/path/to/DSH Desktop.app"
```

Inspect detection without writing files:

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --dry-run
```

### Before use

- A supported DSH desktop client containing the SpecsRelay native page Host.
- A working model connected and selected in the client. SpecsRelay does not request another model Key.
- A signed-in DeepSeek session in the page opened by SpecsRelay.

No browser extension, developer mode, Docker service, or additional third-party service is required.

## Supported desktop clients

SpecsRelay maintains one core plugin bundle. The installer resolves the client, profile, and data directory; each desktop adapter supplies only native-page and directory-selection capabilities. Conversation capture, organization, clarification, and delivery remain shared.

| Client | Current status | Notes |
| --- | --- | --- |
| [anywhere-labs DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) | **Recommended** | Upstream supplies the native page Host required by SpecsRelay and is the preferred option for regular users |
| [Pilot Harness](https://github.com/op7418/pilot-harness) | Adapted | Currently requires the SpecsRelay companion build containing the native Host |
| [DataElement DSH Desktop](https://github.com/dataelement/dsh-desktop) | Adapted | Currently requires the SpecsRelay companion build containing the process bridge |
| [myYangyunfan DSH Desktop](https://github.com/myYangyunfan/dsh_desktop) | Adapted | Local backend supported; WSL-managed mode does not currently expose the native page Host |

Pilot, DataElement, and myYangyunfan public packages can use the unified installer alone after their corresponding native Host is included upstream. Until then, use the SpecsRelay companion source build. An ordinary browser-based DSH WebUI has no native page owner and cannot provide real page embedding or background conversation capture.

See [Desktop client adapters](docs/desktop-client-adapters.en.md) for detection, data-directory, and native-bridge details. The current Pilot baseline is documented in [Pilot Harness local integration](docs/pilot-harness-integration.en.md).

## Use

1. Open or create a DSH session associated with a Workspace.
2. Select the SpecsRelay icon at the bottom of the sidebar.
3. Sign in to DeepSeek in the left pane and open the conversation to relay.
4. Select **Organize current conversation** and wait for automatic organization to complete.
5. If clarification questions appear, answer them and organize again. This step stays hidden when no answer is needed.
6. Select or confirm the project directory, acknowledge that delivery starts the Agent, then select **Send to DSH and start**.

## Data and security

- The DeepSeek pane is a real, sandboxed `WebContentsView`, not a screenshot or remote-control stream.
- An isolated native session preserves the DeepSeek sign-in. SpecsRelay does not read or store account passwords.
- Node integration and preload access remain disabled; main-frame navigation is limited to `https://chat.deepseek.com`.
- DOM capture runs only after the user selects **Organize current conversation**. Loading, showing, and resizing the page do not capture content.
- The current conversation, requirement draft, recovery history, and execution snapshots are stored in SpecsRelay's local DSH-host data directory; browser storage remains a compatibility fallback. The DSH-configured model then processes the requirement, and clarification and revision use the same model path.
- The `specsrelay-requirement-analysis` Skill is built into the workflow and does not require separate installation or configuration.
- **Send to DSH and start** submits the requirement through DSH's native input path. Restoring a historical snapshot restores only the draft and never starts another Agent turn.

## Local development

```sh
pnpm dsh plugin --profile desktop add /absolute/path/to/SpecsRelay/plugins/dsh-deepseek
```

Restart DSH Desktop after adding the plugin. Ordinary WebUI cannot provide the native DeepSeek panel and reports that a desktop client is required.

All four clients share the requirement-organization and handoff core from `@specsrelay/dsh-deepseek`, but they do not share one undifferentiated desktop UI. The plugin selects host-specific presentation from stable host signals: for example, official DSH Desktop bottom-aligns the footer entry in its shared action row so that it stays next to Settings, while other clients retain layouts suited to their own shells. Each desktop client still implements the `desktopWebPanels` service or SpecsRelay process bridge that creates the sandboxed `WebContentsView`, preserves the sign-in partition, performs controlled DOM capture, and closes the page when the DSH child exits.

## Relationship to related projects

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) provides the Agent, model, session, Web UI, and plugin system. SpecsRelay installs through that plugin system without modifying its core runtime.
- [DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop), [Pilot Harness](https://github.com/op7418/pilot-harness), [DataElement DSH Desktop](https://github.com/dataelement/dsh-desktop), and [myYangyunfan DSH Desktop](https://github.com/myYangyunfan/dsh_desktop) are independently maintained community clients. SpecsRelay is compatible with them but is not built into those projects.
- This repository contains only the SpecsRelay DSH plugin distribution, not the SpecsRelay browser-extension edition.

## Acknowledgements

Thanks to DeepSeek Harness and the community desktop-client projects for their plugin foundation, desktop capabilities, and ongoing maintenance. Thanks also to [AI Chat Exporter](https://github.com/TheBluCoder/AI-chat-exporter) for its open-source conversation extraction implementation. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party code and license details.

## License

This project is distributed under the [MIT License](LICENSE). DeepSeek is a trademark of DeepSeek AI. SpecsRelay-DSH is an independent community project and is neither affiliated with nor endorsed by DeepSeek.
