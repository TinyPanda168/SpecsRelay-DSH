import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

async function clientHarness(promptResult = { ok: true, value: { accepted: true } }) {
  const source = await readFile(new URL("../client-native.js", import.meta.url), "utf8");
  const registrations = new Map();
  const created = [];
  const opened = [];
  const submitted = [];
  const drafts = [];
  let plugin;
  const context = {
    URLSearchParams,
    encodeURIComponent,
    fetch: async () => ({
      ok: true,
      json: async () => ({ available: true, sourceFingerprint: "same" })
    }),
    window: { location: { search: "?dsh-desktop-mode=compatibility&dsh-desktop-platform=darwin" } },
    globalThis: {
      __ModuleLoader__: {
        load(definition) {
          plugin = definition.factory((name) => name === "react"
            ? { createElement() {}, useEffect() {}, useMemo() {}, useRef() {}, useState() {}, useSyncExternalStore() {} }
            : {});
        }
      }
    }
  };
  runInNewContext(source, context);
  const sessions = {
    list: {
      getSnapshot: () => ({
        current: "source",
        byId: { source: { cwd: "/project", running: false } },
        jobsBySession: {}
      })
    },
    async create(options) {
      created.push(options);
      return "new-session";
    },
    binding: () => ({
      session: {
        async prompt(parts, mode) {
          submitted.push({ parts, mode });
          return promptResult;
        }
      }
    }),
    open(id) { opened.push(id); },
    scope: () => ({})
  };
  plugin.apply({
    effect: (effect) => effect(),
    slots: {
      inject: (_name, register) => register(),
      register: (options) => { registrations.set(options.id, options); return () => {}; }
    },
    sessions,
    workspaces: { list: { getSnapshot: () => ({ items: [{ workspaceId: "workspace", path: "/project" }] }) } },
    conversation: { input: { for: () => ({ setDraft: (value) => drafts.push(value) }) } }
  });
  return {
    continuation: registrations.get("specsrelay-continuation").inject("source").continueSession,
    created,
    opened,
    submitted,
    drafts
  };
}

const prepared = {
  projectPath: "/project",
  prompt: "verify first, then continue",
  sourceFingerprint: "same"
};

test("confirmation creates one fresh same-workspace session and submits exactly once", async () => {
  const harness = await clientHarness();
  await harness.continuation("source", prepared);
  assert.deepEqual(harness.created.map(({ workspaceId }) => workspaceId), ["workspace"]);
  assert.deepEqual(harness.submitted.map(({ parts, mode }) => [parts[0].text, mode]),
    [[prepared.prompt, "queue"]]);
  assert.deepEqual(harness.opened, ["new-session"]);
  await assert.rejects(harness.continuation("source", prepared), /避免重复提交/);
  assert.equal(harness.created.length, 1);
  assert.equal(harness.submitted.length, 1);
});

test("a rejected send keeps the prepared prompt as a draft without creating twice", async () => {
  const harness = await clientHarness({ ok: false, error: new Error("rejected") });
  await assert.rejects(harness.continuation("source", prepared), /保留在草稿/);
  assert.deepEqual(harness.drafts, [prepared.prompt]);
  assert.deepEqual(harness.opened, ["new-session"]);
  await assert.rejects(harness.continuation("source", prepared), /避免重复提交/);
  assert.equal(harness.created.length, 1);
});

test("a changed source is rejected before creating a new session", async () => {
  const harness = await clientHarness();
  await assert.rejects(
    harness.continuation("source", { ...prepared, sourceFingerprint: "stale" }),
    /发生了变化/
  );
  assert.equal(harness.created.length, 0);
});
