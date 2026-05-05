#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

const pluginRoot = path.resolve(__dirname, "..");
const pluginName = "ogsm";
const marketplaceName = "local";
const version = "0.1.0";
const home = os.homedir();
const claudeRoot = path.join(home, ".claude");
const localMarketplaceRoot = path.join(
  claudeRoot,
  "plugins",
  "marketplaces",
  marketplaceName
);
const installDir = path.join(
  localMarketplaceRoot,
  "external_plugins",
  pluginName
);
const marketplacePath = path.join(
  localMarketplaceRoot,
  ".claude-plugin",
  "marketplace.json"
);
const installedPath = path.join(claudeRoot, "plugins", "installed_plugins.json");
const settingsPath = path.join(claudeRoot, "settings.json");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function upsertPluginEntry(plugins, entry) {
  const index = plugins.findIndex((plugin) => plugin.name === entry.name);
  if (index >= 0) {
    plugins[index] = { ...plugins[index], ...entry };
  } else {
    plugins.push(entry);
  }
}

if (!fs.existsSync(path.join(pluginRoot, ".claude-plugin", "plugin.json"))) {
  console.error("Missing .claude-plugin/plugin.json. Run this script from the OGSM plugin bundle.");
  process.exit(1);
}

fs.rmSync(installDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(installDir), { recursive: true });
fs.cpSync(pluginRoot, installDir, { recursive: true });

const marketplace = readJson(marketplacePath, {
  name: marketplaceName,
  description: "Local development plugins",
  plugins: [],
});
marketplace.plugins = marketplace.plugins || [];
upsertPluginEntry(marketplace.plugins, {
  name: pluginName,
  description:
    "Adaptive OGSM operating loop skills for defining, auditing, realigning, and reviewing plans and schedules.",
  source: `./external_plugins/${pluginName}`,
  category: "productivity",
});
writeJson(marketplacePath, marketplace);

const installed = readJson(installedPath, { version: 2, plugins: {} });
installed.version = installed.version || 2;
installed.plugins = installed.plugins || {};
const now = new Date().toISOString();
installed.plugins[`${pluginName}@${marketplaceName}`] = [
  {
    scope: "user",
    installPath: installDir,
    version,
    installedAt: now,
    lastUpdated: now,
  },
];
writeJson(installedPath, installed);

const settings = readJson(settingsPath, {});
settings.enabledPlugins = settings.enabledPlugins || {};
settings.enabledPlugins[`${pluginName}@${marketplaceName}`] = true;
writeJson(settingsPath, settings);

console.log(`Installed ${pluginName}@${marketplaceName} to ${installDir}`);
console.log("Restart Claude Code before using the OGSM skills.");
