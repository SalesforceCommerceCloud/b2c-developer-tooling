/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * ScrollView component adapted from ink-scroll-view project.
 * Provides scrollable content with automatic text wrapping and measurement.
 */
import type {ReactNode} from 'react';
import React, {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type {BoxProps, DOMElement} from 'ink';
import {Box, measureElement} from 'ink';

/**
 * Hook to manage state with immediate ref synchronization.
 * Useful for values that need to be read synchronously in imperative methods
 * but also trigger re-renders when changed.
 */
function useStateRef<T>(initialValue: T) {
  const [state, setStateInternal] = useState<T>(initialValue);
  const ref = useRef<T>(initialValue);

  const setState = useCallback((update: React.SetStateAction<T>) => {
    const nextValue = typeof update === 'function' ? (update as (prev: T) => T)(ref.current) : update;
    ref.current = nextValue;
    setStateInternal(nextValue);
  }, []);

  const getState = useCallback(() => ref.current, []);

  return [state, setState, getState] as const;
}

/**
 * Internal helper component to measure the height of each child item.
 * Uses `measureElement` from `ink` to determine dimensions and reports
 * height back to the parent via `onMeasure`.
 */
function MeasurableItem({
  children,
  onMeasure,
  index,
  width,
  measureKey,
}: {
  children: ReactNode;
  onMeasure: (index: number, height: number) => void;
  index: number;
  width: number;
  measureKey?: number;
}) {
  const ref = useRef<DOMElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const {height} = measureElement(ref.current);
      onMeasure(index, height);
    }
  }, [index, onMeasure, width, measureKey, children]);

  return (
    <Box flexDirection="column" flexShrink={0} ref={ref} width="100%">
      {children}
    </Box>
  );
}

export interface ScrollViewProps extends BoxProps {
  /**
   * Callback fired when the scroll position changes.
   */
  onScroll?: (scrollOffset: number) => void;

  /**
   * Callback fired when the viewport dimensions change.
   */
  onViewportSizeChange?: (size: {width: number; height: number}, previousSize: {width: number; height: number}) => void;

  /**
   * Callback fired when the total content height changes.
   */
  onContentHeightChange?: (height: number, previousHeight: number) => void;

  /**
   * When true, automatically scrolls to the bottom when new content is added.
   * Set to false to disable auto-scroll (e.g., when user manually scrolls up).
   */
  autoScrollToBottom?: boolean;

  /**
   * Enable debug mode to visualize the ScrollView internals.
   */
  debug?: boolean;

  /**
   * The content to be scrolled.
   */
  children?: ReactNode;
}

export interface ScrollViewRef {
  /**
   * Scrolls to a specific vertical position.
   */
  scrollTo: (offset: number) => void;

  /**
   * Scrolls by a relative amount (positive = down, negative = up).
   */
  scrollBy: (delta: number) => void;

  /**
   * Scrolls to the very top (position 0).
   */
  scrollToTop: () => void;

  /**
   * Scrolls to the very bottom.
   */
  scrollToBottom: () => void;

  /**
   * Gets the current scroll offset.
   */
  getScrollOffset: () => number;

  /**
   * Gets the total height of the content.
   */
  getContentHeight: () => number;

  /**
   * Gets the current height of the visible viewport.
   */
  getViewportHeight: () => number;

  /**
   * Gets the maximum scroll offset (content height - viewport height).
   */
  getBottomOffset: () => number;

  /**
   * Checks if the view is currently scrolled to the bottom.
   */
  isAtBottom: () => boolean;

  /**
   * Re-measures the ScrollView viewport dimensions.
   * Call this on terminal resize events.
   */
  remeasure: () => void;
}

/**
 * A ScrollView component for Ink applications.
 * Allows scrolling through content that exceeds the visible area of the terminal.
 */
export const ScrollView = forwardRef<ScrollViewRef, ScrollViewProps>(
  (
    {
      onScroll,
      onViewportSizeChange,
      onContentHeightChange,
      autoScrollToBottom = false,
      debug = false,
      children,
      ...boxProps
    },
    ref,
  ) => {
    // Current scroll position (offset from top)
    const [scrollOffset, setScrollOffset, getScrollOffset] = useStateRef(0);

    // Viewport dimensions
    const [viewportSize, setViewportSize, getViewportSize] = useStateRef({height: 0, width: 0});

    // Total height of the scrollable content
    const [contentHeight, setContentHeight, getContentHeight] = useStateRef(0);

    // Per-item measure keys to force re-measurement
    const [itemMeasureKeys, setItemMeasureKeys] = useState<Record<number, number>>({});

    const viewportRef = useRef<DOMElement>(null);

    // Track previous content height for change callbacks
    const prevContentHeightRef = useRef(0);

    // Map of item keys to their measured heights
    const itemHeightsRef = useRef<Record<number | string, number>>({});

    // Map of child index to their unique key
    const itemKeysRef = useRef<(number | string)[]>([]);

    // Helper to calculate the bottom scroll offset
    const getBottomOffset = useCallback(
      () => Math.max(0, getContentHeight() - getViewportSize().height),
      [getContentHeight, getViewportSize],
    );

    // Check if at bottom (with small tolerance)
    const isAtBottom = useCallback(() => {
      const bottomOffset = getBottomOffset();
      return getScrollOffset() >= bottomOffset - 1;
    }, [getBottomOffset, getScrollOffset]);

    // Fire content height change callback
    useLayoutEffect(() => {
      if (contentHeight !== prevContentHeightRef.current) {
        onContentHeightChange?.(contentHeight, prevContentHeightRef.current);
        prevContentHeightRef.current = contentHeight;
      }
    }, [contentHeight, onContentHeightChange]);

    // Handle content height changes - clamp scroll position and auto-scroll if needed
    const handleContentHeightChange = useCallback(
      (height: number, previousHeight: number) => {
        // Auto-scroll to bottom when content grows and autoScrollToBottom is enabled
        if (autoScrollToBottom && height > previousHeight) {
          const newBottomOffset = Math.max(0, height - getViewportSize().height);
          if (getScrollOffset() !== newBottomOffset) {
            setScrollOffset(newBottomOffset);
            onScroll?.(newBottomOffset);
          }
        } else if (getScrollOffset() > height) {
          // Clamp scroll position if it exceeds the new max scroll
          setScrollOffset(height);
          onScroll?.(height);
        }
      },
      [autoScrollToBottom, getScrollOffset, getViewportSize, onScroll, setScrollOffset],
    );

    // Handle item measurement
    const handleItemMeasure = useCallback(
      (index: number, height: number) => {
        const key = itemKeysRef.current[index] ?? index;

        if (itemHeightsRef.current[key] !== height) {
          const previousHeight = itemHeightsRef.current[key] ?? 0;

          // Update the height map
          itemHeightsRef.current = {
            ...itemHeightsRef.current,
            [key]: height,
          };

          // Recalculate total content height
          let newTotalHeight = 0;
          for (const itemKey of itemKeysRef.current) {
            newTotalHeight += itemHeightsRef.current[itemKey] ?? 0;
          }

          const currentHeight = getContentHeight();
          if (newTotalHeight !== currentHeight) {
            setContentHeight(newTotalHeight);
            handleContentHeightChange(newTotalHeight, currentHeight);
          }

          // Track previous for callbacks
          if (previousHeight !== height) {
            prevContentHeightRef.current = currentHeight;
          }
        }
      },
      [getContentHeight, setContentHeight, handleContentHeightChange],
    );

    // Measure viewport
    const measureViewport = useCallback(() => {
      if (viewportRef.current) {
        const {width, height} = measureElement(viewportRef.current);
        const currentSize = getViewportSize();
        if (width !== currentSize.width || height !== currentSize.height) {
          onViewportSizeChange?.({width, height}, currentSize);
          setViewportSize({width, height});

          // Force all items to re-measure when width changes (for text wrapping)
          if (width !== currentSize.width) {
            const newMeasureKeys: Record<number, number> = {};
            for (const [i, _] of itemKeysRef.current.entries()) {
              newMeasureKeys[i] = (itemMeasureKeys[i] ?? 0) + 1;
            }
            setItemMeasureKeys(newMeasureKeys);
          }
        }
      }
    }, [getViewportSize, onViewportSizeChange, setViewportSize, itemMeasureKeys]);

    // Measure on layout
    useLayoutEffect(() => {
      measureViewport();
    });

    // Update item keys when children change
    const prevChildrenRef = useRef<typeof children>(null);
    if (prevChildrenRef.current !== children) {
      prevChildrenRef.current = children;

      const newItemKeys: (number | string)[] = [];
      const newItemHeights: Record<number | string, number> = {};

      Children.forEach(children, (child, index) => {
        if (!child) return;
        const key = isValidElement(child) ? child.key : null;
        const effectiveKey = key === null ? index : key;

        newItemKeys[index] = effectiveKey;
        const itemHeight = itemHeightsRef.current[effectiveKey] ?? 0;
        newItemHeights[effectiveKey] = itemHeight;
      });

      itemHeightsRef.current = newItemHeights;
      itemKeysRef.current = newItemKeys;

      let newTotalHeight = 0;
      for (const itemKey of newItemKeys) {
        newTotalHeight += newItemHeights[itemKey] ?? 0;
      }

      const currentHeight = getContentHeight();
      if (newTotalHeight !== currentHeight) {
        setContentHeight(newTotalHeight);
      }
    }

    // Auto-scroll to bottom when enabled and content height changes
    useEffect(() => {
      if (autoScrollToBottom) {
        const bottomOffset = getBottomOffset();
        if (getScrollOffset() !== bottomOffset) {
          setScrollOffset(bottomOffset);
          onScroll?.(bottomOffset);
        }
      }
    }, [autoScrollToBottom, contentHeight, getBottomOffset, getScrollOffset, onScroll, setScrollOffset]);

    // Expose control methods via ref
    useImperativeHandle(
      ref,
      () => ({
        scrollTo(offset: number) {
          if (typeof offset !== 'number' || Number.isNaN(offset)) {
            return;
          }
          const maxOffset = getBottomOffset();
          const newScrollTop = Math.max(0, Math.min(offset, maxOffset));
          if (newScrollTop !== getScrollOffset()) {
            setScrollOffset(newScrollTop);
            onScroll?.(newScrollTop);
          }
        },
        scrollBy(delta: number) {
          if (typeof delta !== 'number' || Number.isNaN(delta)) {
            return;
          }
          const maxOffset = getBottomOffset();
          const newScrollTop = Math.max(0, Math.min(getScrollOffset() + delta, maxOffset));
          if (newScrollTop !== getScrollOffset()) {
            setScrollOffset(newScrollTop);
            onScroll?.(newScrollTop);
          }
        },
        scrollToTop() {
          if (getScrollOffset() !== 0) {
            setScrollOffset(0);
            onScroll?.(0);
          }
        },
        scrollToBottom() {
          const bottomOffset = getBottomOffset();
          if (getScrollOffset() !== bottomOffset) {
            setScrollOffset(bottomOffset);
            onScroll?.(bottomOffset);
          }
        },
        getScrollOffset,
        getContentHeight,
        getViewportHeight: () => getViewportSize().height,
        getBottomOffset,
        isAtBottom,
        remeasure: measureViewport,
      }),
      [
        onScroll,
        getBottomOffset,
        getScrollOffset,
        setScrollOffset,
        getContentHeight,
        getViewportSize,
        isAtBottom,
        measureViewport,
      ],
    );

    return (
      <Box {...boxProps}>
        <Box ref={viewportRef} width="100%">
          <Box overflow={debug ? undefined : 'hidden'} width="100%">
            <Box flexDirection="column" marginTop={-scrollOffset} width="100%">
              {Children.map(children, (child, index) => {
                if (!child) return null;
                return (
                  <MeasurableItem
                    index={index}
                    key={isValidElement(child) ? (child.key ?? index) : index}
                    measureKey={itemMeasureKeys[index]}
                    onMeasure={handleItemMeasure}
                    width={viewportSize.width}
                  >
                    {child}
                  </MeasurableItem>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);
