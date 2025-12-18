/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * DE - German translations for b2c-cli commands.
 */
export const de = {
  commands: {
    sites: {
      list: {
        description: 'Sites auf einer B2C Commerce-Instanz auflisten',
        fetching: 'Rufe Sites von {{hostname}} ab...',
        fetchFailed: 'Sites konnten nicht abgerufen werden: {{status}} {{statusText}}\n{{error}}',
        noSites: 'Keine Sites gefunden.',
        foundSites: '{{count}} Site(s) gefunden:',
        displayName: 'Anzeigename: {{name}}',
        status: 'Status: {{status}}',
        error: 'Sites konnten nicht abgerufen werden: {{message}}',
      },
    },
    code: {
      deploy: {
        description: 'Cartridges auf eine B2C Commerce-Instanz deployen',
        deploying: 'Deploye Cartridges von {{path}}...',
        target: 'Ziel: {{hostname}}',
        codeVersion: 'Code-Version: {{version}}',
        complete: 'Deployment abgeschlossen',
        failed: 'Deployment fehlgeschlagen: {{message}}',
      },
    },
    sandbox: {
      create: {
        description: 'Eine neue On-Demand-Sandbox erstellen',
        creating: 'Erstelle Sandbox in Realm {{realm}}...',
        profile: 'Profil: {{profile}}',
        ttl: 'TTL: {{ttl}} Stunden',
        stub: '(stub) Sandbox-Erstellung noch nicht implementiert',
        wouldCreate: 'Würde Sandbox mit OAuth-Client erstellen: {{clientId}}',
      },
    },
    mrt: {
      envVar: {
        set: {
          description: 'Eine Umgebungsvariable für ein Managed Runtime-Projekt setzen',
          setting: 'Setze {{key}} auf {{project}}/{{environment}}...',
          stub: '(stub) Umgebungsvariablen-Einstellung noch nicht implementiert',
          wouldSet: 'Würde {{key}}={{value}} setzen',
          project: 'Projekt: {{project}}',
          environment: 'Umgebung: {{environment}}',
        },
      },
    },
  },
};
