/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package metrics

import (
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"testing"
)

// TestCatalogParity ensures the Go-embedded metrics tag catalog and golden
// fixture remain in sync with the TypeScript source of truth.
//
// The canonical catalog lives in packages/b2c-tooling-sdk/specs/:
//   - metrics-tags-catalog.json (tag extraction rules)
//   - metrics-tags.golden.json (test fixture with expected outputs)
//
// The Go SDK embeds copies at operations/metrics/data/. This test fails if the
// Go copies drift from the TS originals (ignoring the volatile generatedAt
// timestamp field).
//
// Why cross-language parity matters:
// - The TS SDK generates the catalog via npm script; the Go SDK embeds it.
// - Both implementations must agree on tag extraction logic for Grafana/CLI consistency.
// - A mismatch would cause silent query/tagging divergence between tools.
//
// If this test fails:
//  1. Regenerate the TS catalog: cd packages/b2c-tooling-sdk && pnpm run generate:metrics-tags-catalog
//  2. Copy the updated JSON files from packages/b2c-tooling-sdk/specs/ to
//     packages/b2c-tooling-sdk-go/operations/metrics/data/
//  3. Re-run this test to verify parity.
func TestCatalogParity(t *testing.T) {
	// Find the repo root by walking up from this test file's directory.
	// This is robust to different working directories (go test ./..., CI, IDE test runners).
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("Failed to determine test file path")
	}

	// Navigate from this test file to repo root:
	// catalog_parity_test.go is at:
	//   packages/b2c-tooling-sdk-go/operations/metrics/catalog_parity_test.go
	// repo root is 4 levels up: ../../../..
	repoRoot := filepath.Join(filepath.Dir(thisFile), "..", "..", "..", "..")
	repoRoot, err := filepath.Abs(repoRoot)
	if err != nil {
		t.Fatalf("Failed to resolve repo root: %v", err)
	}

	// TS source of truth paths
	tsCatalogPath := filepath.Join(repoRoot, "packages", "b2c-tooling-sdk", "specs", "metrics-tags-catalog.json")
	tsGoldenPath := filepath.Join(repoRoot, "packages", "b2c-tooling-sdk", "specs", "metrics-tags.golden.json")

	// Go embedded copies (checked against TS originals)
	goCatalogPath := filepath.Join(repoRoot, "packages", "b2c-tooling-sdk-go", "operations", "metrics", "data", "metrics-tags-catalog.json")
	goGoldenPath := filepath.Join(repoRoot, "packages", "b2c-tooling-sdk-go", "operations", "metrics", "data", "metrics-tags.golden.json")

	// If TS files don't exist, skip with a clear message (this allows the test
	// to pass outside the monorepo or when the SDK package is absent).
	if _, err := os.Stat(tsCatalogPath); os.IsNotExist(err) {
		t.Skip("TypeScript catalog not found; skipping cross-language parity check (this is OK outside the monorepo)")
	}

	// Compare catalog files
	t.Run("catalog", func(t *testing.T) {
		assertJSONFilesEqual(t, tsCatalogPath, goCatalogPath)
	})

	// Compare golden fixture files
	t.Run("golden", func(t *testing.T) {
		assertJSONFilesEqual(t, tsGoldenPath, goGoldenPath)
	})
}

// assertJSONFilesEqual reads two JSON files, parses them, removes volatile fields
// (like generatedAt timestamps), and asserts deep equality of the meaningful content.
func assertJSONFilesEqual(t *testing.T, expectedPath, actualPath string) {
	t.Helper()

	// Read expected (TS source of truth)
	expectedBytes, err := os.ReadFile(expectedPath)
	if err != nil {
		t.Fatalf("Failed to read expected file %s: %v", expectedPath, err)
	}

	// Read actual (Go embedded copy)
	actualBytes, err := os.ReadFile(actualPath)
	if err != nil {
		t.Fatalf("Failed to read actual file %s: %v", actualPath, err)
	}

	// Parse both as generic JSON
	var expected, actual map[string]interface{}
	if err := json.Unmarshal(expectedBytes, &expected); err != nil {
		t.Fatalf("Failed to parse expected JSON from %s: %v", expectedPath, err)
	}
	if err := json.Unmarshal(actualBytes, &actual); err != nil {
		t.Fatalf("Failed to parse actual JSON from %s: %v", actualPath, err)
	}

	// Remove volatile generatedAt timestamp before comparison
	delete(expected, "generatedAt")
	delete(actual, "generatedAt")

	// Deep-compare the meaningful content
	if !reflect.DeepEqual(expected, actual) {
		// Format both for readable diff output
		expectedJSON, _ := json.MarshalIndent(expected, "", "  ")
		actualJSON, _ := json.MarshalIndent(actual, "", "  ")

		t.Errorf("Go catalog drift detected!\n\nExpected (TS source of truth):\n%s\n\nActual (Go embedded copy):\n%s\n\nTo fix:\n  1. cd packages/b2c-tooling-sdk && pnpm run generate:metrics-tags-catalog\n  2. cp packages/b2c-tooling-sdk/specs/*.json packages/b2c-tooling-sdk-go/operations/metrics/data/\n  3. Re-run tests",
			expectedJSON, actualJSON)
	}
}
