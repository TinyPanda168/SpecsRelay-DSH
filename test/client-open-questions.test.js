import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

function* elements(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of node.children || []) yield* elements(child);
}

async function harness({ clipboardFails = false, browserReady = true } = {}) {
  const source = await readFile(new URL("../client-native.js", import.meta.url), "utf8");
  const handoff = { open_questions: ["第一版需要账号吗？", "是否支持离线使用？"], ready_for_execution: false };
  const copied = [];
  const requests = [];
  const slots = new Map();
  let plugin;
  let phase = "shortcut";
  let copyStatus = "";
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => {
      if (phase === "panel") return [copyStatus, (value) => { copyStatus = value; }];
      if (phase === "shortcut") return [true, () => {}];
      return [initial === null ? handoff : initial === "starting" && browserReady ? "ready" : initial, () => {}];
    },
    useEffect() {},
    useMemo: (read) => read(),
    useRef: () => ({ current: null }),
    useSyncExternalStore: (_subscribe, read) => read()
  };
  runInNewContext(source, {
    URLSearchParams,
    encodeURIComponent,
    AbortSignal,
    navigator: { clipboard: { writeText: async (text) => {
      if (clipboardFails) throw new Error("Clipboard denied");
      copied.push(text);
    } } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => url.endsWith("/browser/capture")
        ? { item: { captureId: "fresh", messageCount: 4, transcript: "完整原对话\n用户确认：不需要账号，需要离线使用。" } }
        : { handoff: { open_questions: [], ready_for_execution: true }, provider: "fixture", model: "fixture" } };
    },
    window: { location: { search: "?dsh-desktop-mode=compatibility&dsh-desktop-platform=darwin" } },
    globalThis: { __ModuleLoader__: { load: ({ factory }) => {
      plugin = factory((name) => name === "react" ? react : {});
    } } }
  });
  plugin.apply({
    effect: (run) => run(),
    slots: {
      inject: (_slot, register) => register(),
      register: (options, component) => slots.set(`${options.name}/${options.id}`, { options, component })
    }
  });
  const shortcut = slots.get("sidebar.footer.action/specsrelay-deepseek");
  const tree = shortcut.component({
    ...shortcut.options.inject(),
    useSessions: (select) => select({ current: "session", byId: { session: { cwd: "/workspace" } } })
  });
  const view = [...elements(tree)].find((element) => element.type?.name === "SpecsRelayDeepSeekView");
  phase = "view";
  const panel = [...elements(view.type(view.props))].find((element) => element.type?.name === "HandoffSummaryPanel");
  phase = "panel";
  return {
    copied,
    requests,
    render: (overrides = {}) => panel.type({ ...panel.props, ...overrides }),
    button: (label, overrides = {}) => [...elements(panel.type({ ...panel.props, ...overrides }))]
      .find((element) => element.children?.includes(label))
  };
}

test("copying unresolved questions preserves both questions without sending or capturing", async () => {
  const app = await harness();
  await app.button("复制问题，回网页讨论").props.onClick();
  assert.equal(app.copied.length, 1);
  assert.match(app.copied[0], /1\. 第一版需要账号吗？\n2\. 是否支持离线使用？/);
  assert.match(app.copied[0], /不要替我假设答案/);
  assert.deepEqual(app.requests, []);
  assert.ok(app.button("已复制问题"));
  assert.ok(app.button("提交回答并继续整理"));
});

test("returning from discussion captures the updated full conversation before organization", async () => {
  const app = await harness();
  await app.button("重新获取并整理").props.onClick();
  assert.equal(app.requests.length, 2);
  assert.ok(app.requests[0].url.endsWith("/browser/capture"));
  assert.ok(app.requests[1].url.endsWith("/organize"));
  assert.equal(JSON.parse(app.requests[1].options.body).text, "完整原对话\n用户确认：不需要账号，需要离线使用。");
  assert.deepEqual(app.copied, []);
});

test("clipboard failure remains actionable and does not send anything", async () => {
  const app = await harness({ clipboardFails: true });
  await app.button("复制问题，回网页讨论").props.onClick();
  const alert = [...elements(app.render())].find((element) => element.props?.role === "alert");
  assert.match(alert.children.join(""), /复制失败，请手动复制/);
  assert.deepEqual(app.requests, []);
  assert.deepEqual(app.copied, []);
});

test("discussion controls respect busy and page readiness states", async () => {
  const app = await harness({ browserReady: false });
  assert.equal(app.button("重新获取并整理").props.disabled, true);
  assert.equal(app.button("复制问题，回网页讨论").props.disabled, false);
  assert.equal(app.button("复制问题，回网页讨论", { busy: "integrate" }).props.disabled, true);
  await app.button("复制问题，回网页讨论", { busy: "integrate" }).props.onClick();
  assert.deepEqual(app.copied, []);
});
