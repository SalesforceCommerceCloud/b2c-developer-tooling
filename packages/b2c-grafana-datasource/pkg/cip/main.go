/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	cipds "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-grafana-datasource/pkg/cip/plugin"
)

func main() {
	if err := datasource.Manage(
		"salesforce-b2c-cip-datasource",
		cipds.NewDatasource,
		datasource.ManageOpts{},
	); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
