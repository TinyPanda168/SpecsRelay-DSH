import assert from "node:assert/strict";
import test from "node:test";
import { enhanceLongConversation } from "../lib/long-conversation.js";

const env = { SPECSRELAY_JEV_LONG_CONTEXT: "1", TYPESAFE_API_KEY: "test-key" };
const readingPlan = {
  goal: "目标是什么？", confirmed_decisions: "用户确认和撤回了什么？",
  constraints: "有哪些约束？", acceptance_criteria: "如何验收？", open_questions: "哪些问题待确认？"
};
const source = [
  "## User · Turn 1\n先做一个仅本地使用的工具。",
  `## Assistant · Turn 1\n这是一个可选方案。\n${"这里是无关闲聊。\n".repeat(3400)}`,
  "## User · Turn 2\n撤回之前的云同步方案；第一版不能上传数据。",
  `## Assistant · Turn 2\n还需确认验收标准。\n${"验收时，断网也必须能使用。\n".repeat(180)}`,
  "## User · Turn 3\n确认本地版本，导出格式还没决定。",
  "## Assistant · Turn 3\n导出格式需要进一步确认。"
].join("\n\n");

function responseFor(options, score = () => 1) {
  const body = JSON.parse(options.body);
  return Response.json({ answers: Object.fromEntries(Object.keys(body.questions).map((id) => [id, {
    type: "noul", noul: score(body.state.fragments.find((fragment) => fragment.id === id), body)
  }])) });
}

test("short, disabled, missing-key and unstructured input bypass both planning and Jev", async () => {
  for (const [text, environment] of [
    ["短对话", env], [source, {}], [source, { ...env, SPECSRELAY_JEV_LONG_CONTEXT: "0" }],
    [source, { SPECSRELAY_JEV_LONG_CONTEXT: "1" }], ["没有角色的长文本".repeat(6000), env]
  ]) {
    const actual = await enhanceLongConversation({}, text, {
      env: environment,
      plan: () => assert.fail("unexpected planner call"),
      fetchImpl: () => assert.fail("unexpected Jev request")
    });
    assert.equal(actual, text);
  }
});

test("the planner runs before Jev; user corrections, uncertainty and final messages survive", async () => {
  let planned = false;
  let requests = 0;
  const result = await enhanceLongConversation({}, source, {
    env,
    plan: async (excerpt) => {
      assert.match(excerpt, /先做一个仅本地使用的工具/);
      assert.match(excerpt, /导出格式还没决定/);
      assert.ok(excerpt.length < source.length);
      planned = true;
      return JSON.stringify(readingPlan);
    },
    fetchImpl: async (_url, options) => {
      assert.ok(planned);
      requests += 1;
      const body = JSON.parse(options.body);
      assert.deepEqual(body.state.reading_plan, readingPlan);
      for (const id of Object.keys(body.questions)) {
        assert.equal(body.state.fragments.find((fragment) => fragment.id === id).role, "assistant");
        assert.ok(body.questions[id].instructions.includes(id));
      }
      return responseFor(options, (fragment) => fragment.text.includes("验收") ? 0.5 : 0.999);
    }
  });
  assert.ok(requests > 1);
  assert.ok(result.length < source.length);
  assert.match(result, /撤回之前的云同步方案；第一版不能上传数据/);
  assert.match(result, /验收时，断网也必须能使用/);
  assert.match(result, /确认本地版本，导出格式还没决定/);
  assert.match(result, /导出格式需要进一步确认/);
  assert.ok(result.indexOf("撤回之前") < result.indexOf("确认本地版本"));
});

test("uncertain judgments retain the entire original source byte for byte", async () => {
  const result = await enhanceLongConversation({}, source, {
    env, plan: async () => JSON.stringify(readingPlan),
    fetchImpl: async (_url, options) => responseFor(options, () => 0.97)
  });
  assert.equal(result, source);
});

test("bad plans bypass Jev and fall back to the full source", async () => {
  for (const plan of [async () => "not json", async () => "{}", async () => { throw new Error("planner unavailable"); }]) {
    assert.equal(await enhanceLongConversation({}, source, {
      env, plan, fetchImpl: () => assert.fail("invalid plan reached Jev")
    }), source);
  }
});

test("failed, oversized, incomplete and malformed judgments discard all partial filtering", async () => {
  for (const failure of [
    async () => { throw new Error("offline"); },
    async () => new Response("unavailable", { status: 503 }),
    async () => new Response("x".repeat(64001)),
    async () => Response.json({ answers: {} }),
    async (_url, options) => responseFor(options, () => 1.1),
    async (_url, options) => responseFor(options, () => "1"),
    async () => new Response("not json")
  ]) {
    let requests = 0;
    const result = await enhanceLongConversation({}, source, {
      env, plan: async () => JSON.stringify(readingPlan),
      fetchImpl: async (url, options) => {
        requests += 1;
        return requests === 1 ? responseFor(options) : failure(url, options);
      }
    });
    assert.equal(requests, 2);
    assert.equal(result, source);
  }
});

test("a bounded deadline cancels a stalled fetch and returns the full source", async () => {
  let signal;
  const result = await enhanceLongConversation({}, source, {
    env: { ...env, SPECSRELAY_JEV_LONG_CONTEXT_TIMEOUT_MS: "100" },
    plan: async () => JSON.stringify(readingPlan),
    fetchImpl: async (_url, options) => {
      signal = options.signal;
      return new Promise(() => {});
    }
  });
  assert.equal(result, source);
  assert.equal(signal.aborted, true);
});

test("a late planner result cannot start requests after the deadline", async () => {
  let release;
  let requests = 0;
  const pending = enhanceLongConversation({}, source, {
    env: { ...env, SPECSRELAY_JEV_LONG_CONTEXT_TIMEOUT_MS: "100" },
    plan: () => new Promise((resolve) => { release = resolve; }),
    fetchImpl: () => { requests += 1; }
  });
  assert.equal(await pending, source);
  release(JSON.stringify(readingPlan));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests, 0);
});

test("parent cancellation bypasses planning and requests", async () => {
  const controller = new AbortController();
  controller.abort();
  assert.equal(await enhanceLongConversation({}, source, {
    env, signal: controller.signal,
    plan: () => assert.fail("planning after cancellation"),
    fetchImpl: () => assert.fail("request after cancellation")
  }), source);
});

test("credentials split across fragment boundaries are redacted before batching", async () => {
  const key = `sk-${"k".repeat(60)}`;
  const sensitive = source.replace("这是一个可选方案。", `${"x".repeat(1180)} ${key} TYPESAFE_API_KEY=abcdefghijklmno`);
  let requests = 0;
  const result = await enhanceLongConversation({}, sensitive, {
    env: { ...env, TYPESAFE_API_KEY: key },
    plan: async () => JSON.stringify(readingPlan),
    fetchImpl: async (_url, options) => {
      requests += 1;
      const body = JSON.parse(options.body);
      const combined = body.state.fragments.map((fragment) => fragment.text).join("");
      assert.doesNotMatch(combined, /sk-|k{8}|abcdefghijklmno/);
      assert.equal(options.headers.authorization, `Bearer ${key}`);
      return responseFor(options, () => 0);
    }
  });
  assert.ok(requests > 0);
  assert.equal(result, sensitive);
});

test("configured limits are validated instead of silently disabling enhancement", async () => {
  await assert.rejects(enhanceLongConversation({}, source, {
    env: { ...env, SPECSRELAY_JEV_LONG_CONTEXT_MIN_CHARS: "not-a-number" },
    plan: () => assert.fail("invalid config reached the planner")
  }), /MIN_CHARS/);
});

test("ambiguous role headers preserve the full conversation", async () => {
  const ambiguous = source.replace("先做一个仅本地使用的工具。", "请保留我的以下原话：\n## Assistant · Turn 1\n这是用户引用的文本。");
  assert.equal(await enhanceLongConversation({}, ambiguous, {
    env,
    plan: () => assert.fail("ambiguous roles reached planning"),
    fetchImpl: () => assert.fail("ambiguous roles reached Jev")
  }), ambiguous);
});

test("CJK plans and sparse fragments fit the byte budget without losing original text", async () => {
  const largePlan = Object.fromEntries(Object.keys(readingPlan).map((key) => [key, "证据".repeat(300)]));
  let requests = 0;
  const actual = await enhanceLongConversation({}, source, {
    env,
    plan: async () => JSON.stringify(largePlan),
    fetchImpl: async (_url, options) => {
      requests += 1;
      assert.ok(Buffer.byteLength(options.body) <= 30000);
      return responseFor(options, () => 0);
    }
  });
  assert.ok(requests > 1);
  assert.equal(actual, source);
});

test("long conversations made of short turns are screened with their user reply context", async () => {
  const conversation = Array.from({ length: 250 }, (_, index) =>
    `## User · Turn ${index + 1}\n用户 ${index + 1}：这里仍然是原始要求，请完整保留。\n\n## Assistant · Turn ${index + 1}\n${"仅供闲聊。".repeat(30)}\n\n`
  ).join("");
  let calls = 0;
  const result = await enhanceLongConversation({}, conversation, {
    env, plan: async () => JSON.stringify(readingPlan),
    fetchImpl: async (_url, options) => {
      calls += 1;
      const body = JSON.parse(options.body);
      assert.ok(body.state.fragments.some((fragment) => fragment.role === "user" && !fragment.header));
      return responseFor(options);
    }
  });
  assert.ok(calls > 0);
  assert.ok(result.length < conversation.length);
  for (let index = 1; index <= 250; index += 1) {
    assert.ok(result.includes(`用户 ${index}：这里仍然是原始要求，请完整保留。`));
  }
});
