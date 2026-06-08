/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Barrel for the shared component library. Importing from this single entry
// keeps the webview-ui imports tidy and makes the public surface obvious.
export {ConnectionBar} from './ConnectionBar.js';
export {Icon} from './Icon.js';
export {Spinner} from './Spinner.js';
export {EmptyState} from './EmptyState.js';
export {PageHeader} from './PageHeader.js';
export {SidebarSection} from './SidebarSection.js';
export {Modal} from './Modal.js';
export {ClauseCard} from './ClauseCard.js';
export {Chip} from './Chip.js';
export {SegmentedControl} from './SegmentedControl.js';
export {StatusBar, type StatusKind} from './StatusBar.js';
export {SqlPreview} from './SqlPreview.js';
export {ResultsTable} from './ResultsTable.js';
