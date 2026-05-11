# Install Jot on macOS

Jot is a tiny local‑first macOS app. There's no installer, no account, no telemetry.

This early build is **ad‑hoc signed** (no paid Apple Developer ID yet), so the very first launch needs **one extra step** to tell macOS you trust it. After that it just runs like any other app.

---

## ⚡ 60‑second install (most users)

1. **Download** `Jot-2.0.0.dmg` from the [latest release](https://github.com/parthha12/jot/releases/latest).
2. **Double‑click the `.dmg`** to open it.
3. **Drag `Jot` into `Applications`.**
4. Open Terminal (⌘+Space → "Terminal") and paste:

   ```bash
   xattr -dr com.apple.quarantine /Applications/Jot.app
   ```

5. Open Jot from `Applications` (or Launchpad / Spotlight).

That's it. macOS will not complain again.

> **What did that command do?** It removed the "downloaded from the internet" flag macOS attaches to new files. Apple uses that flag to gate apps it hasn't notarized. The command is local‑only and reversible.

---

## 🖱️ No‑Terminal install (alternative)

If you'd rather not touch Terminal:

1. Download the `.dmg`, open it, drag `Jot` to `Applications`.
2. Open **Applications** in Finder.
3. **Right‑click `Jot` → `Open`** (don't double‑click).
4. In the dialog that appears, click **`Open`**.

If macOS shows **"Apple could not verify Jot is free of malware"** with only `Done` / `Move to Trash` (Sequoia 15+ behavior):

1. Click **`Done`**.
2. Open **System Settings → Privacy & Security**.
3. Scroll down. You'll see _"Jot was blocked from use because it is not from an identified developer."_
4. Click **`Open Anyway`**.
5. Enter your password / Touch ID when prompted.

You only do this once per install.

---

## 🛟 Troubleshooting

**"Jot is damaged and can't be opened."**
This is the same Gatekeeper block, worded scarier. Run the quarantine command above:

```bash
xattr -dr com.apple.quarantine /Applications/Jot.app
```

**Permissions prompts on first launch**
Jot uses macOS Automation to read which app is frontmost, so it will ask once for permission. Grant it under **System Settings → Privacy & Security → Automation → Jot**. Without it, surfacing won't fire.

**Where is my data?**
All notes live locally in SQLite under `~/Library/Application Support/Jot/`. Nothing is uploaded.

**Uninstall**
Drag `Jot` to the Trash. To also delete data: `rm -rf ~/Library/Application\ Support/Jot`.

---

## Why am I doing this?

macOS Gatekeeper blocks any app that hasn't been notarized through Apple's paid developer program. This is normal for early indie / open‑source apps.

A fully notarized build is on the roadmap (see [`docs/release-signing.md`](docs/release-signing.md)). Once it ships, the install flow drops to **drag‑and‑drop, double‑click, done** — no Terminal, no Settings.

In the meantime, the source is right here for you to inspect: [github.com/parthha12/jot](https://github.com/parthha12/jot).
