/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Compute (and optionally write) the VS Code Marketplace VSIX version for a
 * release channel.
 *
 * WHY THE MARKETPLACE NUMBER IS DECOUPLED FROM THE CHANGESET/npm VERSION:
 *   - The Marketplace REST API HARD-REJECTS semver pre-release suffixes
 *     (`1.2.3-nightly.x`) — vsce throws on `semver.prerelease(version)`.
 *   - Each version component is capped SERVER-SIDE at int32 (2,147,483,647).
 *   - Every upload must be STRICTLY GREATER than the highest already-published
 *     version, and a pre-release and a stable can never share a number
 *     (Microsoft: "if 1.2.3 is uploaded as a pre-release, the next regular
 *     release must be uploaded with a distinct version, such as 1.2.4").
 *   - Convention: EVEN minor = stable, ODD minor = pre-release.
 * The changeset version walks its own path (1.0.2 -> 1.0.3 -> 1.1.0 ...) driven
 * by patch/minor/major changesets; it cannot satisfy the rules above. So it
 * stays the release TRIGGER and the git-tag / npm identity, while the
 * Marketplace number is computed here on its own monotonic line.
 *
 * THE MARKETPLACE LINE IS SELF-REFERENTIAL — it advances from what is ALREADY
 * present in the b2c-vs-extension GitHub releases, NOT from the changeset minor
 * (which would collide: a patch changeset recomputes the same stable; a minor
 * changeset lands on an odd minor). The caller passes the CURRENT published
 * Marketplace stable (the highest even-minor VSIX present in the releases; seed
 * 1.0.2 — the extension's real current stable) as --current-stable, and:
 *
 *   stable  : <major>.<curMinor + 2>.0            next even  e.g. 1.0.2 -> 1.2.0
 *   nightly : <major>.<curMinor + 1>.<YYYYMMDD>00 next odd   e.g. 1.0.2 -> 1.1.<d>00
 *   beta    : <major>.<curMinor + 1>.<YYYYMMDD>NN NN=01..99  e.g. 1.0.2 -> 1.1.<d>NN
 *   rc      : <major>.<curMinor + 1>.<YYYYMMDD>D  D =1..9     e.g. 1.0.2 -> 1.1.<d>D
 *
 * So a whole release cycle shares ONE odd pre-release minor (curMinor+1) that is
 * strictly above the current stable, and its promotion target is the next even
 * minor (curMinor+2). After 1.2.0 is promoted (present in releases), the next
 * cycle reads current=1.2.0 -> pre-release 1.3.x, stable 1.4.0. The current
 * stable MUST be even (odd => a pre-release leaked in as the base) — fail closed.
 *
 * Within a day: beta(01..99) > nightly(00); rc uses a 9-digit patch
 * (<YYYYMMDD>D) so it sits numerically BELOW same-day nightly/beta — intentional
 * and accepted: rc is the human-gated candidate promoted to stable (build-once),
 * not a competitor for "newest pre-release".
 *
 * All patches stay < int32 through year 2147. Every result is validated as a
 * plain 3-part numeric version AND against the int32 cap, and the script FAILS
 * CLOSED on any breach — a bad version must never reach an irreversible
 * Marketplace publish.
 *
 * Usage:
 *   node scripts/marketplace-version.mjs --channel <nightly|beta|rc|stable> \
 *        --current-stable <x.y.z> [--date <YYYYMMDD>] [--seq <N>] [--write] [--self-test]
 *
 *   --current-stable  the CURRENT published Marketplace stable version — the
 *                     highest EVEN-minor VSIX already present in the
 *                     b2c-vs-extension GitHub releases (the workflow scans the
 *                     release assets; seed 1.0.2 when none exists yet). This is
 *                     the driver for EVERY channel. Read from release history,
 *                     never from package.json (the changeset version), so the
 *                     Marketplace line stays monotonic across cycles.
 *   --date   UTC date stamp YYYYMMDD. Defaults to today (UTC). Ignored for stable.
 *   --seq    beta: 1..99 (sequence within the day). rc: 1..9. Ignored otherwise.
 *   --write  write the computed version back into package.json (so `vsce
 *            package` bakes it); otherwise only prints to stdout.
 *
 * Prints the computed version to stdout (last line) for capture by the workflow.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const INT32_MAX = 2147483647;
const CHANNELS = new Set(['nightly', 'beta', 'rc', 'stable']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.resolve(__dirname, '..', 'package.json');

function parseArgs(argv) {
  const args = {write: false, selfTest: false};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') args.write = true;
    else if (a === '--self-test') args.selfTest = true;
    else if (a === '--channel') args.channel = argv[++i];
    else if (a === '--current-stable') args.currentStable = argv[++i];
    else if (a === '--date') args.date = argv[++i];
    else if (a === '--seq') args.seq = argv[++i];
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

/** Parse "x.y.z" into integers; reject anything that is not a clean 3-part. */
function parseVersion(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version).trim());
  if (!m) throw new Error(`version is not a clean x.y.z: "${version}"`);
  return {major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3])};
}

/** Today's UTC date as YYYYMMDD. */
function utcDateStamp(now) {
  const y = now.getUTCFullYear();
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}${mo}${d}`;
}

/** Validate a YYYYMMDD stamp shape + plausible calendar range. */
function assertDateStamp(stamp) {
  if (!/^\d{8}$/.test(stamp)) throw new Error(`--date must be YYYYMMDD, got "${stamp}"`);
  const year = Number(stamp.slice(0, 4));
  const mo = Number(stamp.slice(4, 6));
  const d = Number(stamp.slice(6, 8));
  if (year < 2020 || year > 2147) throw new Error(`--date year out of range (2020-2147): ${year}`);
  if (mo < 1 || mo > 12) throw new Error(`--date month invalid: ${mo}`);
  if (d < 1 || d > 31) throw new Error(`--date day invalid: ${d}`);
}

/**
 * Core computation. Returns the marketplace version string for the channel,
 * derived from the CURRENT published Marketplace stable (currentStable). Pure —
 * no I/O — so it is directly unit-testable via --self-test.
 */
export function computeVersion({channel, currentStable, dateStamp, seq}) {
  if (!CHANNELS.has(channel)) {
    throw new Error(`--channel must be one of ${[...CHANNELS].join('|')}, got "${channel}"`);
  }
  const {major, minor} = parseVersion(currentStable);
  // The current Marketplace stable is even by construction (every promotion
  // lands on an even minor). An odd minor here means a pre-release version
  // leaked in as the base — refuse it rather than derive a colliding number.
  if (minor % 2 !== 0) {
    throw new Error(`--current-stable minor must be EVEN (got "${currentStable}"); it should be the current published stable, not a pre-release`);
  }

  let version;
  if (channel === 'stable') {
    // Promotion target: the next even minor above the current stable.
    version = `${major}.${minor + 2}.0`;
  } else {
    // Pre-release channels share the odd minor just above the current stable.
    assertDateStamp(dateStamp);
    const preMinor = minor + 1;
    let patchStr;
    if (channel === 'nightly') {
      // exactly one per weekday; the "00" tail keeps it below same-day betas.
      patchStr = `${dateStamp}00`;
    } else if (channel === 'beta') {
      const n = Number(seq);
      if (!Number.isInteger(n) || n < 1 || n > 99) {
        throw new Error(`beta --seq must be an integer 1..99, got "${seq}"`);
      }
      patchStr = `${dateStamp}${String(n).padStart(2, '0')}`;
    } else {
      // rc: single-digit 1..9 tail -> 9-digit patch (see ordering note above).
      const n = Number(seq);
      if (!Number.isInteger(n) || n < 1 || n > 9) {
        throw new Error(`rc --seq must be an integer 1..9, got "${seq}"`);
      }
      patchStr = `${dateStamp}${n}`;
    }
    version = `${major}.${preMinor}.${patchStr}`;
  }

  assertMarketplaceSafe(version);
  return version;
}

/**
 * Fail-closed gate: every component must be a valid integer within int32, and
 * the whole string must be a plain 3-part numeric version (no pre-release
 * suffix, no build metadata) — exactly what the Marketplace REST API accepts.
 */
function assertMarketplaceSafe(version) {
  const parts = version.split('.');
  if (parts.length !== 3) throw new Error(`version must be 3-part, got "${version}"`);
  for (const p of parts) {
    if (!/^\d+$/.test(p)) throw new Error(`version component not a plain integer: "${p}" in "${version}"`);
    if (p.length > 1 && p.startsWith('0')) throw new Error(`version component has a leading zero: "${p}"`);
    const n = Number(p);
    if (n > INT32_MAX) {
      throw new Error(`version component ${n} exceeds int32 cap ${INT32_MAX} — marketplace would reject "${version}"`);
    }
  }
}

function selfTest() {
  const cases = [
    // stable = next even minor above the current stable
    [{channel: 'stable', currentStable: '1.0.2'}, '1.2.0'],
    [{channel: 'stable', currentStable: '1.2.0'}, '1.4.0'],
    [{channel: 'stable', currentStable: '1.4.0'}, '1.6.0'],
    // pre-release channels = odd minor just above the current stable
    [{channel: 'nightly', currentStable: '1.0.2', dateStamp: '20260720'}, '1.1.2026072000'],
    [{channel: 'beta', currentStable: '1.0.2', dateStamp: '20260720', seq: '1'}, '1.1.2026072001'],
    [{channel: 'beta', currentStable: '1.0.2', dateStamp: '20260720', seq: '99'}, '1.1.2026072099'],
    [{channel: 'rc', currentStable: '1.0.2', dateStamp: '20260720', seq: '1'}, '1.1.202607201'],
    [{channel: 'rc', currentStable: '1.0.2', dateStamp: '20260720', seq: '9'}, '1.1.202607209'],
    // next cycle: current stable has advanced to 1.2.0
    [{channel: 'rc', currentStable: '1.2.0', dateStamp: '20270101', seq: '1'}, '1.3.202701011'],
    [{channel: 'nightly', currentStable: '2.4.0', dateStamp: '20270101'}, '2.5.2027010100'],
  ];
  let pass = 0;
  for (const [input, expected] of cases) {
    const got = computeVersion(input);
    const ok = got === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(input)} -> ${got}${ok ? '' : ` (expected ${expected})`}`);
    if (ok) pass++;
  }
  // Ordering invariants on the shared pre-release line (same day, same base).
  const day = '20260720';
  const nightly = Number(computeVersion({channel: 'nightly', currentStable: '1.0.2', dateStamp: day}).split('.')[2]);
  const betaLo = Number(computeVersion({channel: 'beta', currentStable: '1.0.2', dateStamp: day, seq: '1'}).split('.')[2]);
  const betaHi = Number(computeVersion({channel: 'beta', currentStable: '1.0.2', dateStamp: day, seq: '99'}).split('.')[2]);
  const rcHi = Number(computeVersion({channel: 'rc', currentStable: '1.0.2', dateStamp: day, seq: '9'}).split('.')[2]);
  const ordOk = betaLo > nightly && betaHi > betaLo && rcHi < nightly;
  console.log(`${ordOk ? 'PASS' : 'FAIL'}  ordering: beta(01..99) > nightly(00) > rc(...D)`);
  // Cross-channel monotonicity within a cycle: current < pre-release < stable.
  const cur = '1.0.2';
  const preV = computeVersion({channel: 'rc', currentStable: cur, dateStamp: day, seq: '1'});
  const stableV = computeVersion({channel: 'stable', currentStable: cur});
  const curMinor = Number(cur.split('.')[1]);
  const preMinor = Number(preV.split('.')[1]);
  const stableMinor = Number(stableV.split('.')[1]);
  const cycleOk = preMinor === curMinor + 1 && stableMinor === curMinor + 2 && preMinor % 2 === 1 && stableMinor % 2 === 0;
  console.log(`${cycleOk ? 'PASS' : 'FAIL'}  cycle: current(${curMinor},even) < pre-release(${preMinor},odd) < stable(${stableMinor},even)`);
  // Failure cases must throw.
  const mustThrow = [
    {channel: 'stable', currentStable: '1.1.0'}, // odd current stable -> fail closed
    {channel: 'rc', currentStable: '1.1.0', dateStamp: day, seq: '1'},
    {channel: 'beta', currentStable: '1.0.2', dateStamp: day, seq: '100'},
    {channel: 'rc', currentStable: '1.0.2', dateStamp: day, seq: '10'},
    {channel: 'nightly', currentStable: 'not-a-version', dateStamp: day},
    {channel: 'bogus', currentStable: '1.0.2', dateStamp: day},
  ];
  let threw = 0;
  for (const input of mustThrow) {
    try {
      computeVersion(input);
      console.log(`FAIL  expected throw for ${JSON.stringify(input)}`);
    } catch {
      threw++;
    }
  }
  console.log(`${threw === mustThrow.length ? 'PASS' : 'FAIL'}  ${threw}/${mustThrow.length} invalid inputs rejected`);
  const allOk = pass === cases.length && ordOk && cycleOk && threw === mustThrow.length;
  console.log(allOk ? '\nself-test: ALL PASS' : '\nself-test: FAILURES PRESENT');
  process.exit(allOk ? 0 : 1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) return selfTest();
  if (!args.channel) throw new Error('--channel is required');
  if (!args.currentStable) {
    throw new Error('--current-stable is required (the current published Marketplace stable, scanned from GitHub releases; seed 1.0.2)');
  }

  const dateStamp = args.date ?? utcDateStamp(new Date());
  const version = computeVersion({
    channel: args.channel,
    currentStable: args.currentStable,
    dateStamp,
    seq: args.seq,
  });

  if (args.write) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.error(`[marketplace-version] wrote ${version} to ${pkgPath}`);
  }
  // stdout: the version only, for `VERSION=$(node scripts/marketplace-version.mjs ...)`
  console.log(version);
}

main();
