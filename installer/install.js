import { spawn } from "node:child_process";
import { detectHostInstallations } from "./hosts.js";

export const DEFAULT_PACKAGE_SPEC = "github:TinyPanda168/SpecsRelay-DSH";

export function installCommand(installation, packageSpec = DEFAULT_PACKAGE_SPEC) {
  return {
    command: installation.executable,
    args: [
      installation.dshBin,
      "plugin",
      "--profile",
      installation.profile,
      "add",
      packageSpec
    ],
    environment: {
      ...process.env,
      DSH_HOME: installation.dshHome,
      ...(installation.electronRunAsNode ? { ELECTRON_RUN_AS_NODE: "1" } : {})
    }
  };
}

function runCommand(command, installation, { spawnProcess = spawn } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command.command, command.args, {
      env: command.environment,
      stdio: "inherit",
      windowsHide: true
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(
        signal
          ? `${installation.hostName} 安装被信号 ${signal} 中止。`
          : `${installation.hostName} 安装失败，退出码 ${code ?? "unknown"}。`
      ));
    });
  });
}

export async function installOne(installation, packageSpec, options = {}) {
  await runCommand(installCommand(installation, packageSpec), installation, options);
}

export async function installDetected(options = {}) {
  const installations = detectHostInstallations(options);
  if (installations.length === 0) {
    throw new Error(
      "没有检测到 DSH Desktop。SpecsRelay 仅支持 anywhere-labs DSH Desktop；可用 --app 指定其应用路径。"
    );
  }
  const completed = [];
  const seen = new Set();
  for (const installation of installations) {
    const key = `${installation.dshHome}\0${installation.profile}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!options.dryRun) {
      await installOne(installation, options.packageSpec || DEFAULT_PACKAGE_SPEC, options);
    }
    completed.push(installation);
  }
  return completed;
}
