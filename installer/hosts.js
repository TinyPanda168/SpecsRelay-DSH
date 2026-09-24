import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { execFileSync } from "node:child_process";

export const HOSTS = [
  {
    id: "dsh-desktop",
    name: "DSH Desktop",
    bundleId: "ai.deepseek.dsh.desktop",
    profile: "desktop",
    dshHome: ({ home, environment }) => environment.DSH_HOME || join(home, ".dsh"),
    dshBins: [
      "Contents/Resources/app.asar.unpacked/node_modules/@deepseek-ai/dsh/lib/bin.js",
      "resources/app.asar.unpacked/node_modules/@deepseek-ai/dsh/lib/bin.js",
      "Contents/Resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js",
      "resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js"
    ]
  }
];

function firstExisting(root, candidates) {
  return candidates.map((candidate) => join(root, candidate)).find(existsSync);
}

function macBundleValue(appPath, key) {
  return execFileSync(
    "/usr/bin/plutil",
    ["-extract", key, "raw", "-o", "-", join(appPath, "Contents", "Info.plist")],
    { encoding: "utf8" }
  ).trim();
}

function applicationRoot(appPath, platform) {
  return platform === "win32" && extname(appPath).toLowerCase() === ".exe"
    ? dirname(appPath)
    : appPath;
}

function packageMetadata(appPath, platform) {
  const root = applicationRoot(appPath, platform);
  const candidates =
    platform === "darwin"
      ? [
          "Contents/Resources/app/package.json",
          "Contents/Resources/app.asar.unpacked/package.json"
        ]
      : ["resources/app/package.json", "resources/app.asar.unpacked/package.json"];
  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(join(root, candidate), "utf8"));
    } catch {
      // Continue to the next unpacked package metadata location.
    }
  }
  return undefined;
}

function hostFromMetadata(metadata) {
  const repository = String(
    typeof metadata?.repository === "string"
      ? metadata.repository
      : metadata?.repository?.url || ""
  ).toLowerCase();
  if (repository.includes("anywhere-labs/deepseek-harness-desktop")) return HOSTS[0];
  if (metadata?.name === "dsh-plugin-desktop") return HOSTS[0];
  return undefined;
}

function executableFor(appPath, platform, bundleExecutable) {
  if (platform === "darwin") {
    return join(appPath, "Contents", "MacOS", bundleExecutable || basename(appPath, ".app"));
  }
  return appPath;
}

/** Check the packaged native service before changing a user's DSH profile. */
export function assertNativeWebPanels(appPath, platform = process.platform) {
  const root = applicationRoot(appPath, platform);
  const resources = platform === "darwin" ? "Contents/Resources" : "resources";
  for (const layout of ["app", "app.asar.unpacked"]) {
    const packageRoot = join(root, resources, layout);
    let metadata;
    try {
      metadata = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
    } catch {
      // Try the other supported unpacked application layout.
      continue;
    }
    const entry = metadata.exports?.["./web-panels"];
    const target = typeof entry === "string" ? entry : entry?.default;
    if (target === "./lib/web-panels.js" && existsSync(join(packageRoot, target))) return;
    break;
  }
  throw new Error(
    "当前 DSH Desktop 安装包未提供 SpecsRelay 所需的原生网页支持。请安装带 desktopWebPanels 的配套桌面版本；仅更新插件无法补齐此能力。修复说明：https://github.com/TinyPandaGame/SpecsRelay-DSH/blob/main/docs/desktop-native-repair.md"
  );
}

export function resolveHostInstallation(host, appPath, {
  platform = process.platform,
  home = homedir(),
  environment = process.env,
  dshHome,
  bundleExecutable
} = {}) {
  const root = applicationRoot(appPath, platform);
  const dshBin = firstExisting(root, host.dshBins);
  const executable = executableFor(appPath, platform, bundleExecutable);
  if (!dshBin) {
    throw new Error(`${host.name} 中没有找到 DSH 命令。请升级客户端后重试。`);
  }
  if (!existsSync(executable)) {
    throw new Error(`${host.name} 的运行程序不存在：${executable}`);
  }
  assertNativeWebPanels(appPath, platform);
  return {
    hostId: host.id,
    hostName: host.name,
    appPath,
    profile: host.profile,
    dshHome: dshHome || host.dshHome({ home, environment, platform }),
    executable,
    dshBin,
    electronRunAsNode: true
  };
}

function macApplicationRoots(extraRoots = []) {
  return ["/Applications", join(homedir(), "Applications"), ...extraRoots];
}

function macApplications(roots) {
  const apps = [];
  for (const root of roots) {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith(".app")) {
        apps.push(join(root, entry.name));
      }
    }
  }
  return apps;
}

function windowsApplications(environment, extraRoots) {
  const roots = [
    environment.LOCALAPPDATA && join(environment.LOCALAPPDATA, "Programs"),
    environment.ProgramFiles,
    environment["ProgramFiles(x86)"],
    ...extraRoots
  ].filter(Boolean);
  const directories = ["DSH Desktop", "dsh-desktop"];
  const executables = ["DSH Desktop.exe", "dsh-desktop.exe"];
  const candidates = [];
  for (const root of roots) {
    for (const directory of directories) {
      for (const executable of executables) {
        const candidate = join(root, directory, executable);
        if (existsSync(candidate)) candidates.push(candidate);
      }
    }
  }
  return [...new Set(candidates)];
}

export function identifyHost(appPath, { platform = process.platform } = {}) {
  if (platform === "darwin") {
    try {
      const bundleId = macBundleValue(appPath, "CFBundleIdentifier");
      const host = HOSTS.find((candidate) => candidate.bundleId === bundleId);
      if (host) {
        return {
          host,
          bundleExecutable: macBundleValue(appPath, "CFBundleExecutable")
        };
      }
      return undefined;
    } catch {
      // Fall back to unpacked package metadata below.
    }
  }
  const host = hostFromMetadata(packageMetadata(appPath, platform));
  return host ? { host } : undefined;
}

export function detectHostInstallations({
  platform = process.platform,
  appPaths,
  dshHome,
  extraRoots = [],
  environment = process.env
} = {}) {
  const candidates = appPaths?.length
    ? appPaths
    : platform === "darwin"
      ? macApplications(macApplicationRoots(extraRoots))
      : platform === "win32"
        ? windowsApplications(environment, extraRoots)
        : [];
  const installations = [];
  for (const appPath of candidates) {
    const identified = identifyHost(appPath, { platform });
    if (!identified) continue;
    installations.push(
      resolveHostInstallation(identified.host, appPath, {
        platform,
        dshHome,
        environment,
        bundleExecutable: identified.bundleExecutable
      })
    );
  }
  return installations;
}
