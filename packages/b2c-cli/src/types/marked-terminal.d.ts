/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Type declarations for marked-terminal v7.
 * These declarations are minimal and cover only the functionality we use.
 */
declare module 'marked-terminal' {
  import type {MarkedExtension} from 'marked';

  export interface TableOptions {
    wordWrap?: boolean;
    colWidths?: number[];
    colAligns?: ('left' | 'middle' | 'right')[];
    style?: {
      'padding-left'?: number;
      'padding-right'?: number;
      head?: string[];
      border?: string[];
      compact?: boolean;
    };
  }

  export interface MarkedTerminalOptions {
    // Layout options
    width?: number;
    reflowText?: boolean;
    tableOptions?: TableOptions;
    // Renderer overrides
    code?: (code: string) => string;
    blockquote?: (quote: string) => string;
    html?: (html: string) => string;
    heading?: (text: string, level: number) => string;
    firstHeading?: (text: string) => string;
    hr?: () => string;
    listitem?: (text: string) => string;
    table?: (header: string, body: string) => string;
    paragraph?: (text: string) => string;
    strong?: (text: string) => string;
    em?: (text: string) => string;
    codespan?: (code: string) => string;
    del?: (text: string) => string;
    link?: (href: string, title: string, text: string) => string;
    image?: (href: string, title: string, text: string) => string;
  }

  export interface HighlightOptions {
    language?: string;
    ignoreIllegals?: boolean;
  }

  export function markedTerminal(options?: MarkedTerminalOptions, highlightOptions?: HighlightOptions): MarkedExtension;

  export default class TerminalRenderer {
    constructor(options?: MarkedTerminalOptions, highlightOptions?: HighlightOptions);
  }
}
