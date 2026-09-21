import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { organizeImportedContext } from "../index.js";
import { EVIDENCE_PLAN_SYSTEM } from "../lib/long-conversation.js";

const handoff = JSON.parse(await readFile(new URL("./fixtures/long-conversation-handoff.json", import.meta.url), "utf8"));
const readingPlan = {
  goal: "要做什么工具？", confirmed_decisions: "用户撤回和确认了哪些决定？",
  constraints: "第一版允许联网吗？", acceptance_criteria: "怎样验证本地可用？", open_questions: "导出格式是否已确认？"
};
const longText = [
  "## User · Turn 1\n做一个本地笔记工具。",
  `## Assistant · Turn 1\n先讨论方案。\n${"随便聊聊今天的天气。\n".repeat(3000)}`,
  "## User · Turn 2\n撤回云同步方案，第一版只做本地。",
  "## Assistant · Turn 2\n已记录本地要求。",
  "## User · Turn 3\n断网也要能编辑，导出格式尚未确认。",
  "## Assistant · Turn 3\n导出格式作为待确认问题。"
].join("\n\n");

function context(events, { storedKey = "test-key", plannerFails = false } = {}) {
  return {
    agents: { get: () => undefined },
    get: (name) => name === "credentials" ? {
      resolve: async (ref) => ref === "TYPESAFE_API_KEY" && storedKey ? { value: storedKey } : undefined
    } : undefined,
    skills: {
      get: async () => ({ name: "specsrelay-requirement-analysis", provider: "bundled", content: "Only create a factual handoff." })
    },
    llm: {
      listProviders: () => [{ id: "deepseek-official", name: "DeepSeek" }],
      listModels: () => assert.fail("requirement organization must not route models through Jev"),
      async *stream(options) {
        const planning = options.system === EVIDENCE_PLAN_SYSTEM;
        events.push({ type: planning ? "plan" : "synthesis", options });
        if (planning && plannerFails) throw new Error("planner unavailable");
        yield { type: "text-delta", index: 0, text: JSON.stringify(planning ? readingPlan : handoff) };
        yield { type: "finish", reason: "stop" };
      }
    }
  };
}

async function withJev(events, run, { enabled = true, fail = false } = {}) {
  const names = ["SPECSRELAY_JEV_LONG_CONTEXT", "SPECSRELAY_JEV_ROUTER", "TYPESAFE_API_KEY", "SPECSRELAY_JEV_API_KEY", "SPECSRELAY_JEV_LONG_CONTEXT_MIN_CHARS", "SPECSRELAY_JEV_LONG_CONTEXT_TIMEOUT_MS", "SPECSRELAY_JEV_OMIT_PROBABILITY"];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  const previousFetch = globalThis.fetch;
  for (const name of names) delete process.env[name];
  process.env.SPECSRELAY_JEV_LONG_CONTEXT = enabled ? "1" : "0";
  process.env.SPECSRELAY_JEV_ROUTER = "1";
  globalThis.fetch = async (_url, options) => {
    events.push({ type: "jev" });
    if (fail) throw new Error("Jev unavailable");
    const body = JSON.parse(options.body);
    return Response.json({ answers: Object.fromEntries(Object.keys(body.questions).map((id) => [id, { type: "noul", noul: 1 }])) });
  };
  try { return await run(); }
  finally {
    globalThis.fetch = previousFetch;
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("long conversation enhancement plans, filters and produces the existing handoff format", async () => {
  const events = [];
  const result = await withJev(events, () => organizeImportedContext(context(events), { text: longText }));
  assert.equal(events[0].type, "plan");
  assert.equal(events.at(-1).type, "synthesis");
  assert.ok(events.slice(1, -1).every((event) => event.type === "jev"));
  assert.ok(events.length > 2);
  const final = events.at(-1).options;
  assert.equal(final.model, events[0].options.model);
  const prompt = final.messages[0].content[0].text;
  assert.ok(prompt.length < longText.length);
  assert.match(prompt, /撤回云同步方案，第一版只做本地/);
  assert.match(prompt, /断网也要能编辑，导出格式尚未确认/);
  assert.match(prompt, /原始对话仍保留/);
  const expectedEvidence = await readFile(new URL("./fixtures/long-conversation-evidence.txt", import.meta.url), "utf8");
  assert.equal(prompt.match(/<deepseek_conversation>\n([\s\S]*)\n<\/deepseek_conversation>/)[1], expectedEvidence.trimEnd());
  assert.deepEqual(result.handoff, handoff);
  assert.equal(result.requiresClarification, true);
});

test("missing keys, disabled enhancement and either service failing synthesize from the full original", async () => {
  for (const settings of [
    { enabled: false }, { storedKey: "" }, { plannerFails: true }, { fail: true }
  ]) {
    const events = [];
    await withJev(events, () => organizeImportedContext(context(events, settings), { text: longText }), settings);
    const synthesis = events.at(-1);
    assert.equal(synthesis.type, "synthesis");
    assert.ok(synthesis.options.messages[0].content[0].text.includes(longText));
    if (settings.enabled === false || settings.storedKey === "") {
      assert.deepEqual(events.map((event) => event.type), ["synthesis"]);
    }
  }
});

test("clarification answers and revisions survive both planning and evidence filtering", async () => {
  const events = [];
  await withJev(events, () => organizeImportedContext(context(events), {
    text: longText,
    previousHandoff: handoff,
    clarifications: [{ question: "导出格式采用什么？", answer: "确认只导出 Markdown。" }],
    revisionInstruction: "导出按钮放在右上角。"
  }));
  for (const event of events.filter((event) => event.type !== "jev")) {
    const prompt = event.options.messages[0].content[0].text;
    assert.match(prompt, /确认只导出 Markdown/);
    assert.match(prompt, /导出按钮放在右上角/);
  }
});

test("invalid clarification input is rejected before planning or external evaluation", async () => {
  const events = [];
  await withJev(events, async () => {
    await assert.rejects(organizeImportedContext(context(events), {
      text: longText, previousHandoff: handoff,
      clarifications: [{ question: "不是当前问题", answer: "随意" }]
    }), /与当前需求不一致/);
  });
  assert.deepEqual(events, []);
});
