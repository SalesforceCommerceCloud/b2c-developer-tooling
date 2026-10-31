/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const diagnosticsChannel = require('node:diagnostics_channel');

// Usage inference publishes every reference search it runs on this channel
// as `{name, projectWide}` (see src/inference/reference-search.ts). A search
// served from the per-Program cache is not a run and is not published.
const REFERENCE_SEARCH_CHANNEL = '@salesforce/b2c-script-types:reference-search';

/**
 * Starts counting the reference searches usage inference runs: the
 * deterministic cost measure the performance baselines assert on. `total()`
 * counts every search, `projectWide()` those that read every file of the
 * program, and `local()` those confined to the one file that can refer to
 * the searched name. Call `stop()` when done.
 */
function countReferenceSearches() {
  const counts = {projectWide: 0, local: 0};
  const onSearch = (message) => {
    if (message.projectWide) counts.projectWide++;
    else counts.local++;
  };
  diagnosticsChannel.subscribe(REFERENCE_SEARCH_CHANNEL, onSearch);
  return {
    total: () => counts.projectWide + counts.local,
    projectWide: () => counts.projectWide,
    local: () => counts.local,
    reset() {
      counts.projectWide = 0;
      counts.local = 0;
    },
    stop: () => diagnosticsChannel.unsubscribe(REFERENCE_SEARCH_CHANNEL, onSearch),
  };
}

module.exports = {countReferenceSearches};
