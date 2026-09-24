import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

function* elements(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of node.children || []) yield* elements(child);
}

async function harness() {
  const source = await readFile(new URL("../client-native.js", import.meta.url), "utf8");
  const slots = new Map(), states = [], effects = [], deps = [];
  const requests = [], saving = [];
  let plugin, phase = "shortcut", cursor = 0, effectCursor = 0, fail = false;
  let settings = { provider: "off", layaUrl: "", layaModel: "multilingual" };
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState(initial) {
      if (phase !== "settings") return [phase === "shortcut" ? true : initial, () => {}];
      const id = cursor++;
      if (!(id in states)) states[id] = initial;
      return [states[id], (value) => { states[id] = typeof value === "function" ? value(states[id]) : value; }];
    },
    useEffect(run, values) {
      if (phase !== "settings") return;
      const id = effectCursor++;
      if (JSON.stringify(values) !== JSON.stringify(deps[id])) { deps[id] = values; effects.push(run); }
    },
    useMemo: (read) => read(), useRef: () => ({ current: null }),
    useSyncExternalStore: (_subscribe, read) => read()
  };
  runInNewContext(source, {
    URLSearchParams, AbortSignal,
    window: { location: { search: "?dsh-desktop-mode=compatibility&dsh-desktop-platform=darwin" } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (fail) return { ok: false, json: async () => ({ error: "暂时无法保存" }) };
      if (options.method === "PUT") settings = JSON.parse(options.body);
      return { ok: true, json: async () => ({ settings }) };
    },
    globalThis: { __ModuleLoader__: { load: ({ factory }) => {
      plugin = factory((name) => name === "react" ? react : { Button: "button" });
    } } }
  });
  plugin.apply({ effect: (run) => run(), slots: {
    inject: (_slot, register) => register(), register: (options, component) => slots.set(`${options.name}/${options.id}`, { options, component })
  } });
  const shortcut = slots.get("sidebar.footer.action/specsrelay-deepseek");
  const tree = shortcut.component({ ...shortcut.options.inject(),
    useSessions: (select) => select({ current: "session", byId: { session: { cwd: "/workspace" } } })
  });
  const view = [...elements(tree)].find((node) => node.type?.name === "SpecsRelayDeepSeekView");
  phase = "view";
  const panel = [...elements(view.type(view.props))].find((node) => node.type?.name === "EnhancementSettings");
  phase = "settings";
  const render = (busy = "") => {
    cursor = 0; effectCursor = 0;
    return panel.type({ busy, onSaving: (value) => saving.push(value) });
  };
  render();
  for (const effect of effects.splice(0)) effect();
  await new Promise((resolve) => setImmediate(resolve));
  return {
    render, requests, saving, fail: () => { fail = true; },
    field: (name, busy) => [...elements(render(busy))].find((node) => node.props?.["aria-label"] === name),
    save: (busy) => [...elements(render(busy))].find((node) => node.type === "button"),
    current: () => settings
  };
}

test("users can save Laya's endpoint/model, switch to Jev, and turn enhancement off", async () => {
  const app = await harness();
  assert.equal(app.field("增强服务").props.value, "off");
  assert.equal(app.save().props.disabled, true);
  app.field("增强服务").props.onChange({ target: { value: "laya" } });
  app.field("Laya 服务地址").props.onChange({ target: { value: "http://localhost:8000" } });
  app.field("Laya 模型名称").props.onChange({ target: { value: "multilingual" } });
  await app.save().props.onClick();
  assert.deepEqual(app.current(), { provider: "laya", layaUrl: "http://localhost:8000", layaModel: "multilingual" });
  assert.equal([...elements(app.render())].find((node) => node.type === "summary").children[0], "长对话增强 · Laya");
  for (const provider of ["jev", "off"]) {
    app.field("增强服务").props.onChange({ target: { value: provider } });
    assert.equal(app.field("Laya 服务地址"), undefined);
    await app.save().props.onClick();
    assert.equal(app.current().provider, provider);
  }
  assert.deepEqual(app.saving, [true, false, true, false, true, false]);
  assert.ok(app.requests.every((request) => request.url === "/specsrelay/v1/enhancement-settings"));
});

test("failed saves retain the draft and effective selection; busy organization prevents changes", async () => {
  const app = await harness();
  app.field("增强服务").props.onChange({ target: { value: "jev" } });
  assert.equal(app.field("增强服务", "integrate").props.disabled, true);
  await app.save("integrate").props.onClick();
  assert.equal(app.requests.length, 1);
  app.fail();
  await app.save().props.onClick();
  assert.equal(app.current().provider, "off");
  assert.equal(app.field("增强服务").props.value, "jev");
  assert.equal([...elements(app.render())].find((node) => node.props?.role === "alert").children[0], "暂时无法保存");
  assert.equal(app.save().props.disabled, false);
  assert.deepEqual(app.saving, [true, false]);
});
