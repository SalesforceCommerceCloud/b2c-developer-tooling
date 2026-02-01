/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {useEffect} from 'react';
import ansiEscapes from 'ansi-escapes';

/**
 * Hook to manage fullscreen/alternate screen mode.
 * Enters alternate screen on mount and exits on unmount.
 * Also handles cursor visibility.
 */
export function useFullscreen(): void {
  useEffect(() => {
    // Enter alternate screen and hide cursor
    process.stdout.write(ansiEscapes.enterAlternativeScreen);
    process.stdout.write(ansiEscapes.cursorHide);

    // Cleanup: exit alternate screen and show cursor
    return () => {
      process.stdout.write(ansiEscapes.exitAlternativeScreen);
      process.stdout.write(ansiEscapes.cursorShow);
    };
  }, []);
}
