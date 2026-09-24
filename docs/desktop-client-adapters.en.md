# SpecsRelay and DSH Desktop integration

SpecsRelay supports only DSH Desktop by anywhere-labs. Its installer, UI entry points, and native-page integration target this client. Other DSH desktop clients and the browser-based WebUI are outside the supported scope.

## Installation

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install
```

The installer recognizes only DSH Desktop. macOS uses `CFBundleIdentifier`; Windows reads unpacked application metadata. A matching application name alone does not establish support. Use `--app <path>` for non-standard locations and `--dry-run` to inspect the installation plan without writing files.

| Property | Value |
| --- | --- |
| macOS application identifier | `ai.deepseek.dsh.desktop` |
| Installation profile | `desktop` |
| Default DSH_HOME | `~/.dsh`, overridable through `DSH_HOME` or `--dsh-home` |
| Application resource layout | `app` or `app.asar.unpacked` |
| Native page service | `desktopWebPanels` supplied by DSH Desktop |

The installer uses the application's bundled DSH command without modifying the desktop executable. The client must already contain a working native page service.

The installer also checks the application's `./web-panels` export and `lib/web-panels.js` file. Both installation and `--dry-run` stop if these are absent; matching the application identity or version is insufficient. This static check does not replace a real launch test. See the [2.0.13 repair and source patch](desktop-native-repair.md).

## Native page and layout

The sidebar footer lists Import sessions, SpecsRelay, Phone connection, and Settings in that order when those entries are enabled. SpecsRelay uses the `sidebar.footer.action` slot after the session-import entry.

The isolated DSH Desktop Host process must also register `desktopWebPanels`; registering it only in Electron's main process does not support the default launch path. SpecsRelay uses this service to host the real DeepSeek page and no longer supplies child-process bridges for other clients. The server returns the underlying page-startup error, and the panel directs the user to its details.

SpecsRelay registers its UI from the mode and platform signals supplied by DSH Desktop. The DeepSeek page stays on the left and the SpecsRelay controls stay on the right. The controls adapt to window width without switching to tabs in narrower windows. Requirement organization and clarification use the same layout.

In enhanced mode on macOS and Windows, overlays start below the 32-pixel titlebar and fill the remaining content area. The top safe area uses the workspace theme background across the full window width, does not intercept mouse events, and restores the host appearance when the overlay closes.

Compatibility and extended modes place the titlebar outside the renderer, so overlays add no extra top inset. DSH Desktop places native pages above the content renderer and below the independent titlebar and its menus, keeping the window-mode menu visible above the page.
