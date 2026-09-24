import assert from "node:assert/strict";
import test from "node:test";
import { createOfficialBrowser } from "../lib/official-browser-client.js";
import { officialCapture } from "../lib/official-capture.js";

function harness({ acquire, fail = false, silent = false } = {}) {
  const released = [];
  const elements = [];
  const expressions = [];
  class Guest extends EventTarget {
    style = {};
    attributes = {};
    url = "about:blank";
    setAttribute(name, value) { this.attributes[name] = value; }
    getURL() { return this.url; }
    clearHistory() { this.historyCleared = true; }
    remove() { this.removed = true; }
    reload() { queueMicrotask(() => this.dispatchEvent(new Event("dom-ready"))); }
    async loadURL(url) {
      this.url = url;
      if (silent) return;
      queueMicrotask(() => {
        const event = new Event(fail ? "did-fail-load" : "dom-ready");
        Object.assign(event, { isMainFrame: true, errorCode: -105 });
        this.dispatchEvent(event);
      });
    }
    async executeJavaScript(expression) { expressions.push(expression); return { messages: [] }; }
  }
  const bridge = {
    acquire: acquire || (async () => ({ lease: "lease-1", partition: "approved-partition" })),
    release: async (lease) => { released.push(lease); },
    onOpenRequested: () => () => {}
  };
  const document = { createElement(name) { assert.equal(name, "webview"); const guest = new Guest(); elements.push(guest); return guest; } };
  const container = { append(guest) { queueMicrotask(() => guest.dispatchEvent(new Event("dom-ready"))); } };
  const browser = createOfficialBrowser(bridge, {
    document, request: async () => ({ expression: "({messages: []})" }), onError: () => {}, timeoutMs: 50
  });
  return { browser, container, elements, released, expressions };
}

test("official browser uses an approved lease and shares capture without Node or preload access", async () => {
  const h = harness();
  await h.browser.start(h.container, "/project");
  const guest = h.elements[0];
  assert.equal(guest.attributes.partition, "approved-partition");
  assert.equal(guest.attributes.src, "about:blank#lease-1");
  assert.equal(guest.attributes.preload, undefined);
  assert.equal(guest.attributes.nodeintegration, undefined);
  assert.equal(guest.getURL(), "https://chat.deepseek.com/");
  await h.browser.capture();
  assert.match(h.expressions[0], /location.origin !== "https:\/\/chat.deepseek.com"/);
  guest.url = "https://example.com/";
  await assert.rejects(h.browser.capture(), /先在左侧打开 DeepSeek/);
  assert.equal(h.expressions.length, 1);
  await h.browser.dispose();
  assert.deepEqual(h.released, ["lease-1"]);
  assert.equal(guest.removed, true);
});

test("closing during acquisition releases the late reservation without attaching it", async () => {
  let resolve;
  const h = harness({ acquire: () => new Promise(r => { resolve = r; }) });
  const start = h.browser.start(h.container, "/project");
  const rejection = assert.rejects(start, /已关闭/);
  const dispose = h.browser.dispose();
  resolve({ lease: "late", partition: "approved" });
  await Promise.all([dispose, rejection]);
  assert.equal(h.elements.length, 0);
  assert.deepEqual(h.released, ["late"]);
});

test("failed and timed out guest loads release their reservations", async () => {
  for (const options of [{ fail: true }, { silent: true }]) {
    const h = harness(options);
    await assert.rejects(h.browser.start(h.container, "/project"), /加载失败|加载超时/);
    assert.deepEqual(h.released, ["lease-1"]);
    await h.browser.dispose();
    assert.equal(h.released.length, 1);
  }
});

test("closing during load cancels promptly and releases exactly once", async () => {
  const h = harness({ silent: true });
  const start = h.browser.start(h.container, "/project");
  const rejected = assert.rejects(start, /已关闭/);
  await new Promise(r => setImmediate(r));
  await h.browser.dispose();
  await rejected;
  assert.deepEqual(h.released, ["lease-1"]);
});

test("official capture validates page evidence and preserves structured turns", () => {
  const raw = { url: "https://chat.deepseek.com/a/chat/s/example", title: "需求",
    messages: [{ role: "user", content: "目标", turnIndex: 0 }, { role: "assistant", content: "验收", turnIndex: 0 }] };
  const result = officialCapture(raw, true);
  assert.equal(result.messageCount, 2);
  assert.match(result.transcript, /## Assistant · Turn 1\n验收/);
  assert.deepEqual(result.messages.map(m => m.content), ["目标", "验收"]);
  for (const url of ["https://evil.example/", "https://chat.deepseek.com.evil.example/", "https://user:pass@chat.deepseek.com/"]) {
    assert.throws(() => officialCapture({ ...raw, url }), /只能读取/);
  }
  assert.throws(() => officialCapture({ ...raw, messages: [{ role: "system", content: "x" }] }), /消息无效/);
  assert.throws(() => officialCapture({ ...raw, messages: [{ role: "user", content: "x".repeat(500001) }] }), /过长/);
  assert.throws(() => officialCapture({ ...raw, messages: [] }), /没有检测到对话/);
});
