import assert from "node:assert/strict";
import test from "node:test";
import {
  continuationChunks,
  continuationPrompt,
  continuationTranscript,
  parseContinuationPacket
} from "../lib/continuation.js";
import { continuationStatus, prepareContinuation } from "../index.js";

const packet = {
  goal: "完成项目功能",
  confirmed_decisions: ["只修改当前项目"],
  completed: ["已完成设计"],
  in_progress: [],
  next_steps: ["核对工作树后实现"],
  open_questions: [],
  project_facts_to_verify: ["检查已有测试"]
};

function context(messages, { status = "idle", used = 800, capacity = 1000 } = {}) {
  let calls = 0;
  const session = {
    header: { cwd: "/project" },
    requestHeader: () => ({ config: { provider: "test", model: "model" } }),
    deriveMessages: () => messages
  };
  const agent = { session, status, options: { provider: "test", model: "model" } };
  return {
    streamCalls: () => calls,
    agents: { get: () => agent },
    get: (name) => name === "tokenMeter"
      ? { measure: () => ({ totalTokens: used }) }
      : undefined,
    llm: {
      listProviders: () => [{ id: "test" }],
      resolveModelInfo: async () => ({ context: { contextWindow: capacity } }),
      async *stream() {
        calls += 1;
        yield { type: "text-delta", index: 0, text: JSON.stringify(packet) };
        yield { type: "finish", reason: "stop" };
      }
    }
  };
}

const messages = [
  { role: "user", content: [{ type: "text", text: "请做这个功能" }] },
  { role: "assistant", content: [{ type: "text", text: "我已完成设计" }] },
  { role: "tool", content: [{ type: "text", text: "SECRET" }] }
];

test("continuation transcript excludes tool output and chunks without dropping the middle", () => {
  const source = continuationTranscript(messages);
  assert.match(source, /请做这个功能/);
  assert.doesNotMatch(source, /SECRET/);
  assert.equal(continuationChunks(source, 8).join(""), source);
});

test("continuation keeps compaction checkpoints but excludes injected instructions", () => {
  const transcript = continuationTranscript([
    { role: "user", source: { kind: "plugin", plugin: "agent-instructions" }, content: [{ type: "text", text: "hidden instructions" }] },
    { role: "user", source: { kind: "plugin", plugin: "compact" }, content: [{ type: "text", text: "earlier confirmed goal" }] },
    { role: "user", source: { kind: "user" }, content: [{ type: "text", text: "continue now" }] }
  ]);
  assert.doesNotMatch(transcript, /hidden instructions/);
  assert.match(transcript, /\[context checkpoint\]\nearlier confirmed goal/);
  assert.match(transcript, /\[user\]\ncontinue now/);
});

test("continuation packet rejects missing next step and produces a verify-first prompt", () => {
  const parsed = parseContinuationPacket(JSON.stringify(packet));
  assert.match(continuationPrompt(parsed, "old", "/project"), /先只读核对项目现状/);
  assert.throws(
    () => parseContinuationPacket(JSON.stringify({ ...packet, next_steps: [] })),
    /没有明确下一步/
  );
  assert.throws(
    () => parseContinuationPacket(JSON.stringify({
      ...packet,
      completed: ["sk-abcdefghijklmnopqrstuvwxyz123456"]
    })),
    /可能含有密钥/
  );
});

test("80 percent is a soft recommendation, not a prerequisite", async () => {
  const ready = await continuationStatus(context(messages), { sessionId: "old" });
  assert.equal(ready.available, true);
  assert.equal(ready.recommended, true);
  const low = await continuationStatus(context(messages, { used: 200 }), { sessionId: "old" });
  assert.equal(low.available, true);
  assert.equal(low.recommended, false);
  const compacted = await continuationStatus(
    context(messages, { used: 200 }),
    { sessionId: "old" },
    true
  );
  assert.equal(compacted.recommended, true);
  assert.equal(compacted.recommendationReason, "compaction");
});

test("preparation requires an idle source and returns a scoped handoff", async () => {
  await assert.rejects(
    prepareContinuation(context(messages, { status: "running" }), { sessionId: "old" }),
    /仍在运行/
  );
  const result = await prepareContinuation(context(messages), { sessionId: "old" });
  assert.equal(result.projectPath, "/project");
  assert.deepEqual(result.packet, packet);
  assert.match(result.prompt, /旧会话 ID：old/);
});

test("long sessions are summarized in chunks and merged without dropping source text", async () => {
  const longMessages = [{
    role: "user",
    content: [{ type: "text", text: "项目背景".repeat(4000) }]
  }];
  const ctx = context(longMessages, { capacity: 8000 });
  const result = await prepareContinuation(ctx, { sessionId: "old" });
  assert.equal(result.packet.goal, packet.goal);
  assert.ok(ctx.streamCalls() >= 3);
});
