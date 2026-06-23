/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Shared types for the interactive skills catalog. These mirror the shape
// emitted by docs/skills.data.ts (the build-time loader).

export interface SkillRecord {
  name: string;
  plugin: string;
  persona: string | null;
  personaLabel: string | null;
  category: string | null;
  tags: string[];
  description: string;
  skillUrl: string;
  referenceUrls: string[];
}

export interface PersonaNode {
  id: string;
  label: string;
  count: number;
  categories: Array<{name: string; count: number}>;
}

export interface SkillsIndex {
  base: string;
  origin: string;
  skills: SkillRecord[];
  personaTree: PersonaNode[];
  tagCounts: Array<{tag: string; count: number}>;
  fidelityNote: string;
}
