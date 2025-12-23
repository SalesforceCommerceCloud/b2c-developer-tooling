/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Special toolset value that enables all toolsets.
 */
export const ALL_TOOLSETS = "ALL";

/**
 * Available toolsets that can be enabled.
 */
export const TOOLSETS = [
  "CARTRIDGES",
  "MRT",
  "PWAV3",
  "SCAPI",
  "STOREFRONTNEXT",
] as const;

/**
 * Valid toolset names including the special "ALL" value.
 */
export const VALID_TOOLSET_NAMES = [ALL_TOOLSETS, ...TOOLSETS] as const;

/**
 * Type representing a valid toolset name.
 */
export type Toolset = (typeof TOOLSETS)[number];
