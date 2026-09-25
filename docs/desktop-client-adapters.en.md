# SpecsRelay desktop client adapters

SpecsRelay supports official DeepSeek Harness Desktop and community DSH Desktop by anywhere-labs. Requirement organization, enhancement, clarification and handoff share one workflow, with separate browser and session adapters. Other desktop forks and browser WebUI remain outside scope.

| Client | macOS identifier | Browser API | Installation |
| --- | --- | --- | --- |
| Official DeepSeek Harness | `com.deepseek.dsh` | `window.dshDesktop.browser`, protocol 1 | In-app Plugins page |
| Community anywhere-labs DSH Desktop | `ai.deepseek.dsh.desktop` | `desktopWebPanels` | Bundled DSH CLI / this installer |

## Official Desktop

Install `github:TinyPandaGame/SpecsRelay-DSH` from Plugins, then restart. The official app manages its desktop profile. This installer detects the official macOS app and prints in-app instructions without running the community CLI. When both clients are detected it prefers official instructions to avoid changing shared `~/.dsh` data. Explicit `--app` selection still permits community installation.

The plugin directly consumes the official browser API through an independently implemented `lib/official-browser-client.js`; it copies or changes no official desktop core code. It leases a sandboxed `webview` per workspace and releases it on close, failed loading, timeout or late acquisition. Capture and clarification sending verify the DeepSeek origin. Node integration, preload and host security policies stay unchanged.

The guest occupies the left DOM container with SpecsRelay on the right. The footer entry occupies its own row below Import sessions and above More, matching More’s icon and label alignment. The overlay reserves 32 pixels on macOS and 40 on Windows. Icon compatibility covers official Regular exports and community size-specific exports. Official selection uses `retainedBy.mainView`; project connection and navigation use `uiWorkspace`. Handoff and continuation explicitly retain the target session and wait for acceptance before reporting success.

Validation baseline: official 0.1.7-rc.2 on macOS Apple Silicon. Real page loading, split layout, titlebar clearance and close/reopen were checked; a real organizer-model request passed. Automated tests cover capture, clarification and handoff interfaces. The unsigned-in website currently displays an environment warning, so the signed-in conversation-to-Agent flow has not been validated end to end. Official Windows/Linux builds and other versions have not been verified.

## Community installation

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --app "/Applications/DSH Desktop.app"
```

macOS identifies the bundle; Windows reads unpacked package metadata. Application names alone are insufficient. `--dry-run` prints the plan. Installation targets the `desktop` profile in `~/.dsh`, overridable with `DSH_HOME` or `--dsh-home`.

The installer requires `./web-panels` and `lib/web-panels.js`, stopping without changing the app when they are missing. See the [community 2.0.13 repair notes](desktop-native-repair.md). That patch does not apply to official DeepSeek Desktop.

## Community native page and layout

The sidebar footer lists Import sessions, SpecsRelay, Phone connection, and Settings in that order when those entries are enabled. SpecsRelay uses the `sidebar.footer.action` slot after the session-import entry.

The isolated DSH Desktop Host process must also register `desktopWebPanels`; registering it only in Electron's main process does not support the default launch path. SpecsRelay uses this service to host the real DeepSeek page and no longer supplies child-process bridges for other clients. The server returns the underlying page-startup error, and the panel directs the user to its details.

SpecsRelay registers its UI from the mode and platform signals supplied by DSH Desktop. The DeepSeek page stays on the left and the SpecsRelay controls stay on the right. The controls adapt to window width without switching to tabs in narrower windows. Requirement organization and clarification use the same layout.

In enhanced mode on macOS and Windows, overlays start below the 32-pixel titlebar and fill the remaining content area. The top safe area uses the workspace theme background across the full window width, does not intercept mouse events, and restores the host appearance when the overlay closes.

Compatibility and extended modes place the titlebar outside the renderer, so overlays add no extra top inset. DSH Desktop places native pages above the content renderer and below the independent titlebar and its menus, keeping the window-mode menu visible above the page.
