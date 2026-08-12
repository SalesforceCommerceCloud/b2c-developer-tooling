/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package cip

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
)

func TestNewClient_RequiresInstance(t *testing.T) {
	mockAuth := createMockAuthStrategy(t)

	_, err := NewClient(Config{
		Instance: "", // Empty instance should error
	}, mockAuth)

	if err == nil {
		t.Fatal("Expected error for empty Instance, got nil")
	}
	if err.Error() != "cip: Instance is required" {
		t.Errorf("Expected 'cip: Instance is required', got: %v", err)
	}
}

func TestNewClient_DefaultHost(t *testing.T) {
	mockAuth := createMockAuthStrategy(t)

	client, err := NewClient(Config{
		Instance: "test_instance",
		// Host empty → should default to DefaultHost
	}, mockAuth)

	if err != nil {
		t.Fatalf("Unexpected error creating client: %v", err)
	}
	if client == nil {
		t.Fatal("Expected non-nil client")
	}
	// Clean up
	client.Close()
}

func TestNewClient_CustomHost(t *testing.T) {
	mockAuth := createMockAuthStrategy(t)

	client, err := NewClient(Config{
		Instance: "test_instance",
		Host:     "custom.jdbc.host.com",
	}, mockAuth)

	if err != nil {
		t.Fatalf("Unexpected error creating client with custom host: %v", err)
	}
	if client == nil {
		t.Fatal("Expected non-nil client")
	}
	// Clean up
	client.Close()
}

func TestSessionTransport_InjectsHeaders(t *testing.T) {
	var capturedHeaders http.Header
	var requestCount int

	// Mock HTTP server to capture headers
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		capturedHeaders = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// Create session transport
	transport := &sessionTransport{
		base:     http.DefaultTransport,
		instance: "test_instance",
	}

	// Make request
	req, _ := http.NewRequest("GET", server.URL, nil)
	client := &http.Client{Transport: transport}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	resp.Body.Close()

	// Verify headers were injected
	if got := capturedHeaders.Get("InstanceId"); got != "test_instance" {
		t.Errorf("Expected InstanceId header 'test_instance', got: %q", got)
	}
	if got := capturedHeaders.Get("X-Client-Version"); got != clientVersion {
		t.Errorf("Expected X-Client-Version header %q, got: %q", clientVersion, got)
	}
	if requestCount != 1 {
		t.Errorf("Expected 1 request, got %d", requestCount)
	}
}

func TestSessionTransport_StickySession(t *testing.T) {
	var requests []http.Header
	testSessionID := "test-session-123"

	// Mock HTTP server that returns x-session-id on first request
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests = append(requests, r.Header.Clone())

		// First request: return session ID
		if len(requests) == 1 {
			w.Header().Set("x-session-id", testSessionID)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// Create session transport
	transport := &sessionTransport{
		base:     http.DefaultTransport,
		instance: "test_instance",
	}

	client := &http.Client{Transport: transport}

	// First request - should NOT have x-session-id
	req1, _ := http.NewRequest("GET", server.URL, nil)
	resp1, err := client.Do(req1)
	if err != nil {
		t.Fatalf("First request failed: %v", err)
	}
	resp1.Body.Close()

	// Second request - SHOULD have x-session-id echoed
	req2, _ := http.NewRequest("GET", server.URL, nil)
	resp2, err := client.Do(req2)
	if err != nil {
		t.Fatalf("Second request failed: %v", err)
	}
	resp2.Body.Close()

	// Third request - SHOULD also have x-session-id
	req3, _ := http.NewRequest("GET", server.URL, nil)
	resp3, err := client.Do(req3)
	if err != nil {
		t.Fatalf("Third request failed: %v", err)
	}
	resp3.Body.Close()

	// Verify first request did NOT have session ID
	if got := requests[0].Get("x-session-id"); got != "" {
		t.Errorf("First request should not have x-session-id, got: %q", got)
	}

	// Verify second request echoed session ID
	if got := requests[1].Get("x-session-id"); got != testSessionID {
		t.Errorf("Second request expected x-session-id %q, got: %q", testSessionID, got)
	}

	// Verify third request also echoed session ID
	if got := requests[2].Get("x-session-id"); got != testSessionID {
		t.Errorf("Third request expected x-session-id %q, got: %q", testSessionID, got)
	}
}

func TestSessionTransport_ThreadSafety(t *testing.T) {
	testSessionID := "concurrent-session-456"
	requestCount := 0
	var mu sync.Mutex

	// Mock HTTP server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		requestCount++
		count := requestCount
		mu.Unlock()

		// Return session ID on first request
		if count == 1 {
			w.Header().Set("x-session-id", testSessionID)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// Create session transport
	transport := &sessionTransport{
		base:     http.DefaultTransport,
		instance: "test_instance",
	}

	client := &http.Client{Transport: transport}

	// Make concurrent requests to test thread safety
	const concurrency = 10
	var wg sync.WaitGroup
	errors := make(chan error, concurrency)

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			req, _ := http.NewRequest("GET", server.URL, nil)
			resp, err := client.Do(req)
			if err != nil {
				errors <- err
				return
			}
			resp.Body.Close()
		}()
	}

	wg.Wait()
	close(errors)

	// Check for errors
	for err := range errors {
		t.Errorf("Concurrent request failed: %v", err)
	}

	// Verify all requests completed
	mu.Lock()
	finalCount := requestCount
	mu.Unlock()

	if finalCount != concurrency {
		t.Errorf("Expected %d requests, got %d", concurrency, finalCount)
	}
}

func TestSessionTransport_SessionIDUpdate(t *testing.T) {
	sessionIDs := []string{"session-1", "session-2", "session-3"}
	requestNum := 0

	// Mock HTTP server that changes session ID on each request
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if requestNum < len(sessionIDs) {
			w.Header().Set("x-session-id", sessionIDs[requestNum])
		}
		requestNum++
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	transport := &sessionTransport{
		base:     http.DefaultTransport,
		instance: "test_instance",
	}

	client := &http.Client{Transport: transport}

	// Make requests and verify session ID updates
	for i := 0; i < len(sessionIDs); i++ {
		req, _ := http.NewRequest("GET", server.URL, nil)
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request %d failed: %v", i, err)
		}
		resp.Body.Close()

		// Verify internal session ID was updated
		transport.mu.Lock()
		got := transport.sessionID
		transport.mu.Unlock()

		if got != sessionIDs[i] {
			t.Errorf("After request %d, expected sessionID %q, got %q", i, sessionIDs[i], got)
		}
	}
}

// createMockAuthStrategy creates a minimal mock OAuth strategy for testing.
// It returns a strategy with a mock token endpoint that doesn't perform actual OAuth.
func createMockAuthStrategy(t *testing.T) *auth.OAuthStrategy {
	// Create a mock token server
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"access_token": "mock-token",
			"token_type": "Bearer",
			"expires_in": 3600
		}`))
	}))
	t.Cleanup(tokenServer.Close)

	// Create strategy with mock token URL
	strategy := auth.NewOAuthStrategy(auth.OAuthConfig{
		ClientID:     "mock-client",
		ClientSecret: "mock-secret",
		TokenURL:     tokenServer.URL, // Use mock server
		Scopes:       []string{"SALESFORCE_COMMERCE_API:test"},
	})

	return strategy
}

func TestClient_DB(t *testing.T) {
	mockAuth := createMockAuthStrategy(t)

	client, err := NewClient(Config{
		Instance: "test_instance",
	}, mockAuth)
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Verify DB() returns non-nil
	db := client.DB()
	if db == nil {
		t.Error("Expected non-nil *sql.DB from DB()")
	}
}

func TestClient_Close(t *testing.T) {
	mockAuth := createMockAuthStrategy(t)

	client, err := NewClient(Config{
		Instance: "test_instance",
	}, mockAuth)
	if err != nil {
		t.Fatalf("Failed to create client: %v", err)
	}

	// Close should not error
	if err := client.Close(); err != nil {
		t.Errorf("Close() returned error: %v", err)
	}

	// Multiple closes should be safe
	if err := client.Close(); err != nil {
		t.Errorf("Second Close() returned error: %v", err)
	}
}

// TestClient_Query and TestClient_Ping would require actual Avatica protocol mocking,
// which is complex. These are better tested via integration tests with a real CIP instance.
// The unit tests above cover the custom logic (session handling, config validation, header injection).
