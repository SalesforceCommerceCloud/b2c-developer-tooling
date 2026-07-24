/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
)

func TestNewClient_BaseURLOverride(t *testing.T) {
	// Mock token server
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"access_token": "test-token", "token_type": "Bearer", "expires_in": 3600}`))
	}))
	defer tokenServer.Close()

	// Mock metrics API server
	metricsServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify path structure
		expectedPath := "/organizations/f_ecom_bdpx_prd/metrics/overall"
		if r.URL.Path != expectedPath {
			t.Errorf("Expected path %q, got %q", expectedPath, r.URL.Path)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"data": [{
				"metricId": "totalCalls",
				"title": "Total Calls",
				"description": "Total API calls",
				"unit": "",
				"dataSeries": [{
					"id": "bdpx.test",
					"name": "test",
					"data": [{"timestamp": 1000, "value": 100}]
				}]
			}]
		}`))
	}))
	defer metricsServer.Close()

	// Create auth strategy with token override
	authStrategy := auth.NewOAuthStrategy(auth.OAuthConfig{
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		TokenURL:     tokenServer.URL,
	})

	// Create client with BaseURL override (http://)
	client := NewClient(Config{
		ShortCode: "ignored", // Should be ignored when BaseURL is set
		TenantID:  "bdpx_prd",
		BaseURL:   metricsServer.URL, // Full http:// URL
	}, authStrategy)

	// Verify the baseURL was set correctly
	if client.baseURL != metricsServer.URL {
		t.Errorf("Expected baseURL %q, got %q", metricsServer.URL, client.baseURL)
	}

	// Verify it accepts http:// scheme
	if !strings.HasPrefix(client.baseURL, "http://") {
		t.Errorf("Expected http:// scheme to be preserved, got: %s", client.baseURL)
	}

	// Test actual API call to verify it works
	ctx := context.Background()
	from := time.Unix(500, 0)
	to := time.Unix(2000, 0)

	resp, err := client.GetOverallMetrics(ctx, from, to, nil)
	if err != nil {
		t.Fatalf("GetOverallMetrics failed: %v", err)
	}

	if len(resp.Data) != 1 {
		t.Errorf("Expected 1 metric, got %d", len(resp.Data))
	}

	if resp.Data[0].MetricID != "totalCalls" {
		t.Errorf("Expected metricId 'totalCalls', got %q", resp.Data[0].MetricID)
	}
}

func TestNewClient_BaseURLEmpty_DerivesFromShortCode(t *testing.T) {
	// Mock token server
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"access_token": "test-token", "token_type": "Bearer", "expires_in": 3600}`))
	}))
	defer tokenServer.Close()

	authStrategy := auth.NewOAuthStrategy(auth.OAuthConfig{
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		TokenURL:     tokenServer.URL,
	})

	// Create client without BaseURL (should derive from ShortCode)
	client := NewClient(Config{
		ShortCode: "kv7kzm78",
		TenantID:  "bdpx_prd",
	}, authStrategy)

	expectedURL := "https://kv7kzm78.api.commercecloud.salesforce.com/observability/metrics/v1"
	if client.baseURL != expectedURL {
		t.Errorf("Expected baseURL %q, got %q", expectedURL, client.baseURL)
	}
}

func TestNewClient_ScopesIncluded(t *testing.T) {
	// Mock token server that captures the scope request
	var requestedScopes string
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Parse form to get scope parameter
		r.ParseForm()
		requestedScopes = r.Form.Get("scope")

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"access_token": "test-token", "token_type": "Bearer", "expires_in": 3600}`))
	}))
	defer tokenServer.Close()

	authStrategy := auth.NewOAuthStrategy(auth.OAuthConfig{
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		TokenURL:     tokenServer.URL,
	})

	// Create client
	client := NewClient(Config{
		ShortCode: "test",
		TenantID:  "bdpx_prd",
	}, authStrategy)

	// Trigger a token fetch by making a request
	ctx := context.Background()
	from := time.Unix(500, 0)
	to := time.Unix(2000, 0)

	// This will fail because we don't have a metrics server, but it will trigger token fetch
	_, _ = client.GetOverallMetrics(ctx, from, to, nil)

	// Verify both required scopes are present
	if !strings.Contains(requestedScopes, MetricsScope) {
		t.Errorf("Expected scope %q in request, got: %s", MetricsScope, requestedScopes)
	}

	// BuildTenantScope normalizes the tenant ID (strips f_ecom_), so expect the normalized form
	expectedTenantScope := "SALESFORCE_COMMERCE_API:bdpx_prd"
	if !strings.Contains(requestedScopes, expectedTenantScope) {
		t.Errorf("Expected scope %q in request, got: %s", expectedTenantScope, requestedScopes)
	}
}
