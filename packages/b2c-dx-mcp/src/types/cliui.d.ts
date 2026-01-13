/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
declare module 'cliui' {
  interface Column {
    text: string;
    width?: number;
    align?: 'center' | 'left' | 'right';
    padding?: [number, number, number, number];
    border?: boolean;
  }

  interface UIOptions {
    width?: number;
    wrap?: boolean;
  }

  interface UI {
    div(...columns: (Column | string)[]): void;
    span(...columns: (Column | string)[]): void;
    resetOutput(): void;
    toString(): string;
  }

  function cliui(options?: UIOptions): UI;
  export default cliui;
}
