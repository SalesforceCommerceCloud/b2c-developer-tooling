/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import (
	"context"
	"sort"
	"time"
)

// maxWindow is the Metrics API's maximum time window per request. Requests wider than
// this are rejected by the API with a 400, so a wider range must be partitioned into
// sub-windows and merged. Kept in sync with operations/metrics.MetricsDefaultWindow (24h).
const maxWindow = 24 * time.Hour

// getMetricsRange fetches a category over an arbitrary [from, to] range, transparently
// partitioning ranges wider than the API's 24-hour maximum into sequential sub-requests
// and merging the results by (metricId, seriesId). This lets a normal Grafana dashboard
// range like "Last 7 days" work against an API that only accepts <=24h windows.
//
// Sub-windows are fetched newest-first is unnecessary — order does not matter since we
// merge and sort by timestamp. Points at chunk boundaries are de-duplicated.
func (c *Client) getMetricsRange(ctx context.Context, category string, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	if !to.After(from) || to.Sub(from) <= maxWindow {
		// Single request suffices.
		return c.getMetrics(ctx, category, from, to, filters)
	}

	// Accumulate merged series keyed by metricId then seriesId, preserving metric/series
	// metadata from the first chunk that carries it.
	type mergedMetric struct {
		metric Metric                 // header (metricId/title/description/unit)
		series map[string]*DataSeries // seriesID → series (with growing Data)
		order  []string               // seriesID order of first appearance
	}
	metrics := map[string]*mergedMetric{}
	var metricOrder []string

	// Walk sub-windows [start, end] with end-exclusive stitching so boundary points
	// aren't double-counted: each chunk covers (start, start+maxWindow].
	for start := from; start.Before(to); start = start.Add(maxWindow) {
		end := start.Add(maxWindow)
		if end.After(to) {
			end = to
		}
		chunk, err := c.getMetrics(ctx, category, start, end, filters)
		if err != nil {
			return nil, err
		}
		for _, m := range chunk.Data {
			mm := metrics[m.MetricID]
			if mm == nil {
				mm = &mergedMetric{metric: m, series: map[string]*DataSeries{}}
				metrics[m.MetricID] = mm
				metricOrder = append(metricOrder, m.MetricID)
			}
			for _, s := range m.DataSeries {
				existing := mm.series[s.ID]
				if existing == nil {
					cp := s // copy header (ID/Name/Tags)
					cp.Data = append([]DataPoint(nil), s.Data...)
					mm.series[s.ID] = &cp
					mm.order = append(mm.order, s.ID)
					continue
				}
				existing.Data = append(existing.Data, s.Data...)
			}
		}
	}

	// Rebuild the response, sorting + de-duplicating each series' points by timestamp.
	out := &MetricsDataResponse{Data: make([]Metric, 0, len(metricOrder))}
	for _, mid := range metricOrder {
		mm := metrics[mid]
		metric := mm.metric
		metric.DataSeries = make([]DataSeries, 0, len(mm.order))
		for _, sid := range mm.order {
			s := mm.series[sid]
			s.Data = sortDedupPoints(s.Data)
			metric.DataSeries = append(metric.DataSeries, *s)
		}
		out.Data = append(out.Data, metric)
	}
	return out, nil
}

// sortDedupPoints sorts points ascending by timestamp and drops duplicate timestamps
// (keeping the first), which can occur at sub-window boundaries.
func sortDedupPoints(points []DataPoint) []DataPoint {
	if len(points) < 2 {
		return points
	}
	sort.SliceStable(points, func(i, j int) bool { return points[i].Timestamp < points[j].Timestamp })
	out := points[:1]
	for _, p := range points[1:] {
		if p.Timestamp != out[len(out)-1].Timestamp {
			out = append(out, p)
		}
	}
	return out
}
