/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package plugin

import (
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
)

func mkQuery(rawSQL string, interval time.Duration) *sqlutil.Query {
	return &sqlutil.Query{
		RawSQL:   rawSQL,
		Interval: interval,
		TimeRange: backend.TimeRange{
			From: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
			To:   time.Date(2026, 1, 2, 12, 30, 0, 0, time.UTC),
		},
	}
}

// interpolate runs a rawSQL string through the CIP driver's macros exactly as sqlds would.
func interpolate(t *testing.T, rawSQL string, interval time.Duration) string {
	t.Helper()
	d := &cipDriver{}
	q := mkQuery(rawSQL, interval)
	out, err := sqlutil.Interpolate(q, d.Macros())
	if err != nil {
		t.Fatalf("Interpolate(%q) error: %v", rawSQL, err)
	}
	return out
}

func TestCIPMacros(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string // substring that must appear
	}{
		{"timeFilter", "WHERE $__timeFilter(submit_date)", "submit_date BETWEEN TIMESTAMP '2026-01-01 00:00:00' AND TIMESTAMP '2026-01-02 12:30:00'"},
		{"timeGroup day", "SELECT $__timeGroup(submit_date, '1d')", "FLOOR(submit_date TO DAY)"},
		{"timeGroup hour", "SELECT $__timeGroup(ts, '1h')", "FLOOR(ts TO HOUR)"},
		{"timeGroup 6h→HOUR (multiplier not lost to MINUTE)", "SELECT $__timeGroup(ts, '6h')", "FLOOR(ts TO HOUR)"},
		{"timeGroup 15m→MINUTE", "SELECT $__timeGroup(ts, '15m')", "FLOOR(ts TO MINUTE)"},
		{"timeGroup month", "SELECT $__timeGroup(ts, '1M')", "FLOOR(ts TO MONTH)"},
		{"timeGroupAlias", "SELECT $__timeGroupAlias(submit_date, '1d')", `FLOOR(submit_date TO DAY) AS "time"`},
		{"timeFrom", "x > $__timeFrom()", "TIMESTAMP '2026-01-01 00:00:00'"},
		{"timeTo", "x < $__timeTo()", "TIMESTAMP '2026-01-02 12:30:00'"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := interpolate(t, c.in, time.Minute)
			if !strings.Contains(got, c.want) {
				t.Errorf("interpolate(%q)\n  got:  %q\n  want substring: %q", c.in, got, c.want)
			}
		})
	}
}

// TestCIPMacrosInterval verifies the $__interval macro (from sqlutil's default set,
// merged by sqlds) resolves — the previous hand-rolled expander left it unexpanded,
// which broke the shipped default query.
func TestCIPMacrosInterval(t *testing.T) {
	got := interpolate(t, "SELECT $__timeGroupAlias(submit_date, $__interval)", 5*time.Minute)
	if strings.Contains(got, "$__interval") {
		t.Errorf("$__interval left unexpanded: %q", got)
	}
	if !strings.Contains(got, "FLOOR(submit_date TO") {
		t.Errorf("timeGroupAlias with $__interval did not expand to FLOOR: %q", got)
	}
}

func TestCalciteFloorUnit(t *testing.T) {
	for dur, want := range map[string]string{
		"30s": "SECOND", "5m": "MINUTE", "15m": "MINUTE", "1h": "HOUR", "6h": "HOUR",
		"1d": "DAY", "1w": "WEEK", "1M": "MONTH", "1y": "YEAR", "": "DAY",
	} {
		if got := calciteFloorUnit(dur); got != want {
			t.Errorf("calciteFloorUnit(%q)=%q want %q", dur, got, want)
		}
	}
}
