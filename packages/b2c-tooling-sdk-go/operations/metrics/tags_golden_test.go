/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import (
	_ "embed"
	"encoding/json"
	"reflect"
	"testing"
)

//go:embed data/metrics-tags.golden.json
var goldenJSON []byte

// GoldenTestCase represents a single test case from the golden fixture.
type GoldenTestCase struct {
	Category     string            `json:"category"`
	MetricID     string            `json:"metricId"`
	SeriesID     string            `json:"seriesId"`
	Context      goldenContext     `json:"context"`
	ExpectedTags map[string]string `json:"expectedTags"`
	Description  string            `json:"description,omitempty"`
}

type goldenContext struct {
	TenantID            string `json:"tenantId"`
	APIFamily           string `json:"apiFamily,omitempty"`
	APIName             string `json:"apiName,omitempty"`
	OcapiCategory       string `json:"ocapiCategory,omitempty"`
	OcapiAPI            string `json:"ocapiApi,omitempty"`
	ThirdPartyServiceID string `json:"thirdPartyServiceId,omitempty"`
}

// GoldenFixture represents the complete golden test fixture.
type GoldenFixture struct {
	Version     string           `json:"version"`
	GeneratedAt string           `json:"generatedAt"`
	Description string           `json:"description"`
	TestCases   []GoldenTestCase `json:"testCases"`
}

func TestParseSeriesTags_Golden(t *testing.T) {
	var fixture GoldenFixture
	if err := json.Unmarshal(goldenJSON, &fixture); err != nil {
		t.Fatalf("Failed to unmarshal golden fixture: %v", err)
	}

	t.Logf("Running %d golden test cases from fixture version %s", len(fixture.TestCases), fixture.Version)

	for i, tc := range fixture.TestCases {
		name := tc.Description
		if name == "" {
			name = tc.Category + "/" + tc.MetricID + "/" + tc.SeriesID
		}

		t.Run(name, func(t *testing.T) {
			got := ParseSeriesTags(ParseSeriesTagsParams{
				Category: tc.Category,
				MetricID: tc.MetricID,
				SeriesID: tc.SeriesID,
				Context: MetricsTagContext{
					TenantID:            tc.Context.TenantID,
					APIFamily:           tc.Context.APIFamily,
					APIName:             tc.Context.APIName,
					OcapiCategory:       tc.Context.OcapiCategory,
					OcapiAPI:            tc.Context.OcapiAPI,
					ThirdPartyServiceID: tc.Context.ThirdPartyServiceID,
				},
			})

			if !reflect.DeepEqual(got, MetricSeriesTags(tc.ExpectedTags)) {
				t.Errorf("Test case #%d (%s):\n  got:  %+v\n  want: %+v",
					i, tc.Description, got, tc.ExpectedTags)
			}
		})
	}
}

func TestParseSeriesTags_EdgeCases(t *testing.T) {
	tests := []struct {
		name   string
		params ParseSeriesTagsParams
		want   MetricSeriesTags
	}{
		{
			name: "empty tenant id",
			params: ParseSeriesTagsParams{
				Category: "scapi",
				MetricID: "totalCalls",
				SeriesID: "product",
				Context:  MetricsTagContext{TenantID: ""},
			},
			want: MetricSeriesTags{"realm": "", "apiFamily": "product"},
		},
		{
			// A series whose id is just the metric id echoed back is a rollup with no
			// per-series dimension → tagged aggregation=total (not apiFamily/series).
			name: "series id equals metric id",
			params: ParseSeriesTagsParams{
				Category: "mrt",
				MetricID: "errorRate",
				SeriesID: "errorRate",
				Context:  MetricsTagContext{TenantID: "bdpx_prd"},
			},
			want: MetricSeriesTags{"realm": "bdpx", "environment": "prd", "aggregation": "total"},
		},
		{
			name: "unrecognized category",
			params: ParseSeriesTagsParams{
				Category: "unknown",
				MetricID: "metric",
				SeriesID: "bdpx.value",
				Context:  MetricsTagContext{TenantID: "bdpx_prd"},
			},
			want: MetricSeriesTags{"realm": "bdpx", "environment": "prd", "series": "value"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ParseSeriesTags(tt.params)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ParseSeriesTags() = %+v, want %+v", got, tt.want)
			}
		})
	}
}
