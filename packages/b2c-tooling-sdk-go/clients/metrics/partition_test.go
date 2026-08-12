/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import "testing"

func TestSortDedupPoints(t *testing.T) {
	in := []DataPoint{
		{Timestamp: 300, Value: 3},
		{Timestamp: 100, Value: 1},
		{Timestamp: 200, Value: 2},
		{Timestamp: 200, Value: 2}, // duplicate boundary point
		{Timestamp: 100, Value: 1}, // duplicate
	}
	got := sortDedupPoints(in)
	want := []int64{100, 200, 300}
	if len(got) != len(want) {
		t.Fatalf("len=%d want %d (%v)", len(got), len(want), got)
	}
	for i, ts := range want {
		if got[i].Timestamp != ts {
			t.Errorf("point %d: ts=%d want %d", i, got[i].Timestamp, ts)
		}
	}
}

func TestSortDedupPointsShort(t *testing.T) {
	if got := sortDedupPoints(nil); got != nil {
		t.Errorf("nil in → %v", got)
	}
	one := []DataPoint{{Timestamp: 5, Value: 1}}
	if got := sortDedupPoints(one); len(got) != 1 {
		t.Errorf("single point mangled: %v", got)
	}
}
