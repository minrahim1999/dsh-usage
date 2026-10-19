# DSH Usage — experimental v0.1.0

Read-only **local recorded usage**, in **Settings → Usage** for DeepSeek Harness Desktop **0.2.1-rc.2 on macOS**. This exact installed version was verified; other releases/platforms are not supported yet. Not affiliated with DeepSeek.

## What it shows

All / 30d / 7d calendar periods, recorded tokens, active sessions, user + assistant messages, active days, model bars, and a model-filtered daily heatmap. All-time totals cover recorded history; the All heatmap shows only the latest 13 weeks. Calendar boundaries use the Host timezone. Bars show relative activity, not quota.

**Not billing, account usage, balance, cost, requests, or remaining quota.** Tokens come from assistant-reported `totalTokens`, or complete `inputTokens + outputTokens`. Missing/invalid reports remain unknown and totals are marked partial. Repeated request input context is included; auxiliary model activity may be absent. Messages include autonomous rounds and exclude tools/commands/stream chunks. Commands can make a day/session active without adding messages. Unknown model provenance stays unknown; model identity comes from recorded request headers, not current selection. Fork-inherited prefixes are excluded; live sessions take precedence.

## Privacy and trust

The Host reads existing local session metadata through native read-only persistence handles. No model calls, restore/attach/archive, history writes, telemetry, network fetches, or plugin-owned storage. Only aggregate counts, dates, coverage and provider/model labels reach the renderer. The owner-only RPC checks authorization before cache access. Aggregates may remain cached for 30 seconds; the mounted page refreshes every minute.

This is a trusted in-process plugin, **not a security sandbox**. Provider/model labels can contain personal custom names: review even aggregate screenshots before sharing. Do not attach profiles, histories, logs or real screenshots to issues.

## Installation status and compatibility

This is an **experimental GitHub release**, not a stable plugin or npm distribution. Package `private: true` prevents accidental npm publication. See the release assets for the installable package.

The new package identity is `dsh-usage`. The native Host entry `welcome-usage` and RPC `welcomeUsage/summary` intentionally remain stable. The original linked package is not renamed in place: this staging copy cannot change that running installation.

### Install from the GitHub source ZIP (macOS 0.2.1-rc.2)

1. Download `dsh-usage-v0.1.0-source.zip` from the v0.1.0 GitHub prerelease and extract it into a permanent directory. Do not move or delete that directory while installed: the dependency is a local link. The `.tgz` is an alternative packaged-source asset, **not** an npm publication; extract its `package/` directory and use that directory as `PLUGIN` if preferred.
2. Resolve your **actual selected Desktop profile directory** from the running Host's arguments/profile configuration, or Desktop's profile information. This is the directory containing that profile's `package.json`, not a workspace or session directory. Do not assume a `~/.dsh` path. If you cannot identify the selected profile, stop rather than modify an arbitrary directory. Quit Desktop yourself before changing a real profile; these release tests did not quit/restart any app or migrate a real profile.
3. Back up the profile's `package.json`, `pnpm-lock.yaml` (if present), and profile patch/configuration files outside the profile. Record the previous bundle selection. Set these variables to your resolved absolute paths (replace both placeholders):

```sh
PROFILE='/absolute/path/to/your/selected/profile'
PLUGIN='/absolute/path/to/extracted/dsh-usage-v0.1.0'
RUNTIME='/Applications/DeepSeek Harness.app/Contents/Resources/runtime/primary-runtime/dependencies'
test -f "$PROFILE/package.json" && test -f "$PLUGIN/cordis.patch.yml" || exit 1
cd "$PROFILE" || exit 1
"$RUNTIME/node/bin/node" "$RUNTIME/pnpm/bin/pnpm.cjs" add --offline --ignore-scripts "dsh-usage@link:$PLUGIN"
```

4. In that profile's `package.json`, preserve every unrelated field and edit only `dsh.profile.bundles`: append `"dsh-usage"` to the existing array. If migrating from the legacy `dsh-welcome-usage` bundle, **replace its selection** with `"dsh-usage"`, never select both. If an overlay separately inserts `welcome-usage`, disable/remove only that old insertion before selecting this bundle. The minimal relevant JSON shape is:

```json
{"dsh":{"profile":{"bundles":["dsh-usage"]}}}
```

This is an illustration, **not a replacement for your entire manifest**. Keep all other bundles. Do not copy dependencies from the signed app or install another Cordis runtime.
5. Open Desktop yourself and select **Settings → Usage**. Verify the page and filters before removing a legacy dependency. If activation fails, quit Desktop and restore only the previous bundle selection; remove `dsh-usage` with the scripts-disabled command below if needed. Keep unrelated later edits and all histories.

The exact shipped Node/pnpm `add --offline --ignore-scripts` command and bundle selection were exercised in a disposable profile and accepted by native profile composition. Separate native fixtures verify Loader activation, client serving, owner RPC/denial and removal, including the unpacked tarball. This is **not** proof of migration or visible activation in your real Desktop profile.

To deactivate, remove only `"dsh-usage"` from `dsh.profile.bundles`. To uninstall afterward, run from the resolved profile directory:

```sh
npm_config_offline=true npm_config_ignore_scripts=true "$RUNTIME/node/bin/node" "$RUNTIME/pnpm/bin/pnpm.cjs" remove dsh-usage
```

Preserve histories and unrelated configuration. Disposable native fixture activation/removal is verified; production-profile migration has **not** been executed.

## Development and verification

Requires Node with its native test runner plus an installed macOS Desktop 0.2.1-rc.2 at the standard Applications location for native integration tests. No production npm dependencies.

```sh
npm ci --ignore-scripts
npm test
npm run test:installed
npm pack --dry-run --json
```

Unit tests use synthetic metadata. Installed tests read native code from the existing signed app without modifying or bundling it. A disposable package-resolution/profile root exercises native Loader, Gateway, RemoteAccess, owner/non-owner peers, client serving and removal. No second real profile, GUI launch/restart, production model or prompt is used. Native Settings/React tests cover the post-RPC result envelope and filters. VM Modules emit Node's expected experimental warning.

The repository contains no app code or private reports. `examples/synthetic-events.json` is explicitly fabricated example input, not observed usage. Earlier live UI verification belongs to the unchanged legacy linked installation; it does not establish live activation of this renamed release candidate.

## License

MIT License. Copyright (c) 2026 Muhaimin Rahim. See LICENSE. Third-party dev dependencies retain their own licenses; they are not shipped in the plugin tarball.
