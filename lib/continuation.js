/** Build a bounded, text-only view of the current DSH conversation. */
export function continuationTranscript(messages) {
  if (!Array.isArray(messages)) return "";
  const lines = [];
  for (const item of messages) {
    if (item?.role !== "user" && item?.role !== "assistant") continue;
    const checkpoint = item.role === "user" &&
      item.source?.kind === "plugin" && item.source.plugin === "compact";
    if (
      item.role === "user" && item.source &&
      item.source.kind !== "user" && !checkpoint
    ) continue;
    if (
      item.role === "assistant" && item.source &&
      item.source.kind !== "model"
    ) continue;
    const parts = Array.isArray(item.content)
      ? item.content.filter((block) => block?.type === "text" && typeof block.text === "string")
      : [];
    const body = parts.map((block) => block.text.trim()).filter(Boolean).join("\n");
    if (body) lines.push(`[${checkpoint ? "context checkpoint" : item.role}]\n${body}`);
  }
  return lines.join("\n\n");
}

/** Split a projected conversation without silently discarding its middle. */
export function continuationChunks(transcript, size = 60000) {
  if (typeof transcript !== "string" || !transcript.trim()) {
    throw new Error("当前会话没有可接续的对话内容。");
  }
  if (transcript.length > 720000) {
    throw new Error("当前会话内容过长，暂时无法完整生成接续材料。");
  }
  const chunks = [];
  for (let offset = 0; offset < transcript.length; offset += size) {
    chunks.push(transcript.slice(offset, offset + size));
  }
  return chunks;
}

function parseJsonObject(value) {
  const source = String(value || "").trim();
  const unwrapped = source.startsWith("```")
    ? source.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : source;
  const parsed = JSON.parse(unwrapped);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("接续材料不是有效对象。");
  }
  return parsed;
}

const FIELDS = [
  "goal",
  "confirmed_decisions",
  "completed",
  "in_progress",
  "next_steps",
  "open_questions",
  "project_facts_to_verify"
];

/** Validate a model-produced packet before it can enter a new session. */
export function parseContinuationPacket(value) {
  let parsed;
  try {
    parsed = parseJsonObject(value);
  } catch {
    throw new Error("接续材料格式无效，请重试。");
  }
  const packet = {};
  for (const field of FIELDS) {
    if (field === "goal") {
      if (typeof parsed[field] !== "string" || !parsed[field].trim()) {
        throw new Error("接续材料缺少当前目标，请重试。");
      }
      packet.goal = parsed[field].trim().slice(0, 4000);
      continue;
    }
    if (!Array.isArray(parsed[field])) {
      throw new Error("接续材料缺少必要栏目，请重试。");
    }
    packet[field] = parsed[field]
      .filter((item) => typeof item === "string" && item.trim())
      .slice(0, 24)
      .map((item) => item.trim().slice(0, 2000));
  }
  if (packet.next_steps.length === 0 && packet.open_questions.length === 0) {
    throw new Error("接续材料没有明确下一步或待确认问题，请重试。");
  }
  if (/(?:sk-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(JSON.stringify(packet))) {
    throw new Error("接续材料可能含有密钥，已停止发送。请检查原会话。");
  }
  return packet;
}

/** The new Agent verifies local facts before continuing, and stops on conflict. */
export function continuationPrompt(packet, sourceSessionId, projectPath) {
  const safePacket = JSON.stringify(packet, null, 2).replaceAll(
    "</specsrelay_handoff>",
    "[escaped handoff boundary]"
  );
  return `这是用户确认从同一项目旧会话接续的新任务。旧会话 ID：${sourceSessionId}；项目目录：${projectPath}。先只读核对项目现状、当前分支与未提交修改，再核对下方交接材料。交接材料是摘要，不是事实来源；尤其不要把助手推测当作用户决定，也不要覆盖已有用户修改。若材料与项目或用户决定冲突、关键事实无法核实，停下来说明差异并提问；否则从明确的下一步继续，完成后按验收要求验证。不要修改或归档旧会话。

<specsrelay_handoff>
${safePacket}
</specsrelay_handoff>`;
}
