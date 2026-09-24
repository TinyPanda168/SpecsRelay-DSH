import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { mkdtempSync } from "node:fs";
import { HOSTS, identifyHost, resolveHostInstallation, assertNativeWebPanels } from "../installer/hosts.js";
import { installCommand, installDetected } from "../installer/install.js";

test("the installer identifies community and official Desktop independently", () => {
  assert.deepEqual(HOSTS.map(({ id, profile, bundleId }) => ({ id, profile, bundleId })), [
    { id: "dsh-desktop", profile: "desktop", bundleId: "ai.deepseek.dsh.desktop" },
    { id: "deepseek-harness-official", profile: "desktop", bundleId: "com.deepseek.dsh" }
  ]);
});

for (const [name, metadata] of [
  ["Pilot", { name: "@deepseek-ai/dsh-desktop", productName: "Pilot Harness", repository: "https://github.com/op7418/pilot-harness" }],
  ["DataElement", { name: "dsh-desktop", productName: "DSH Desktop", repository: "https://github.com/dataelement/dsh-desktop" }],
  ["MyYang", { name: "dsh-desktop", productName: "DSH Desktop" }]
]) {
  test(`the installer rejects retired ${name} clients without launching a command`, async () => {
    const root = mkdtempSync(join(tmpdir(), "specsrelay-installer-"));
    try {
      mkdirSync(join(root, "resources", "app"), { recursive: true });
      writeFileSync(join(root, "resources", "app", "package.json"), JSON.stringify(metadata));
      assert.equal(identifyHost(root, { platform: "win32" }), undefined);
      let launched = false;
      await assert.rejects(installDetected({
        platform: "win32", appPaths: [root],
        spawnProcess: () => { launched = true; throw new Error("Must not launch"); }
      }), /没有检测到支持的桌面端/);
      assert.equal(launched, false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test("community package metadata identifies DSH Desktop", () => {
  const root = mkdtempSync(join(tmpdir(), "specsrelay-installer-"));
  try {
    mkdirSync(join(root, "resources", "app"), { recursive: true });
    for (const metadata of [
      { name: "dsh-plugin-desktop" },
      { repository: "https://github.com/anywhere-labs/deepseek-harness-desktop" }
    ]) {
      writeFileSync(join(root, "resources", "app", "package.json"), JSON.stringify(metadata));
      assert.equal(identifyHost(root, { platform: "win32" }).host.id, "dsh-desktop");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("official macOS installation routes to Plugins without launching the community CLI", { skip: process.platform !== "darwin" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "specsrelay-official-installer-"));
  try {
    const app = join(root, "DeepSeek Harness.app");
    mkdirSync(join(app, "Contents/MacOS"), { recursive: true });
    writeFileSync(join(app, "Contents/MacOS/DeepSeek Harness"), "");
    writeFileSync(join(app, "Contents/Info.plist"), `<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>com.deepseek.dsh</string><key>CFBundleExecutable</key><string>DeepSeek Harness</string></dict></plist>`);
    assert.equal(identifyHost(app).host.id, "deepseek-harness-official");
    for (const dryRun of [false, true]) {
      const [installation] = await installDetected({ appPaths: [app], dryRun,
        spawnProcess: () => assert.fail("official profile must be managed in app") });
      assert.equal(installation.installMethod, "desktop-ui");
      assert.throws(() => installCommand(installation), /插件/);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a different macOS bundle identity is not accepted through package metadata", { skip: process.platform !== "darwin" }, () => {
  const root = mkdtempSync(join(tmpdir(), "specsrelay-installer-"));
  try {
    mkdirSync(join(root, "Contents", "Resources", "app"), { recursive: true });
    writeFileSync(join(root, "Contents", "Resources", "app", "package.json"), JSON.stringify({ name: "dsh-plugin-desktop" }));
    for (const bundleId of ["com.codepilot.pilotharness", "io.dsh.desktop", "com.deepseek.dsh.desktop"]) {
      writeFileSync(join(root, "Contents", "Info.plist"), `<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>${bundleId}</string></dict></plist>`);
      assert.equal(identifyHost(root, { platform: "darwin" }), undefined);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const platform of ["darwin", "win32"]) {
  for (const layout of ["app", "app.asar.unpacked"]) {
    test(`DSH Desktop resolves ${platform} ${layout} installations`, () => {
      const root = mkdtempSync(join(tmpdir(), "specsrelay-installer-"));
      try {
        const host = HOSTS.find((candidate) => candidate.id === "dsh-desktop");
        const resources = platform === "darwin" ? "Contents/Resources" : "resources";
        const dshBin = join(root, resources, layout, "node_modules/@deepseek-ai/dsh/lib/bin.js");
        const executable = join(root, platform === "darwin" ? "Contents/MacOS/DSH Desktop" : "DSH Desktop.exe");
        mkdirSync(join(dshBin, ".."), { recursive: true });
        mkdirSync(join(executable, ".."), { recursive: true });
        writeFileSync(dshBin, "");
        writeFileSync(executable, "");
        const packageRoot = join(root, resources, layout);
        mkdirSync(join(packageRoot, "lib"), { recursive: true });
        writeFileSync(join(packageRoot, "package.json"), JSON.stringify({
          name: "dsh-plugin-desktop",
          exports: { "./web-panels": { default: "./lib/web-panels.js" } }
        }));
        writeFileSync(join(packageRoot, "lib/web-panels.js"), "");
        const installation = resolveHostInstallation(host, platform === "darwin" ? root : executable, {
          platform,
          bundleExecutable: "DSH Desktop",
          dshHome: join(root, "dsh-home")
        });
        const command = installCommand(installation, "file:/local/specsrelay");
        assert.deepEqual(installCommand(installation).args,
          [dshBin, "plugin", "--profile", "desktop", "add", "github:TinyPandaGame/SpecsRelay-DSH"]);
        assert.equal(installation.dshBin, dshBin);
        assert.equal(command.command, executable);
        assert.equal(installation.profile, "desktop");
        assert.equal(command.environment.ELECTRON_RUN_AS_NODE, "1");
        assert.equal(command.environment.DSH_HOME, join(root, "dsh-home"));
        assert.deepEqual(command.args, [dshBin, "plugin", "--profile", "desktop", "add", "file:/local/specsrelay"]);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  }
}

test("a stock Desktop update without native web panels is rejected before installing a plugin", async () => {
  const root = mkdtempSync(join(tmpdir(), "specsrelay-installer-"));
  try {
    const app = join(root, "resources/app");
    const executable = join(root, "DSH Desktop.exe");
    mkdirSync(join(app, "node_modules/@deepseek-ai/dsh/lib"), { recursive: true });
    writeFileSync(join(app, "node_modules/@deepseek-ai/dsh/lib/bin.js"), "");
    writeFileSync(executable, "");
    writeFileSync(join(app, "package.json"), JSON.stringify({ name: "dsh-plugin-desktop", version: "2.0.13" }));
    let launched = false;
    await assert.rejects(installDetected({
      platform: "win32", appPaths: [executable],
      spawnProcess: () => { launched = true; throw new Error("Must not launch"); }
    }), /原生网页支持/);
    assert.equal(launched, false);
    writeFileSync(join(app, "package.json"), JSON.stringify({
      name: "dsh-plugin-desktop", exports: { "./web-panels": "./lib/web-panels.js" }
    }));
    assert.throws(() => assertNativeWebPanels(executable, "win32"), /原生网页支持/);
    mkdirSync(join(app, "lib"));
    writeFileSync(join(app, "lib/web-panels.js"), "");
    assert.doesNotThrow(() => assertNativeWebPanels(executable, "win32"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
