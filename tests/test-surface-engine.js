'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');

const { resolveBundleIds, getEligibleNotes } = require('../surfaceEngine');
const { APP_NAME_TO_BUNDLE_ID } = require('../knownApps');

// ── resolveBundleIds ─────────────────────────────────────────────────────────

test('resolveBundleIds: includes provided bundle ID', () => {
  const ids = resolveBundleIds('com.apple.MobileSMS', 'Messages');
  assert.ok(ids.includes('com.apple.MobileSMS'));
});

test('resolveBundleIds: adds fallback from app name map', () => {
  // Even with empty bundleId, app name fallback applies
  const ids = resolveBundleIds('', 'WhatsApp');
  assert.ok(ids.includes('net.whatsapp.WhatsApp'));
});

test('resolveBundleIds: no duplicates when bundleId matches fallback', () => {
  const ids = resolveBundleIds('com.apple.MobileSMS', 'Messages');
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size);
});

test('resolveBundleIds: unknown app with bundleId only', () => {
  const ids = resolveBundleIds('com.some.App', 'SomeApp');
  assert.deepEqual(ids, ['com.some.App']);
});

test('resolveBundleIds: no bundleId, no known name → empty', () => {
  const ids = resolveBundleIds('', 'UnknownApp');
  assert.equal(ids.length, 0);
});

// ── APP_NAME_TO_BUNDLE_ID map ─────────────────────────────────────────────────

test('APP_NAME_TO_BUNDLE_ID contains expected entries', () => {
  assert.equal(APP_NAME_TO_BUNDLE_ID['Messages'],  'com.apple.MobileSMS');
  assert.equal(APP_NAME_TO_BUNDLE_ID['WhatsApp'],  'net.whatsapp.WhatsApp');
  assert.equal(APP_NAME_TO_BUNDLE_ID['Slack'],     'com.tinyspeck.slackmacgap');
  assert.equal(APP_NAME_TO_BUNDLE_ID['Telegram'],  'ru.keepcoder.Telegram');
});

// ── getEligibleNotes ─────────────────────────────────────────────────────────

test('getEligibleNotes: returns notes not snoozed and not disabled', () => {
  const notes = [
    { id: 1, title: 'A', content: '', surface_disabled: 0, surface_snoozed_until: null },
    { id: 2, title: 'B', content: '', surface_disabled: 1, surface_snoozed_until: null },
  ];

  const mockDb = {
    getNotesByAnyBundleId: () => notes,
    noteEligibleForSurface: (n) => !n.surface_disabled && (!n.surface_snoozed_until || new Date(n.surface_snoozed_until) <= new Date()),
  };

  const eligible = getEligibleNotes('com.apple.MobileSMS', 'Messages', mockDb);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 1);
});

test('getEligibleNotes: respects active snooze', () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const notes = [
    { id: 1, title: 'A', content: '', surface_disabled: 0, surface_snoozed_until: future },
  ];

  const mockDb = {
    getNotesByAnyBundleId: () => notes,
    noteEligibleForSurface: (n) => !n.surface_disabled && (!n.surface_snoozed_until || new Date(n.surface_snoozed_until) <= new Date()),
  };

  const eligible = getEligibleNotes('com.apple.MobileSMS', 'Messages', mockDb);
  assert.equal(eligible.length, 0);
});

test('getEligibleNotes: expired snooze is eligible', () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const notes = [
    { id: 3, title: 'C', content: '', surface_disabled: 0, surface_snoozed_until: past },
  ];

  const mockDb = {
    getNotesByAnyBundleId: () => notes,
    noteEligibleForSurface: (n) => !n.surface_disabled && (!n.surface_snoozed_until || new Date(n.surface_snoozed_until) <= new Date()),
  };

  const eligible = getEligibleNotes('', 'Messages', mockDb);
  assert.equal(eligible.length, 1);
});

test('getEligibleNotes: no bundle IDs → empty', () => {
  const mockDb = {
    getNotesByAnyBundleId: () => [],
    noteEligibleForSurface: () => true,
  };
  const eligible = getEligibleNotes('', 'UnknownApp', mockDb);
  assert.equal(eligible.length, 0);
});

// ── Source-agnostic surfacing ─────────────────────────────────────────────────
// getNotesByAnyBundleId does not filter by source — a link is a link.

test('auto-linked note is eligible for surfacing (source is irrelevant to eligibility)', () => {
  const notes = [
    { id: 10, title: 'Auto', content: '', surface_disabled: 0, surface_snoozed_until: null },
  ];
  const mockDb = {
    // DB query returns notes regardless of link source
    getNotesByAnyBundleId: () => notes,
    noteEligibleForSurface: (n) => !n.surface_disabled && !n.surface_snoozed_until,
  };
  const eligible = getEligibleNotes('com.tinyspeck.slackmacgap', 'Slack', mockDb);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 10);
});
