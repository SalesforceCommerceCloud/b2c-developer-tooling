/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const id = input.attributeId.startsWith('c_') ? input.attributeId.slice(2) : input.attributeId;
  const base =
    '/dx/object-definitions/v1/organizations/{organizationId}/system/object-types/' +
    encodeURIComponent(input.objectType);
  const attributePath = base + '/attribute-definitions/' + encodeURIComponent(id);
  let stage = 'inspect';
  let writeAttempted = false;
  try {
    const before = await scapi.request({method: 'GET', path: attributePath});
    if (before.ok) return {state: 'exists', id: 'c_' + id, changed: false};
    if (before.status !== 404) return {stage, ...before};
    const definition = {
      id,
      valueType: input.valueType,
      ...(input.displayName === undefined ? {} : {displayName: {default: input.displayName}}),
      ...(input.properties ?? {}),
    };
    stage = 'create';
    writeAttempted = true;
    // PUT is create-or-replace; the GET above guards against replacing an existing definition.
    const created = await scapi.request({method: 'PUT', path: attributePath, body: definition});
    if (!created.ok) return {stage, id, ...created};
    let group;
    if (input.groupId) {
      const groupPath = base + '/attribute-groups/' + encodeURIComponent(input.groupId);
      stage = 'inspect-group';
      const existing = await scapi.request({method: 'GET', path: groupPath});
      if (!existing.ok && existing.status !== 404) return {state: 'partial', stage, id: 'c_' + id, ...existing};
      if (!existing.ok) {
        stage = 'create-group';
        const made = await scapi.request({
          method: 'PUT',
          path: groupPath,
          body: {id: input.groupId, displayName: {default: input.groupDisplayName ?? input.groupId}},
        });
        if (!made.ok) return {state: 'partial', stage, id: 'c_' + id, ...made};
      }
      stage = 'assign';
      const assigned = await scapi.request({
        method: 'PUT',
        path: groupPath + '/attribute-definitions/' + encodeURIComponent(id),
      });
      if (!assigned.ok) return {state: 'partial', stage, id: 'c_' + id, ...assigned};
      group = {id: input.groupId, created: !existing.ok};
    }
    stage = 'verify';
    const after = await scapi.request({method: 'GET', path: attributePath, query: {select: '(**)'}});
    if (!after.ok) return {state: 'partial', stage, id: 'c_' + id, ...after};
    const saved = after.data;
    const verified = saved.id === id && saved.valueType === input.valueType;
    return {
      state: verified ? 'verified' : 'verification_failed',
      id: saved.effectiveId ?? 'c_' + id,
      valueType: saved.valueType,
      writeStatus: created.status,
      ...(group ? {group} : {}),
      ...(input.valueType.startsWith('enum_of_')
        ? {note: 'Enum values cannot be set through this API; add them with a metadata site import.'}
        : {}),
    };
  } catch (error) {
    return {stage, id, error: String(error), checkWriteBeforeRetry: writeAttempted};
  }
}
