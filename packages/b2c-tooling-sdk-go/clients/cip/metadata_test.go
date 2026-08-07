/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package cip

import (
	"testing"
)

func TestPick(t *testing.T) {
	tests := []struct {
		name     string
		row      map[string]any
		keys     []string
		expected string
	}{
		{
			name:     "first key exists",
			row:      map[string]any{"columnName": "test_col", "COLUMN_NAME": "other"},
			keys:     []string{"columnName", "COLUMN_NAME"},
			expected: "test_col",
		},
		{
			name:     "second key exists",
			row:      map[string]any{"COLUMN_NAME": "uppercase_col"},
			keys:     []string{"columnName", "COLUMN_NAME"},
			expected: "uppercase_col",
		},
		{
			name:     "no keys exist",
			row:      map[string]any{"other": "value"},
			keys:     []string{"columnName", "COLUMN_NAME"},
			expected: "",
		},
		{
			name:     "nil value",
			row:      map[string]any{"columnName": nil},
			keys:     []string{"columnName"},
			expected: "",
		},
		{
			name:     "byte slice value",
			row:      map[string]any{"columnName": []byte("byte_col")},
			keys:     []string{"columnName"},
			expected: "byte_col",
		},
		{
			name:     "case sensitivity",
			row:      map[string]any{"columnname": "lowercase", "columnName": "camelCase"},
			keys:     []string{"columnName", "columnname"},
			expected: "camelCase",
		},
		{
			name:     "empty row",
			row:      map[string]any{},
			keys:     []string{"columnName"},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pick(tt.row, tt.keys...)
			if got != tt.expected {
				t.Errorf("pick() = %q, want %q", got, tt.expected)
			}
		})
	}
}

func TestPickInt(t *testing.T) {
	tests := []struct {
		name     string
		row      map[string]any
		keys     []string
		expected int
	}{
		{
			name:     "int value",
			row:      map[string]any{"ordinalPosition": 5},
			keys:     []string{"ordinalPosition"},
			expected: 5,
		},
		{
			name:     "int32 value",
			row:      map[string]any{"ordinalPosition": int32(10)},
			keys:     []string{"ordinalPosition"},
			expected: 10,
		},
		{
			name:     "int64 value",
			row:      map[string]any{"ordinalPosition": int64(15)},
			keys:     []string{"ordinalPosition"},
			expected: 15,
		},
		{
			name:     "float64 value",
			row:      map[string]any{"ordinalPosition": float64(20.7)},
			keys:     []string{"ordinalPosition"},
			expected: 20,
		},
		{
			name:     "first key exists",
			row:      map[string]any{"ordinalposition": 1, "ORDINAL_POSITION": 2},
			keys:     []string{"ordinalposition", "ORDINAL_POSITION"},
			expected: 1,
		},
		{
			name:     "no keys exist",
			row:      map[string]any{"other": 42},
			keys:     []string{"ordinalPosition"},
			expected: 0,
		},
		{
			name:     "string value (not int)",
			row:      map[string]any{"ordinalPosition": "not_a_number"},
			keys:     []string{"ordinalPosition"},
			expected: 0,
		},
		{
			name:     "nil value",
			row:      map[string]any{"ordinalPosition": nil},
			keys:     []string{"ordinalPosition"},
			expected: 0,
		},
		{
			name:     "empty row",
			row:      map[string]any{},
			keys:     []string{"ordinalPosition"},
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pickInt(tt.row, tt.keys...)
			if got != tt.expected {
				t.Errorf("pickInt() = %d, want %d", got, tt.expected)
			}
		})
	}
}

func TestEscapeSQLString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "no single quotes",
			input:    "warehouse",
			expected: "warehouse",
		},
		{
			name:     "single quote",
			input:    "O'Reilly",
			expected: "O''Reilly",
		},
		{
			name:     "multiple single quotes",
			input:    "It's John's book",
			expected: "It''s John''s book",
		},
		{
			name:     "only single quote",
			input:    "'",
			expected: "''",
		},
		{
			name:     "consecutive single quotes",
			input:    "''test''",
			expected: "''''test''''",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "SQL injection attempt",
			input:    "'; DROP TABLE users; --",
			expected: "''; DROP TABLE users; --",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := escapeSQLString(tt.input)
			if got != tt.expected {
				t.Errorf("escapeSQLString(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestAsString(t *testing.T) {
	tests := []struct {
		name     string
		input    any
		expected string
	}{
		{
			name:     "string value",
			input:    "test_string",
			expected: "test_string",
		},
		{
			name:     "byte slice",
			input:    []byte("byte_string"),
			expected: "byte_string",
		},
		{
			name:     "nil value",
			input:    nil,
			expected: "",
		},
		{
			name:     "int value",
			input:    42,
			expected: "42",
		},
		{
			name:     "float value",
			input:    3.14,
			expected: "3.14",
		},
		{
			name:     "bool value",
			input:    true,
			expected: "true",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "empty byte slice",
			input:    []byte{},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := asString(tt.input)
			if got != tt.expected {
				t.Errorf("asString(%v) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}
