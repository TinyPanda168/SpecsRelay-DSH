# User guide

[Back to overview](../README.en.md) · [简体中文](usage.md) | English

## Quick install

**Official DeepSeek Harness Desktop**: configure a working model, open **Plugins**, install `github:TinyPandaGame/SpecsRelay-DSH`, then restart. The app owns plugin installation; do not use the community CLI to alter its desktop profile.

**Community DSH Desktop by anywhere-labs**: use a client with the native-page service, then run:

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --app "/Applications/DSH Desktop.app"
```

**Restart DSH Desktop** after installation. The regular workflow needs no browser extension, Docker, or additional third-party service.

<details>
<summary>Portable installations, custom paths and detection checks</summary>

Specify the desktop application path:

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --app "/absolute/path/to/DSH Desktop.app"
```

Inspect detection without writing files:

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --dry-run
```

</details>

### Supported desktop clients

Official DeepSeek Harness Desktop (macOS Apple Silicon 0.1.7-rc.2 tested) and community DSH Desktop by anywhere-labs are supported. Official Desktop requires browser bridge protocol 1; the community client requires `desktopWebPanels`. Other clients and browser WebUI remain outside scope. Official Windows/Linux builds have not been validated.

See [DSH Desktop integration](desktop-client-adapters.en.md) for detection, configuration directories and window modes.

## Workflow

**Discuss → Organize → Confirm → Send to the Agent**

### Use

Open or create a DSH session associated with a Workspace, then select **SpecsRelay** at the bottom of the sidebar.

1. **Discuss your idea**: sign in to DeepSeek in the left pane and open or continue a conversation.
2. **Organize requirements**: select **Organize current conversation** to extract goals, constraints, decisions and acceptance criteria from the complete conversation.
3. **Resolve open questions**: answer in the panel, or copy questions into the original DeepSeek conversation, discuss them, then select **Capture and organize again**. Copying never sends automatically. This step is skipped when nothing needs confirmation.
4. **Start work**: review the requirements and project directory, then select **Send to DSH and start** to launch the corresponding Agent.

### Highlights

- **Capture the complete conversation on demand**, without manually copying context.
- **Requirement-analysis Skill included**, with no separate installation or configuration.
- **Webpage on the left, requirements on the right**, so you can discuss and review together.

### Select methods according to the content

The bundled Skill guides the current organizer to combine only the methods the requirement needs: keep small changes concise; ask prerequisite questions first when material choices remain, at most three per round; connect feature requirements to acceptance and verification; and reconcile corrections or withdrawals while retaining unaffected requirements. A proportionate review runs within the same generation.

Continue using **Organize current conversation** without selecting a framework, installing other tools, or adding a Key. Revisions return the complete current requirement; persistent semantic version diffs and stable requirement IDs are not included. Existing format repair and optional long-conversation enhancement may make additional model calls. Review the model's output; see the [validation scope and acceptance examples (Chinese)](requirement-analysis-evaluation.md). Restart DSH Desktop after updating the plugin to reload the bundled Skill.

## Optional features

### Optional long-conversation enhancement

For long discussions where earlier decisions matter, the organizer plans what to look for, your selected Jev or Laya service selects original evidence, and the original organizer writes the requirements. You still select **Organize current conversation** once.

- **Off by default**. Expand **Long-conversation enhancement** in the sidebar, choose Off, Jev or Laya, then save. Jev uses a TypeSafe Key; Laya takes a running service URL and optional model name.
- Once enabled, conversations of **24,000 characters or more** are enhanced automatically; short conversations use the full text directly.
- Planning or screening failures return to full-source organization. Your Coding Agent's main model stays unchanged.

> **Data notice:** enhancement sends conversation fragments to the selected TypeSafe or Laya service, potentially covering most of the conversation. Credential masking does not remove every kind of sensitive information. Enable it only for conversations you allow that service to receive.

[Setup, selection rules and advanced parameters →](jev-features.en.md#long-conversation-enhancement)

### Optional continuation routing

Let Jev choose an auxiliary organizer model for **Continue session**. This is off by default, enabled independently of long-conversation enhancement, and uses the same optional Key. Failed selection preserves the original route; your Coding Agent's main model stays unchanged.

[Configuration and data sent →](jev-features.en.md#continuation-routing)

### Continue a DSH session

When a session grows long, select **Continue session** in the composer. After confirmation, SpecsRelay sends goals, confirmed decisions, progress and facts to verify to **a new session in the same project**.

The original session stays available. The new Agent checks the project and uncommitted changes read-only before continuing the next clear step.

<details>
<summary>When continuation is suggested and what the new Agent checks</summary>

- SpecsRelay estimates context pressure when the current Agent is idle.
- Near 80% of the model's reported context window, or after an observed automatic compaction, the button shows **Continuation suggested**. Suggestions never create sessions automatically.
- Manual continuation remains available without reliable context-window metadata.
- Handoff material uses the current session's available content and cannot replace project inspection. The new Agent asks about conflicts or unverifiable facts before proceeding.
- The original session is neither changed nor archived. Uncertain sends are not retried automatically, avoiding duplicate work.

</details>

### Clarify a product question during implementation

When the Agent needs a product decision, discuss it in DeepSeek and bring your answer back to the original DSH session:

1. Select **Clarify requirement**, then review and edit the suggested question.
2. Open the original DeepSeek conversation on the left and select **Start clarification** to send your reviewed question automatically.
3. Discuss and confirm your choice, then select **Read new discussion** and review the newly added messages.
4. Place the result in **the original DSH session's draft** and send it yourself to continue.

<details>
<summary>Question cards, draft protection and session checks</summary>

- This flow creates no subagent or new DSH session. DeepSeek suggestions are not treated as your decisions; unresolved choices still require your answer.
- Only messages added after clarification began are captured. Results go into the original session's empty draft, without overwriting or automatically sending it.
- Returns are rejected if you switch DeepSeek conversations, edit earlier messages, or switch DSH projects.
- If DSH is waiting on an `ask_user_question` card, open **Clarify requirement** from the sidebar and copy your final answer back into that card after discussion. SpecsRelay does not submit the card; normal draft return resumes once the card is resolved.

</details>

## Data and security

### What is read and sent

- Page capture runs only after you select **Organize current conversation**, **Start clarification**, or **Read new discussion**. Loading and resizing do not capture content.
- Requirement organization, clarification and revision use the model configured in DSH.
- Long-conversation enhancement and Jev continuation routing are off by default. See [enhancement data handling](jev-features.en.md#data-sent-to-typesafe) for what the selected service receives.

### What is stored locally

- An isolated webpage session preserves your DeepSeek sign-in. SpecsRelay does not read or store account passwords.
- Conversations, requirement drafts, recovery history and execution snapshots are stored in SpecsRelay's local DSH-host data directory; browser storage is a compatibility fallback.
- Restoring a historical snapshot restores only the draft and never starts another Agent turn.

<details>
<summary>Native webpage isolation</summary>

Official Desktop supplies a leased, sandboxed `webview`; community Desktop uses `WebContentsView`. SpecsRelay adds no Node integration or preload and executes capture/send scripts only on `https://chat.deepseek.com`. Closing the official panel releases its guest lease. If DeepSeek shows an environment warning, stop and follow the website instructions; SpecsRelay does not bypass login or site checks.

</details>

## Local development

<details>
<summary>Load from source and service responsibilities</summary>

```sh
pnpm dsh plugin --profile desktop add /absolute/path/to/SpecsRelay-DSH
```

The command above is for community Desktop. For official Desktop, install the local plugin path from its Plugins page, then restart. UI registration accepts either the official browser bridge or the community mode/platform signals. See [client adapters](desktop-client-adapters.en.md) for ownership and interface details.

</details>

## Relationship to related projects

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) provides the Agent, model, session and plugin system. SpecsRelay installs as a plugin without changing the core runtime.
- [DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) provides desktop capabilities and is the only supported community client.
- This repository contains the DSH plugin distribution. The browser extension is a separate edition.

## Acknowledgements

Thanks to DeepSeek Harness, DSH Desktop and [AI Chat Exporter](https://github.com/TheBluCoder/AI-chat-exporter). See [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) for third-party code and licenses.

## License

[MIT License](../LICENSE). DeepSeek is a trademark of DeepSeek AI. This independent project is neither affiliated with nor endorsed by DeepSeek.
