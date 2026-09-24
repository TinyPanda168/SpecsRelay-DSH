import { JEV_API_MODEL, JEV_API_URL, resolveApiKey } from "./jev-router.js";

export const ENHANCEMENT_SETTINGS_KEY = "specsrelay.enhancement.v1";
const PROVIDERS = ["off", "jev", "laya"];

/** Validate the user-selected HTTP inference endpoint without embedding credentials. */
function layaEndpoint(value) {
  let url;
  try { url = new URL(value); }
  catch { throw new Error("请填写 Laya 服务的 http:// 或 https:// 地址"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Laya 服务地址不能包含密钥、查询参数或片段");
  }
  const pathname = url.pathname.replace(/\/+$/, "");
  if (!pathname.endsWith("/v1/systemone")) {
    url.pathname = pathname + (pathname.endsWith("/v1") ? "/systemone" : "/v1/systemone");
  } else {
    url.pathname = pathname;
  }
  return url.href;
}

/** Normalize persisted or submitted settings; credentials are never accepted here. */
export function normalizeEnhancementSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).some((key) => !["provider", "layaUrl", "layaModel"].includes(key)) ||
      !PROVIDERS.includes(value.provider)) {
    throw new Error("请选择关闭、Jev 或 Laya");
  }
  for (const key of ["layaUrl", "layaModel"]) {
    if (typeof value[key] !== "string" || value[key].length > 2048 || /[\x00-\x1f]/.test(value[key])) {
      throw new Error("Laya 配置格式无效");
    }
  }
  const layaUrl = value.layaUrl.trim();
  if (value.provider === "laya" && !layaUrl) throw new Error("请先填写 Laya 服务地址");
  let normalizedUrl = "";
  if (layaUrl) {
    try { normalizedUrl = layaEndpoint(layaUrl); }
    catch (error) {
      // An unfinished, hidden Laya address must not prevent switching off or choosing Jev.
      if (value.provider === "laya") throw error;
    }
  }
  return {
    provider: value.provider,
    layaUrl: normalizedUrl,
    layaModel: value.layaModel.trim()
  };
}

/** Saved UI choices, including off, take precedence over legacy environment switches. */
export function resolveEnhancementSettings(saved, env = process.env) {
  if (saved !== undefined && saved !== null) return normalizeEnhancementSettings(saved);
  return normalizeEnhancementSettings({
    provider: env.SPECSRELAY_ENHANCEMENT_PROVIDER ??
      (/^(1|true|on|yes)$/i.test(String(env.SPECSRELAY_JEV_LONG_CONTEXT ?? "").trim()) ? "jev" : "off"),
    layaUrl: env.SPECSRELAY_LAYA_URL ?? "",
    layaModel: env.SPECSRELAY_LAYA_MODEL ?? "multilingual"
  });
}

/** Resolve only Laya's credential; a Jev key is never forwarded to a custom endpoint. */
async function layaKey(ctx, env) {
  let value;
  try { value = (await ctx.get?.("credentials")?.resolve?.("SPECSRELAY_LAYA_API_KEY"))?.value; }
  catch (error) { /* An unavailable optional credential falls back to the environment. */ }
  const key = String(value || env.SPECSRELAY_LAYA_API_KEY || "").trim();
  if (key && !/^[\x21-\x7e]+$/.test(key)) throw new Error("Invalid Laya credential.");
  return key;
}

/** Resolve one selected evidence service; never silently switch to another provider. */
export async function resolveEvidenceBackend(ctx, settings, env) {
  if (settings.provider === "off") return null;
  if (settings.provider === "jev") {
    const key = await resolveApiKey(ctx, env);
    return key ? { provider: "jev", url: JEV_API_URL, model: JEV_API_MODEL, key,
      batchSize: 4, maxRequestBytes: 30000 } : null;
  }
  const maxRequestBytes = Number(env.SPECSRELAY_LAYA_MAX_REQUEST_BYTES ?? 900);
  if (!Number.isInteger(maxRequestBytes) || maxRequestBytes < 400 || maxRequestBytes > 30000) {
    throw new Error("SPECSRELAY_LAYA_MAX_REQUEST_BYTES must be an integer between 400 and 30000.");
  }
  return {
    provider: "laya", url: settings.layaUrl, model: settings.layaModel,
    key: await layaKey(ctx, env), batchSize: 1, maxRequestBytes
  };
}
