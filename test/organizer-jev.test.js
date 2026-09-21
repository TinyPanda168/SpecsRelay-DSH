import assert from "node:assert/strict";
import test from "node:test";
import { organizeImportedContext } from "../index.js";

const handoff = {
  schema_version: "1.0",
  title: "测试需求",
  objective: "验证可选分流只影响整理调用",
  context: "用户显式启用了 Jev。",
  implementation_plan: ["保持原交互"],
  acceptance_criteria: ["整理结果有效"],
  verification_steps: ["检查实际调用路线"],
  constraints: ["不改变 Coding Agent 模型"],
  non_goals: ["不路由 Agent 主会话"],
  decisions: ["Jev 仅用于辅助整理"],
  open_questions: [],
  local_context_needed: [],
  risk_level: "low",
  execution_mode: "plan",
  ready_for_execution: true,
  source: {
    provider: "DeepSeek",
    model: "deepseek-v4-flash",
    conversation_title: "测试"
  }
};

test("short requirement organization bypasses the old Jev model router", async () => {
  const calls = [];
  let jevRequests = 0;
  const ctx = {
    agents: { get: () => undefined },
    get(name) {
      if (name !== "credentials") return undefined;
      return {
        resolve: async (ref) => ref === "SPECSRELAY_JEV_API_KEY"
          ? { value: "test-key", source: "test" }
          : undefined
      };
    },
    skills: {
      get: async () => ({
        name: "specsrelay-requirement-analysis",
        provider: "bundled",
        content: "Only create a factual handoff."
      })
    },
    llm: {
      listProviders: () => [{ id: "deepseek-official", name: "DeepSeek" }],
      listModels: async () => [
        { provider: "deepseek-official", id: "deepseek-flash", name: "Flash" },
        { provider: "deepseek-official", id: "deepseek-pro", name: "Pro" }
      ],
      resolveModelInfo: async (provider, id) => ({
        provider,
        id,
        name: id,
        reasoning: {
          efforts: [
            { id: "off", name: "Off" },
            { id: "high", name: "High" }
          ]
        }
      }),
      async *stream(options) {
        calls.push({
          provider: options.provider,
          model: options.model,
          reasoningEffort: options.reasoningEffort
        });
        yield { type: "text-delta", index: 0, text: JSON.stringify(handoff) };
        yield { type: "finish", reason: "stop" };
      }
    }
  };

  const previousFlag = process.env.SPECSRELAY_JEV_ROUTER;
  const previousFetch = globalThis.fetch;
  process.env.SPECSRELAY_JEV_ROUTER = "1";
  globalThis.fetch = async () => {
    jevRequests += 1;
    return {
    ok: true,
    text: async () => JSON.stringify({
      answers: { route: { choice: "route_6" } }
    })
    };
  };
  try {
    const result = await organizeImportedContext(ctx, {
      sessionId: "session",
      text: "请整理这个已经明确的需求。"
    });
    assert.equal(result.provider, "deepseek-official");
    assert.equal(result.model, "deepseek-v4-flash");
    assert.equal(jevRequests, 0);
    assert.deepEqual(calls, [{
      provider: "deepseek-official",
      model: "deepseek-v4-flash",
      reasoningEffort: "off"
    }]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousFlag === undefined) {
      delete process.env.SPECSRELAY_JEV_ROUTER;
    } else {
      process.env.SPECSRELAY_JEV_ROUTER = previousFlag;
    }
  }
});
