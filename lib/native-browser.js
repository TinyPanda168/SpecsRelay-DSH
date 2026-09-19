import { randomUUID } from "node:crypto";

const DEEPSEEK_URL = "https://chat.deepseek.com/";
const MAX_PANEL_SIZE = 20000;

/*
 * The progressive scrolling, virtualized-turn hydration, stable-key
 * deduplication, and structured text extraction below are adapted from the
 * SpecsRelay Capture Engine, which is derived from AI Chat Exporter.
 * Upstream commit: 3253d7696a112204137c4c3a1843a3c7d20e14b9 (MIT).
 */
export const DEEPSEEK_CAPTURE_EXPRESSION = String.raw`(async () => {
  const TOP_LOAD_ATTEMPTS = 16;
  const SWEEP_ATTEMPTS = 100;
  const TOP_LOAD_DELAY = 260;
  const SWEEP_DELAY = 180;
  const RECOVERY_DELAY = 320;
  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const normalize = (value) => String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  const safeQueryAll = (root, selectors) => {
    const found = [];
    const unique = new Set();
    for (const selector of selectors) {
      try {
        for (const element of root.querySelectorAll(selector)) {
          if (!unique.has(element)) {
            unique.add(element);
            found.push(element);
          }
        }
      } catch {}
    }
    return found;
  };
  const codeFence = (content) => {
    const marker = String.fromCharCode(96);
    const runs = String(content ?? "").match(new RegExp(marker + "+", "g")) ?? [];
    return marker.repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
  };
  const extractStructuredText = (element, selector) => {
    if (!element) return "";
    const target = selector ? element.querySelector(selector) ?? element : element;
    const clone = target.cloneNode(true);
    clone.querySelectorAll("button,svg,style,script,textarea,input,[aria-hidden='true']")
      .forEach((node) => node.remove());
    clone.querySelectorAll("pre").forEach((pre) => {
      const code = pre.querySelector("code") ?? pre;
      const content = String(code.innerText ?? code.textContent ?? "").replace(/\r\n/g, "\n").trimEnd();
      if (!content) {
        pre.remove();
        return;
      }
      const language = String(code.getAttribute("class") ?? "")
        .match(/language-([\w+-]+)/i)?.[1] ?? "";
      const fence = codeFence(content);
      pre.replaceWith("\n" + fence + language + "\n" + content + "\n" + fence + "\n");
    });
    clone.querySelectorAll("code").forEach((code) => {
      const content = normalize(code.textContent);
      const marker = String.fromCharCode(96);
      code.replaceWith(content ? marker + content + marker : "");
    });
    clone.querySelectorAll("ol,ul").forEach((list) => {
      const ordered = list.tagName === "OL";
      const items = [...list.children].filter((child) => child.tagName === "LI");
      const content = items.map((item, index) =>
        (ordered ? String(index + 1) + "." : "-") + " " + normalize(item.innerText ?? item.textContent)
      ).join("\n");
      if (content) list.replaceWith("\n" + content + "\n");
    });
    clone.querySelectorAll("img").forEach((image) => {
      const url = image.currentSrc || image.src || image.getAttribute("data-src") || "";
      const label = normalize(image.alt) || "Image";
      image.replaceWith(url && !url.startsWith("data:") ? "\n![" + label + "](" + url + ")\n" : "");
    });
    return normalize(clone.innerText ?? clone.textContent);
  };
  const root = document.querySelector(".ds-virtual-list.ds-virtual-list--printable")
    || document.querySelector(".ds-virtual-list")
    || document.querySelector("main")
    || document.body;
  let scroller = document.querySelector(".ds-virtual-list.ds-scroll-area")
    || document.querySelector(".ds-virtual-list")
    || root;
  while (scroller && scroller !== document.body) {
    const style = getComputedStyle(scroller);
    if (style.overflowY === "auto" || style.overflowY === "scroll" || scroller.scrollHeight > scroller.clientHeight + 32) break;
    scroller = scroller.parentElement;
  }
  scroller = scroller || document.scrollingElement || document.documentElement;
  const originalTop = scroller.scrollTop;
  const originalMaxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const wasNearBottom = originalTop >= originalMaxTop - 48;
  const messages = new Map();
  const seenKeys = new Set();
  const scan = () => {
    const turns = safeQueryAll(root, ["[data-virtual-list-item-key]"]);
    turns.forEach((turn, index) => {
      const assistant = turn.querySelector(".ds-assistant-message-main-content");
      const user = assistant ? null : turn.querySelector(".ds-message");
      const role = assistant ? "assistant" : user ? "user" : "";
      if (!role) return;
      const virtualKey = turn.getAttribute("data-virtual-list-item-key") || String(index);
      const numericKey = Number.parseInt(virtualKey, 10);
      const turnIndex = Number.isFinite(numericKey)
        ? Math.max(0, Math.floor((numericKey - 1) / 2))
        : Math.floor(index / 2);
      const key = "deepseek:" + virtualKey;
      seenKeys.add(key);
      const content = extractStructuredText(
        turn,
        role === "assistant" ? ".ds-assistant-message-main-content" : ".ds-message"
      );
      if (!content) return;
      const previous = messages.get(key);
      if (!previous || content.length > previous.content.length) {
        messages.set(key, {
          key,
          role,
          content,
          turnIndex,
          order: Number.isFinite(numericKey) ? numericKey : index
        });
      }
    });
  };
  const sweep = async (ratio, delay) => {
    let stalled = 0;
    let previousTop = -1;
    for (let attempt = 0; attempt < SWEEP_ATTEMPTS; attempt += 1) {
      scan();
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (scroller.scrollTop >= maxTop - 2) break;
      const increment = Math.max(240, Math.floor((scroller.clientHeight || innerHeight) * ratio));
      scroller.scrollTop = Math.min(maxTop, scroller.scrollTop + increment);
      await sleep(delay);
      if (scroller.scrollTop === previousTop) {
        stalled += 1;
        if (stalled >= 3) break;
      } else {
        stalled = 0;
      }
      previousTop = scroller.scrollTop;
    }
    scan();
  };
  try {
    scan();
    let previousHeight = scroller.scrollHeight;
    let stable = 0;
    for (let attempt = 0; attempt < TOP_LOAD_ATTEMPTS; attempt += 1) {
      scroller.scrollTop = 0;
      await sleep(TOP_LOAD_DELAY);
      const height = scroller.scrollHeight;
      if (height > previousHeight) {
        previousHeight = height;
        stable = 0;
      } else if (++stable >= 2) {
        break;
      }
    }
    await sweep(0.78, SWEEP_DELAY);
    if ([...seenKeys].some((key) => !messages.has(key))) {
      scroller.scrollTop = 0;
      await sleep(RECOVERY_DELAY);
      await sweep(0.4, RECOVERY_DELAY);
    }
    return {
      title: normalize(document.title).replace(/\s*-\s*DeepSeek\s*$/i, "") || "当前 DeepSeek 网页对话",
      url: location.href,
      messages: [...messages.values()].sort((left, right) => left.order - right.order)
    };
  } finally {
    const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTop = wasNearBottom ? maxTop : Math.min(originalTop, maxTop);
  }
})()`;

const DEEPSEEK_SEND_FUNCTION = String.raw`async ({ text, expectedUrl, marker }) => {
  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const conversationUrl = (value) => {
    const url = new URL(value);
    return url.origin + url.pathname.replace(/\/$/, "");
  };
  if (conversationUrl(location.href) !== expectedUrl) {
    throw new Error("当前不是开始澄清时的 DeepSeek 对话，请切回原对话。");
  }
  const existing = [...document.querySelectorAll(".ds-message")]
    .some((element) => String(element.innerText ?? element.textContent ?? "").includes(marker));
  if (existing) return { alreadySent: true, sent: false, url: location.href };
  const editor = document.querySelector("textarea[placeholder*='DeepSeek']")
    || document.querySelector("textarea")
    || document.querySelector("[contenteditable='true']");
  if (!editor) throw new Error("没有找到 DeepSeek 输入框，请刷新网页后重试。");
  editor.focus();
  if ("value" in editor) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(editor), "value")?.set;
    if (setter) setter.call(editor, text);
    else editor.value = text;
  } else {
    editor.textContent = text;
  }
  const InputEventClass = globalThis.InputEvent || Event;
  editor.dispatchEvent(new InputEventClass("input", {
    bubbles: true,
    data: text,
    inputType: "insertText"
  }));
  editor.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(80);
  let scope = editor.parentElement;
  let buttons = [];
  for (let depth = 0; depth < 7 && scope; depth += 1) {
    buttons = [...scope.querySelectorAll("button,[role='button']")].filter((button) =>
      !button.disabled
      && button.getAttribute("aria-disabled") !== "true"
      && button.getClientRects().length > 0
    );
    if (buttons.length >= 2) break;
    scope = scope.parentElement;
  }
  const send = buttons.find((button) =>
    /发送|send/i.test([
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.textContent
    ].filter(Boolean).join(" "))
  ) || buttons.at(-1);
  if (!send) throw new Error("没有找到 DeepSeek 发送按钮，请刷新网页后重试。");
  send.click();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(100);
    const current = "value" in editor ? editor.value : editor.textContent;
    const appeared = [...document.querySelectorAll(".ds-message")]
      .some((element) => String(element.innerText ?? element.textContent ?? "").includes(marker));
    if (!String(current ?? "").trim() || appeared) {
      return { alreadySent: false, sent: true, url: location.href };
    }
  }
  throw new Error("DeepSeek 没有发送问题，请重试。");
}`;

export function buildDeepSeekSendExpression({ text, expectedUrl, marker }) {
  return `(${DEEPSEEK_SEND_FUNCTION})(${JSON.stringify({ text, expectedUrl, marker })})`;
}

function conversationRecord(value, includeMessages = false) {
  const messages = Array.isArray(value?.messages) ? value.messages : [];
  if (messages.length === 0) {
    throw new Error("没有检测到对话");
  }
  const transcript = messages
    .map((message, index) => {
      const role = message.role === "assistant" ? "Assistant" : "User";
      const turn = Number.isInteger(message.turnIndex)
        ? message.turnIndex + 1
        : Math.floor(index / 2) + 1;
      return `## ${role} · Turn ${turn}\n${String(message.content || "").trim()}`;
    })
    .join("\n\n");
  return {
    requestId: randomUUID(),
    captureId: `desktop-native-${randomUUID()}`,
    capturedAt: new Date().toISOString(),
    provider: "DeepSeek",
    title: String(value.title || "当前 DeepSeek 网页对话").slice(0, 500),
    url: String(value.url || ""),
    messageCount: messages.length,
    ...(includeMessages ? {
      messages: messages.map((message) => ({
        role: message.role,
        content: String(message.content || "").trim()
      }))
    } : {}),
    transcript
  };
}

function normalizedBounds(value) {
  const bounds = {};
  for (const name of ["x", "y", "width", "height"]) {
    const number = Number(value?.[name]);
    if (!Number.isInteger(number) || number < 0 || number > MAX_PANEL_SIZE) {
      throw new Error(`DeepSeek 网页区域 ${name} 无效。`);
    }
    bounds[name] = number;
  }
  if (bounds.width === 0 || bounds.height === 0) {
    throw new Error("DeepSeek 网页区域尚未准备完成。");
  }
  return bounds;
}

class DesktopBrowserHost {
  constructor(webPanels) {
    this.panel = webPanels.register({
      id: "specsrelay-deepseek",
      url: DEEPSEEK_URL,
      allowedOrigins: ["https://chat.deepseek.com"]
    });
  }

  status() {
    const status = this.panel.status();
    return {
      state: status.state,
      mode: "native",
      url: status.url,
      ...(status.error ? { error: status.error } : {})
    };
  }

  async ensureReady({ reload = false } = {}) {
    if (reload) await this.panel.reload();
    else await this.panel.ready();
    return this.status();
  }

  async setLayout(value) {
    if (value?.visible === false) {
      this.panel.hide();
      return this.status();
    }
    await this.panel.show(normalizedBounds(value));
    return this.status();
  }

  async capture({ includeMessages = false } = {}) {
    return conversationRecord(
      await this.panel.evaluate(DEEPSEEK_CAPTURE_EXPRESSION),
      includeMessages
    );
  }

  async sendMessage(value) {
    return this.panel.evaluate(buildDeepSeekSendExpression(value));
  }

  async close() {
    await this.panel.dispose();
  }
}

class UnsupportedBrowserHost {
  status() {
    return {
      state: "unavailable",
      mode: "webui",
      error: "请使用支持 SpecsRelay 的 DSH 桌面客户端。"
    };
  }

  async ensureReady() {
    throw new Error(this.status().error);
  }

  async setLayout() {
    return this.status();
  }

  async capture() {
    throw new Error(this.status().error);
  }

  async sendMessage() {
    throw new Error(this.status().error);
  }

  async close() {}
}

/** Browser host whose native implementation may arrive after this plugin loads. */
export class SwitchableDesktopBrowserHost {
  constructor(webPanels, resolveWebPanels) {
    this.webPanels = webPanels;
    this.resolveWebPanels = resolveWebPanels;
    this.current = createDesktopBrowserHost(webPanels);
  }

  ensureAttached() {
    if (this.webPanels || !this.resolveWebPanels) return;
    const webPanels = this.resolveWebPanels();
    if (webPanels) this.attach(webPanels);
  }

  status() {
    this.ensureAttached();
    return this.current.status();
  }

  ensureReady(options) {
    this.ensureAttached();
    return this.current.ensureReady(options);
  }

  setLayout(value) {
    this.ensureAttached();
    return this.current.setLayout(value);
  }

  capture(options) {
    this.ensureAttached();
    return this.current.capture(options);
  }

  sendMessage(value) {
    this.ensureAttached();
    return this.current.sendMessage(value);
  }

  attach(webPanels) {
    if (this.webPanels === webPanels) return async () => {};
    const next = createDesktopBrowserHost(webPanels);
    const previous = this.current;
    this.webPanels = webPanels;
    this.current = next;
    void previous.close().catch(() => {});
    let active = true;
    return async () => {
      if (!active) return;
      active = false;
      if (this.current !== next) return;
      this.webPanels = undefined;
      this.current = createDesktopBrowserHost();
      await next.close();
    };
  }

  async close() {
    const current = this.current;
    this.webPanels = undefined;
    this.current = createDesktopBrowserHost();
    await current.close();
  }
}

export function createDesktopBrowserHost(webPanels) {
  return webPanels
    ? new DesktopBrowserHost(webPanels)
    : new UnsupportedBrowserHost();
}

export function createSwitchableDesktopBrowserHost(webPanels, resolveWebPanels) {
  return new SwitchableDesktopBrowserHost(webPanels, resolveWebPanels);
}
