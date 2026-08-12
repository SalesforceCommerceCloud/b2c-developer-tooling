/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import { Configuration } from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = (env: any): Configuration => {
  const isProduction = env.production === true;

  return {
    mode: isProduction ? 'production' : 'development',
    target: 'web',

    entry: {
      // Metrics datasource → dist/module.js
      module: './src/module.ts',
      // CIP datasource → dist/cip/module.js (separate plugin dir)
      'cip/module': './src/cip/module.ts',
    },

    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: '[name].js',
      libraryTarget: 'amd', // Grafana uses AMD/SystemJS module format
      clean: true, // Clean dist folder before build
    },

    // Externals - Grafana provides these at runtime
    externals: [
      'lodash',
      'react',
      'react-dom',
      '@grafana/data',
      '@grafana/ui',
      '@grafana/runtime',
      ({ request }, callback) => {
        // Externalize all @grafana/* packages
        if (request && request.startsWith('@grafana/')) {
          return callback(null, request);
        }
        // Externalize all @emotion/* packages (used by @grafana/ui)
        if (request && request.startsWith('@emotion/')) {
          return callback(null, request);
        }
        callback();
      },
    ],

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      // Grafana 10+ uses ESM, but we still need to resolve node modules
      alias: {
        // Ensure we're using the same React instance as Grafana
        react: path.resolve(__dirname, '../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      },
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                target: 'es2020',
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: !isProduction,
                  },
                },
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/plugin.json', to: '.' },
          { from: 'src/img', to: 'img', noErrorOnMissing: true },
          // CIP datasource assets → dist/cip/
          { from: 'src/cip/plugin.json', to: 'cip' },
          { from: 'src/cip/img', to: 'cip/img', noErrorOnMissing: true },
        ],
      }),
    ],

    devtool: isProduction ? 'source-map' : 'eval-source-map',

    performance: {
      hints: false,
    },
  };
};

export default config;
