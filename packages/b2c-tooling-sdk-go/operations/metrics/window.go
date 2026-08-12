/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const (
	// MetricsRetentionPeriod is how far back the Metrics API retains data (30 days).
	// from must be no older than serverNow - 30 days, or the API returns 400.
	MetricsRetentionPeriod = 30 * 24 * time.Hour

	// MetricsDefaultWindow is the default (and maximum) width of a metrics time window (24 hours).
	MetricsDefaultWindow = 24 * time.Hour

	// MetricsRetentionSafetyMargin is a safety margin kept inside the retention window when clamping from.
	// 5 minutes comfortably covers latency and typical skew.
	MetricsRetentionSafetyMargin = 5 * time.Minute
)

// ResolvedMetricsWindow represents a fully resolved time window with both bounds present.
type ResolvedMetricsWindow struct {
	From             time.Time
	To               time.Time
	FromEpochSeconds int64
	ToEpochSeconds   int64
	ClampedFrom      bool // True if from was clamped forward to stay inside retention
	DefaultedWindow  bool // True if a bound was derived from the 24-hour default window
}

// parseRelativeTime parses a relative duration string like "5m", "1h", "30d" into a duration.
// Returns 0 and an error if the string is invalid.
var relativeTimeRegex = regexp.MustCompile(`^(\d+)(s|m|h|d)$`)

func parseRelativeTime(s string) (time.Duration, error) {
	matches := relativeTimeRegex.FindStringSubmatch(strings.TrimSpace(s))
	if matches == nil {
		return 0, fmt.Errorf("invalid relative time format: %q (expected format: 5m, 1h, 2d)", s)
	}

	value, err := strconv.ParseInt(matches[1], 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid number in relative time: %q", matches[1])
	}

	unit := matches[2]
	switch unit {
	case "s":
		return time.Duration(value) * time.Second, nil
	case "m":
		return time.Duration(value) * time.Minute, nil
	case "h":
		return time.Duration(value) * time.Hour, nil
	case "d":
		return time.Duration(value) * 24 * time.Hour, nil
	default:
		return 0, fmt.Errorf("unknown time unit: %q", unit)
	}
}

// parseSinceTime parses a time bound that can be:
// - A relative duration like "5m", "1h", "2d" (interpreted as "ago" from now)
// - An ISO 8601 timestamp string
func parseSinceTime(s string, now time.Time) (time.Time, error) {
	s = strings.TrimSpace(s)

	// Try relative time first
	if duration, err := parseRelativeTime(s); err == nil {
		return now.Add(-duration), nil
	}

	// Try parsing as ISO 8601 timestamp
	// Try multiple formats
	formats := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("invalid time format: %q (expected relative like '5m' or ISO 8601)", s)
}

// ParseMetricsBound parses a single metrics time bound (from or to) into a time.Time.
// Accepts:
// - time.Time (returned as-is)
// - Unix epoch milliseconds (int64)
// - Relative duration string like "5m", "1h", "2d" (relative to now)
// - ISO 8601 timestamp string
func ParseMetricsBound(value interface{}, now time.Time) (time.Time, error) {
	switch v := value.(type) {
	case time.Time:
		return v, nil
	case int64:
		// Epoch milliseconds
		return time.UnixMilli(v), nil
	case string:
		return parseSinceTime(v, now)
	default:
		return time.Time{}, fmt.Errorf("invalid bound type: %T (expected time.Time, int64, or string)", value)
	}
}

// MetricsWindowInput holds raw from/to/window inputs before resolution.
type MetricsWindowInput struct {
	From   interface{} // time.Time, int64 (epoch ms), or string (relative/ISO)
	To     interface{} // time.Time, int64 (epoch ms), or string (relative/ISO)
	Window interface{} // time.Duration or string (relative)
}

// ResolveMetricsWindow resolves from/to/window inputs into concrete bounds for the Metrics API.
//
// Resolution rules:
// - from + to: used as given; window must NOT also be set
// - from + window: to = from + window
// - to + window: from = to - window
// - window only: the last window (to = now, from = now - window)
// - from only: 24-hour window forward from from (to = min(from + 24h, now))
// - to only: 24-hour window back from to (from = to - 24h)
// - nothing: the last 24 hours (to = now, from = now - 24h)
//
// A from that predates the 30-day retention floor is clamped forward to stay within retention.
// The clamp is applied before deriving the companion bound so the window width is preserved.
func ResolveMetricsWindow(input MetricsWindowInput, now time.Time) (*ResolvedMetricsWindow, error) {
	hasFrom := input.From != nil
	hasTo := input.To != nil
	hasWindow := input.Window != nil

	if hasFrom && hasTo && hasWindow {
		return nil, fmt.Errorf("specify at most two of from, to, and window — not all three")
	}

	var from, to time.Time
	var err error
	clampedFrom := false
	defaultedWindow := false

	// Clamp function for retention enforcement
	earliestSafe := now.Add(-MetricsRetentionPeriod + MetricsRetentionSafetyMargin)
	clampFrom := func(t time.Time) time.Time {
		if t.Before(earliestSafe) {
			clampedFrom = true
			return earliestSafe
		}
		return t
	}

	// Parse window if provided
	var windowDuration time.Duration
	if hasWindow {
		switch w := input.Window.(type) {
		case time.Duration:
			windowDuration = w
		case string:
			windowDuration, err = parseRelativeTime(w)
			if err != nil {
				return nil, fmt.Errorf("invalid window: %w", err)
			}
		default:
			return nil, fmt.Errorf("invalid window type: %T (expected time.Duration or string)", input.Window)
		}
	}

	// Parse from and to if provided
	if hasFrom {
		from, err = ParseMetricsBound(input.From, now)
		if err != nil {
			return nil, fmt.Errorf("invalid from: %w", err)
		}
		from = clampFrom(from)
	}

	if hasTo {
		to, err = ParseMetricsBound(input.To, now)
		if err != nil {
			return nil, fmt.Errorf("invalid to: %w", err)
		}
	}

	// Apply resolution rules
	if hasWindow {
		if hasFrom && !hasTo {
			to = from.Add(windowDuration)
		} else if hasTo && !hasFrom {
			from = to.Add(-windowDuration)
		} else {
			// window alone → the last {window}
			to = now
			from = now.Add(-windowDuration)
		}
	} else if !(hasFrom && hasTo) {
		// No explicit window and at least one bound open → fill from 24-hour default
		defaultedWindow = true
		if hasFrom && !hasTo {
			// A window forward from from, but never past now
			to = from.Add(MetricsDefaultWindow)
			if to.After(now) {
				to = now
			}
		} else if hasTo && !hasFrom {
			from = to.Add(-MetricsDefaultWindow)
		} else {
			// Nothing supplied → the last 24 hours
			to = now
			from = now.Add(-MetricsDefaultWindow)
		}
	}

	// Clamp from again if it was derived from to
	from = clampFrom(from)

	if from.After(to) {
		return nil, fmt.Errorf("invalid time window: from (%s) must be before to (%s)", from.Format(time.RFC3339), to.Format(time.RFC3339))
	}

	return &ResolvedMetricsWindow{
		From:             from,
		To:               to,
		FromEpochSeconds: from.Unix(),
		ToEpochSeconds:   to.Unix(),
		ClampedFrom:      clampedFrom,
		DefaultedWindow:  defaultedWindow,
	}, nil
}
