/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  // PUT replaces every client's origins for the site; merge into the current state instead.
  const path = '/configuration/cors/v1/organizations/' + encodeURIComponent(organizationId) + '/cors';
  const query = {siteId: input.siteId};
  const before = await scapi.request({method: 'GET', path, query});
  if (!before.ok) return {stage: 'inspect', ...before};
  const current = before.data?.corsClientPreferences ?? [];
  const byClient = new Map(current.map((c) => [c.clientId, [...(c.origins ?? [])]]));
  const origins = byClient.get(input.clientId) ?? [];
  const add = (input.add ?? []).filter((o) => !origins.includes(o));
  const remove = (input.remove ?? []).filter((o) => origins.includes(o));
  if (!add.length && !remove.length)
    return {state: 'unchanged', siteId: input.siteId, clientId: input.clientId, origins};
  const next = [...origins.filter((o) => !remove.includes(o)), ...add];
  if (next.length) byClient.set(input.clientId, next);
  else byClient.delete(input.clientId);
  const body = {corsClientPreferences: [...byClient].map(([clientId, o]) => ({clientId, origins: o}))};
  // Removing the last client cannot be expressed as a merge; DELETE clears every client for the site.
  const written = body.corsClientPreferences.length
    ? await scapi.request({method: 'PUT', path, query, body})
    : await scapi.request({method: 'DELETE', path, query});
  if (!written.ok) return {stage: 'write', siteId: input.siteId, added: add, removed: remove, ...written};
  const after = await scapi.request({method: 'GET', path, query});
  if (!after.ok) return {stage: 'verify', writeStatus: written.status, ...after};
  const saved = (after.data?.corsClientPreferences ?? []).find((c) => c.clientId === input.clientId)?.origins ?? [];
  const verified = next.length === saved.length && next.every((o) => saved.includes(o));
  return {
    state: verified ? 'verified' : 'verification_failed',
    siteId: input.siteId,
    clientId: input.clientId,
    added: add,
    removed: remove,
    origins: saved,
    otherClients: (after.data?.corsClientPreferences ?? []).filter((c) => c.clientId !== input.clientId).length,
    writeStatus: written.status,
  };
}
