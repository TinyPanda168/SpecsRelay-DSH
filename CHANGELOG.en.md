# Changelog

[简体中文](CHANGELOG.md) | English

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

- Both Jev features are independently enabled and off by default; the Key is optional. Organization works without Jev. Once long-conversation enhancement is enabled with a Key, conversations of at least 24,000 characters are screened automatically. Short conversations bypass screening; failed planning or screening falls back to the full conversation. See the [configuration guide](README.en.md#optional-long-conversation-enhancement).
- Restart DSH Desktop after updating the plugin. The client must already provide a working native page service; installing this plugin does not modify the desktop executable. The client owns the stacking of window-mode menus and native pages. See the [integration guide](docs/desktop-client-adapters.en.md).

### Validation

- All 71 automated tests passed, covering installation detection, panel layout conditions, copying and recapture, session continuation, Jev evidence selection and failure fallbacks. Tests do not call paid live models and do not establish screening quality on real conversations.
- Checked the files being committed and previously unpushed commits, including comparisons against local credentials. No private Keys were found; the scanner's sole suspicious match was a dummy value in a credential-rejection test.

Implementation: [ef2b00c](https://github.com/TinyPanda168/SpecsRelay-DSH/commit/ef2b00ccebc2db87572eb9fb1cbef03e6203493e).
