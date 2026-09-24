# Changelog

[简体中文](CHANGELOG.md) | English

## 0.11.0 — 2026-09-25

- **Official Desktop adapter**: support DeepSeek Harness Desktop browser bridge protocol 1, alongside the existing anywhere-labs community adapter. Real DeepSeek pages use an official sandboxed webview lease; close, failure, timeout and late acquisition release it.
- **Session and UI compatibility**: use official main-view selection and workspace navigation, retain handoff/continuation targets through acceptance, and support the new icon exports. Preserve the left-page/right-SpecsRelay layout and the entry below Import sessions.
- **Installation**: official Desktop installs through its Plugins page. macOS detection prints those instructions instead of running community CLI against its profile. The community native-page patch remains separate.
- **Validation**: 97 plugin tests passed, including official and community adapters, guest lifecycle, multibyte capture, clarification and accepted/rejected handoffs. Official 0.1.7-rc.2 on macOS Apple Silicon loaded the real DeepSeek sign-in page and passed a real organizer request. Current-project display and empty-capture errors were checked in the running app. The website's environment warning prevents signed-in end-to-end acceptance; official Windows/Linux remain untested. See [adapter details](docs/desktop-client-adapters.en.md).

## 2026-09-24

- **Desktop upgrade compatibility**: retain a native-page companion source patch for DSH Desktop 2.0.13, covering Electron and isolated Host registration, RPC, menu stacking and build exports. The installer checks packaged capability files before modifying the profile, and the plugin now explains missing native support. A plugin update does not modify the desktop application. See [repair and upgrade notes](docs/desktop-native-repair.md).
- **Switch enhancement services**: sidebar settings offer Off / Jev / Laya and take effect on the next organization. Laya takes a service URL and optional model name; the plugin only calls an existing service. Saved UI settings override legacy environment switches; provider credentials are resolved independently and not stored in settings.
- **Laya HTTP adapter**: support `/v1/systemone` with per-candidate budgets, a separate threshold, full-source fallback and rejected redirects. Never switch to another service on failure. Mock HTTP, persistence and UI-switch tests cover integration, not live-model quality. Implementation scope and the upstream revision are recorded in the [watchlist (Chinese)](docs/external-reference-watchlist.md#laya-接口适配--2026-09-24).
- **Select organization methods by content**: combine necessary clarification, requirement/acceptance coverage, revision reconciliation and review within the existing organizer's generation. Buttons and the handoff format remain unchanged.
- **Reduce unnecessary questions**: ask prerequisite decisions first, at most three material questions per round; reassess after answers or revisions and remove answered, withdrawn or irrelevant questions.
- **Record adoption precisely**: reproduce Superpowers' five-item review checklist with its MIT license; independently write the selected methods inspired by grill-me, Spec-Kit and OpenSpec. Trellis remains a tracked reference. See the [adoption record (Chinese)](docs/external-reference-watchlist.md#实际采用记录--2026-09-24).
- **Validation scope**: 13 relevant automated tests passed, covering actual Skill loading, call counts, revision inputs and existing interactions. Six content-evaluation scenarios are documented; live-model semantic quality has not been evaluated. No framework dependency, separate routing service or persistent requirement-version manager was added.

## 2026-09-22

- Place the SpecsRelay sidebar entry below Import sessions and above Phone connection and Settings in DSH Desktop.
- Move the GitHub repository to [TinyPandaGame/SpecsRelay-DSH](https://github.com/TinyPandaGame/SpecsRelay-DSH) and update the installer's default source, installation guides, and launch materials.

## 0.10.0 — 2026-09-21

### Added

- **Return to the webpage for clarification**: unresolved requirements now offer actions to copy the questions and recapture the conversation. Paste the questions into the original DeepSeek conversation on the left, discuss them, then capture the complete updated conversation for organization. Direct answers remain available. Copying writes only to the clipboard and never sends a message automatically.
- **Optional long-conversation enhancement**: the organizer plans evidence searches for goals, confirmed decisions, constraints, acceptance criteria and open questions; Jev selects original evidence; the organizer then writes Specs. This runs inside one organization action, with no separate compression step or compression-ratio control.
- **Optional continuation routing**: Jev can select an auxiliary model for session continuation. Failed selection preserves the original route and does not change the Coding Agent model.

### Changed and fixed

- **DSH Desktop by anywhere-labs only**: installation and UI entry points now target this client. Removed the dedicated Pilot Harness, DataElement and myYangyunfan adapters and their process bridge.
- **Consistent side-by-side layout**: DeepSeek stays on the left and SpecsRelay on the right. Controls wrap in narrower windows without switching to tabs.
- **Enhanced-mode titlebar spacing**: plugin overlays on macOS and Windows leave room for the 32-pixel titlebar. The webpage and right panel move together, and the top background follows the workspace theme. Compatibility and extended modes add no duplicate top inset.
- **Page-startup errors**: failures direct users to the specific error instead of reporting every failure as an unsupported client.
- **Local configuration protection**: added Git ignore rules for environment files, credentials and local runtime state. Updated bilingual documentation and launch materials for the single supported client.

### Configuration and upgrading

- Both Jev features are independently enabled and off by default; the Key is optional. Organization works without Jev. Once long-conversation enhancement is enabled with a Key, conversations of at least 24,000 characters are screened automatically. Short conversations bypass screening; failed planning or screening falls back to the full conversation. See the [configuration guide](docs/jev-features.en.md#long-conversation-enhancement).
- Restart DSH Desktop after updating the plugin. The client must already provide a working native page service; installing this plugin does not modify the desktop executable. The client owns the stacking of window-mode menus and native pages. See the [integration guide](docs/desktop-client-adapters.en.md).

### Validation

- All 71 automated tests passed, covering installation detection, panel layout conditions, copying and recapture, session continuation, Jev evidence selection and failure fallbacks. Tests do not call paid live models and do not establish screening quality on real conversations.
- Checked the files being committed and previously unpushed commits, including comparisons against local credentials. No private Keys were found; the scanner's sole suspicious match was a dummy value in a credential-rejection test.

Implementation: [ef2b00c](https://github.com/TinyPandaGame/SpecsRelay-DSH/commit/ef2b00ccebc2db87572eb9fb1cbef03e6203493e).
