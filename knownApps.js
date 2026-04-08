'use strict';

/**
 * knownApps.js — Shared catalog of known macOS apps with aliases for scanning.
 *
 * This is the single source of truth used by:
 *   - noteAppScan.js  (text detection)
 *   - surfaceEngine.js (app-name → bundle-ID fallback)
 *   - renderer/renderer.js (UI list for manual linking — duplicated with comment)
 *
 * Aliases are used for keyword-based detection from note text. Rules:
 *   - Case-insensitive whole-word matching is applied to all aliases.
 *   - Keep aliases unambiguous: e.g. "wa" is too short/common — omit it.
 *   - Short aliases (≤4 chars) get stricter whole-word enforcement.
 *   - Longer phrases (≥8 chars) are matched with boundary check.
 */

const KNOWN_APPS = [
  {
    name:     'Messages',
    bundleId: 'com.apple.MobileSMS',
    aliases:  ['messages', 'imessage', 'iMessage', 'sms', 'texts', 'text message', 'text messages'],
  },
  {
    name:     'WhatsApp',
    bundleId: 'net.whatsapp.WhatsApp',
    aliases:  ['whatsapp', 'whats app'],
  },
  {
    name:     'Telegram',
    bundleId: 'ru.keepcoder.Telegram',
    aliases:  ['telegram'],
  },
  {
    name:     'Slack',
    bundleId: 'com.tinyspeck.slackmacgap',
    aliases:  ['slack'],
  },
  {
    name:     'Zoom',
    bundleId: 'us.zoom.xos',
    aliases:  ['zoom call', 'zoom meeting', 'zoom', 'on zoom'],
  },
  {
    name:     'Mail',
    bundleId: 'com.apple.mail',
    aliases:  ['apple mail', 'mail app'],
  },
  {
    name:     'FaceTime',
    bundleId: 'com.apple.FaceTime',
    aliases:  ['facetime', 'face time'],
  },
  {
    name:     'Discord',
    bundleId: 'com.hnc.Discord',
    aliases:  ['discord'],
  },
  {
    name:     'Messenger',
    bundleId: 'com.facebook.Messenger',
    aliases:  ['messenger', 'facebook messenger', 'fb messenger'],
  },
  {
    name:     'Microsoft Teams',
    bundleId: 'com.microsoft.teams2',
    aliases:  ['microsoft teams', 'ms teams', 'teams meeting', 'teams call'],
  },
  {
    name:     'Signal',
    bundleId: 'org.whispersystems.signal-desktop',
    aliases:  ['signal app', 'signal message'],
  },
  {
    name:     'Safari',
    bundleId: 'com.apple.Safari',
    aliases:  ['safari browser', 'safari'],
  },
  {
    name:     'Google Chrome',
    bundleId: 'com.google.Chrome',
    aliases:  ['google chrome', 'chrome browser'],
  },
];

/**
 * Flat map: bundleId → display name. Used in surfaceEngine + renderer.
 */
const BUNDLE_ID_TO_NAME = Object.fromEntries(KNOWN_APPS.map(a => [a.bundleId, a.name]));

/**
 * Flat map: app display name (as reported by macOS System Events) → bundleId.
 * Used in surfaceEngine for name fallback when bundle ID is unavailable.
 *
 * Keys use the capitalized form that System Events reports so direct lookups
 * work without normalisation. surfaceEngine also does a lowercase fallback.
 */
const APP_NAME_TO_BUNDLE_ID = {
  // Canonical display names (System Events form)
  'Messages':           'com.apple.MobileSMS',
  'WhatsApp':           'net.whatsapp.WhatsApp',
  'Telegram':           'ru.keepcoder.Telegram',
  'Slack':              'com.tinyspeck.slackmacgap',
  'Zoom':               'us.zoom.xos',
  'Mail':               'com.apple.mail',
  'FaceTime':           'com.apple.FaceTime',
  'Discord':            'com.hnc.Discord',
  'Messenger':          'com.facebook.Messenger',
  'Microsoft Teams':    'com.microsoft.teams2',
  'Microsoft Teams (work or school)': 'com.microsoft.teams2',
  'Signal':             'org.whispersystems.signal-desktop',
  'Safari':             'com.apple.Safari',
  'Google Chrome':      'com.google.Chrome',
};

module.exports = { KNOWN_APPS, BUNDLE_ID_TO_NAME, APP_NAME_TO_BUNDLE_ID };
