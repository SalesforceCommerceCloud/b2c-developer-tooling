/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  describeAuthSession,
  describeInstanceAuth,
  listAuthSessions,
  type InstanceAuthSession,
  type InstanceAuthSummary,
  type InstanceAuthTarget,
} from '@salesforce/b2c-tooling-sdk/auth';
import {t, withDocs} from '../../i18n/index.js';
import {clientLabel, describeAccessToken, describeAuthPath, describeSessionState} from '../../utils/auth/describe.js';

/** A stored session, with what the current instance uses it for. */
type StatusSession = Omit<InstanceAuthSession, 'usedFor'> & {usedFor?: InstanceAuthTarget[]};

interface AuthStatusResponse {
  /** How the configured instance authenticates, when one is configured. */
  instance?: Omit<InstanceAuthSummary, 'sessions'> & {hostname: string};
  /** All stored sessions. */
  sessions: StatusSession[];
}

const COLUMNS: Record<string, ColumnDef<StatusSession>> = {
  client: {header: 'Client', get: (s) => clientLabel(s.clientId, s.builtInClient)},
  user: {header: 'User', get: (s) => s.user ?? '-'},
  flow: {header: 'Flow', get: (s) => s.flow},
  access: {header: 'Access Token', get: (s) => describeAccessToken(s)},
  refresh: {header: 'Renews', get: (s) => (s.canRefresh ? 'Yes' : 'No')},
  usedFor: {header: 'This Instance', get: (s) => s.usedFor?.join(', ') || '-'},
};

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Show stored Account Manager sessions and how the configured instance
 * authenticates. Sessions are stored per client, so one sign-in can serve
 * several instances.
 */
export default class AuthStatus extends BaseCommand<typeof AuthStatus> {
  static description = withDocs(
    t('commands.auth.status.description', 'Show stored sessions and how the configured instance authenticates'),
    '/cli/auth.html#b2c-auth-status',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.example.com',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  async run(): Promise<AuthStatusResponse> {
    const {values} = this.resolvedConfig;
    const summary = values.hostname
      ? describeInstanceAuth(values, {defaultWebDavClient: true, reuseUnconfiguredSession: true})
      : undefined;
    const sessions: StatusSession[] = listAuthSessions().map((session) => ({
      ...describeAuthSession(session, values.accountManagerHost),
      usedFor: summary?.sessions.find((s) => s.clientId === session.clientId)?.usedFor,
    }));

    const response: AuthStatusResponse = {sessions};
    if (summary && values.hostname) {
      const {sessions: _used, ...paths} = summary;
      response.instance = {hostname: values.hostname, ...paths};
    }
    if (this.jsonEnabled()) return response;

    if (summary && values.hostname) {
      ux.stdout(t('commands.auth.status.instance', 'Instance {{hostname}}', {hostname: values.hostname}));
      for (const [label, path] of [
        ['WebDAV', summary.webdav],
        ['OCAPI', summary.ocapi],
        ['SCAPI', summary.scapi],
      ] as const) {
        const session = path.clientId ? summary.sessions.find((s) => s.clientId === path.clientId) : undefined;
        const state = describeSessionState(path, session);
        ux.stdout(`  ${label.padEnd(8)}${describeAuthPath(path)}${state ? ` — ${state}` : ''}`);
      }
      ux.stdout('');
    }

    if (sessions.length === 0) {
      ux.stdout(t('commands.auth.status.noSessions', 'No stored sessions.'));
      return response;
    }
    tableRenderer.render(
      sessions,
      summary ? Object.keys(COLUMNS) : Object.keys(COLUMNS).filter((c) => c !== 'usedFor'),
    );
    ux.stdout(
      '\n' +
        t(
          'commands.auth.status.hint',
          'Sessions are stored per Account Manager client and shared across instances. Sign out with "b2c auth logout".',
        ),
    );
    return response;
  }
}
