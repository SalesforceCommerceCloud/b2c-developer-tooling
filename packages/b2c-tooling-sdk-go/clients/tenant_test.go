/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package clients

import "testing"

func TestNormalizeTenantID(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "prefixed org id",
			input: "f_ecom_bdpx_prd",
			want:  "bdpx_prd",
		},
		{
			name:  "bare tenant id",
			input: "bdpx_prd",
			want:  "bdpx_prd",
		},
		{
			name:  "full hostname with dot",
			input: "abcd-123.dx.commercecloud.salesforce.com",
			want:  "abcd_123",
		},
		{
			name:  "hyphenated id",
			input: "test-realm-env",
			want:  "test_realm_env",
		},
		{
			name:  "with leading and trailing whitespace",
			input: "  bdpx_prd  ",
			want:  "bdpx_prd",
		},
		{
			name:  "prefixed with dot",
			input: "f_ecom_bdpx_prd.dx.example.com",
			want:  "bdpx_prd",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NormalizeTenantID(tt.input)
			if got != tt.want {
				t.Errorf("NormalizeTenantID(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestToOrganizationID(t *testing.T) {
	tests := []struct {
		name     string
		tenantID string
		want     string
	}{
		{
			name:     "bare tenant id",
			tenantID: "bdpx_prd",
			want:     "f_ecom_bdpx_prd",
		},
		{
			name:     "already prefixed",
			tenantID: "f_ecom_bdpx_prd",
			want:     "f_ecom_bdpx_prd",
		},
		{
			name:     "with hostname",
			tenantID: "abcd-123.dx.example.com",
			want:     "f_ecom_abcd_123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ToOrganizationID(tt.tenantID)
			if got != tt.want {
				t.Errorf("ToOrganizationID(%q) = %q, want %q", tt.tenantID, got, tt.want)
			}
		})
	}
}

func TestBuildTenantScope(t *testing.T) {
	tests := []struct {
		name     string
		tenantID string
		want     string
	}{
		{
			name:     "bare tenant id",
			tenantID: "bdpx_prd",
			want:     "SALESFORCE_COMMERCE_API:bdpx_prd",
		},
		{
			name:     "prefixed org id",
			tenantID: "f_ecom_bdpx_prd",
			want:     "SALESFORCE_COMMERCE_API:bdpx_prd",
		},
		{
			name:     "hyphenated id",
			tenantID: "test-realm-env",
			want:     "SALESFORCE_COMMERCE_API:test_realm_env",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildTenantScope(tt.tenantID)
			if got != tt.want {
				t.Errorf("BuildTenantScope(%q) = %q, want %q", tt.tenantID, got, tt.want)
			}
		})
	}
}
