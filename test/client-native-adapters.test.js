import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

test("only DSH Desktop registers UI and reserves captions in enhanced mode", async () => {
  const source = await readFile(new URL("../client-native.js", import.meta.url), "utf8");
  for (const [mode, platform, inset, desktop] of [
    ["advanced", "darwin", 32, true],
    ["advanced", "win32", 32, true],
    ["compatibility", "darwin", 0, true],
    ["extended", "darwin", 0, true],
    ["advanced", "linux", 0, true],
    ["advanced", "", 0, false],
    ["", "darwin", 0, false],
    ["", "", 0, false]
  ]) {
    const registrations = new Map();
    let plugin;
    let openShortcut = true;
    const react = {
      createElement: (type, props, ...children) => ({ type, props, children }),
      useState: (initial) => [openShortcut ? true : initial, () => {}],
      useEffect() {},
      useMemo: (read) => read(),
      useRef: () => ({ current: null }),
      useSyncExternalStore: (_subscribe, read) => read()
    };
    runInNewContext(source, {
      URLSearchParams,
      window: { location: { search: `?dsh-desktop-mode=${mode}&dsh-desktop-platform=${platform}` } },
      globalThis: { __ModuleLoader__: { load: ({ factory }) => {
        plugin = factory((name) => name === "react" ? react : {});
      } } }
    });
    plugin.apply({
      effect: (run) => run(),
      slots: {
        inject: (_slot, register) => register(),
        register: (options, component) => { registrations.set(`${options.name}/${options.id}`, { options, component }); }
      }
    });
    if (!desktop) {
      assert.equal(registrations.size, 0, `unsupported host: ${mode}/${platform}`);
      continue;
    }
    const useSessions = (select) => select({ current: "session", byId: { session: { cwd: "/workspace" } } });
    for (const id of ["sidebar.footer.action/specsrelay-deepseek", "conversation.input.right/specsrelay-clarification"]) {
      openShortcut = true;
      const { options, component } = registrations.get(id);
      const tree = component({ ...options.inject("session"), useSessions });
      const overlay = tree.children.find((child) => child?.props?.style?.position === "fixed");
      assert.equal(overlay.props.style.top, inset, `${id}: ${mode}/${platform}`);
      openShortcut = false;
      const view = overlay.children[0];
      const section = view.type(view.props);
      assert.equal(section.props.style.height, desktop ? "100%" : "100vh");
      assert.equal(section.props.style.minHeight, desktop ? 0 : 520);
    }
  }
});

test("uses a desktop-provided directory picker before the DSH web fallback", async () => {
  const client = await readFile(new URL("../client-native.js", import.meta.url), "utf8");

  assert.match(client, /const desktopPicker = window\.dshDesktopDirectoryPicker;/);
  assert.match(client, /desktopPicker\.pick\(\)/);
  assert.match(client, /ctx\.workspaces\.pickDirectory\(\)/);
});

test("bottom-aligns the footer shortcut only in official DSH Desktop", async () => {
  const client = await readFile(new URL("../client-native.js", import.meta.url), "utf8");

  assert.match(client, /locationParams\.get\("dsh-desktop-mode"\)/);
  assert.match(client, /locationParams\.get\("dsh-desktop-platform"\)/);
  assert.match(client, /alignSelf: dshDesktop \? "flex-end" : undefined/);
  assert.match(client, /dshDesktop: isDshDesktop/);
  assert.match(client, /order: -10/);
});

test("continuation uses a fresh session in the same workspace only after confirmation", async () => {
  const client = await readFile(new URL("../client-native.js", import.meta.url), "utf8");

  assert.match(client, /确认并接续/);
  assert.match(client, /ctx\.sessions\.create\(\{ workspaceId: workspace\.workspaceId \}\)/);
  assert.match(client, /binding\.session\.prompt\(/);
  assert.match(client, /continuationAttempts\.set\(sourceId, \{ targetId: newId \}\)/);
  assert.match(client, /ctx\.sessions\.open\(newId\)/);
});
