/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Package plugin implements the Grafana backend for the B2C CIP (Commerce Intelligence
// Platform) data source: a raw Calcite-SQL editor over the CIP analytics warehouse.
//
// It is built on the grafana/sqlds framework (the same framework the built-in Postgres,
// MySQL, and community SQL datasources use), which owns the QueryData/CheckHealth/
// resource plumbing, row limiting, timeouts, macro interpolation, and frame conversion.
// The CIP-specific pieces are the sqlds.Driver implementation below: connecting via the
// Avatica/protobuf client, the Calcite dialect of the standard time macros, the DECIMAL→
// float converter, and a response mutator for conditional wide-framing.
package plugin

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
	"github.com/grafana/sqlds/v4"

	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients"
	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients/cip"
)

// defaultRowLimit caps rows returned per query to protect plugin memory against broad
// analytical SELECTs. Mirrors the bounded behavior of mature SQL datasources.
const defaultRowLimit = int64(100000)

// defaultQueryTimeout bounds a single CIP query.
const defaultQueryTimeout = 60 * time.Second

// datasourceConfig is the non-secret jsonData for the CIP datasource.
type datasourceConfig struct {
	// Instance is the CIP instance id (e.g. "bdpx_prd"). Falls back to TenantId
	// (normalized) when empty so a single config can mirror the Metrics datasource.
	Instance string `json:"instance"`
	TenantID string `json:"tenantId"`
	ClientID string `json:"clientId"`

	AccountManagerHost string `json:"accountManagerHost"`
	// Host overrides the CIP Avatica host (optional; for staging analytics).
	Host string `json:"cipHost"`
}

// cipDriver implements sqlds.Driver for the CIP Avatica warehouse. One driver instance
// is created per Grafana datasource instance; it owns a single CIP client (whose *sql.DB
// is sticky-session, MaxOpenConns=1).
type cipDriver struct {
	client   *cip.Client
	instance string
}

// newDriver builds a cipDriver from Grafana datasource settings.
func newDriver(settings backend.DataSourceInstanceSettings) (*cipDriver, error) {
	var cfg datasourceConfig
	if err := json.Unmarshal(settings.JSONData, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse datasource settings: %w", err)
	}

	instance := cfg.Instance
	if instance == "" {
		instance = clients.NormalizeTenantID(cfg.TenantID)
	}
	if instance == "" {
		return nil, fmt.Errorf("cip datasource requires 'instance' (or 'tenantId')")
	}

	clientID := cfg.ClientID
	clientSecret := settings.DecryptedSecureJSONData["clientSecret"]
	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("missing client credentials (clientId in jsonData, clientSecret in secureJsonData)")
	}

	authCfg := auth.OAuthConfig{ClientID: clientID, ClientSecret: clientSecret, AccountManagerHost: cfg.AccountManagerHost}
	if authCfg.AccountManagerHost == "" {
		authCfg.AccountManagerHost = auth.DefaultAccountManagerHost
	}
	strat := auth.NewOAuthStrategy(authCfg)

	client, err := cip.NewClient(cip.Config{Instance: instance, Host: cfg.Host}, strat)
	if err != nil {
		return nil, fmt.Errorf("creating CIP client: %w", err)
	}
	return &cipDriver{client: client, instance: instance}, nil
}

// Connect returns the CIP client's *sql.DB. sqlds calls this to obtain the connection;
// the msg (connection args) is unused — CIP has a single connection per datasource.
func (d *cipDriver) Connect(_ context.Context, _ backend.DataSourceInstanceSettings, _ json.RawMessage) (*sql.DB, error) {
	return d.client.DB(), nil
}

// Settings supplies framework behavior: a bounded row limit and per-query timeout.
func (d *cipDriver) Settings(_ context.Context, _ backend.DataSourceInstanceSettings) sqlds.DriverSettings {
	return sqlds.DriverSettings{
		Timeout:  defaultQueryTimeout,
		RowLimit: defaultRowLimit,
		// FillMode left nil → sqlds default; CIP results are aggregates, not sparse series.
	}
}

// Macros returns the Calcite dialect of the standard Grafana SQL time macros. These use
// sqlutil's parser (so $__interval, multipliers, and arg parsing are handled correctly —
// unlike the previous hand-rolled regex expander), but emit Calcite-specific SQL:
// TIMESTAMP literals and FLOOR(col TO UNIT) bucketing.
func (d *cipDriver) Macros() sqlds.Macros {
	return sqlds.Macros{
		// $__timeFilter(col) → col BETWEEN TIMESTAMP '..' AND TIMESTAMP '..'
		"timeFilter": func(q *sqlutil.Query, args []string) (string, error) {
			col, err := oneArg(args, "timeFilter")
			if err != nil {
				return "", err
			}
			return fmt.Sprintf("%s BETWEEN %s AND %s", col, tsLiteral(q.TimeRange.From), tsLiteral(q.TimeRange.To)), nil
		},
		// $__timeFrom() / $__timeTo() → TIMESTAMP '..'
		"timeFrom": func(q *sqlutil.Query, _ []string) (string, error) { return tsLiteral(q.TimeRange.From), nil },
		"timeTo":   func(q *sqlutil.Query, _ []string) (string, error) { return tsLiteral(q.TimeRange.To), nil },
		// $__timeGroup(col, '1d') → FLOOR(col TO DAY)
		"timeGroup": func(_ *sqlutil.Query, args []string) (string, error) {
			col, unit, err := colAndUnit(args, "timeGroup")
			if err != nil {
				return "", err
			}
			return fmt.Sprintf("FLOOR(%s TO %s)", col, unit), nil
		},
		// $__timeGroupAlias(col, '1d') → FLOOR(col TO DAY) AS "time"
		"timeGroupAlias": func(_ *sqlutil.Query, args []string) (string, error) {
			col, unit, err := colAndUnit(args, "timeGroupAlias")
			if err != nil {
				return "", err
			}
			return fmt.Sprintf(`FLOOR(%s TO %s) AS "time"`, col, unit), nil
		},
	}
}

// Converters returns the CIP column converters (DECIMAL→float64; see cipConverters).
func (d *cipDriver) Converters() []sqlutil.Converter {
	return cipConverters()
}

// Note on framing: sqlds handles long→wide reshaping itself based on the query Format
// (FormatOptionTimeSeries → LongToWide when the frame is long; FormatOptionTable → as-is)
// and sets PreferredVisualization. So no ResponseMutator is needed — the DECIMAL
// converter is what makes our aggregate columns numeric so that reshaping works.

// --- macro helpers -------------------------------------------------------------

const cipTimeLayout = "2006-01-02 15:04:05"

func tsLiteral(t time.Time) string {
	return fmt.Sprintf("TIMESTAMP '%s'", t.UTC().Format(cipTimeLayout))
}

func oneArg(args []string, macro string) (string, error) {
	if len(args) < 1 || strings.TrimSpace(args[0]) == "" {
		return "", fmt.Errorf("%s requires a column argument", macro)
	}
	return strings.TrimSpace(args[0]), nil
}

func colAndUnit(args []string, macro string) (col, unit string, err error) {
	if len(args) < 2 {
		return "", "", fmt.Errorf("%s requires (column, interval) arguments", macro)
	}
	col = strings.TrimSpace(args[0])
	unit = calciteFloorUnit(strings.Trim(strings.TrimSpace(args[1]), "'\""))
	if col == "" {
		return "", "", fmt.Errorf("%s: empty column", macro)
	}
	return col, unit, nil
}

// calciteFloorUnit maps a Grafana duration to a Calcite FLOOR time unit. Calcite's
// FLOOR(datetime TO unit) has no multiplier concept, so we bucket to the unit implied by
// the duration's magnitude (e.g. 30s→SECOND, 5m→MINUTE, 6h→HOUR, 1d→DAY). This is a
// deliberate coarsening; sub-unit multipliers aren't expressible in Calcite FLOOR.
func calciteFloorUnit(dur string) string {
	d, err := time.ParseDuration(strings.NewReplacer("d", "h", "w", "h").Replace(normalizeDur(dur)))
	if err != nil || d <= 0 {
		return "DAY"
	}
	switch {
	case d < time.Minute:
		return "SECOND"
	case d < time.Hour:
		return "MINUTE"
	case d < 24*time.Hour:
		return "HOUR"
	case d < 7*24*time.Hour:
		return "DAY"
	case d < 30*24*time.Hour:
		return "WEEK"
	case d < 365*24*time.Hour:
		return "MONTH"
	default:
		return "YEAR"
	}
}

// normalizeDur converts a Grafana-style duration where d/w/M/y are day/week/month/year
// into an hours-based approximation time.ParseDuration can read (only for magnitude
// bucketing in calciteFloorUnit). e.g. "1d"→"24h", "1w"→"168h", "1M"→"720h", "1y"→"8760h".
func normalizeDur(dur string) string {
	dur = strings.TrimSpace(dur)
	if dur == "" {
		return "24h"
	}
	suffix := dur[len(dur)-1]
	num := dur[:len(dur)-1]
	n, err := strconv.Atoi(num)
	if err != nil {
		return dur // let ParseDuration try (handles s/m/h natively)
	}
	switch suffix {
	case 'd':
		return fmt.Sprintf("%dh", n*24)
	case 'w':
		return fmt.Sprintf("%dh", n*24*7)
	case 'M':
		return fmt.Sprintf("%dh", n*24*30)
	case 'y':
		return fmt.Sprintf("%dh", n*24*365)
	default:
		return dur // s/m/h
	}
}

// cipConverters returns sqlutil converters for CIP/Avatica column types that would
// otherwise scan as strings and break charting. Avatica returns DECIMAL as a Go string
// (e.g. "32324.00"); every revenue/AOV/latency/percentage column in the report catalog
// is DECIMAL, so without this they arrive unplottable AND (being string fields) trip the
// long→wide pivot. Converts DECIMAL → nullable float64. DOUBLE/FLOAT already scan as
// float64, BIGINT as int64, DATE/TIMESTAMP as time.Time.
func cipConverters() []sqlutil.Converter {
	decimalToFloat := sqlutil.Converter{
		Name:          "CIP DECIMAL to float64",
		InputScanType: reflect.TypeOf(sql.NullString{}),
		InputTypeName: "DECIMAL",
		FrameConverter: sqlutil.FrameConverter{
			FieldType: data.FieldTypeNullableFloat64,
			ConverterFunc: func(in interface{}) (interface{}, error) {
				v, ok := in.(*sql.NullString)
				if !ok || v == nil || !v.Valid {
					return (*float64)(nil), nil
				}
				f, err := strconv.ParseFloat(strings.TrimSpace(v.String), 64)
				if err != nil {
					// Non-numeric DECIMAL text → null (never fail the frame), but log so
					// data-quality issues are visible rather than silently dropped.
					log.DefaultLogger.Warn("CIP DECIMAL parse failed", "value", v.String, "error", err)
					return (*float64)(nil), nil
				}
				return &f, nil
			},
		},
	}
	return []sqlutil.Converter{decimalToFloat}
}
