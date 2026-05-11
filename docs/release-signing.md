# Release signing & notarization — audit and upgrade path

This document is for **maintainers**. It captures the current packaging state of Jot, what is missing for a fully notarized public release, and the exact steps to flip the switch later with **no code changes** — only credentials and an icon.

> Today's shipping artifact is **ad‑hoc signed** (no Developer ID). That's fine for friends / YC demos / early testers; end users need the one‑command quarantine unblock in [`INSTALL.md`](../INSTALL.md). Notarization removes that step entirely.

---

## Current state (what's already in place)

| Concern | Status | Where |
| --- | --- | --- |
| Hardened runtime | ✅ Enabled | `package.json` → `build.mac.hardenedRuntime: true` |
| Entitlements | ✅ Present | `build/entitlements.mac.plist` (JIT, library validation off, unsigned exec memory — needed for Electron) |
| Notarization script | ✅ Wired, gated on env | `scripts/notarize.js` (called via `build.afterSign`) |
| Universal (arm64 + x64) build | ✅ Working | `npm run dist:universal` |
| Code signing identity | ⚠️ `null` (ad‑hoc) | `build.mac.identity: null` in `package.json` |
| Developer ID certificate | ❌ Not yet installed | Requires paid Apple Developer Program ($99/yr) |
| App‑specific password | ❌ Not yet generated | [appleid.apple.com](https://appleid.apple.com/) → Sign‑In and Security |
| App icon (`build/icon.icns`) | ❌ Missing — falls back to default Electron icon | Drop a `1024×1024` PNG → `iconutil` (see below) |
| DMG window layout | ✅ Polished | `build.dmg` block in `package.json` (Applications shortcut, sized window) |
| Artifact name | ✅ Clean | `Jot-${version}.dmg` / `Jot-${version}-mac.zip` |
| GitHub release workflow | ⚠️ Manual today (`gh release create`) | Could move to GitHub Actions later |

---

## What you need before notarizing

You need **all four** of these, end‑to‑end:

### 1. Apple Developer Program membership

- Sign up at [developer.apple.com/programs](https://developer.apple.com/programs/) — **$99 / year**.
- Approval typically takes a few hours to ~2 days.

### 2. "Developer ID Application" certificate

Once you're in the program:

1. Open **Xcode → Settings → Accounts**, sign in with your Apple ID.
2. Select your team → **Manage Certificates…**
3. Click **+** → **Developer ID Application**.
4. Confirm it appears in **Keychain Access → login → My Certificates** as `Developer ID Application: <Your Name> (TEAMID)`.

Alternatively via the web: [developer.apple.com/account → Certificates](https://developer.apple.com/account/resources/certificates/list) → **+** → **Developer ID Application**, follow the CSR flow, download and double‑click the `.cer`.

### 3. App‑specific password

Notarization needs a password distinct from your Apple ID password:

1. Go to [appleid.apple.com](https://appleid.apple.com/) → **Sign‑In and Security** → **App‑Specific Passwords**.
2. Create one, label it `jot-notarize`.
3. Save the value somewhere safe (you can't view it again).

### 4. Team ID

- Visible at [developer.apple.com/account](https://developer.apple.com/account) under **Membership details** → Team ID (10‑character alphanumeric).

---

## Doing a notarized release

Once the four above exist, a notarized universal build is a single command:

```bash
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCDE12345"

npm run dist:notarized
```

What happens:

1. `electron-builder` packages a **universal** `.app`.
2. It is signed with the `Developer ID Application` certificate found in your login keychain.
3. `scripts/notarize.js` (already wired as `afterSign`) submits the `.app` to Apple's notary service and waits.
4. The DMG and zip are built **after** notarization, stapling the ticket.

Result: `dist/Jot-<version>.dmg` and `dist/Jot-<version>-mac.zip` that open with **zero warnings** on any modern macOS.

The `INSTALL.md` quarantine step can be removed from the README at that point.

---

## App icon (recommended before next public release)

The default Electron icon is the single biggest visual hit on the current build. Generating a proper `.icns` is a one‑time chore:

1. Make a square **`1024×1024` PNG** of the Jot mark.
2. Run:

   ```bash
   mkdir Jot.iconset
   sips -z 16 16     icon-1024.png --out Jot.iconset/icon_16x16.png
   sips -z 32 32     icon-1024.png --out Jot.iconset/icon_16x16@2x.png
   sips -z 32 32     icon-1024.png --out Jot.iconset/icon_32x32.png
   sips -z 64 64     icon-1024.png --out Jot.iconset/icon_32x32@2x.png
   sips -z 128 128   icon-1024.png --out Jot.iconset/icon_128x128.png
   sips -z 256 256   icon-1024.png --out Jot.iconset/icon_128x128@2x.png
   sips -z 256 256   icon-1024.png --out Jot.iconset/icon_256x256.png
   sips -z 512 512   icon-1024.png --out Jot.iconset/icon_256x256@2x.png
   sips -z 512 512   icon-1024.png --out Jot.iconset/icon_512x512.png
   cp icon-1024.png            Jot.iconset/icon_512x512@2x.png
   iconutil -c icns Jot.iconset -o build/icon.icns
   rm -rf Jot.iconset
   ```

3. `electron-builder` picks `build/icon.icns` up automatically on next build — no config change needed.

---

## Hardening checklist for the v2.1 / v3 notarized release

- [ ] Apple Developer Program active
- [ ] `Developer ID Application` cert installed in login keychain (verify with `security find-identity -v -p codesigning | grep "Developer ID Application"`)
- [ ] `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` available (locally in shell, or as GitHub Actions secrets)
- [ ] `build/icon.icns` present
- [ ] `npm test` passes
- [ ] `npm run dist:notarized` succeeds (`spctl -a -vv -t install dist/Jot-*.dmg` returns `accepted source=Notarized Developer ID`)
- [ ] Sanity: drag‑install on a clean Mac, double‑click — opens with no Gatekeeper prompts
- [ ] Update `README.md` and `INSTALL.md` to drop the `xattr` step
- [ ] Tag, push, `gh release create` with new DMG/zip

---

## Why each entitlement is on

Located in `build/entitlements.mac.plist`. All are required by Electron / V8 under hardened runtime:

- `com.apple.security.cs.allow-jit` — V8 JIT.
- `com.apple.security.cs.allow-unsigned-executable-memory` — V8 codegen pages.
- `com.apple.security.cs.disable-library-validation` — Electron loads helper frameworks not signed by the same Team ID.
- `com.apple.security.app-sandbox: false` — Jot reads frontmost app via Automation; not feasible inside the sandbox.

If you ever want App Store distribution, that last one has to flip to `true` and the AppleScript bridge has to be replaced. Not a near‑term goal.
