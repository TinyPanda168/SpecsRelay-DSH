import assert from "node:assert/strict";
import test from "node:test";
import {
  JEV_API_MODEL,
  JEV_CREDENTIAL_REFS,
  JEV_ROUTE_INSTRUCTIONS,
  sameAuxiliaryRoute,
  selectJevAuxiliaryRoute
} from "../lib/jev-router.js";

const baseRoute = { provider: "deepseek-official", model: "deepseek-flash" };

function context({ models = ["deepseek-flash", "deepseek-pro"], storedKey = "" } = {}) {
  return {
    get(name) {
      if (name !== "credentials" || !storedKey) return undefined;
      return {
        resolve: async (ref) => ref === "TYPESAFE_API_KEY"
          ? { value: storedKey, source: "test" }
          : undefined
      };
    },
    llm: {
      listModels: async (provider) => models.map((id) => ({
        provider,
        id,
        name: id
      })),
      resolveModelInfo: async (provider, id) => ({
        provider,
        id,
        name: id,
        context: { contextWindow: id.includes("pro") ? 200000 : 100000 },
        reasoning: {
          efforts: [
            { id: "off", name: "Off" },
            { id: "high", name: "High" }
          ],
          defaultEffort: "off"
        }
      })
    }
  };
}

function jsonResponse(value, ok = true) {
  return {
    ok,
    text: async () => JSON.stringify(value)
  };
}

test("Jev routing stays off without an explicit user credential", async () => {
  let calls = 0;
  const result = await selectJevAuxiliaryRoute(context(), baseRoute, {
    task: "organize",
    text: "需求",
    env: { SPECSRELAY_JEV_ROUTER: "1" },
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({});
    }
  });
  assert.equal(calls, 0);
  assert.equal(result.selectedBy, "default");
  assert.equal(result.route, baseRoute);
});

test("Jev keeps the official credential name and reviewable question first", () => {
  assert.deepEqual(JEV_CREDENTIAL_REFS, [
    "TYPESAFE_API_KEY",
    "SPECSRELAY_JEV_API_KEY"
  ]);
  assert.match(JEV_ROUTE_INSTRUCTIONS.objective, /lower reasoning effort/);
});

test("Jev routing bypasses one-model catalogs", async () => {
  let calls = 0;
  const result = await selectJevAuxiliaryRoute(
    context({ models: ["deepseek-flash"] }),
    baseRoute,
    {
      task: "organize",
      text: "需求",
      env: {
        SPECSRELAY_JEV_ROUTER: "1",
        TYPESAFE_API_KEY: "test-key"
      },
      fetchImpl: async () => {
        calls += 1;
        return jsonResponse({});
      }
    }
  );
  assert.equal(calls, 0);
  assert.equal(result.selectedBy, "default");
});

test("Jev may select an advertised auxiliary model and effort", async () => {
  let request;
  const result = await selectJevAuxiliaryRoute(
    context({ storedKey: "stored-test-key" }),
    baseRoute,
    {
      task: "organize",
      text: "需要综合多个相互冲突的约束",
      env: { SPECSRELAY_JEV_ROUTER: "1" },
      fetchImpl: async (_url, options) => {
        request = options;
        return jsonResponse({
          answers: { route: { choice: "route_4" } }
        });
      }
    }
  );
  assert.equal(result.selectedBy, "jev");
  assert.deepEqual(result.route, {
    provider: "deepseek-official",
    model: "deepseek-pro",
    reasoningEffort: "high"
  });
  const body = JSON.parse(request.body);
  assert.equal(body.model, JEV_API_MODEL);
  assert.equal(body.state.task, "organize");
  assert.equal(Object.keys(body.questions.route.criteria).length, 4);
});

test("Jev receives only a bounded, credential-redacted excerpt", async () => {
  let body;
  const exposed = `apikey_${"a".repeat(48)}_${"b".repeat(48)}`;
  await selectJevAuxiliaryRoute(context(), baseRoute, {
    task: "continuation",
    text: `${"前文".repeat(1600)} ${"后文".repeat(100)} ${exposed}`,
    env: {
      SPECSRELAY_JEV_ROUTER: "1",
      TYPESAFE_API_KEY: "test-key"
    },
    fetchImpl: async (_url, options) => {
      body = JSON.parse(options.body);
      return jsonResponse({ answers: { route: { choice: "route_1" } } });
    }
  });
  assert.ok(body.state.excerpt.length <= 1600);
  assert.doesNotMatch(body.state.excerpt, /apikey_/);
  assert.match(body.state.excerpt, /\[redacted credential\]/);
});

test("Jev errors, malformed choices, and explicit disable all preserve the route", async () => {
  for (const fetchImpl of [
    async () => { throw new Error("offline"); },
    async () => jsonResponse({ answers: { route: { choice: "route_99" } } }),
    async () => jsonResponse({}, false)
  ]) {
    const result = await selectJevAuxiliaryRoute(context(), baseRoute, {
      task: "organize",
      text: "需求",
      env: {
        SPECSRELAY_JEV_ROUTER: "1",
        TYPESAFE_API_KEY: "test-key"
      },
      fetchImpl
    });
    assert.equal(result.selectedBy, "default");
    assert.equal(result.route, baseRoute);
  }

  let calls = 0;
  const disabled = await selectJevAuxiliaryRoute(context(), baseRoute, {
    task: "organize",
    text: "需求",
    env: {
      TYPESAFE_API_KEY: "test-key",
      SPECSRELAY_JEV_ROUTER: "off"
    },
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({});
    }
  });
  assert.equal(calls, 0);
  assert.equal(disabled.selectedBy, "default");
  assert.ok(sameAuxiliaryRoute(disabled.route, baseRoute));
});
