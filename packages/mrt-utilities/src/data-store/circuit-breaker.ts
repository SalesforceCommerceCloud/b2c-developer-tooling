/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Circuit-breaker states.
 *
 * - `closed`: requests flow through; failures are counted toward the trip threshold.
 * - `open`: requests fail fast without touching the backend, for a cooldown window.
 * - `half-open`: a limited number of probe requests are allowed; success closes the
 *   breaker, any failure re-opens it.
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * A state transition, emitted for observability.
 */
export interface CircuitBreakerTransition {
  from: CircuitBreakerState;
  to: CircuitBreakerState;
  /** The reason the transition happened, for the telemetry message. */
  reason: string;
}

/**
 * Tuning for the circuit breaker. All fields are engineering-tuned defaults; they are
 * internal constants at the call site (only an on/off kill switch is env-configurable), but
 * kept injectable so tests can drive transitions deterministically.
 */
export interface CircuitBreakerOptions {
  /**
   * Failure weight (in "points") needed to trip the breaker from closed to open. A plain
   * failure contributes 1 point; a throttling failure contributes {@link throttleWeight}.
   */
  failureThreshold: number;
  /**
   * Points contributed by a throttling failure. Weighted heavier than a plain failure
   * because throttles are the signal this breaker exists to shed load for.
   */
  throttleWeight: number;
  /** How long (ms) the breaker stays open before allowing a half-open probe. */
  cooldownMs: number;
  /** Number of consecutive successful probes in half-open required to close the breaker. */
  halfOpenProbes: number;
  /** Injectable clock (ms epoch) for deterministic tests. Defaults to `Date.now`. */
  now?: () => number;
  /** Callback invoked on every state transition, for telemetry. */
  onTransition?: (transition: CircuitBreakerTransition) => void;
}

/**
 * A per-instance, in-memory circuit breaker.
 *
 * Load-shedding for a single warm execution environment — state is NOT shared across the
 * fleet and does not survive a cold start (which begins `closed`). This is intentional: it
 * is a local guard that stops a container from hammering an already-saturated backend, not a
 * coordinated fleet-wide switch.
 *
 * The breaker is policy-only: it decides whether a call may proceed ({@link canRequest}) and
 * records outcomes ({@link recordSuccess} / {@link recordFailure}). It never calls the
 * backend itself, so it is trivially testable and reusable.
 */
export class CircuitBreaker {
  private _state: CircuitBreakerState = 'closed';
  /** Accumulated failure points while closed. */
  private _failureScore = 0;
  /** Successful probes recorded while half-open. */
  private _probeSuccesses = 0;
  /** Probes admitted but not yet resolved while half-open (concurrency budget). */
  private _probesInFlight = 0;
  /** Epoch ms when the breaker opened; used to time the cooldown. */
  private _openedAt = 0;

  private readonly _failureThreshold: number;
  private readonly _throttleWeight: number;
  private readonly _cooldownMs: number;
  private readonly _halfOpenProbes: number;
  private readonly _now: () => number;
  private readonly _onTransition?: (transition: CircuitBreakerTransition) => void;

  constructor(options: CircuitBreakerOptions) {
    this._failureThreshold = options.failureThreshold;
    this._throttleWeight = options.throttleWeight;
    this._cooldownMs = options.cooldownMs;
    this._halfOpenProbes = options.halfOpenProbes;
    this._now = options.now ?? Date.now;
    this._onTransition = options.onTransition;
  }

  /**
   * The current state. This is a pure read and never advances the machine — the open→half-open
   * transition happens only when a caller asks to proceed via {@link canRequest}.
   */
  get state(): CircuitBreakerState {
    return this._state;
  }

  /**
   * Whether a request may proceed to the backend right now.
   *
   * - `closed`: always true.
   * - `open`: false until the cooldown elapses, then transitions to half-open and returns
   *   true to admit the first probe.
   * - `half-open`: true only while fewer than {@link CircuitBreakerOptions.halfOpenProbes}
   *   probes are in flight — the caller must report each admitted probe's outcome via
   *   {@link recordSuccess} / {@link recordFailure}. This caps the probe burst so concurrent
   *   callers on one warm container don't stampede a backend that may still be saturated.
   *
   * @returns true if the request should be attempted, false if it should fail fast
   */
  canRequest(): boolean {
    if (this._state === 'open') {
      if (this._now() - this._openedAt >= this._cooldownMs) {
        this.transition('half-open', 'cooldown elapsed; probing');
        this._probesInFlight += 1;
        return true;
      }
      return false;
    }
    if (this._state === 'half-open') {
      // Admit only up to the probe budget; further concurrent callers fail fast until an
      // in-flight probe resolves (closing the breaker on success, re-opening on failure).
      if (this._probesInFlight < this._halfOpenProbes) {
        this._probesInFlight += 1;
        return true;
      }
      return false;
    }
    return true;
  }

  /**
   * Record a successful backend call. Closes the breaker once enough probes succeed in
   * half-open; resets the failure score in closed.
   */
  recordSuccess(): void {
    if (this._state === 'half-open') {
      this._probesInFlight = Math.max(0, this._probesInFlight - 1);
      this._probeSuccesses += 1;
      if (this._probeSuccesses >= this._halfOpenProbes) {
        this.transition('closed', 'probe succeeded; recovered');
      }
      return;
    }
    // A success in the closed state is the healthy path — reset the failure score so only a
    // sustained, near-uninterrupted run of failures (not an intermittent trickle interleaved
    // with successes) can open the breaker. This is what keeps normal miss/hit traffic from
    // ever tripping it.
    this._failureScore = 0;
  }

  /**
   * Record a failed backend call.
   *
   * @param throttled Whether the failure was a throttling response (weighted heavier).
   */
  recordFailure(throttled: boolean): void {
    if (this._state === 'half-open') {
      // Any failure during probing means the backend has not recovered.
      this._probesInFlight = Math.max(0, this._probesInFlight - 1);
      this.transition('open', 'probe failed; backend still unhealthy');
      return;
    }
    if (this._state === 'open') {
      // Already open (e.g. a call that started before opening lands late) — nothing to do.
      return;
    }
    this._failureScore += throttled ? this._throttleWeight : 1;
    if (this._failureScore >= this._failureThreshold) {
      this.transition('open', throttled ? 'failure threshold reached (throttling)' : 'failure threshold reached');
    }
  }

  private transition(to: CircuitBreakerState, reason: string): void {
    const from = this._state;
    if (from === to) {
      return;
    }
    this._state = to;
    if (to === 'open') {
      this._openedAt = this._now();
      this._failureScore = 0;
      this._probeSuccesses = 0;
      this._probesInFlight = 0;
    } else if (to === 'half-open') {
      this._probeSuccesses = 0;
      // Note: the admitting caller in canRequest() increments _probesInFlight after this
      // transition runs, so it must start from zero here.
      this._probesInFlight = 0;
    } else {
      // closed
      this._failureScore = 0;
      this._probeSuccesses = 0;
      this._probesInFlight = 0;
    }
    this._onTransition?.({from, to, reason});
  }
}
