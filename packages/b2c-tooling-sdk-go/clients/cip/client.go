/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Package cip is a client for the B2C Commerce Intelligence Platform (CIP) analytics
// warehouse. CIP exposes an Apache Calcite Avatica endpoint over protobuf; this package
// wraps the maintained apache/calcite-avatica-go driver, injecting B2C OAuth
// authentication and the CIP-specific request headers and sticky-session handling.
package cip

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"sync"
	"time"

	avatica "github.com/apache/calcite-avatica-go/v5"

	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
)

const (
	// DefaultHost is the production CIP Avatica host.
	DefaultHost = "jdbc.analytics.commercecloud.salesforce.com"
	// clientVersion is sent as X-Client-Version, matching the reference client.
	clientVersion = "2.11.0"
)

// Config configures a CIP client.
type Config struct {
	// Instance is the CIP instance identifier (e.g. "bdpx_prd"). Required.
	Instance string
	// Host overrides the CIP Avatica host. Empty → DefaultHost.
	Host string
}

// Client executes SQL against CIP via the Avatica protobuf protocol.
type Client struct {
	db *sql.DB
}

// QueryResult is a decoded CIP result set.
type QueryResult struct {
	Columns []string
	Rows    []map[string]any
}

// sessionTransport injects the CIP-required request headers (InstanceId,
// X-Client-Version) and implements Avatica sticky sessions: CIP returns an
// x-session-id on the first (OpenConnection) response that MUST be echoed on every
// subsequent request, or the load balancer routes to a backend that has no such
// connection and returns 410 Gone. avatica-go does not do this itself.
type sessionTransport struct {
	base     http.RoundTripper
	instance string

	mu        sync.Mutex
	sessionID string
}

func (t *sessionTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("InstanceId", t.instance)
	req.Header.Set("X-Client-Version", clientVersion)

	t.mu.Lock()
	sid := t.sessionID
	t.mu.Unlock()
	if sid != "" {
		req.Header.Set("x-session-id", sid)
	}

	resp, err := t.base.RoundTrip(req)
	if err != nil {
		return resp, err
	}
	if got := resp.Header.Get("x-session-id"); got != "" {
		t.mu.Lock()
		t.sessionID = got
		t.mu.Unlock()
	}
	return resp, nil
}

// NewClient builds a CIP client. The auth strategy is scoped for the instance
// (SALESFORCE_COMMERCE_API:{instance}); its OAuth http.Client carries the bearer token,
// wrapped with CIP header + sticky-session handling and handed to the Avatica driver.
//
// A CIP connection is sticky to one backend, so each Client owns a single-connection
// pool (MaxOpenConns=1); create multiple Clients for concurrency.
func NewClient(cfg Config, authStrategy *auth.OAuthStrategy) (*Client, error) {
	if cfg.Instance == "" {
		return nil, fmt.Errorf("cip: Instance is required")
	}
	host := cfg.Host
	if host == "" {
		host = DefaultHost
	}

	scoped := authStrategy.WithAdditionalScopes([]string{"SALESFORCE_COMMERCE_API:" + cfg.Instance})
	oauthClient := scoped.Client()

	httpClient := &http.Client{
		Timeout: 60 * time.Second,
		Transport: &sessionTransport{
			base:     oauthClient.Transport,
			instance: cfg.Instance,
		},
	}

	dsn := fmt.Sprintf("https://%s/%s", host, cfg.Instance)
	connector, ok := avatica.NewConnector(dsn).(*avatica.Connector)
	if !ok {
		return nil, fmt.Errorf("cip: unexpected connector type from avatica driver")
	}
	connector.Client = httpClient

	db := sql.OpenDB(connector)
	// CIP sessions are sticky to a single backend; keep exactly one connection.
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(5 * time.Minute)

	return &Client{db: db}, nil
}

// Query runs a SQL statement and returns all rows with column metadata. Values are
// decoded to their native Go types by the driver (numbers, strings, time.Time, etc.).
func (c *Client) Query(ctx context.Context, query string) (*QueryResult, error) {
	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("cip query failed: %w", err)
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("cip: reading columns: %w", err)
	}

	result := &QueryResult{Columns: cols, Rows: []map[string]any{}}
	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, fmt.Errorf("cip: scanning row: %w", err)
		}
		row := make(map[string]any, len(cols))
		for i, col := range cols {
			row[col] = vals[i]
		}
		result.Rows = append(result.Rows, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("cip: iterating rows: %w", err)
	}
	return result, nil
}

// DB exposes the underlying *sql.DB for callers that need direct database/sql access
// (e.g. Grafana's sqlutil frame conversion working on *sql.Rows). The pool is
// single-connection and sticky to one CIP backend; use QueryContext on it.
func (c *Client) DB() *sql.DB {
	return c.db
}

// Close releases the underlying connection pool.
func (c *Client) Close() error {
	return c.db.Close()
}

// Ping verifies connectivity by running a trivial metadata query.
func (c *Client) Ping(ctx context.Context) error {
	_, err := c.Query(ctx, "SELECT tableName FROM metadata.TABLES LIMIT 1")
	return err
}
