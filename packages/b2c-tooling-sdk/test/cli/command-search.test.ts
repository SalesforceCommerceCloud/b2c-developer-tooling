/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {CommandSearchIndex, type SearchableCommand} from '@salesforce/b2c-tooling-sdk/cli';

const COMMANDS: SearchableCommand[] = [
  {
    id: 'code:deploy',
    summary: 'Deploy cartridges to a B2C Commerce instance',
    examples: [
      '<%= config.bin %> <%= command.id %> --reload',
      {command: '<%= config.bin %> <%= command.id %> -c app', description: 'x'},
    ],
    flags: {
      reload: {description: 'Reload the code version after deploy'},
      server: {description: 'Instance hostname', helpGroup: 'INSTANCE'},
    },
  },
  {id: 'code:list', summary: 'List code versions'},
  {id: 'sandbox:reset', summary: 'Reset an on-demand sandbox', aliases: ['ods:reset']},
  // oclif materializes aliases as separate entries whose id is the alias
  {id: 'ods:reset', summary: 'Reset an on-demand sandbox', aliases: ['ods:reset']},
  {id: 'mrt:env:var:set', summary: 'Set environment variables'},
  {id: 'mrt:push', summary: 'Push a bundle', state: 'deprecated'},
  {id: 'mrt:bundle:deploy', summary: 'Push a bundle to Managed Runtime'},
  {id: 'internal:secret', summary: 'Deploy secret things', hidden: true},
  {id: 'logs:tail', description: 'Tail instance logs.\n\nStreams log files in real time.'},
];

const TOPICS = [
  {name: 'mrt', description: 'Managed Runtime commands for PWA Kit storefronts'},
  {name: 'mrt:env', description: 'Manage environments'},
];

describe('cli/command-search', () => {
  const index = new CommandSearchIndex(COMMANDS, TOPICS);

  it('indexes only non-hidden commands', () => {
    expect(index.size).to.equal(7);
    expect(index.search('secret').map((r) => r.id)).to.not.include('internal:secret');
  });

  it('ranks the matching command first and renders display fields', () => {
    const [top] = index.search('deploy cartridges');
    expect(top.id).to.equal('code:deploy');
    expect(top.command).to.equal('b2c code deploy');
    expect(top.topic).to.equal('code');
    expect(top.examples).to.deep.equal(['b2c code deploy --reload', 'b2c code deploy -c app']);
  });

  it('uses the first description line when no summary is set', () => {
    const [top] = index.search('tail logs');
    expect(top.id).to.equal('logs:tail');
    expect(top.summary).to.equal('Tail instance logs.');
  });

  it('matches aliases without duplicating alias entries', () => {
    const results = index.search('ods reset');
    expect(results.map((r) => r.id)).to.not.include('ods:reset');
    const [top] = results;
    expect(top.id).to.equal('sandbox:reset');
    expect(top.aliases).to.deep.equal(['ods reset']);
  });

  it('matches parent topic descriptions', () => {
    const ids = index.search('pwa kit').map((r) => r.id);
    expect(ids).to.include('mrt:env:var:set');
  });

  it('matches command-specific flags but not base-class flags', () => {
    expect(index.search('reload')[0]?.id).to.equal('code:deploy');
    expect(index.search('hostname')).to.have.length(0);
  });

  it('tolerates typos and prefixes', () => {
    expect(index.search('sandbx')[0]?.id).to.equal('sandbox:reset');
    expect(index.search('depl')[0]?.id).to.be.oneOf(['code:deploy', 'mrt:bundle:deploy']);
  });

  it('marks and demotes deprecated commands', () => {
    const results = index.search('push bundle');
    expect(results[0].id).to.equal('mrt:bundle:deploy');
    const deprecated = results.find((r) => r.id === 'mrt:push');
    expect(deprecated?.deprecated).to.equal(true);
  });

  it('filters by topic (colon or space separated)', () => {
    expect(index.search('deploy', {topic: 'mrt'}).map((r) => r.id)).to.deep.equal(['mrt:bundle:deploy']);
    expect(index.search('set', {topic: 'mrt env'}).map((r) => r.id)).to.deep.equal(['mrt:env:var:set']);
  });

  it('applies limit and custom bin', () => {
    const results = index.search('code', {limit: 1, bin: 'mycli'});
    expect(results).to.have.length(1);
    expect(results[0].command).to.match(/^mycli code /);
  });

  it('returns no results for unrelated queries', () => {
    expect(index.search('zzzzqqq')).to.deep.equal([]);
  });
});
