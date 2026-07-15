/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import (
	"testing"
	"time"
)

func TestParseRelativeTime(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    time.Duration
		wantErr bool
	}{
		{
			name:  "seconds",
			input: "30s",
			want:  30 * time.Second,
		},
		{
			name:  "minutes",
			input: "5m",
			want:  5 * time.Minute,
		},
		{
			name:  "hours",
			input: "2h",
			want:  2 * time.Hour,
		},
		{
			name:  "days",
			input: "7d",
			want:  7 * 24 * time.Hour,
		},
		{
			name:    "invalid format",
			input:   "5",
			wantErr: true,
		},
		{
			name:    "invalid unit",
			input:   "5x",
			wantErr: true,
		},
		{
			name:    "empty string",
			input:   "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseRelativeTime(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseRelativeTime(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("parseRelativeTime(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestParseSinceTime(t *testing.T) {
	now := time.Date(2026, 7, 14, 12, 0, 0, 0, time.UTC)

	tests := []struct {
		name    string
		input   string
		want    time.Time
		wantErr bool
	}{
		{
			name:  "relative 5 minutes ago",
			input: "5m",
			want:  now.Add(-5 * time.Minute),
		},
		{
			name:  "relative 1 hour ago",
			input: "1h",
			want:  now.Add(-1 * time.Hour),
		},
		{
			name:  "relative 7 days ago",
			input: "7d",
			want:  now.Add(-7 * 24 * time.Hour),
		},
		{
			name:  "ISO 8601 RFC3339",
			input: "2026-07-14T10:00:00Z",
			want:  time.Date(2026, 7, 14, 10, 0, 0, 0, time.UTC),
		},
		{
			name:  "ISO 8601 date only",
			input: "2026-07-14",
			want:  time.Date(2026, 7, 14, 0, 0, 0, 0, time.UTC),
		},
		{
			name:    "invalid format",
			input:   "not a time",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseSinceTime(tt.input, now)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseSinceTime(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && !got.Equal(tt.want) {
				t.Errorf("parseSinceTime(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestResolveMetricsWindow(t *testing.T) {
	now := time.Date(2026, 7, 14, 12, 0, 0, 0, time.UTC)

	tests := []struct {
		name            string
		input           MetricsWindowInput
		wantFromOffset  time.Duration // Offset from now
		wantToOffset    time.Duration // Offset from now
		wantClampedFrom bool
		wantDefaulted   bool
		wantErr         bool
	}{
		{
			name: "from and to provided",
			input: MetricsWindowInput{
				From: now.Add(-2 * time.Hour),
				To:   now.Add(-1 * time.Hour),
			},
			wantFromOffset: -2 * time.Hour,
			wantToOffset:   -1 * time.Hour,
		},
		{
			name: "from and window",
			input: MetricsWindowInput{
				From:   now.Add(-7 * 24 * time.Hour),
				Window: 1 * time.Hour,
			},
			wantFromOffset: -7 * 24 * time.Hour,
			wantToOffset:   -7*24*time.Hour + 1*time.Hour,
		},
		{
			name: "to and window",
			input: MetricsWindowInput{
				To:     now,
				Window: 2 * time.Hour,
			},
			wantFromOffset: -2 * time.Hour,
			wantToOffset:   0,
		},
		{
			name: "window only",
			input: MetricsWindowInput{
				Window: 6 * time.Hour,
			},
			wantFromOffset: -6 * time.Hour,
			wantToOffset:   0,
		},
		{
			name: "from only (defaulted 24h window)",
			input: MetricsWindowInput{
				From: now.Add(-2 * time.Hour),
			},
			wantFromOffset: -2 * time.Hour,
			wantToOffset:   0, // min(from + 24h, now) = now (capped)
			wantDefaulted:  true,
		},
		{
			name: "to only (defaulted 24h window)",
			input: MetricsWindowInput{
				To: now,
			},
			wantFromOffset: -24 * time.Hour,
			wantToOffset:   0,
			wantDefaulted:  true,
		},
		{
			name:           "nothing (default last 24h)",
			input:          MetricsWindowInput{},
			wantFromOffset: -24 * time.Hour,
			wantToOffset:   0,
			wantDefaulted:  true,
		},
		{
			name: "from before retention floor (clamped)",
			input: MetricsWindowInput{
				From: now.Add(-31 * 24 * time.Hour), // Older than 30 days
				To:   now,
			},
			wantFromOffset:  -MetricsRetentionPeriod + MetricsRetentionSafetyMargin,
			wantToOffset:    0,
			wantClampedFrom: true,
		},
		{
			name: "all three specified (error)",
			input: MetricsWindowInput{
				From:   now.Add(-2 * time.Hour),
				To:     now,
				Window: 1 * time.Hour,
			},
			wantErr: true,
		},
		{
			name: "from after to (error)",
			input: MetricsWindowInput{
				From: now,
				To:   now.Add(-1 * time.Hour),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ResolveMetricsWindow(tt.input, now)
			if (err != nil) != tt.wantErr {
				t.Errorf("ResolveMetricsWindow() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantErr {
				return
			}

			wantFrom := now.Add(tt.wantFromOffset)
			wantTo := now.Add(tt.wantToOffset)

			if !got.From.Equal(wantFrom) {
				t.Errorf("From = %v, want %v (offset %v from now)", got.From, wantFrom, tt.wantFromOffset)
			}

			if !got.To.Equal(wantTo) {
				t.Errorf("To = %v, want %v (offset %v from now)", got.To, wantTo, tt.wantToOffset)
			}

			if got.ClampedFrom != tt.wantClampedFrom {
				t.Errorf("ClampedFrom = %v, want %v", got.ClampedFrom, tt.wantClampedFrom)
			}

			if got.DefaultedWindow != tt.wantDefaulted {
				t.Errorf("DefaultedWindow = %v, want %v", got.DefaultedWindow, tt.wantDefaulted)
			}

			// Verify epoch seconds match
			if got.FromEpochSeconds != got.From.Unix() {
				t.Errorf("FromEpochSeconds = %d, want %d", got.FromEpochSeconds, got.From.Unix())
			}

			if got.ToEpochSeconds != got.To.Unix() {
				t.Errorf("ToEpochSeconds = %d, want %d", got.ToEpochSeconds, got.To.Unix())
			}
		})
	}
}

func TestResolveMetricsWindow_StringInputs(t *testing.T) {
	now := time.Date(2026, 7, 14, 12, 0, 0, 0, time.UTC)

	input := MetricsWindowInput{
		From:   "7d", // 7 days ago
		Window: "1h", // 1 hour window
	}

	got, err := ResolveMetricsWindow(input, now)
	if err != nil {
		t.Fatalf("ResolveMetricsWindow() unexpected error: %v", err)
	}

	wantFrom := now.Add(-7 * 24 * time.Hour)
	wantTo := wantFrom.Add(1 * time.Hour)

	if !got.From.Equal(wantFrom) {
		t.Errorf("From = %v, want %v", got.From, wantFrom)
	}

	if !got.To.Equal(wantTo) {
		t.Errorf("To = %v, want %v", got.To, wantTo)
	}
}
