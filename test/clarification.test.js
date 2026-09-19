import assert from "node:assert/strict";
import test from "node:test";
import {
  beginClarification,
  collectClarification,
  suggestClarificationQuestion
} from "../lib/clarification.js";

const sourceUrl = "https://chat.deepseek.com/a/chat/s/example-123";
const original = [
  { role: "user", content: "做一个应用" },
  { role: "assistant", content: "可以先做基础版本" }
];

function started() {
  return beginClarification({
    sessionId: "dsh-session",
    projectPath: "/project",
    question: "第一版需要账号吗？",
    capture: { url: sourceUrl, messages: original }
  });
}

test("suggests an assistant question but not a tool or user instruction", () => {
  assert.equal(suggestClarificationQuestion([
    { role: "assistant", content: [{ type: "text", text: "介绍。\n\n请确认第一版要账号吗？" }] },
    { role: "tool", content: [{ type: "text", text: "不要发问" }] }
  ]), "请确认第一版要账号吗？");
  assert.equal(suggestClarificationQuestion([
    { role: "assistant", content: [{ type: "text", text: "已完成。" }] }
  ]), "");
});

test("returns only appended discussion and labels assistant ideas as unconfirmed", () => {
  const baseline = started();
  const result = collectClarification({
    baseline,
    capture: { url: sourceUrl, messages: [
      ...original,
      { role: "user", content: baseline.promptToCopy },
      { role: "assistant", content: "可以做真实账号或本地切换。" },
      { role: "user", content: "确认第一版只做本地切换，不做真实账号。" }
    ] }
  });
  assert.equal(result.sessionId, "dsh-session");
  assert.equal(result.projectPath, "/project");
  assert.equal(result.newMessageCount, 3);
  assert.match(result.prompt, /确认第一版只做本地切换/);
  assert.match(result.prompt, /DeepSeek 的建议、推测和未获我确认的选项不能自动视为决定/);
  assert.doesNotMatch(result.prompt, /做一个应用/);
  assert.doesNotMatch(result.prompt, /可以先做基础版本/);
});

test("ignores DeepSeek presentation disclaimers added to existing assistant turns", () => {
  const baseline = started();
  const result = collectClarification({
    baseline,
    capture: { url: sourceUrl, messages: [
      original[0],
      {
        ...original[1],
        content: `${original[1].content}\n\n本回答由 AI 生成，内容仅供参考，请仔细甄别`
      },
      { role: "user", content: baseline.promptToCopy },
      {
        role: "assistant",
        content: "建议先做本地切换。\n\n内容由 AI 生成，请仔细甄别"
      }
    ] }
  });
  assert.equal(result.newMessageCount, 2);
  assert.match(result.prompt, /建议先做本地切换/);
  assert.doesNotMatch(result.prompt, /AI 生成/);
});

test("rejects a different chat, missing marker, or incomplete new exchange", () => {
  const baseline = started();
  const added = [
    { role: "user", content: baseline.promptToCopy },
    { role: "assistant", content: "方案 A" }
  ];
  assert.throws(() => collectClarification({ baseline,
    capture: { url: "https://chat.deepseek.com/a/chat/s/other", messages: [...original, ...added] }
  }), /不是开始澄清时/);
  assert.throws(() => collectClarification({ baseline,
    capture: { url: sourceUrl, messages: [...original, { role: "user", content: baseline.promptToCopy }] }
  }), /还没有检测到/);
  assert.throws(() => collectClarification({ baseline,
    capture: { url: sourceUrl, messages: [...original, { role: "user", content: "无关对话" }, added[1]] }
  }), /还没有检测到/);
});

test("accepts the marked exchange when DeepSeek hydrates more old turns", () => {
  const baseline = started();
  const result = collectClarification({
    baseline,
    capture: { url: sourceUrl, messages: [
      { role: "user", content: "较早的动态加载消息" },
      { role: "assistant", content: "较早的回复" },
      ...original,
      { role: "user", content: baseline.promptToCopy },
      { role: "assistant", content: "建议先验证最小闭环。" }
    ] }
  });
  assert.equal(result.newMessageCount, 2);
  assert.doesNotMatch(result.prompt, /较早的动态加载消息/);
  assert.match(result.prompt, /建议先验证最小闭环/);
});

test("excludes an old assistant turn reordered after the new marker", () => {
  const baseline = started();
  const result = collectClarification({
    baseline,
    capture: { url: sourceUrl, messages: [
      original[0],
      { role: "user", content: baseline.promptToCopy },
      original[1],
      { role: "assistant", content: "建议先做最小闭环，再决定是否扩展。" }
    ] }
  });
  assert.equal(result.newMessageCount, 2);
  assert.doesNotMatch(result.prompt, /可以先做基础版本/);
  assert.match(result.prompt, /建议先做最小闭环/);
});

test("requires an existing DeepSeek conversation and excludes likely credentials", () => {
  assert.throws(() => beginClarification({ sessionId: "s", projectPath: "/project",
    question: "问题？", capture: { url: "https://chat.deepseek.com/", messages: original }
  }), /打开要继续讨论的原对话/);
  assert.throws(() => beginClarification({ sessionId: "s", projectPath: "/project",
    question: "api key: sk-12345678901234567890", capture: { url: sourceUrl, messages: original }
  }), /可能包含密钥/);
});
