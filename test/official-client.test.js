import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

async function officialClient({ reject = false, failOpen = false } = {}) {
  const source = await readFile(new URL("../client-native.js", import.meta.url), "utf8");
  const registrations = new Map();
  const opened = [], submitted = [], drafts = [], acquired = [], released = [];
  const retained = new Set();
  const byId = { source: { id: "source", cwd: "/project", retainedBy: { mainView: 1 }, running: false } };
  let currentDraft = "";
  let plugin;
  const primitives = Object.fromEntries([
    "Button", "Tooltip", "IconArchiveOutlineRegular", "IconChevronLeftOutlineRegular",
    "IconCloseOutlineRegular", "IconEditOutlineRegular", "IconEnhanceOutlineRegular",
    "IconRefreshOutlineRegular", "IconSendOutlineRegular", "IconTrashOutlineRegular", "IconWarningOutlineRegular"
  ].map(name => [name, name]));
  runInNewContext(source, {
    URLSearchParams, performance, encodeURIComponent,
    document: { documentElement: { dataset: { platform: "darwin" } } },
    window: { location: { search: "" }, dshDesktop: { protocolVersion: 1, browser: {
      acquire() {}, release() {}, onOpenRequested() {}
    } } },
    fetch: async () => ({ ok: true, json: async () => ({ available: true, sourceFingerprint: "same" }) }),
    globalThis: { __ModuleLoader__: { load({ factory }) {
      plugin = factory(name => name === "react" ? {
        Fragment: "fragment", createElement(type, props, ...children) {
          assert.notEqual(type, undefined, "official primitives must resolve");
          return { type, props, children };
        },
        useState: value => [value, () => {}], useEffect() {}, useMemo: read => read(),
        useRef: () => ({ current: null }), useSyncExternalStore: (_subscribe, read) => read()
      } : primitives);
    } } }
  });
  const sessions = {
    list: { getSnapshot: () => ({ byId }) },
    scope: id => retained.has(id) || byId[id]?.retainedBy.mainView ? { id } : undefined,
    binding(id) {
      assert.ok(retained.has(id), "must retain a catalogued session before borrowing it");
      return { session: { async prompt(parts, mode) {
        submitted.push({ id, text: parts[0].text, mode });
        return reject ? { ok: false } : { ok: true, value: { accepted: true } };
      } } };
    },
    retain(id) {
      acquired.push(id);
      retained.add(id);
      return { ready: failOpen ? Promise.reject(new Error("open failed")) : Promise.resolve(),
        release() { retained.delete(id); released.push(id); } };
    },
    async create() {
      byId.target = { id: "target", cwd: "/target", retainedBy: {}, running: false };
      return "target";
    }
  };
  const navigation = {
    openSession(id) { opened.push(id); byId[id].retainedBy.mainView = 1; },
    connectWorkspace: () => sessions.create(),
    pickDirectory: async () => "/picked"
  };
  plugin.apply({
    get: name => name === "uiWorkspace" ? navigation : undefined,
    sessions,
    workspaces: { list: { getSnapshot: () => ({ items: [
      { workspaceId: "workspace", path: "/target" }
    ] }) } },
    conversation: { input: { for: scope => ({
      state: { getSnapshot: () => ({ draft: currentDraft, attachmentIds: [], phase: "plain" }) },
      setDraft(text) { drafts.push({ id: scope.id, text }); currentDraft = text; },
      submit() { throw new Error("official handoff must await prompt acceptance"); }
    }) } },
    effect: run => run(),
    slots: { inject: (_name, run) => run(), register(options, component) {
      registrations.set(`${options.name}/${options.id}`, { options, component });
      return () => {};
    } }
  });
  const shortcut = registrations.get("sidebar.footer.action/specsrelay-deepseek");
  const actions = shortcut.options.inject();
  return { actions, shortcut, byId, opened, submitted, drafts, acquired, released,
    setDraft: value => { currentDraft = value; },
    continueSession: registrations.get("conversation.input.right/specsrelay-continuation")
      .options.inject("source").continueSession };
}

test("official bridge registers the shortcut and uses mainView selection without legacy query parameters", async () => {
  const app = await officialClient();
  assert.equal(app.actions.desktopTopInset, 32);
  app.shortcut.component({ ...app.actions, useSessions: select => select({ byId: app.byId }) });
  const target = await app.actions.prepareProject("/project");
  assert.equal(target.sessionId, "source");
  assert.equal(await app.actions.pickProject(), "/picked");
  assert.equal(app.actions.draftClarification("source", "/project", "decision").ok, true);
  assert.deepEqual(app.drafts, [{ id: "source", text: "decision" }]);
  assert.equal(app.actions.draftClarification("source", "/project", "replacement").ok, false);
  app.setDraft("");
  app.byId.source.retainedBy.mainView = 0;
  assert.equal(app.actions.draftClarification("source", "/project", "wrong selection").ok, false);
});

test("official handoff retains its target through acceptance, navigates and releases once", async () => {
  const app = await officialClient();
  const result = await app.actions.loadProjectDraft({ projectPath: "/target", prompt: "spec", submit: true });
  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.deepEqual(app.submitted, [{ id: "target", text: "spec", mode: "queue" }]);
  assert.deepEqual(app.opened, ["target"]);
  assert.deepEqual(app.acquired, ["target"]);
  assert.deepEqual(app.released, ["target"]);
  assert.deepEqual(app.drafts, []);
});

test("official rejected or unopened targets never report a successful send", async () => {
  const app = await officialClient({ reject: true });
  assert.equal((await app.actions.loadProjectDraft({ projectPath: "/target", prompt: "spec", submit: true })).ok, false);
  assert.deepEqual(app.opened, []);
  assert.deepEqual(app.released, ["target"]);
  const broken = await officialClient({ failOpen: true });
  await assert.rejects(broken.actions.loadProjectDraft({ projectPath: "/target", prompt: "spec", submit: true }), /open failed/);
  assert.deepEqual(broken.submitted, []);
  assert.deepEqual(broken.released, ["target"]);
});

test("official continuation retains the new session and blocks duplicate submission", async () => {
  const app = await officialClient();
  app.byId.source.cwd = "/target";
  const prepared = { projectPath: "/target", prompt: "continue", sourceFingerprint: "same" };
  await app.continueSession("source", prepared);
  assert.deepEqual(app.submitted, [{ id: "target", text: "continue", mode: "queue" }]);
  assert.deepEqual(app.released, ["target"]);
  await assert.rejects(app.continueSession("source", prepared), /避免重复提交/);
  assert.equal(app.submitted.length, 1);
});
