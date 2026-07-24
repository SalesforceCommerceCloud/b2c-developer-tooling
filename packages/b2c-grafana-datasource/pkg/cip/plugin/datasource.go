/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/sqlds/v4"
)

// NewDatasource is the datasource.InstanceFactoryFunc registered with the plugin.
// It builds a CIP sqlds.Driver and wraps sqlds.NewDatasource, attaching the CIP-specific
// schema-browser and template-variable resource routes.
func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	drv, err := newDriver(settings)
	if err != nil {
		return nil, err
	}

	ds := sqlds.NewDatasource(drv)
	// Custom resource routes for the query editor's schema browser and template
	// variables (sqlds owns /tables|/schemas|/columns completion; ours are additive).
	ds.CustomRoutes = map[string]func(http.ResponseWriter, *http.Request){
		"/cip/tables":   drv.handleTables,
		"/cip/columns":  drv.handleColumns,
		"/cip/sites":    drv.handleSites,
		"/cip/variable": drv.handleVariable,
	}

	inst, err := ds.NewDatasource(ctx, settings)
	if err != nil {
		return nil, err
	}
	return inst, nil
}

// --- CIP resource handlers (schema browser + template variables) ---------------
//
// These operate on the driver's CIP client directly (metadata queries), independent of
// the sqlds query path. They return JSON for the frontend query editor.

func (d *cipDriver) handleTables(w http.ResponseWriter, r *http.Request) {
	tables, err := d.client.ListTables(r.Context(), r.URL.Query().Get("schema"))
	writeJSONOrErr(w, tables, err)
}

func (d *cipDriver) handleColumns(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	cols, err := d.client.DescribeColumns(r.Context(), q.Get("schema"), q.Get("table"))
	writeJSONOrErr(w, cols, err)
}

func (d *cipDriver) handleSites(w http.ResponseWriter, r *http.Request) {
	vals, err := d.variableValues(r.Context(),
		"SELECT DISTINCT nsite_id FROM warehouse.ccdw_dim_site WHERE nsite_id IS NOT NULL ORDER BY nsite_id")
	writeJSONOrErr(w, vals, err)
}

func (d *cipDriver) handleVariable(w http.ResponseWriter, r *http.Request) {
	sqlStr := r.URL.Query().Get("sql")
	if sqlStr == "" {
		var body struct {
			SQL string `json:"sql"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
			sqlStr = body.SQL
		}
	}
	if strings.TrimSpace(sqlStr) == "" {
		http.Error(w, "sql is required", http.StatusBadRequest)
		return
	}
	vals, err := d.variableValues(r.Context(), sqlStr)
	writeJSONOrErr(w, vals, err)
}

// variableValues runs a variable query and returns the DISTINCT values of its first
// column as strings (for populating a Grafana template-variable dropdown).
func (d *cipDriver) variableValues(ctx context.Context, query string) ([]string, error) {
	res, err := d.client.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	if len(res.Columns) == 0 {
		return []string{}, nil
	}
	col := res.Columns[0]
	seen := map[string]bool{}
	out := []string{}
	for _, row := range res.Rows {
		v := row[col]
		if v == nil {
			continue
		}
		s := fmt.Sprintf("%v", v)
		if s == "" || seen[s] {
			continue
		}
		seen[s] = true
		out = append(out, s)
	}
	return out, nil
}

func writeJSONOrErr(w http.ResponseWriter, v any, err error) {
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}
