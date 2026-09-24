import { conversationRecord } from "./native-browser.js";

/** Validate renderer-supplied page evidence before using the shared organizer. */
export function officialCapture(value, includeMessages = false) {
  let url;
  try { url = new URL(value?.url); } catch { throw new Error("DeepSeek 对话地址无效。"); }
  if (url.origin !== "https://chat.deepseek.com" || url.username || url.password) {
    throw new Error("只能读取 DeepSeek 网页对话。");
  }
  if (!Array.isArray(value.messages) || value.messages.length > 10000) {
    throw new Error("DeepSeek 对话消息无效。");
  }
  let length = 0;
  for (const message of value.messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
      throw new Error("DeepSeek 对话消息无效。");
    }
    length += message.content.length;
    if (length > 500000) throw new Error("当前对话过长，请分段整理。");
  }
  return conversationRecord(value, includeMessages);
}
