import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { apply } from "../index.js";
import { normalizeEnhancementSettings, resolveEnhancementSettings } from "../lib/enhancement-settings.js";
import { EVIDENCE_PLAN_SYSTEM, enhanceLongConversation } from "../lib/long-conversation.js";

const off = { provider: "off", layaUrl: "", layaModel: "multilingual" };
const laya = { ...off, provider: "laya", layaUrl: "http://127.0.0.1:8000" };
const plan = { goal: "目标", confirmed_decisions: "决定", constraints: "约束", acceptance_criteria: "验收", open_questions: "问题" };
const source = Array.from({ length: 25 }, (_, i) =>
  `## User · Turn ${i + 1}\n保留用户原话 ${i + 1}。\n\n## Assistant · Turn ${i + 1}\n你好。\n\n`
).join("");
const env = { SPECSRELAY_JEV_LONG_CONTEXT_MIN_CHARS: "1000" };
const options = { env, settings: laya, plan: async () => JSON.stringify(plan) };
const answer = (body, score = 1) => ({ answers: Object.fromEntries(Object.keys(body.questions).map((id) => [id, { type: "noul", noul: score }])) });

test("saved off overrides old Jev opt-in; Laya does not depend on a Jev key", () => {
  const legacy = { SPECSRELAY_JEV_LONG_CONTEXT: "1" };
  assert.equal(resolveEnhancementSettings(undefined, legacy).provider, "jev");
  assert.equal(resolveEnhancementSettings(off, legacy).provider, "off");
  assert.equal(resolveEnhancementSettings(laya, legacy).provider, "laya");
  assert.equal(resolveEnhancementSettings(undefined, {}).provider, "off");
});

test("Laya accepts base, versioned and full endpoints and rejects embedded secrets and file paths", () => {
  for (const suffix of ["", "/", "/v1", "/v1/systemone/"]) {
    assert.equal(normalizeEnhancementSettings({ ...laya, layaUrl: `http://127.0.0.1:8000${suffix}` }).layaUrl,
      "http://127.0.0.1:8000/v1/systemone");
  }
  for (const layaUrl of ["", "/models/laya", "file:///models/laya", "http://user:password@localhost", "https://host/?key=private", "https://host/#private"]) {
    assert.throws(() => normalizeEnhancementSettings({ ...laya, layaUrl }));
  }
  assert.throws(() => normalizeEnhancementSettings({ ...laya, apiKey: "do-not-store" }));
  assert.throws(() => normalizeEnhancementSettings({ ...laya, provider: "unknown" }));
  assert.deepEqual(normalizeEnhancementSettings({ ...off, layaUrl: "unfinished-address" }), off);
});

test("Laya HTTP adapter sends the selected model without Jev credentials and preserves user text", async (t) => {
  const conversation = source.replaceAll("你好。", "Only repeated greetings. ".repeat(8));
  const requests = [];
  const server = createServer(async (req, res) => {
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const body = JSON.parse(Buffer.concat(buffers));
    requests.push({ path: req.url, headers: req.headers, body });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(answer(body)));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const actual = await enhanceLongConversation({ get: () => {
    return { resolve: (name) => {
      assert.equal(name, "SPECSRELAY_LAYA_API_KEY");
      return undefined;
    } };
  } }, conversation, {
    ...options,
    env: { ...env, TYPESAFE_API_KEY: "must-not-be-forwarded", SPECSRELAY_LAYA_MAX_REQUEST_BYTES: "1400" },
    settings: { ...laya, layaUrl: `http://127.0.0.1:${server.address().port}`, layaModel: "multilingual" }
  });
  assert.ok(requests.length > 0);
  assert.ok(actual.length < conversation.length);
  for (const request of requests) {
    assert.equal(request.path, "/v1/systemone");
    assert.equal(request.headers.authorization, undefined);
    assert.equal(request.body.model, "multilingual");
    assert.ok(Buffer.byteLength(JSON.stringify(request.body)) <= 1400);
    assert.equal(Object.keys(request.body.questions).length, 1);
    assert.ok(request.body.state.fragments.some((fragment) => fragment.role === "user"));
  }
  for (let i = 1; i <= 25; i += 1) assert.ok(actual.includes(`保留用户原话 ${i}。`));
  assert.ok(actual.endsWith(`## Assistant · Turn 25\n${"Only repeated greetings. ".repeat(8)}\n\n`));
});

test("Laya uses its own key, masks it from evidence, and applies its own conservative threshold", async () => {
  let calls = 0;
  const actual = await enhanceLongConversation({}, source, {
    ...options, env: { ...env, SPECSRELAY_LAYA_API_KEY: "laya-test-secret", TYPESAFE_API_KEY: "jev-test-secret" },
    fetchImpl: async (url, request) => {
      calls += 1;
      assert.equal(url, "http://127.0.0.1:8000/v1/systemone");
      assert.equal(request.headers.authorization, "Bearer laya-test-secret");
      assert.equal(request.redirect, "error");
      assert.doesNotMatch(request.body, /laya-test-secret|jev-test-secret/);
      return Response.json(answer(JSON.parse(request.body), 0.99));
    }
  });
  assert.ok(calls > 0);
  assert.equal(actual, source);
});

test("Laya outages, invalid replies and late failures return full text without contacting Jev", async () => {
  for (const failure of [() => { throw new Error("offline"); }, () => Response.json({ answers: {} }), () => Response.redirect("https://example.com")]) {
    let calls = 0;
    const actual = await enhanceLongConversation({}, source, { ...options,
      fetchImpl: async (url, request) => {
        assert.match(url, /^http:\/\/127\.0\.0\.1/);
        calls += 1;
        return calls === 1 ? Response.json(answer(JSON.parse(request.body))) : failure();
      }
    });
    assert.equal(calls, 2);
    assert.equal(actual, source);
  }
});

test("off and short conversations call neither the planner nor any backend", async () => {
  for (const [text, settings] of [[source, off], ["short", laya]]) {
    assert.equal(await enhanceLongConversation({}, text, { ...options, settings,
      plan: () => assert.fail("unexpected planning"), fetchImpl: () => assert.fail("unexpected request")
    }), text);
  }
});

test("oversized Laya context is retained, never silently truncated for a judgment", async () => {
  const largePlan = Object.fromEntries(Object.keys(plan).map((key) => [key, "重要需求".repeat(100)]));
  assert.equal(await enhanceLongConversation({}, source, { ...options,
    plan: async () => JSON.stringify(largePlan), fetchImpl: () => assert.fail("oversized context sent")
  }), source);
});

test("settings API persists provider switches across registration and excludes credentials", async (t) => {
  const home = await mkdtemp(path.join(tmpdir(), "specsrelay-enhancement-"));
  const previous = process.env.SPECSRELAY_HOME;
  process.env.SPECSRELAY_HOME = home;
  t.after(async () => {
    if (previous === undefined) delete process.env.SPECSRELAY_HOME;
    else process.env.SPECSRELAY_HOME = previous;
    await rm(home, { recursive: true, force: true });
  });
  const routes = new Map();
  const events = [];
  const handoff = JSON.parse(await readFile(new URL("./fixtures/long-conversation-handoff.json", import.meta.url), "utf8"));
  const stop = new Error("routes registered");
  const register = async () => assert.rejects(apply({
    effect: (run, label) => { run(); if (label.endsWith("WebUI routes")) throw stop; },
    skills: { register() {}, get: async () => ({ content: "Create a factual handoff." }) },
    agents: { get() {} }, get() {}, inject() {}, on() {},
    llm: {
      listProviders: () => [{ id: "deepseek-official", name: "DeepSeek" }],
      async *stream(request) {
        const planning = request.system === EVIDENCE_PLAN_SYSTEM;
        events.push(planning ? "plan" : "specs");
        yield { type: "text-delta", index: 0, text: JSON.stringify(planning ? plan : handoff) };
        yield { type: "finish", reason: "stop" };
      }
    },
    webServer: { register(route) { routes.set(route.path, route.handler); return () => {}; } }
  }), (error) => error === stop);
  await register();
  const call = async (method, body, route = "/specsrelay/v1/enhancement-settings") => {
    const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
    Object.assign(req, { method, socket: { remoteAddress: "127.0.0.1" }, headers: {} });
    let status, data;
    await routes.get(route)(req, {
      writeHead(code) { status = code; }, end(value) { data = JSON.parse(value); }, setHeader() {}
    });
    return { status, data };
  };
  const saved = await call("PUT", laya);
  assert.equal(saved.status, 200);
  await register();
  assert.deepEqual((await call("GET")).data, saved.data);
  assert.equal((await call("PUT", { ...laya, apiKey: "private" })).status, 400);
  assert.deepEqual((await call("GET")).data, saved.data);
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  globalThis.fetch = async (url, request) => {
    assert.equal(url, "http://127.0.0.1:8000/v1/systemone");
    events.push("laya");
    return Response.json(answer(JSON.parse(request.body), 0));
  };
  const longText = Array.from({ length: 600 }, (_, i) =>
    `## User · Turn ${i + 1}\n保留用户原话 ${i + 1}。\n\n## Assistant · Turn ${i + 1}\n你好。\n\n`
  ).join("");
  const organized = await call("POST", { text: longText }, "/specsrelay/v1/organize");
  assert.equal(organized.status, 200, JSON.stringify(organized.data));
  assert.equal(events[0], "plan");
  assert.ok(events.includes("laya"));
  assert.equal(events.at(-1), "specs");
  assert.equal((await call("PUT", off)).status, 200);
  assert.equal((await call("GET")).data.settings.provider, "off");
  events.length = 0;
  assert.equal((await call("POST", { text: longText }, "/specsrelay/v1/organize")).status, 200);
  assert.deepEqual(events, ["specs"]);
  assert.equal((await call("DELETE")).status, 405);
});
