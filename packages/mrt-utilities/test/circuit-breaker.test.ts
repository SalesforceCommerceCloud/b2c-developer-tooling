/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
// Imported via a relative path, not the package barrel: CircuitBreaker is an internal
// implementation detail of the data store, not part of the published API surface.
import {CircuitBreaker} from '../src/data-store/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let clock: number;
  const now = () => clock;

  const makeBreaker = (overrides: Partial<Parameters<typeof CircuitBreaker>[0]> = {}) =>
    new CircuitBreaker({
      failureThreshold: 3,
      throttleWeight: 2,
      cooldownMs: 1_000,
      halfOpenProbes: 1,
      now,
      ...overrides,
    });

  beforeEach(() => {
    clock = 0;
  });

  it('starts closed and admits requests', () => {
    const breaker = makeBreaker();
    expect(breaker.state).to.equal('closed');
    expect(breaker.canRequest()).to.equal(true);
  });

  it('opens once accumulated plain failures reach the threshold', () => {
    const breaker = makeBreaker({failureThreshold: 3});
    breaker.recordFailure(false);
    breaker.recordFailure(false);
    expect(breaker.state).to.equal('closed');
    breaker.recordFailure(false);
    expect(breaker.state).to.equal('open');
    expect(breaker.canRequest()).to.equal(false);
  });

  it('weights throttling failures heavier when tripping', () => {
    const breaker = makeBreaker({failureThreshold: 4, throttleWeight: 2});
    breaker.recordFailure(true); // 2
    breaker.recordFailure(true); // 4 => trip
    expect(breaker.state).to.equal('open');
  });

  it('decays the failure score on a success while closed', () => {
    const breaker = makeBreaker({failureThreshold: 2});
    breaker.recordFailure(false); // 1
    breaker.recordSuccess(); // reset to 0
    breaker.recordFailure(false); // 1, not 2
    expect(breaker.state).to.equal('closed');
  });

  it('stays open until the cooldown elapses, then admits a half-open probe', () => {
    const breaker = makeBreaker({failureThreshold: 1, cooldownMs: 1_000});
    breaker.recordFailure(false);
    expect(breaker.state).to.equal('open');

    clock = 999;
    expect(breaker.canRequest()).to.equal(false);
    expect(breaker.state).to.equal('open');

    clock = 1_000;
    expect(breaker.canRequest()).to.equal(true);
    expect(breaker.state).to.equal('half-open');
  });

  it('closes after the required number of successful probes', () => {
    const breaker = makeBreaker({failureThreshold: 1, cooldownMs: 1_000, halfOpenProbes: 2});
    breaker.recordFailure(false);
    clock = 1_000;
    breaker.canRequest(); // -> half-open
    breaker.recordSuccess(); // 1 of 2
    expect(breaker.state).to.equal('half-open');
    breaker.recordSuccess(); // 2 of 2
    expect(breaker.state).to.equal('closed');
  });

  it('re-opens on any failure while half-open', () => {
    const breaker = makeBreaker({failureThreshold: 1, cooldownMs: 1_000});
    breaker.recordFailure(false);
    clock = 1_000;
    breaker.canRequest(); // -> half-open
    breaker.recordFailure(false);
    expect(breaker.state).to.equal('open');
  });

  it('admits only up to halfOpenProbes concurrent probes; further callers fail fast', () => {
    const breaker = makeBreaker({failureThreshold: 1, cooldownMs: 1_000, halfOpenProbes: 1});
    breaker.recordFailure(false);
    clock = 1_000;

    // First caller is admitted as the probe...
    expect(breaker.canRequest()).to.equal(true);
    expect(breaker.state).to.equal('half-open');
    // ...concurrent callers, before the probe resolves, are turned away.
    expect(breaker.canRequest()).to.equal(false);
    expect(breaker.canRequest()).to.equal(false);
  });

  it('admits a fresh probe after an in-flight probe resolves without closing', () => {
    const breaker = makeBreaker({failureThreshold: 1, cooldownMs: 1_000, halfOpenProbes: 2});
    breaker.recordFailure(false);
    clock = 1_000;

    expect(breaker.canRequest()).to.equal(true); // probe 1 in flight
    expect(breaker.canRequest()).to.equal(true); // probe 2 in flight (budget 2)
    expect(breaker.canRequest()).to.equal(false); // budget exhausted
    breaker.recordSuccess(); // probe 1 resolves; 1 of 2 successes, still half-open
    expect(breaker.state).to.equal('half-open');
    expect(breaker.canRequest()).to.equal(true); // slot freed, admit another
  });

  it('does not open under a mixed failure/success stream (successes reset the score)', () => {
    const breaker = makeBreaker({failureThreshold: 3});
    // Alternating fail/success never accumulates to the threshold.
    for (let i = 0; i < 20; i++) {
      breaker.recordFailure(i % 2 === 0); // vary throttled vs not
      breaker.recordSuccess();
    }
    expect(breaker.state).to.equal('closed');
  });

  it('resets the cooldown window when it re-opens from half-open', () => {
    const breaker = makeBreaker({failureThreshold: 1, cooldownMs: 1_000});
    breaker.recordFailure(false); // opened at t=0
    clock = 1_000;
    breaker.canRequest(); // -> half-open
    breaker.recordFailure(false); // re-opened at t=1000

    clock = 1_500; // only 500ms since re-open
    expect(breaker.canRequest()).to.equal(false);
    clock = 2_000; // full cooldown since re-open
    expect(breaker.canRequest()).to.equal(true);
  });

  it('ignores a late failure that arrives while already open', () => {
    const breaker = makeBreaker({failureThreshold: 1});
    breaker.recordFailure(false);
    expect(breaker.state).to.equal('open');
    // A call that started before opening lands late — must not extend/alter state.
    breaker.recordFailure(false);
    expect(breaker.state).to.equal('open');
  });

  it('notifies onTransition for every state change with from/to/reason', () => {
    const onTransition = sinon.stub();
    const breaker = makeBreaker({failureThreshold: 1, cooldownMs: 1_000, onTransition});

    breaker.recordFailure(true); // closed -> open
    clock = 1_000;
    breaker.canRequest(); // open -> half-open
    breaker.recordSuccess(); // half-open -> closed

    expect(onTransition.callCount).to.equal(3);
    const transitions = onTransition.getCalls().map((c) => ({from: c.args[0].from, to: c.args[0].to}));
    expect(transitions).to.deep.equal([
      {from: 'closed', to: 'open'},
      {from: 'open', to: 'half-open'},
      {from: 'half-open', to: 'closed'},
    ]);
    for (const call of onTransition.getCalls()) {
      expect(call.args[0].reason).to.be.a('string').and.not.empty;
    }
  });

  it('defaults the clock to Date.now when none is injected', () => {
    // Just exercises the default-now branch; behavior is unchanged when never opened.
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      throttleWeight: 2,
      cooldownMs: 0,
      halfOpenProbes: 1,
    });
    expect(breaker.canRequest()).to.equal(true);
    breaker.recordFailure(false);
    // cooldownMs 0 => immediately eligible for a probe.
    expect(breaker.canRequest()).to.equal(true);
    expect(breaker.state).to.equal('half-open');
  });
});
