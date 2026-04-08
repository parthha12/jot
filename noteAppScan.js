'use strict';

/**
 * noteAppScan.js — Pure, deterministic text scanner.
 *
 * Given a note's title and content, returns a Set of bundle IDs that should
 * be auto-linked based on keyword/alias matching. No LLM, no network calls.
 *
 * Matching rules:
 *   1. Text is normalised: lowercased, non-alphanumeric chars replaced with spaces,
 *      runs of whitespace collapsed.
 *   2. Each alias is matched with a whole-word boundary check (\b) so that
 *      e.g. "sms" doesn't match inside "plasma" or "awesome".
 *   3. Running this function twice on identical input is idempotent (pure function).
 *   4. The caller (main.js) is responsible for checking the dismissals table
 *      and the global autoAppLinkFromText toggle before acting on the results.
 */

/**
 * Normalise text for matching: lowercase + collapse punctuation to spaces.
 */
function normalise(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pre-compiled regex cache keyed by alias string.
const _reCache = new Map();

function getWordBoundaryRe(alias) {
  if (_reCache.has(alias)) return _reCache.get(alias);
  const normalised = normalise(alias);
  // Escape any regex-special chars remaining after normalisation (unlikely but safe).
  const escaped = normalised.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  _reCache.set(alias, re);
  return re;
}

/**
 * Detect bundle IDs from a note's title and content.
 *
 * @param {string} title    - Note title.
 * @param {string} content  - Note body text.
 * @param {Array}  catalog  - Array of { name, bundleId, aliases[] } (from knownApps.js).
 * @returns {Set<string>}   - Bundle IDs that matched; may be empty.
 */
function detectBundleIdsFromText(title, content, catalog) {
  const combined = normalise((title || '') + ' ' + (content || ''));
  const found = new Set();

  for (const app of catalog) {
    if (found.has(app.bundleId)) continue; // already matched
    for (const alias of app.aliases) {
      const re = getWordBoundaryRe(alias);
      if (re.test(combined)) {
        found.add(app.bundleId);
        break; // one alias match per app is enough
      }
    }
  }

  return found;
}

module.exports = { detectBundleIdsFromText, normalise };
