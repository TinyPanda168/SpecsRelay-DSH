import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { apply } from "../index.js";

test("official capture and clarification routes use bounded guest evidence without community browser service", async (t) => {
  const home = await mkdtemp(path.join(tmpdir(), "specsrelay-official-"));
  const previous = process.env.SPECSRELAY_HOME;
  process.env.SPECSRELAY_HOME = home;
  t.after(async () => {
    if (previous === undefined) delete process.env.SPECSRELAY_HOME;
    else process.env.SPECSRELAY_HOME = previous;
    await rm(home, { recursive: true, force: true });
  });
  const routes = new Map();
  const stop = new Error("registered");
  await assert.rejects(apply({
    effect: (run, label) => { run(); if (label.endsWith("WebUI routes")) throw stop; },
    skills: { register() {} },
    agents: { get: () => ({ session: { header: { cwd: "/project" } } }) },
    get() {}, inject() {}, on() {},
    webServer: { register(route) { routes.set(route.path, route.handler); return () => {}; } }
  }), error => error === stop);
  const call = async (route, body, method = "POST", extraHeaders = {}) => {
    const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
    Object.assign(req, { method, socket: { remoteAddress: extraHeaders.origin ? "192.0.2.1" : "127.0.0.1" },
      headers: { "content-type": "application/json", ...extraHeaders } });
    let status = 200, text;
    await routes.get(`/specsrelay/v1/${route}`)(req, {
      writeHead(code) { status = code; }, end(value) { text = value; }, setHeader() {}
    });
    return { status, text, json: () => JSON.parse(text) };
  };
  const capture = { url: "https://chat.deepseek.com/a/chat/s/example", title: "需求",
    messages: [{ role: "user", content: "目标", turnIndex: 0 }] };
  assert.equal((await call("browser/capture", { capture })).json().item.messageCount, 1);
  const large = { ...capture, messages: [{ role: "user", content: "汉".repeat(200000) }] };
  assert.equal((await call("browser/capture", { capture: large })).status, 200);
  assert.equal((await call("browser/capture", { capture: { ...capture, url: "https://example.com" } })).status, 400);
  assert.equal((await call("browser/capture", { capture }, "GET")).status, 405);
  assert.equal((await call("browser/capture", { capture }, "POST", { origin: "https://example.com" })).status, 403);
  assert.equal((await call("browser/capture", { capture, padding: "x".repeat(2100000) })).status, 400);
  assert.ok((await call("browser/script", null, "GET")).json().expression.includes("document"));
  assert.match((await call("official-browser.js", null, "GET")).text, /export function createOfficialBrowser/);
  assert.equal((await call("official-browser.js", null, "POST")).status, 405);
  assert.equal((await call("official-browser.js", null, "GET", { origin: "https://example.com" })).status, 403);
  const begun = await call("clarification/begin", { sessionId: "source", question: "需要账号吗？", capture });
  assert.equal(begun.status, 200, begun.text);
  const { sendExpression, ...baseline } = begun.json();
  assert.match(sendExpression, /需要账号吗/);
  const returned = await call("clarification/result", { sessionId: "source", baseline, capture: {
    ...capture, messages: [...capture.messages,
      { role: "user", content: baseline.promptToCopy }, { role: "assistant", content: "可以先做无账号版本。" }]
  } });
  assert.equal(returned.status, 200, returned.text);
  assert.match(returned.json().prompt, /无账号版本/);
  assert.equal((await call("clarification/result", { sessionId: "another", baseline, capture })).status, 400);
});
