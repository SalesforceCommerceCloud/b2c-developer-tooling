/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Package clients provides tenant ID normalization and OAuth scope helpers for B2C Commerce APIs.
package clients

import "strings"

const (
	// OrganizationIDPrefix is the required prefix for SCAPI organization IDs.
	OrganizationIDPrefix = "f_ecom_"

	// ScapiTenantScopePrefix is the prefix for tenant-specific SCAPI OAuth scopes.
	ScapiTenantScopePrefix = "SALESFORCE_COMMERCE_API:"
)

// NormalizeTenantID normalizes a tenant ID by:
// 1. Trimming whitespace
// 2. Taking substring before first dot (if present)
// 3. Stripping leading "f_ecom_" prefix (if present)
// 4. Replacing all hyphens with underscores
//
// Examples:
//   - "f_ecom_bdpx_prd" → "bdpx_prd"
//   - "abcd-123.dx.commercecloud.salesforce.com" → "abcd_123"
//   - "bdpx_prd" → "bdpx_prd"
func NormalizeTenantID(value string) string {
	// Trim whitespace
	normalized := strings.TrimSpace(value)

	// Take substring before first dot
	if dotIdx := strings.Index(normalized, "."); dotIdx > 0 {
		normalized = normalized[:dotIdx]
	}

	// Strip f_ecom_ prefix
	normalized = strings.TrimPrefix(normalized, OrganizationIDPrefix)

	// Replace hyphens with underscores
	normalized = strings.ReplaceAll(normalized, "-", "_")

	return normalized
}

// ToOrganizationID ensures a tenant ID has the required f_ecom_ prefix for use as an SCAPI organizationId.
// If the value already has the prefix, it is returned unchanged (after normalization).
//
// Examples:
//   - "bdpx_prd" → "f_ecom_bdpx_prd"
//   - "f_ecom_bdpx_prd" → "f_ecom_bdpx_prd"
func ToOrganizationID(tenantID string) string {
	normalized := NormalizeTenantID(tenantID)
	return OrganizationIDPrefix + normalized
}

// BuildTenantScope constructs the tenant-specific SCAPI OAuth scope for the given tenant ID.
//
// Example:
//   - "bdpx_prd" → "SALESFORCE_COMMERCE_API:bdpx_prd"
func BuildTenantScope(tenantID string) string {
	normalized := NormalizeTenantID(tenantID)
	return ScapiTenantScopePrefix + normalized
}
