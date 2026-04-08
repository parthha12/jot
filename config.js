'use strict';

/**
 * config.js — Configuration loader for Proactive Recall.
 *
 * Priority (highest to lowest):
 *   1. Environment variables (ANTHROPIC_API_KEY, PROACTIVE_RECALL_*)
 *   2. config.json in app userData directory
 *   3. Built-in defaults
 */

const fs   = require('fs');
const path = require('path');

let _userDataPath = null;

function setUserDataPath(p) { _userDataPath = p; }

function getConfigPath() {
  if (!_userDataPath) return null;
  return path.join(_userDataPath, 'config.json');
}

function readConfigFile() {
  const p = getConfigPath();
  if (!p) return {};
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function getConfig() {
  const file = readConfigFile();
  return {
    anthropicApiKey:        process.env.ANTHROPIC_API_KEY || file.anthropicApiKey || '',
    model:                  process.env.PROACTIVE_RECALL_MODEL || file.model || 'claude-sonnet-4-6',
    surfacingEnabled:       parseBool(process.env.PROACTIVE_RECALL_SURFACING, file.surfacingEnabled, true),
    pollIntervalMs:         parseInt(process.env.PROACTIVE_RECALL_POLL_MS || '', 10) || file.pollIntervalMs || 1500,
    surfaceCooldownMinutes: parseInt(process.env.PROACTIVE_RECALL_COOLDOWN_MIN || '', 10) || file.surfaceCooldownMinutes || 30,
    overlayAutoDismissMs:   parseInt(process.env.PROACTIVE_RECALL_DISMISS_MS || '', 10) || file.overlayAutoDismissMs || 10000,
  };
}

function saveConfigKey(key, value) {
  const p = getConfigPath();
  if (!p) return;
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  existing[key] = value;
  fs.writeFileSync(p, JSON.stringify(existing, null, 2), 'utf8');
}

function parseBool(envVal, fileVal, defaultVal) {
  if (envVal !== undefined) return envVal === '1' || envVal === 'true';
  if (fileVal !== undefined) return Boolean(fileVal);
  return defaultVal;
}

module.exports = { getConfig, setUserDataPath, saveConfigKey };
