import { createHash, randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const WORKSPACE_STATE_VERSION = 1;
export const MAX_WORKSPACE_STATE_BYTES = 12_000_000;

function workspaceFileName(key) {
  return `${createHash("sha256").update(key).digest("hex")}.json`;
}

function validateKey(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Workspace state key is required.");
  }
  const key = value.trim();
  if (key.length > 6000 || key.includes("\0")) {
    throw new Error("Workspace state key is invalid.");
  }
  return key;
}

function validateState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Workspace state must be an object.");
  }
  return value;
}

export function createWorkspaceStore(directory) {
  if (typeof directory !== "string" || !directory.trim()) {
    throw new Error("Workspace state directory is required.");
  }
  const root = path.resolve(directory);

  return {
    async read(value) {
      const key = validateKey(value);
      const filePath = path.join(root, workspaceFileName(key));
      let source;
      try {
        source = await readFile(filePath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
      const record = JSON.parse(source);
      if (
        record?.version !== WORKSPACE_STATE_VERSION ||
        record?.key !== key ||
        !record?.state ||
        typeof record.state !== "object" ||
        Array.isArray(record.state)
      ) {
        throw new Error("Stored workspace state is invalid.");
      }
      return {
        savedAt: String(record.savedAt || ""),
        state: structuredClone(record.state)
      };
    },

    async write(value, stateValue) {
      const key = validateKey(value);
      const state = validateState(stateValue);
      const savedAt = new Date().toISOString();
      const body = `${JSON.stringify({
        version: WORKSPACE_STATE_VERSION,
        key,
        savedAt,
        state
      })}\n`;
      if (Buffer.byteLength(body) > MAX_WORKSPACE_STATE_BYTES) {
        throw new Error("Workspace state is too large.");
      }
      await mkdir(root, { recursive: true, mode: 0o700 });
      const filePath = path.join(root, workspaceFileName(key));
      const temporary = `${filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
      try {
        await writeFile(temporary, body, {
          encoding: "utf8",
          mode: 0o600,
          flag: "wx"
        });
        await rename(temporary, filePath);
        await chmod(filePath, 0o600).catch(() => {});
      } catch (error) {
        await unlink(temporary).catch(() => {});
        throw error;
      }
      return { savedAt };
    }
  };
}
