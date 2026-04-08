'use strict';

/**
 * surfaceEngine.js — Matches frontmost app to linked notes and decides what to surface.
 *
 * When the frontmost app changes:
 *   1. Query notes linked to the new bundle ID (or by stable app name fallback).
 *   2. Filter out notes that are snoozed or permanently disabled.
 *   3. Return eligible notes to be shown in the overlay.
 *   4. After surfacing, auto-snooze each note for cooldownMinutes.
 *
 * No external I/O — pure logic over DB helpers.
 * Note: queries include links from BOTH 'manual' and 'auto' sources.
 */

const { APP_NAME_TO_BUNDLE_ID } = require('./knownApps');

/**
 * Resolve canonical bundle IDs to query for a given frontmost app event.
 * Returns an array because the app name fallback may add a second candidate.
 */
function resolveBundleIds(bundleId, appName) {
  const ids = new Set();
  if (bundleId) ids.add(bundleId);
  // App-name fallback: exact match first, then case-insensitive.
  if (appName) {
    const exact = APP_NAME_TO_BUNDLE_ID[appName];
    if (exact) {
      ids.add(exact);
    } else {
      // Case-insensitive fallback in case System Events returns differently-cased names
      const lower = appName.toLowerCase();
      for (const [key, val] of Object.entries(APP_NAME_TO_BUNDLE_ID)) {
        if (key.toLowerCase() === lower) { ids.add(val); break; }
      }
    }
  }
  return [...ids];
}

/**
 * Find notes eligible for surfacing when the given app becomes frontmost.
 *
 * @param {string} bundleId  - Bundle ID from System Events (may be empty).
 * @param {string} appName   - Process display name.
 * @param {object} db        - database.js module.
 * @returns {Array}          - Array of note objects eligible for surfacing.
 */
function getEligibleNotes(bundleId, appName, db) {
  const ids = resolveBundleIds(bundleId, appName);
  if (ids.length === 0) return [];

  const candidates = db.getNotesByAnyBundleId(ids);
  return candidates.filter(n => db.noteEligibleForSurface(n));
}

/**
 * After surfacing a set of notes, auto-snooze each for cooldownMinutes.
 */
function recordSurfaced(notes, db, cooldownMinutes) {
  for (const note of notes) {
    db.markNoteSurfaced(note.id, cooldownMinutes);
  }
}

module.exports = { resolveBundleIds, getEligibleNotes, recordSurfaced };
