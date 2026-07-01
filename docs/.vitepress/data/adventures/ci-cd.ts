// Adventure: Set up CI/CD pipeline.

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, link, ocapiConfig, scopes} from './_helpers.js';

export const ciCdAdventure = defineAdventure({
  id: 'ci-cd',
  title: 'Set up CI/CD pipeline',
  tagline: 'Automate cartridge deployment from GitHub Actions or another CI runner.',
  icon: 'mdi:source-branch',
  tags: ['ci-cd', 'automation', 'client-credentials', 'safety-mode', 'deploy', 'github'],
  priority: 'common',
  intro:
    "CI/CD runs the CLI non-interactively. You'll wire credentials through your runner's secret store, pick an authentication method that works without a human at the keyboard, and choose a safety level so production deploys can't accidentally delete or overwrite data.",

  steps: [
    step('runner', {
      title: 'Which CI runner are you using?',
      doc: doc('/guide/ci-cd', 'overview', 'CI/CD overview'),
      choices: [
        choice('github', {
          title: 'GitHub Actions',
          subtitle: 'Most common runner',
          icon: 'mdi:github',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`Run the B2C CLI in a GitHub Actions workflow with secrets from the repository's secret store. See the [CI/CD quick start](/guide/ci-cd#quick-start-deploy-cartridges).`,
          contributes: {runner: 'github'},
        }),
        choice('generic', {
          title: 'GitLab / Jenkins / Other',
          subtitle: 'Generic runner',
          icon: 'mdi:server-outline',
          body: md`Install the CLI in your job and load \`SFCC_*\` env vars from the runner's secret store.`,
          contributes: {runner: 'generic'},
        }),
      ],
    }),

    step('auth', {
      title: 'How will the runner authenticate?',
      subtitle: 'Both options are non-interactive — pick what your security policy allows.',
      doc: doc('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
      choices: [
        choice('client-credentials', {
          title: 'Client Credentials',
          subtitle: 'Client ID + secret',
          icon: 'mdi:key-variant',
          badges: [{text: 'Common', tone: 'quick'}],
          body: md`Account Manager API client with a client secret stored in your runner's secret store.`,
          contributes: {authMethod: 'client-credentials'},
        }),
        choice('jwt', {
          title: 'JWT Bearer',
          subtitle: 'Certificate-based',
          icon: 'mdi:certificate-outline',
          badges: [{text: 'Preferred where allowed', tone: 'info'}],
          body: md`Use a public/private cert pair instead of a long-lived secret. See [JWT setup](/guide/authentication#jwt-authentication-certificate-based).`,
          contributes: {authMethod: 'jwt'},
        }),
      ],
    }),

    step('scope', {
      title: 'What will the pipeline deploy?',
      doc: doc('/guide/ci-cd', 'quick-start-deploy-cartridges', 'Quick Start: Deploy Cartridges'),
      choices: [
        choice('cartridges', {
          title: 'Cartridges only',
          subtitle: 'Deploy + activate',
          icon: 'mdi:cloud-upload-outline',
          body: md`Build, upload, and activate a code version with \`b2c code deploy\`.`,
          contributes: {deployScope: 'cartridges'},
        }),
        choice('cartridges-jobs', {
          title: 'Cartridges + job-driven imports',
          subtitle: 'Adds Jobs OCAPI scope',
          icon: 'mdi:cog-play-outline',
          body: md`Also runs site / catalog imports via \`b2c webdav put\` + \`b2c job run sfcc-site-archive-import\` (followed by \`b2c job wait\`).`,
          contributes: {deployScope: 'cartridges-jobs'},
        }),
      ],
    }),

    step('safety', {
      title: 'What safety level should the pipeline enforce?',
      subtitle: 'Set SFCC_SAFETY_LEVEL so destructive operations are blocked at the SDK middleware layer.',
      doc: doc('/guide/safety', 'safety-levels', 'Safety Levels'),
      choices: [
        choice('none', {
          title: 'NONE',
          subtitle: 'No restrictions',
          icon: 'mdi:lock-open-variant-outline',
          body: md`Default. Acceptable for ephemeral sandbox pipelines only.`,
          contributes: {safetyLevel: 'NONE'},
        }),
        choice('no-delete', {
          title: 'NO_DELETE',
          subtitle: 'Block DELETE operations',
          icon: 'mdi:lock-outline',
          badges: [{text: 'Common', tone: 'quick'}],
          body: md`A reasonable default for shared sandboxes — uploads and activations still work.`,
          contributes: {safetyLevel: 'NO_DELETE'},
        }),
        choice('no-update', {
          title: 'NO_UPDATE',
          subtitle: 'Block deletes + reset/stop/restart',
          icon: 'mdi:shield-lock-outline',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`Recommended for production pipelines — preserves the ability to deploy code while blocking destructive admin ops.`,
          contributes: {safetyLevel: 'NO_UPDATE'},
        }),
        choice('read-only', {
          title: 'READ_ONLY',
          subtitle: 'Block all writes',
          icon: 'mdi:eye-lock-outline',
          body: md`Audit / verification jobs that should never modify the instance.`,
          contributes: {safetyLevel: 'READ_ONLY'},
        }),
      ],
    }),
  ],

  synthesize(state) {
    const runner = (state.runner as string) ?? 'github';
    const authMethod = (state.authMethod as string) ?? 'client-credentials';
    const deployScope = (state.deployScope as string) ?? 'cartridges';
    const safetyLevel = (state.safetyLevel as string) ?? 'NO_DELETE';

    const isJwt = authMethod === 'jwt';
    const includeJobs = deployScope === 'cartridges-jobs';
    const isGithub = runner === 'github';

    const dw = "# CI/CD prefers environment variables from your runner's secret store — see the .env tab.";

    const envLines = [
      'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
      'SFCC_CODE_VERSION=version1',
      'SFCC_CLIENT_ID=<CLIENT_ID>',
      isJwt ? 'SFCC_JWT_CERT=./cert.pem' : 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>',
      isJwt ? 'SFCC_JWT_KEY=./key.pem' : '',
      'SFCC_USERNAME=<BM_USERNAME>',
      'SFCC_PASSWORD=<WEBDAV_ACCESS_KEY>',
      `SFCC_SAFETY_LEVEL=${safetyLevel}`,
    ]
      .filter(Boolean)
      .join('\n');

    const checklist = [
      check(
        isJwt
          ? 'Create an Account Manager API client with JWT (certificate) auth'
          : 'Create an Account Manager API client with a client secret',
        link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
      ),
      check(
        `Add Default Scopes: ${scopes('baseline')}`,
        link('/guide/authentication', 'configuring-scopes', 'Configuring Scopes'),
      ),
      ...(isJwt
        ? [
            check(
              'Generate a certificate pair and register the public cert in Account Manager',
              link(
                '/guide/authentication',
                'jwt-authentication-certificate-based',
                'JWT Authentication (Certificate-Based)',
              ),
            ),
          ]
        : []),
      check(
        'Generate a WebDAV access key for cartridge uploads',
        link('/guide/authentication', 'option-a-basic-authentication-recommended', 'Basic Authentication'),
      ),
      check(
        'Enable code_versions in OCAPI Data API (Business Manager)',
        link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
      ),
      ...(includeJobs
        ? [
            check(
              'Enable Jobs in OCAPI Data API (Business Manager)',
              link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
            ),
          ]
        : []),
      check(
        isGithub
          ? 'Add SFCC_* values as GitHub repository secrets / variables'
          : "Store SFCC_* values in your CI runner's secret store",
        link('/guide/ci-cd', 'authentication', isGithub ? 'GitHub Actions: Authentication' : 'CI/CD Authentication'),
      ),
      check(
        `Set SFCC_SAFETY_LEVEL=${safetyLevel} for production deployments`,
        link('/guide/safety', 'safety-levels', 'Safety Levels'),
      ),
    ];

    const ocapi = ocapiConfig('<CLIENT_ID>', includeJobs ? ['codeVersions', 'jobs'] : ['codeVersions']);

    const warnings: string[] = [
      "Never commit `dw.json` or `.env` files containing real secrets — always load them from your runner's secret store.",
      `Paste the following block into Business Manager → Administration → Site Development → Open Commerce API Settings → Data API:\n\n\`\`\`json\n${ocapi}\n\`\`\``,
    ];

    if (isGithub) {
      const ghLines: string[] = [
        'name: Deploy',
        '',
        'on:',
        '  push:',
        '    branches: [main]',
        '',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    env:',
        '      SFCC_SERVER: ${{ vars.SFCC_SERVER }}',
        '      SFCC_CODE_VERSION: ${{ vars.SFCC_CODE_VERSION }}',
        '      SFCC_CLIENT_ID: ${{ secrets.SFCC_CLIENT_ID }}',
      ];
      if (isJwt) {
        ghLines.push('      SFCC_JWT_CERT: ./cert.pem');
        ghLines.push('      SFCC_JWT_KEY: ./key.pem');
      } else {
        ghLines.push('      SFCC_CLIENT_SECRET: ${{ secrets.SFCC_CLIENT_SECRET }}');
      }
      ghLines.push(
        '      SFCC_USERNAME: ${{ secrets.SFCC_USERNAME }}',
        '      SFCC_PASSWORD: ${{ secrets.SFCC_PASSWORD }}',
        `      SFCC_SAFETY_LEVEL: ${safetyLevel}`,
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: actions/setup-node@v4',
        '        with:',
        '          node-version: 22',
        '      - run: npm install -g @salesforce/b2c-cli',
      );
      if (isJwt) {
        ghLines.push(
          '      - name: Write JWT credentials',
          '        run: |',
          '          printf "%s" "${{ secrets.SFCC_JWT_CERT_PEM }}" > cert.pem',
          '          printf "%s" "${{ secrets.SFCC_JWT_KEY_PEM }}" > key.pem',
        );
      }
      ghLines.push('      - run: b2c code deploy --activate');
      if (includeJobs) {
        ghLines.push(
          '      - name: Upload site archive',
          '        run: b2c webdav put ./site-archive.zip Impex/src/instance/',
          '      - name: Run site archive import',
          '        id: import',
          '        run: b2c job run sfcc-site-archive-import --json | tee job.json',
          '      - name: Wait for import',
          '        run: |',
          '          JOB_ID=$(jq -r .id job.json)',
          '          EXEC_ID=$(jq -r .executionId job.json)',
          '          b2c job wait "$JOB_ID" "$EXEC_ID"',
        );
      }
      warnings.push(`Example GitHub Actions workflow:\n\n\`\`\`yaml\n${ghLines.join('\n')}\n\`\`\``);
    } else {
      warnings.push(
        'Generic runners: install the CLI with `npm i -g @salesforce/b2c-cli`, then run `b2c code deploy --code-version=$SFCC_CODE_VERSION --activate` after exporting the SFCC_* env vars from your secret store.',
      );
    }

    if (isJwt) {
      warnings.push(
        'For JWT auth, write the cert/key files to disk in a single setup step (e.g., `echo "$SFCC_JWT_CERT_PEM" > cert.pem`) and point `SFCC_JWT_CERT` / `SFCC_JWT_KEY` at them. Avoid committing certs.',
      );
    }

    if (safetyLevel === 'NONE') {
      warnings.push(
        'You picked SFCC_SAFETY_LEVEL=NONE — destructive operations are not blocked. Reserve this for sandbox-only workflows.',
      );
    }

    return {
      dwJson: dw,
      env: envLines,
      checklist,
      warnings,
      verifyCommand: 'b2c code list',
    };
  },
});
