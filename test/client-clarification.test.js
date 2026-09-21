import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

async function harness() {
  const source = await readFile(new URL("../client-native.js", import.meta.url), "utf8");
  const slots = new Map();
  const drafts = [];
  const submitted = [];
  let plugin;
  let current = "source";
  let cwd = "/project";
  let draft = "";
  let attachmentIds = [];
  let phase = "plain";
  let pendingInteraction = null;
  let stateAvailable = true;
  runInNewContext(source, {
    URLSearchParams,
    encodeURIComponent,
    window: { location: { search: "?dsh-desktop-mode=compatibility&dsh-desktop-platform=darwin" } },
    globalThis: { __ModuleLoader__: { load(definition) {
      plugin = definition.factory((name) => name === "react"
        ? { createElement() {}, useEffect() {}, useMemo() {}, useRef() {}, useState() {}, useSyncExternalStore() {} }
        : {});
    } } }
  });
  plugin.apply({
    get: (name) => name === "uiSession"
      ? { sessionStatus: { getSnapshot: () => new Map([["source", { pendingInteraction }]]) } }
      : undefined,
    effect: (run) => run(),
    slots: {
      inject: (_name, register) => register(),
      register: (options) => { slots.set(options.id, options); return () => {}; }
    },
    sessions: {
      list: { getSnapshot: () => ({ current, byId: { source: { cwd } } }) },
      scope: () => ({})
    },
    workspaces: { list: { getSnapshot: () => ({ items: [] }) } },
    conversation: { input: { for: () => ({
      state: stateAvailable ? { getSnapshot: () => ({ draft, attachmentIds, phase }) } : undefined,
      setDraft(value) { drafts.push(value); draft = value; },
      submit() { submitted.push(true); },
      focus() {}
    }) } }
  });
  return {
    load: slots.get("specsrelay-clarification").inject("source").draftClarification,
    pendingQuestion: slots.get("specsrelay-clarification").inject("source").getPendingQuestion,
    drafts,
    submitted,
    setCurrent: (value) => { current = value; },
    setCwd: (value) => { cwd = value; },
    setDraft: (value) => { draft = value; },
    setAttachments: (value) => { attachmentIds = value; },
    setPhase: (value) => { phase = value; },
    setPending: (value) => { pendingInteraction = value; },
    setStateAvailable: (value) => { stateAvailable = value; }
  };
}

test("puts clarification in the same session draft without submitting", async () => {
  const app = await harness();
  assert.equal(app.load("source", "/project", "confirmed decision").ok, true);
  assert.deepEqual(app.drafts, ["confirmed decision"]);
  assert.deepEqual(app.submitted, []);
});

test("does not hide a pending DSH question behind an ordinary draft", async () => {
  const app = await harness();
  app.setPending({ kind: "question", questions: [{
    question: "第一版要账号吗？",
    options: [{ label: "需要" }, { label: "不需要" }]
  }] });
  assert.equal(app.pendingQuestion("source"), "第一版要账号吗？\n- 需要\n- 不需要");
  const result = app.load("source", "/project", "discussion");
  assert.equal(result.ok, false);
  assert.equal(result.pendingQuestion, true);
  assert.deepEqual(app.drafts, []);
  assert.deepEqual(app.submitted, []);
});

test("does not overwrite a draft or cross session/project boundaries", async () => {
  const app = await harness();
  app.setDraft("existing work");
  assert.equal(app.load("source", "/project", "new").ok, false);
  app.setDraft("");
  app.setAttachments(["attachment"]);
  assert.equal(app.load("source", "/project", "new").ok, false);
  app.setAttachments([]);
  app.setPhase("submitting");
  assert.equal(app.load("source", "/project", "new").ok, false);
  app.setPhase("plain");
  app.setCurrent("another");
  assert.equal(app.load("source", "/project", "new").ok, false);
  app.setCurrent("source");
  app.setCwd("/elsewhere");
  assert.equal(app.load("source", "/project", "new").ok, false);
  assert.deepEqual(app.drafts, []);
  assert.deepEqual(app.submitted, []);
});

test("older clients without readable draft state fail safely", async () => {
  const app = await harness();
  app.setStateAvailable(false);
  const result = app.load("source", "/project", "discussion");
  assert.equal(result.ok, false);
  assert.match(result.message, /手动粘贴/);
  assert.deepEqual(app.drafts, []);
});

test("clarification sends the question back to DeepSeek without a copy step", async () => {
  const source = await readFile(new URL("../client-native.js", import.meta.url), "utf8");
  const start = source.indexOf("function SpecsRelayClarificationPanel(");
  const end = source.indexOf("function SpecsRelayDeepSeekView(", start);
  assert.ok(start >= 0 && end > start, "automatic clarification panel is present");
  const panel = source.slice(start, end);
  assert.match(panel, /正在发送到原对话/);
  assert.match(panel, /问题已自动发送/);
  assert.doesNotMatch(panel, /复制问题/);
  assert.doesNotMatch(panel, /复制下方问题到左侧 DeepSeek/);
});
