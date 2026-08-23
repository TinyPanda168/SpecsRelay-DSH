import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createWorkspaceStore,
  MAX_WORKSPACE_STATE_BYTES
} from "../lib/workspace-store.js";

test("persists and replaces workspace state atomically", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "specsrelay-state-"));
  try {
    const store = createWorkspaceStore(directory);
    assert.equal(await store.read("workspace:/a"), null);

    await store.write("workspace:/a", { handoff: { title: "first" } });
    assert.deepEqual((await store.read("workspace:/a")).state, {
      handoff: { title: "first" }
    });

    await store.write("workspace:/a", { handoff: { title: "second" } });
    assert.deepEqual((await store.read("workspace:/a")).state, {
      handoff: { title: "second" }
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects invalid and oversized workspace state", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "specsrelay-state-"));
  try {
    const store = createWorkspaceStore(directory);
    await assert.rejects(store.write("", {}), /key is required/);
    await assert.rejects(store.write("workspace:/a", []), /must be an object/);
    await assert.rejects(
      store.write("workspace:/a", { text: "x".repeat(MAX_WORKSPACE_STATE_BYTES) }),
      /too large/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects corrupted workspace state instead of returning it", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "specsrelay-state-"));
  try {
    const store = createWorkspaceStore(directory);
    await store.write("workspace:/a", { ready: true });
    const [fileName] = await readdir(directory);
    await writeFile(path.join(directory, fileName), "{}\n", "utf8");
    await assert.rejects(store.read("workspace:/a"), /invalid/);
    assert.equal((await readFile(path.join(directory, fileName), "utf8")).trim(), "{}");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
