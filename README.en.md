# SpecsRelay for DeepSeek

**Turn a DeepSeek discussion into work a DSH project can continue immediately.**

SpecsRelay for DeepSeek is an open-source requirement handoff plugin for DSH desktop clients. It opens the real, sign-in-capable DeepSeek website inside the desktop application and keeps a requirement handoff panel beside it. With one action, SpecsRelay captures the complete current multi-turn conversation, uses the model already configured in DSH and the bundled requirement-analysis Skill to create an actionable requirement, then sends the confirmed result to a selected project and starts its Agent.

SpecsRelay is not another chat client and does not ask users to change how they discuss a solution in DeepSeek. Clarification appears only when an unresolved decision would materially affect implementation; clear requirements proceed directly to delivery. The default workflow requires no browser extension, manual copy and paste, Docker service, third-party platform, or second model API Key entry inside SpecsRelay. A user-provided TypeSafe API Key is required only when optional Jev long-conversation enhancement or continuation routing is explicitly enabled.

_This is an independently maintained community project. It is not an official DeepSeek product or a built-in feature of any desktop client._

> **Supported client: SpecsRelay supports only [DSH Desktop by anywhere-labs](https://github.com/anywhere-labs/deepseek-harness-desktop).** Other DSH desktop clients and the browser-based WebUI are outside the supported scope.

[简体中文](README.md) | English

<a href="https://www.producthunt.com/products/specsrelay-for-deepseek" target="_blank" rel="noopener noreferrer"><img alt="Product Hunt launch rank number 66" width="250" height="54" src="assets/product-hunt-rank-66.svg"></a>

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

### Optional long-conversation enhancement

Long-conversation enhancement runs inside **Organize current conversation**. SpecsRelay captures the complete conversation; the organizer uses the opening, recent discussion and current clarifications to plan evidence searches for goals, confirmed decisions, constraints, acceptance criteria and open questions. [Jev / TypeSafe System One](https://docs.typesafe.ai/agent-skill) then evaluates source fragments in batches, and the original organizer reads the retained evidence to write Specs. Jev finds useful information; the organizer interprets it and writes requirements. Users still click once, with no compression ratio or separate compression step.

The feature is off by default. Obtain your own TypeSafe API Key and set both variables in the desktop client's `$DSH_HOME/.env` (or in the environment that launches DSH). Never commit this local file to a project repository:

```sh
SPECSRELAY_JEV_LONG_CONTEXT=1
TYPESAFE_API_KEY=your_TypeSafe_API_Key
```

`SPECSRELAY_JEV_API_KEY` remains a compatibility alias. Once enabled with a Key, conversations of at least 24,000 characters are enhanced automatically. Short conversations, missing Keys, disabled enhancement or ambiguous role headers use the full conversation directly. Planning or Jev failures, timeouts and invalid responses discard all filtering results and return to full-source organization. The existing 400,000-character import limit and the organizer model's context limit still apply.

Selection retains all identifiable user text, role labels and the latest two messages. Only assistant fragments judged with high probability to be entirely chatter or repetition without new information are omitted; uncertain content stays. Judgments also receive adjacent fragments and excerpts of preceding and following user messages to help preserve referenced proposals. Retained source fragments preserve their order, and the original conversation is not overwritten. Common credentials and the current TypeSafe Key are masked before slicing. TypeSafe receives the reading plan and batches of source fragments, potentially covering most of the conversation, including adjacent user context; this is not limited to the old router's 1,600-character excerpt. Redaction does not remove every kind of sensitive information: enable this only for conversations you allow TypeSafe to receive.

Set `SPECSRELAY_JEV_LONG_CONTEXT=0` or remove it to disable enhancement. It does not select the organizer model or change the Coding Agent model. Chinese screening quality still needs evaluation on real conversations; automated tests verify ordering, retained text and fallbacks, not model accuracy or savings. Maintainers can tune `SPECSRELAY_JEV_LONG_CONTEXT_MIN_CHARS` (1,000–400,000), `SPECSRELAY_JEV_LONG_CONTEXT_TIMEOUT_MS` (100–60,000; default 20,000) and `SPECSRELAY_JEV_OMIT_PROBABILITY` (0.9–1; default 0.98). Invalid values report an error. Ordinary users do not need to set these parameters.

### Optional continuation routing

The existing `SPECSRELAY_JEV_ROUTER=1` flag now applies only to auxiliary-model selection for **Continue session**. It is off by default and uses the same optional Key. It sends a credential-redacted task excerpt of at most 1,600 characters plus model candidates; fewer than two models or a failed request preserves the original route. This flag does not enable long-conversation enhancement, and requirement organization no longer uses it to select a model. Keys are resolved per operation through DSH credentials or the launch environment, without writing them to plugin configuration, workspace state or logs.

### Continue a DSH session

During a longer DSH task, select **Continue session** in the composer. SpecsRelay estimates context pressure when the current Agent is idle. Near 80% of the configured model's reported context window, or after it observes an automatic context compaction, the button changes to **Continuation suggested**. These are only suggestions: they never create a session automatically, and manual continuation remains available when reliable window metadata is unavailable.

After confirmation, SpecsRelay summarizes the current session's available conversation into goals, confirmed decisions, progress, and facts to verify. It creates a separate session in the same project and sends the handoff. The receiving Agent first checks the project and uncommitted changes read-only; it asks about conflicts or unverifiable facts before continuing the next clear step. The original session is neither changed nor archived, and the summary does not replace inspection of the actual project.

### Clarify a product question during implementation

When DSH reaches a product decision that needs your input, select **Clarify requirement** in the current session's composer. SpecsRelay suggests an editable question. Review it, open the original DeepSeek conversation on the left, and select **Start clarification**; SpecsRelay sends the question to that original conversation automatically. After discussing and explicitly confirming your choice, select **Read new discussion**. SpecsRelay brings back only messages added after clarification began. Review them, then place the result in a draft in the **same DSH session**. The Agent continues only after you send that draft yourself.

This optional flow does not create a subagent or a new DSH session, and it does not treat DeepSeek suggestions as your decisions. If the decision is still open, DSH should ask you again. SpecsRelay refuses a return from a different DeepSeek conversation, edited earlier messages, or a different DSH project.

If DSH is waiting on an `ask_user_question` card, its normal composer is temporarily unavailable. Open **Clarify requirement** from the SpecsRelay sidebar, complete the discussion, then copy only your confirmed final answer back into the original session's question card. SpecsRelay does not submit the card for you. Once the card is resolved, normal draft return is available again.

## Highlights

| Capability | What it provides |
| --- | --- |
| Real DeepSeek website | Full sign-in, conversation history, and native website interaction—not a screenshot or video stream |
| Complete context capture | Captures the current multi-turn conversation on demand without copy and paste or a browser extension |
| Requirement organization | Extracts goals, constraints, confirmed decisions, and acceptance criteria, asking only material questions |
| Reuses the DSH model | Uses the model already available in the desktop client instead of requesting another Key in SpecsRelay |
| Optional long-conversation enhancement | Once enabled with a Jev Key, long conversations are screened before organization; short input bypasses screening and failures use the full source |
| Project-aware delivery | Select a project, review the final requirement, then send it directly and start the corresponding Agent |
| In-task clarification loop | Discuss a DSH product question in the original DeepSeek conversation and return only new turns to the original DSH session draft |
| One installation entry | Detects DSH Desktop and installs the plugin into its profile |

## Quick install

For the simplest setup, use [DSH Desktop by anywhere-labs](https://github.com/anywhere-labs/deepseek-harness-desktop). Install and start the desktop client first, then run:

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install
```

The installer detects only DSH Desktop and installs SpecsRelay into its `desktop` profile. Restart DSH Desktop when installation completes.

Portable or non-standard installations can provide an application path explicitly:

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --app "/absolute/path/to/DSH Desktop.app"
```

Inspect detection without writing files:

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install --dry-run
```

### Before use

- DSH Desktop by anywhere-labs containing the SpecsRelay native page Host.
- A working model connected and selected in the client. SpecsRelay does not request another model Key.
- A signed-in DeepSeek session in the page opened by SpecsRelay.

The default workflow needs no browser extension, developer mode, Docker service, or additional third-party service. Jev long-conversation enhancement and continuation routing are independently enabled third-party options and do not affect users who leave them off.

## Supported desktop clients

SpecsRelay supports only [DSH Desktop by anywhere-labs](https://github.com/anywhere-labs/deepseek-harness-desktop), identified on macOS by `ai.deepseek.dsh.desktop`. The installer adds the plugin only to this client's `desktop` profile.

The client must include a working `desktopWebPanels` native page service. Installing the plugin cannot add missing Host capabilities to an older client. See [DSH Desktop integration](docs/desktop-client-adapters.en.md) for detection, data-directory, and window-layout details.

## Use

1. Open or create a DSH session associated with a Workspace.
2. Select the SpecsRelay icon at the bottom of the sidebar.
3. Sign in to DeepSeek in the left pane and open the conversation to relay.
4. Select **Organize current conversation** and wait for automatic organization to complete.
5. If decisions are still needed, copy the questions into the original DeepSeek conversation on the left, continue the discussion, then select **Capture and organize again**. You can also answer directly in SpecsRelay. Copying never sends the questions automatically. This step stays hidden when no answer is needed.
6. Select or confirm the project directory, acknowledge that delivery starts the Agent, then select **Send to DSH and start**.

## Data and security

- The DeepSeek pane is a real, sandboxed `WebContentsView`, not a screenshot or remote-control stream.
- An isolated native session preserves the DeepSeek sign-in. SpecsRelay does not read or store account passwords.
- Node integration and preload access remain disabled; main-frame navigation is limited to `https://chat.deepseek.com`.
- DOM capture runs only after the user selects **Organize current conversation**, **Start clarification**, or **Read new discussion**. Loading, showing, and resizing the page do not capture content.
- The current conversation, requirement draft, recovery history, and execution snapshots are stored in SpecsRelay's local DSH-host data directory; browser storage remains a compatibility fallback. The DSH-configured model then processes the requirement, and clarification and revision use the same model path.
- Jev features are off by default. Long-conversation enhancement sends reading questions and source fragments with common credentials redacted; continuation routing sends only a short excerpt and model candidates. Neither reads project files or tool results directly, although content pasted into the web conversation may include them. The Key is used for authentication, not sent as screening evidence.
- The `specsrelay-requirement-analysis` Skill is built into the workflow and does not require separate installation or configuration.
- **Send to DSH and start** submits the requirement through DSH's native input path. Restoring a historical snapshot restores only the draft and never starts another Agent turn.
- **Continue session** prepares and sends only after user confirmation. An uncertain send is not retried automatically, avoiding duplicate work.
- **Clarify requirement** automatically sends only a user-reviewed question to the currently open original DeepSeek conversation; return capture uses only new turns and writes only to the original DSH session's empty draft. It never submits the DSH draft automatically or overwrites an existing draft.

## Local development

```sh
pnpm dsh plugin --profile desktop add /absolute/path/to/SpecsRelay/plugins/dsh-deepseek
```

Restart DSH Desktop after adding the plugin. SpecsRelay registers its UI only when DSH Desktop provides its mode and platform signals.

`@specsrelay/dsh-deepseek` uses the `desktopWebPanels` service supplied by DSH Desktop. DSH Desktop creates the sandboxed `WebContentsView`, preserves the sign-in partition, performs controlled DOM capture, and disposes native pages; SpecsRelay handles requirement organization, clarification, and delivery.

## Relationship to related projects

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) provides the Agent, model, session, Web UI, and plugin system. SpecsRelay installs through that plugin system without modifying its core runtime.
- [DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) is an independently maintained community client and the only desktop client supported by SpecsRelay. SpecsRelay installs as a plugin and is not built into that project.
- This repository contains only the SpecsRelay DSH plugin distribution, not the SpecsRelay browser-extension edition.

## Acknowledgements

Thanks to DeepSeek Harness and DSH Desktop for their plugin foundation, desktop capabilities, and ongoing maintenance. Thanks also to [AI Chat Exporter](https://github.com/TheBluCoder/AI-chat-exporter) for its open-source conversation extraction implementation. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party code and license details.

## License

This project is distributed under the [MIT License](LICENSE). DeepSeek is a trademark of DeepSeek AI. SpecsRelay-DSH is an independent community project and is neither affiliated with nor endorsed by DeepSeek.
