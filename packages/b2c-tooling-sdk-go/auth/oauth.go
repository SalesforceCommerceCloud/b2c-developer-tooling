/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Package auth provides OAuth2 authentication strategies for B2C Commerce APIs.
package auth

import (
	"context"
	"net/http"
	"strings"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

const (
	// DefaultAccountManagerHost is the default Account Manager host for OAuth authentication.
	DefaultAccountManagerHost = "account.demandware.com"

	// ClientIDHeader is the HTTP header used to pass the OAuth client ID.
	ClientIDHeader = "x-dw-client-id"
)

// OAuthConfig holds configuration for OAuth2 client credentials flow.
type OAuthConfig struct {
	// ClientID is the OAuth client ID.
	ClientID string

	// ClientSecret is the OAuth client secret.
	ClientSecret string

	// AccountManagerHost is the Account Manager hostname.
	// Defaults to DefaultAccountManagerHost if not specified.
	// Ignored if TokenURL is set.
	AccountManagerHost string

	// TokenURL is the full OAuth token endpoint URL.
	// If set, used verbatim (supports http:// for local testing).
	// If empty, derived from AccountManagerHost as https://{host}/dwsso/oauth2/access_token.
	TokenURL string

	// Scopes is the list of OAuth scopes to request.
	// If nil or empty, requests no scopes (server default).
	Scopes []string
}

// OAuthStrategy implements OAuth2 client credentials authentication with token caching
// and automatic x-dw-client-id header injection. It wraps golang.org/x/oauth2/clientcredentials
// for grant+refresh and provides an http.Client ready for B2C Commerce API calls.
type OAuthStrategy struct {
	clientID string
	config   *clientcredentials.Config
	client   *http.Client
}

// NewOAuthStrategy creates a new OAuth2 authentication strategy using client credentials flow.
// The returned strategy provides an http.Client that automatically:
// - Fetches and caches OAuth tokens
// - Refreshes tokens on expiry
// - Injects the Authorization: Bearer header
// - Injects the x-dw-client-id header
//
// Token caching is handled by oauth2.ReuseTokenSource, which provides single-flight token
// requests (concurrent calls coalesce onto a single token fetch).
func NewOAuthStrategy(cfg OAuthConfig) *OAuthStrategy {
	// Determine token URL
	var tokenURL string
	if cfg.TokenURL != "" {
		// Use explicit override (supports http:// for local testing)
		tokenURL = cfg.TokenURL
	} else {
		// Derive from AccountManagerHost
		host := cfg.AccountManagerHost
		if host == "" {
			host = DefaultAccountManagerHost
		}
		tokenURL = "https://" + host + "/dwsso/oauth2/access_token"
	}

	// Create client credentials config
	ccConfig := &clientcredentials.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		TokenURL:     tokenURL,
		Scopes:       cfg.Scopes,
		AuthStyle:    oauth2.AuthStyleInHeader, // Use Basic auth (base64 clientId:clientSecret)
	}

	// Create an HTTP client with the oauth2 transport plus our custom header transport
	ctx := context.Background()
	tokenSource := ccConfig.TokenSource(ctx)

	// Wrap the oauth2 transport to inject x-dw-client-id header
	baseClient := oauth2.NewClient(ctx, tokenSource)
	clientIDTransport := &clientIDTransport{
		base:     baseClient.Transport,
		clientID: cfg.ClientID,
	}

	client := &http.Client{
		Transport: clientIDTransport,
	}

	return &OAuthStrategy{
		clientID: cfg.ClientID,
		config:   ccConfig,
		client:   client,
	}
}

// Client returns the http.Client configured with OAuth authentication.
// The client automatically handles token fetch, cache, refresh, and header injection.
func (s *OAuthStrategy) Client() *http.Client {
	return s.client
}

// WithAdditionalScopes returns a new OAuthStrategy with additional scopes added to the existing set.
// This is useful for creating scoped clients from a base strategy without re-specifying all config.
func (s *OAuthStrategy) WithAdditionalScopes(additionalScopes []string) *OAuthStrategy {
	// Merge scopes, avoiding duplicates
	scopeSet := make(map[string]bool)
	for _, scope := range s.config.Scopes {
		scopeSet[scope] = true
	}
	for _, scope := range additionalScopes {
		scopeSet[scope] = true
	}

	// Convert back to slice
	mergedScopes := make([]string, 0, len(scopeSet))
	for scope := range scopeSet {
		mergedScopes = append(mergedScopes, scope)
	}

	// Create new config with merged scopes
	newConfig := &clientcredentials.Config{
		ClientID:     s.config.ClientID,
		ClientSecret: s.config.ClientSecret,
		TokenURL:     s.config.TokenURL,
		Scopes:       mergedScopes,
		AuthStyle:    s.config.AuthStyle,
	}

	// Create new client with merged scopes
	ctx := context.Background()
	tokenSource := newConfig.TokenSource(ctx)
	baseClient := oauth2.NewClient(ctx, tokenSource)
	clientIDTransport := &clientIDTransport{
		base:     baseClient.Transport,
		clientID: s.clientID,
	}

	client := &http.Client{
		Transport: clientIDTransport,
	}

	return &OAuthStrategy{
		clientID: s.clientID,
		config:   newConfig,
		client:   client,
	}
}

// clientIDTransport is an http.RoundTripper that injects the x-dw-client-id header.
type clientIDTransport struct {
	base     http.RoundTripper
	clientID string
}

func (t *clientIDTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// Clone the request to avoid mutating the original
	req2 := req.Clone(req.Context())
	req2.Header.Set(ClientIDHeader, t.clientID)
	return t.base.RoundTrip(req2)
}

// FormatScopes joins scopes into a space-delimited string for OAuth token requests.
func FormatScopes(scopes []string) string {
	return strings.Join(scopes, " ")
}
