/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package cip

import (
	"context"
	"fmt"
	"strings"
)

// TableInfo describes a CIP catalog table.
type TableInfo struct {
	Schema string `json:"schema"`
	Name   string `json:"name"`
	Type   string `json:"type"`
}

// ColumnInfo describes a CIP table column.
type ColumnInfo struct {
	Name     string `json:"name"`
	DataType string `json:"dataType"`
	Nullable bool   `json:"nullable"`
	Ordinal  int    `json:"ordinal"`
}

// asString coerces a decoded Avatica value to string.
func asString(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case []byte:
		return string(t)
	case nil:
		return ""
	default:
		return fmt.Sprintf("%v", t)
	}
}

// ListTables returns catalog tables, optionally filtered to a schema (e.g. "warehouse").
func (c *Client) ListTables(ctx context.Context, schema string) ([]TableInfo, error) {
	q := "SELECT tableSchem, tableName, tableType FROM metadata.TABLES"
	if schema != "" {
		q += fmt.Sprintf(" WHERE tableSchem = '%s'", escapeSQLString(schema))
	}
	q += " ORDER BY tableSchem, tableName"

	res, err := c.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	tables := make([]TableInfo, 0, len(res.Rows))
	for _, row := range res.Rows {
		tables = append(tables, TableInfo{
			Schema: pick(row, "tableSchem", "tableschem", "TABLE_SCHEM"),
			Name:   pick(row, "tableName", "tablename", "TABLE_NAME"),
			Type:   pick(row, "tableType", "tabletype", "TABLE_TYPE"),
		})
	}
	return tables, nil
}

// DescribeColumns returns the columns of a table (schema defaults to "warehouse").
func (c *Client) DescribeColumns(ctx context.Context, schema, table string) ([]ColumnInfo, error) {
	if schema == "" {
		schema = "warehouse"
	}
	q := fmt.Sprintf(
		"SELECT columnName, typeName, isNullable, ordinalPosition FROM metadata.COLUMNS "+
			"WHERE tableSchem = '%s' AND tableName = '%s' ORDER BY ordinalPosition",
		escapeSQLString(schema), escapeSQLString(table),
	)
	res, err := c.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	cols := make([]ColumnInfo, 0, len(res.Rows))
	for _, row := range res.Rows {
		cols = append(cols, ColumnInfo{
			Name:     pick(row, "columnName", "columnname", "COLUMN_NAME"),
			DataType: pick(row, "typeName", "typename", "TYPE_NAME"),
			Nullable: strings.EqualFold(pick(row, "isNullable", "isnullable", "IS_NULLABLE"), "YES"),
			Ordinal:  pickInt(row, "ordinalPosition", "ordinalposition", "ORDINAL_POSITION"),
		})
	}
	return cols, nil
}

// pick returns the first present key's value as a string (CIP/JDBC metadata label
// casing varies by driver: camelCase alias vs uppercase JDBC name).
func pick(row map[string]any, keys ...string) string {
	for _, k := range keys {
		if v, ok := row[k]; ok {
			return asString(v)
		}
	}
	return ""
}

// pickInt returns the first present key's value coerced to int.
func pickInt(row map[string]any, keys ...string) int {
	for _, k := range keys {
		if v, ok := row[k]; ok {
			switch t := v.(type) {
			case int:
				return t
			case int32:
				return int(t)
			case int64:
				return int(t)
			case float64:
				return int(t)
			}
		}
	}
	return 0
}

// escapeSQLString escapes single quotes for safe embedding in a SQL string literal.
func escapeSQLString(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}
