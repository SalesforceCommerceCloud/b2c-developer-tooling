/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const ts = require('typescript');

const init = require('../../src/index');
const {createFixtureHost, sharedDocumentRegistry} = require('./fixture-language-service');

/**
 * Installs the plugin on a language service the way tsserver does, passing
 * only the part of PluginCreateInfo the plugin touches (logger, current
 * directory, project version, config, host, language service).
 *
 * @param {object} options
 * @param {object} options.config - the plugin configuration
 * @param {Record<string, string>} [options.files] - in-memory fixture files (when no `host` is given)
 * @param {object} [options.compilerOptions] - compiler options for the fixture host
 * @param {object} [options.host] - a prepared LanguageServiceHost to use instead of a fixture host
 * @param {object} [options.languageService] - the language service to decorate (default: one over `host`)
 * @param {() => string} [options.projectVersion] - the project version tsserver reports
 * @param {string} [options.currentDirectory] - the project root auto-discovery starts from
 * @param {(message: string) => void} [options.log] - receives the plugin's log lines
 * @returns {{proxy: object, plugin: {create: Function, onConfigurationChanged: Function}, host: object, languageService: object}}
 */
function createPluginProxy({
  config,
  files,
  compilerOptions,
  host = createFixtureHost(files, compilerOptions),
  languageService = ts.createLanguageService(host, sharedDocumentRegistry),
  projectVersion = () => '1',
  currentDirectory = '/',
  log = () => {},
}) {
  const plugin = init({typescript: ts});
  const proxy = plugin.create({
    languageService,
    languageServiceHost: host,
    project: {
      projectService: {logger: {info: log}},
      getCurrentDirectory: () => currentDirectory,
      getProjectVersion: projectVersion,
    },
    config,
  });
  return {proxy, plugin, host, languageService};
}

module.exports = {createPluginProxy};
