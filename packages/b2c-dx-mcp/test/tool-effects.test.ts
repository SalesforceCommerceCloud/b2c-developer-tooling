/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {toToolAnnotations} from '../src/utils/index.js';

describe('tool effects', () => {
  it('distinguishes non-destructive writes from reads and destructive updates', () => {
    expect(toToolAnnotations({effect: 'write', idempotent: false, openWorld: true})).to.deep.equal({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    });
    expect(toToolAnnotations({effect: 'read', idempotent: true, openWorld: false})).to.deep.equal({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(toToolAnnotations({effect: 'destructive', idempotent: true, openWorld: false})).to.deep.equal({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
  });
});
