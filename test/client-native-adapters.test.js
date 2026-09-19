import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses a desktop-provided directory picker before the DSH web fallback", async () => {
  const client = await readFile(new URL("../client-native.js", import.meta.url), "utf8");

  assert.match(client, /const desktopPicker = window\.dshDesktopDirectoryPicker;/);
  assert.match(client, /desktopPicker\.pick\(\)/);
  assert.match(client, /ctx\.workspaces\.pickDirectory\(\)/);
});

test("bottom-aligns the footer shortcut only in official DSH Desktop", async () => {
  const client = await readFile(new URL("../client-native.js", import.meta.url), "utf8");

  assert.match(client, /locationParams\.get\("dsh-desktop-mode"\)/);
  assert.match(client, /locationParams\.get\("dsh-desktop-platform"\)/);
  assert.match(client, /alignSelf: dshDesktop \? "flex-end" : undefined/);
  assert.match(client, /dshDesktop: isDshDesktop/);
  assert.match(client, /order: -10/);
});

test("continuation uses a fresh session in the same workspace only after confirmation", async () => {
  const client = await readFile(new URL("../client-native.js", import.meta.url), "utf8");

  assert.match(client, /确认并接续/);
  assert.match(client, /ctx\.sessions\.create\(\{ workspaceId: workspace\.workspaceId \}\)/);
  assert.match(client, /binding\.session\.prompt\(/);
  assert.match(client, /continuationAttempts\.set\(sourceId, \{ targetId: newId \}\)/);
  assert.match(client, /ctx\.sessions\.open\(newId\)/);
});
