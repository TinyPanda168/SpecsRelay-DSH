import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDeepSeekSendExpression,
  createDesktopBrowserHost,
  createSwitchableDesktopBrowserHost
} from "../lib/native-browser.js";

test("automatic send expression pins the original conversation and marker", () => {
  const expression = buildDeepSeekSendExpression({
    expectedUrl: "https://chat.deepseek.com/a/chat/s/example-123",
    marker: "【SpecsRelay 澄清 test-marker】",
    text: "问题文本"
  });
  assert.match(expression, /当前不是开始澄清时的 DeepSeek 对话/);
  assert.match(expression, /example-123/);
  assert.match(expression, /SpecsRelay 澄清 test-marker/);
  assert.match(expression, /问题文本/);
});

test("native capture retains structured turns for a delimited clarification return", async () => {
  const expressions = [];
  const host = createDesktopBrowserHost({
    register() {
      return {
        evaluate: async (expression) => {
          expressions.push(expression);
          if (expression.includes("问题文本")) {
            return { alreadySent: false, sent: true,
              url: "https://chat.deepseek.com/a/chat/s/example-123" };
          }
          return {
            title: "产品讨论 - DeepSeek",
            url: "https://chat.deepseek.com/a/chat/s/example-123",
            messages: [
              { role: "user", content: "问题", turnIndex: 0 },
              { role: "assistant", content: "回答", turnIndex: 0 }
            ]
          };
        },
        dispose: async () => {}
      };
    }
  });
  const capture = await host.capture({ includeMessages: true });
  assert.deepEqual(capture.messages, [
    { role: "user", content: "问题" },
    { role: "assistant", content: "回答" }
  ]);
  assert.equal(capture.messageCount, 2);
  assert.match(capture.transcript, /## Assistant · Turn 1\n回答/);
  const regularCapture = await host.capture();
  assert.equal(Object.hasOwn(regularCapture, "messages"), false);
  assert.equal((await host.sendMessage({
    expectedUrl: "https://chat.deepseek.com/a/chat/s/example-123",
    marker: "marker",
    text: "问题文本"
  })).sent, true);
  assert.equal(expressions.length, 3);
});

test("late desktop Web panel service replaces the unsupported browser", async () => {
  let disposed = 0;
  let state = "idle";
  const host = createSwitchableDesktopBrowserHost();
  assert.equal(host.status().state, "unavailable");
  const detach = host.attach({
    register() {
      return {
        status: () => ({ state, url: "https://chat.deepseek.com/" }),
        ready: async () => {
          state = "ready";
          return { state, url: "https://chat.deepseek.com/" };
        },
        show: async () => ({ state: "ready", url: "https://chat.deepseek.com/" }),
        hide() {},
        reload: async () => ({ state: "ready", url: "https://chat.deepseek.com/" }),
        evaluate: async () => ({
          title: "澄清讨论",
          url: "https://chat.deepseek.com/a/chat/s/example-123",
          messages: [{ role: "user", content: "新增决定", turnIndex: 0 }]
        }),
        dispose: async () => { disposed += 1; }
      };
    }
  });
  assert.equal((await host.ensureReady()).state, "ready");
  assert.equal((await host.capture({ includeMessages: true })).messageCount, 1);
  await detach();
  assert.equal(host.status().state, "unavailable");
  assert.equal(disposed, 1);
});

test("browser lazily resolves a desktop service published after plugin startup", async () => {
  let available = false;
  let state = "idle";
  const webPanels = {
    register() {
      return {
        status: () => ({ state, url: "https://chat.deepseek.com/" }),
        ready: async () => {
          state = "ready";
          return { state, url: "https://chat.deepseek.com/" };
        },
        show: async () => ({ state, url: "https://chat.deepseek.com/" }),
        hide() {},
        reload: async () => ({ state, url: "https://chat.deepseek.com/" }),
        evaluate: async () => ({}),
        dispose: async () => {}
      };
    }
  };
  const host = createSwitchableDesktopBrowserHost(
    undefined,
    () => available ? webPanels : undefined
  );
  assert.equal(host.status().state, "unavailable");
  available = true;
  assert.equal((await host.ensureReady()).state, "ready");
  await host.close();
});
