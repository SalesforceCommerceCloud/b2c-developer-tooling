/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

// HTTPError is a typed, inspectable error for a non-2xx Metrics API response. It lets
// callers (e.g. the Grafana backend) distinguish rate-limits (429) and downstream 5xx
// from client mistakes (4xx) and attribute the error correctly. Use errors.As to extract.
type HTTPError struct {
	StatusCode int
	Status     string
	Body       string
	// RetryAfter is the parsed Retry-After header (0 if absent/unparseable).
	RetryAfter time.Duration
}

func (e *HTTPError) Error() string {
	if e.RetryAfter > 0 {
		return fmt.Sprintf("metrics API error (status %d): %s (retry after %s)", e.StatusCode, e.Body, e.RetryAfter)
	}
	return fmt.Sprintf("metrics API error (status %d): %s", e.StatusCode, e.Body)
}

// IsRateLimit reports whether this is a 429 Too Many Requests.
func (e *HTTPError) IsRateLimit() bool { return e.StatusCode == http.StatusTooManyRequests }

// IsDownstream reports whether the failure is attributable to the upstream API rather
// than the plugin/caller: 429 and 5xx are downstream; 4xx (except 429) are caller errors.
func (e *HTTPError) IsDownstream() bool {
	return e.StatusCode == http.StatusTooManyRequests || (e.StatusCode >= 500 && e.StatusCode < 600)
}

// IsRetryable reports whether retrying the request could succeed (429, 5xx, 408).
func (e *HTTPError) IsRetryable() bool {
	return e.StatusCode == http.StatusTooManyRequests ||
		e.StatusCode == http.StatusRequestTimeout ||
		(e.StatusCode >= 500 && e.StatusCode < 600)
}

// AsHTTPError extracts an *HTTPError from an error chain, if present.
func AsHTTPError(err error) (*HTTPError, bool) {
	var he *HTTPError
	if errors.As(err, &he) {
		return he, true
	}
	return nil, false
}

// parseRetryAfter parses an HTTP Retry-After header value (delta-seconds or HTTP-date).
// Returns 0 when empty or unparseable.
func parseRetryAfter(header string) time.Duration {
	if header == "" {
		return 0
	}
	if secs, err := strconv.Atoi(header); err == nil && secs >= 0 {
		return time.Duration(secs) * time.Second
	}
	if t, err := http.ParseTime(header); err == nil {
		if d := time.Until(t); d > 0 {
			return d
		}
	}
	return 0
}
