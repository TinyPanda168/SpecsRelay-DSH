#!/usr/bin/env node

import {
  installDetected,
  installCommand
} from "../installer/install.js";

function help() {
  process.stdout.write(`SpecsRelay for DSH Desktop installer

Usage:
  specsrelay-dsh install [options]

Options:
  --app <path>       DSH Desktop application path (repeatable)
  --dsh-home <path>  Override the detected DSH_HOME
  --package <spec>    Plugin package reference
  --dry-run           Show the detected install plan without changing files
  --help              Show this help
`);
}

function parse(argv) {
  const options = { appPaths: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--dry-run") options.dryRun = true;
    else if (["--app", "--dsh-home", "--package"].includes(argument)) {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} 需要一个值。`);
      if (argument === "--app") options.appPaths.push(value);
      else if (argument === "--dsh-home") options.dshHome = value;
      else options.packageSpec = value;
    } else if (argument !== "install") {
      throw new Error(`未知参数：${argument}`);
    }
  }
  return options;
}

try {
  const options = parse(process.argv.slice(2));
  if (options.help) {
    help();
    process.exitCode = 0;
  } else {
    const completed = await installDetected(options);
    for (const installation of completed) {
      const action = options.dryRun ? "检测到" : "已安装到";
      process.stdout.write(
        `${action} ${installation.hostName} · ${installation.profile} · ${installation.dshHome}\n`
      );
      if (options.dryRun) {
        const command = installCommand(installation, options.packageSpec);
        process.stdout.write(`  ${command.command} ${command.args.join(" ")}\n`);
      }
    }
    if (!options.dryRun) process.stdout.write("请重启 DSH Desktop。\n");
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
