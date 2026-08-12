/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package auth

import (
	"context"
	"encoding/base64"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"golang.org/x/oauth2"
)

func TestOAuthStrategy_Integration(t *testing.T) {
	// Track token requests
	var tokenRequests int
	var lastAuthHeader string

	// Mock token endpoint
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenRequests++

		// Verify Basic auth header
		lastAuthHeader = r.Header.Get("Authorization")
		if !strings.HasPrefix(lastAuthHeader, "Basic ") {
			t.Errorf("Expected Basic auth, got: %s", lastAuthHeader)
		}

		// Decode Basic auth to verify client credentials
		encodedCreds := strings.TrimPrefix(lastAuthHeader, "Basic ")
		decoded, err := base64.StdEncoding.DecodeString(encodedCreds)
		if err != nil {
			t.Fatalf("Failed to decode Basic auth: %v", err)
		}
		creds := string(decoded)
		if !strings.HasPrefix(creds, "test-client-id:test-client-secret") {
			t.Errorf("Expected credentials 'test-client-id:test-client-secret', got: %s", creds)
		}

		// Verify grant_type
		body, _ := io.ReadAll(r.Body)
		if !strings.Contains(string(body), "grant_type=client_credentials") {
			t.Errorf("Expected grant_type=client_credentials in body, got: %s", string(body))
		}

		// Return mock token
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"access_token": "mock-access-token",
			"token_type": "Bearer",
			"expires_in": 3600,
			"scope": "sfcc.metrics SALESFORCE_COMMERCE_API:bdpx_prd"
		}`))
	}))
	defer tokenServer.Close()

	// Mock API endpoint
	apiCallCount := 0
	apiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiCallCount++

		// Verify Bearer token
		authHeader := r.Header.Get("Authorization")
		if authHeader != "Bearer mock-access-token" {
			t.Errorf("Expected Bearer token, got: %s", authHeader)
		}

		// Verify x-dw-client-id header
		clientIDHeader := r.Header.Get("x-dw-client-id")
		if clientIDHeader != "test-client-id" {
			t.Errorf("Expected x-dw-client-id header 'test-client-id', got: %s", clientIDHeader)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok"}`))
	}))
	defer apiServer.Close()

	// Create OAuth strategy with mock token URL
	strategy := NewOAuthStrategy(OAuthConfig{
		ClientID:           "test-client-id",
		ClientSecret:       "test-client-secret",
		AccountManagerHost: strings.TrimPrefix(tokenServer.URL, "https://"),
		Scopes:             []string{"sfcc.metrics", "SALESFORCE_COMMERCE_API:bdpx_prd"},
	})

	// Override the token URL since httptest creates http:// URLs
	strategy.config.TokenURL = tokenServer.URL

	// Recreate the client with the updated config
	ctx := context.Background()
	tokenSource := strategy.config.TokenSource(ctx)
	baseClient := &http.Client{
		Transport: &http.Transport{},
	}
	baseClient.Transport = &oauth2Transport{
		base:   baseClient.Transport,
		source: tokenSource,
	}
	clientIDTransport := &clientIDTransport{
		base:     baseClient.Transport,
		clientID: strategy.clientID,
	}
	strategy.client = &http.Client{
		Transport: clientIDTransport,
	}

	// Make first API call
	resp, err := strategy.Client().Get(apiServer.URL)
	if err != nil {
		t.Fatalf("First API call failed: %v", err)
	}
	resp.Body.Close()

	if tokenRequests != 1 {
		t.Errorf("Expected 1 token request, got %d", tokenRequests)
	}
	if apiCallCount != 1 {
		t.Errorf("Expected 1 API call, got %d", apiCallCount)
	}

	// Make second API call - should reuse cached token
	resp, err = strategy.Client().Get(apiServer.URL)
	if err != nil {
		t.Fatalf("Second API call failed: %v", err)
	}
	resp.Body.Close()

	if tokenRequests != 1 {
		t.Errorf("Expected token to be cached (still 1 request), got %d", tokenRequests)
	}
	if apiCallCount != 2 {
		t.Errorf("Expected 2 API calls, got %d", apiCallCount)
	}
}

func TestOAuthStrategy_WithAdditionalScopes(t *testing.T) {
	strategy := NewOAuthStrategy(OAuthConfig{
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		Scopes:       []string{"sfcc.products"},
	})

	// Add additional scopes
	scopedStrategy := strategy.WithAdditionalScopes([]string{"sfcc.orders", "sfcc.customers"})

	// Verify merged scopes (order may vary due to map iteration)
	scopeMap := make(map[string]bool)
	for _, scope := range scopedStrategy.config.Scopes {
		scopeMap[scope] = true
	}

	expectedScopes := []string{"sfcc.products", "sfcc.orders", "sfcc.customers"}
	for _, expected := range expectedScopes {
		if !scopeMap[expected] {
			t.Errorf("Expected scope %q in merged scopes", expected)
		}
	}

	if len(scopedStrategy.config.Scopes) != 3 {
		t.Errorf("Expected 3 merged scopes, got %d", len(scopedStrategy.config.Scopes))
	}
}

func TestOAuthStrategy_WithAdditionalScopes_NoDuplicates(t *testing.T) {
	strategy := NewOAuthStrategy(OAuthConfig{
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		Scopes:       []string{"sfcc.products", "sfcc.orders"},
	})

	// Add overlapping scopes
	scopedStrategy := strategy.WithAdditionalScopes([]string{"sfcc.orders", "sfcc.customers"})

	// Verify no duplicates
	if len(scopedStrategy.config.Scopes) != 3 {
		t.Errorf("Expected 3 unique scopes, got %d: %v", len(scopedStrategy.config.Scopes), scopedStrategy.config.Scopes)
	}
}

// oauth2Transport is a minimal oauth2 transport for testing (mimics oauth2.Transport)
type oauth2Transport struct {
	base   http.RoundTripper
	source oauth2.TokenSource
}

func (t *oauth2Transport) RoundTrip(req *http.Request) (*http.Response, error) {
	token, err := t.source.Token()
	if err != nil {
		return nil, err
	}

	req2 := req.Clone(req.Context())
	token.SetAuthHeader(req2)
	return t.base.RoundTrip(req2)
}

func TestOAuthStrategy_TokenURLOverride(t *testing.T) {
	// Mock token endpoint
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"access_token": "override-token",
			"token_type": "Bearer",
			"expires_in": 3600
		}`))
	}))
	defer tokenServer.Close()

	// Create strategy with explicit TokenURL override (http://)
	strategy := NewOAuthStrategy(OAuthConfig{
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		TokenURL:     tokenServer.URL, // Full http:// URL
		Scopes:       []string{"sfcc.metrics"},
	})

	// Verify the tokenURL was used verbatim
	if strategy.config.TokenURL != tokenServer.URL {
		t.Errorf("Expected TokenURL %q, got %q", tokenServer.URL, strategy.config.TokenURL)
	}

	// Verify it accepts http:// scheme
	if !strings.HasPrefix(strategy.config.TokenURL, "http://") {
		t.Errorf("Expected http:// scheme to be preserved, got: %s", strategy.config.TokenURL)
	}

	// Test that it actually works for token fetch
	ctx := context.Background()
	token, err := strategy.config.TokenSource(ctx).Token()
	if err != nil {
		t.Fatalf("Token fetch failed: %v", err)
	}

	if token.AccessToken != "override-token" {
		t.Errorf("Expected token 'override-token', got %q", token.AccessToken)
	}
}

func TestOAuthStrategy_TokenURLEmpty_FallsBackToAccountManagerHost(t *testing.T) {
	// Create strategy without TokenURL (should derive from AccountManagerHost)
	strategy := NewOAuthStrategy(OAuthConfig{
		ClientID:           "test-client",
		ClientSecret:       "test-secret",
		AccountManagerHost: "custom.account.manager.com",
	})

	expectedURL := "https://custom.account.manager.com/dwsso/oauth2/access_token"
	if strategy.config.TokenURL != expectedURL {
		t.Errorf("Expected TokenURL %q, got %q", expectedURL, strategy.config.TokenURL)
	}
}

func TestOAuthStrategy_TokenURLEmpty_DefaultAccountManager(t *testing.T) {
	// Create strategy without TokenURL or AccountManagerHost
	strategy := NewOAuthStrategy(OAuthConfig{
		ClientID:     "test-client",
		ClientSecret: "test-secret",
	})

	expectedURL := "https://" + DefaultAccountManagerHost + "/dwsso/oauth2/access_token"
	if strategy.config.TokenURL != expectedURL {
		t.Errorf("Expected TokenURL %q, got %q", expectedURL, strategy.config.TokenURL)
	}
}

func TestFormatScopes(t *testing.T) {
	tests := []struct {
		name   string
		scopes []string
		want   string
	}{
		{
			name:   "single scope",
			scopes: []string{"sfcc.products"},
			want:   "sfcc.products",
		},
		{
			name:   "multiple scopes",
			scopes: []string{"sfcc.products", "sfcc.orders", "SALESFORCE_COMMERCE_API:bdpx_prd"},
			want:   "sfcc.products sfcc.orders SALESFORCE_COMMERCE_API:bdpx_prd",
		},
		{
			name:   "empty scopes",
			scopes: []string{},
			want:   "",
		},
		{
			name:   "nil scopes",
			scopes: nil,
			want:   "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := FormatScopes(tt.scopes)
			if got != tt.want {
				t.Errorf("FormatScopes(%v) = %q, want %q", tt.scopes, got, tt.want)
			}
		})
	}
}
