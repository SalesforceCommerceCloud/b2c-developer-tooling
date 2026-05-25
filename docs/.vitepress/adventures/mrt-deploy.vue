<!--
  Managed Runtime deployments · Quickstart adventure.

  Page shim: docs/quickstart/mrt-deploy.md
-->
<script setup lang="ts">
import {check, link} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const projectType = (state.projectType as string) ?? 'pwa-kit';
  const credSource = (state.credSource as string) ?? 'mobify';
  const trigger = (state.trigger as string) ?? 'manual';

  const isPwa = projectType === 'pwa-kit';
  const isNext = projectType === 'storefront-next';
  const isBoth = projectType === 'both';
  const useMobify = credSource === 'mobify';
  const useEnv = credSource === 'env';
  const useFlags = credSource === 'flags';
  const isCi = trigger === 'ci';

  // MRT credentials live in ~/.mobify or as MRT_API_KEY env var — no dw.json
  // fields are required. The .env tab below shows the canonical env-var setup;
  // dwJson is a comment that points the reader at the right tab.
  const dw = useMobify
    ? '# MRT credentials live in ~/.mobify (written by `b2c mrt save-credentials`).\n# No dw.json fields are required for MRT commands.\n#\n# Optional: set `mrtProject` / `mrtEnvironment` in dw.json to default the\n# `--project` / `--environment` flags for a given checkout.'
    : useFlags
      ? '# Credentials passed per-command via `--api-key`, `--project`, `--environment` flags.\n# Nothing to put in dw.json — see the verify command at the bottom.'
      : '# Using environment variables — see .env tab below.';

  const envLines = [
    'MRT_API_KEY=<MRT_API_KEY>',
    'MRT_PROJECT=<PROJECT_SLUG>',
    'MRT_ENVIRONMENT=<ENVIRONMENT_SLUG>',
  ].join('\n');

  const buildStep = isPwa
    ? 'Build your PWA Kit storefront (`npm run build`) so the `build/` directory contains the bundle to deploy'
    : isNext
      ? 'Build your Storefront Next app (`npm run build`) so the configured `--build-dir` contains the bundle to deploy'
      : 'Build each storefront (`npm run build`) so its `build/` directory is ready to deploy';

  const checklist = [
    check(
      'Get an MRT API key from the Managed Runtime dashboard',
      link('/guide/authentication', 'getting-an-mrt-api-key', 'Getting an MRT API Key'),
    ),
    check(
      useMobify
        ? 'Save credentials with `b2c mrt save-credentials --user <email> --api-key <KEY>`'
        : useEnv
          ? 'Set `MRT_API_KEY` (and optionally `MRT_PROJECT` / `MRT_ENVIRONMENT`) in your shell or CI secret store'
          : 'Pass `--api-key`, `--project`, and `--environment` on every `b2c mrt` invocation',
      link('/guide/authentication', 'configuring-the-api-key', 'Configuring the API Key'),
    ),
    check(
      'Confirm the project exists with `b2c mrt project list` and pick (or create) an environment with `b2c mrt env list` / `b2c mrt env create`',
      link('/cli/mrt', 'project-commands', 'Project Commands'),
    ),
    check(
      buildStep,
      isNext
        ? link('/guide/storefront-next', 'step-5-deploy', 'Storefront Next: Deploy')
        : link('/cli/mrt', 'b2c-mrt-bundle-deploy', 'b2c mrt bundle deploy'),
    ),
    check(
      'Run `b2c mrt bundle deploy --project <slug> --environment <slug>` (add `--wait` to block until the deployment is live)',
      link('/cli/mrt', 'b2c-mrt-bundle-deploy', 'b2c mrt bundle deploy'),
    ),
    check(
      'Tail real-time application logs with `b2c mrt tail-logs -p <slug> -e <slug>` while validating the deploy',
      link('/cli/mrt', 'b2c-mrt-tail-logs', 'b2c mrt tail-logs'),
    ),
  ];

  const warnings: string[] = [
    'MRT API keys grant access to every project on your Managed Runtime account — treat them like a password and store them in your CI runner\'s secret store, never in `dw.json` or git.',
  ];

  if (useMobify) {
    warnings.push(
      'The `~/.mobify` file is plaintext JSON. On shared workstations consider using `MRT_API_KEY` from a secret manager instead.',
    );
  }

  if (isCi) {
    const ciLines: string[] = [
      'name: Deploy to MRT',
      '',
      'on:',
      '  push:',
      '    branches: [main]',
      '',
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
      '    env:',
      '      MRT_API_KEY: ${{ secrets.MRT_API_KEY }}',
      '      MRT_PROJECT: <PROJECT_SLUG>',
      '      MRT_ENVIRONMENT: <ENVIRONMENT_SLUG>',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with:',
      '          node-version: 22',
      '      - run: npm ci',
      '      - run: npm run build',
      '      - run: npm install -g @salesforce/b2c-cli',
      '      - run: b2c mrt bundle deploy --wait',
    ];
    warnings.push(`Example GitHub Actions workflow:\n\n\`\`\`yaml\n${ciLines.join('\n')}\n\`\`\``);
  }

  if (isNext || isBoth) {
    warnings.push(
      'Storefront Next has its own end-to-end onboarding (SLAS client, environment vars, multi-site config). See [Storefront Next on Managed Runtime](/guide/storefront-next) for the full walkthrough.',
    );
  }

  return {
    dwJson: dw,
    env: useEnv ? envLines : undefined,
    checklist,
    warnings,
    verifyCommand: 'b2c mrt project list',
  };
};
</script>

<template>
  <Wizard
    id="mrt-deploy"
    title="Managed Runtime deployments"
    tagline="Configure projects, environments, and bundle deploys for PWA Kit and Storefront Next on Managed Runtime."
    intro="Managed Runtime commands talk to the MRT control plane with an API key (separate from Account Manager OAuth). You'll pick what you're deploying, where the API key lives, and whether deploys are run by hand or by CI."
    icon="mdi:rocket-launch-outline"
    :synth="synth"
  >
    <QStep
      id="project-type"
      title="What are you deploying?"
      subtitle="Both project types use the same b2c mrt commands — only the build artifacts differ."
      :doc="{path: '/cli/mrt', hash: 'command-overview', label: 'MRT command overview'}"
    >
      <QChoice
        id="pwa-kit"
        title="PWA Kit v3"
        subtitle="React storefront"
        icon="mdi:react"
        :badges="[{text: 'Common', tone: 'quick'}]"
        :contributes="{projectType: 'pwa-kit'}"
      >
        Build with <code>npm run build</code>; deploy the <code>build/</code> directory with
        <code>b2c mrt bundle deploy</code>.
      </QChoice>
      <QChoice
        id="storefront-next"
        title="Storefront Next"
        subtitle="Next.js storefront (closed pilot)"
        icon="simple-icons:nextdotjs"
        :badges="[{text: 'Pilot', tone: 'beta'}]"
        :contributes="{projectType: 'storefront-next'}"
      >
        Build the Storefront Next app, then deploy its build output with <code>b2c mrt bundle deploy</code>. Access
        is currently limited to pilot customers — see
        <a href="/guide/storefront-next">Storefront Next on Managed Runtime</a> for the full setup.
      </QChoice>
      <QChoice
        id="both"
        title="Both"
        subtitle="Multiple frontends"
        icon="mdi:layers-triple-outline"
        :contributes="{projectType: 'both'}"
      >
        Manage PWA Kit and Storefront Next under the same MRT account — one project per app, deployed independently.
      </QChoice>
    </QStep>

    <QStep
      id="credentials"
      title="Where should the CLI find your MRT API key?"
      subtitle="MRT auth is separate from Account Manager OAuth — pick one place to keep the key."
      :doc="{path: '/guide/authentication', hash: 'managed-runtime-api-key', label: 'Managed Runtime API Key'}"
    >
      <QChoice
        id="mobify"
        title="~/.mobify file"
        subtitle="Saved with save-credentials"
        icon="mdi:file-key-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{credSource: 'mobify'}"
      >
        Run <code>b2c mrt save-credentials --user &lt;email&gt; --api-key &lt;KEY&gt;</code> once. The CLI reads
        <code>~/.mobify</code> for every subsequent <code>b2c mrt</code> call.
      </QChoice>
      <QChoice
        id="env"
        title="Environment variables"
        subtitle="MRT_API_KEY / MRT_PROJECT / MRT_ENVIRONMENT"
        icon="mdi:console-line"
        :badges="[{text: 'CI', tone: 'quick'}]"
        :contributes="{credSource: 'env'}"
      >
        Export <code>MRT_API_KEY</code> (and optionally <code>MRT_PROJECT</code> / <code>MRT_ENVIRONMENT</code>) from
        your shell or your runner's secret store. Best for CI/CD.
      </QChoice>
      <QChoice
        id="flags"
        title="Flags on every command"
        subtitle="--api-key / --project / --environment"
        icon="mdi:flag-outline"
        :contributes="{credSource: 'flags'}"
      >
        Pass credentials and the target on every invocation. Useful when juggling multiple MRT accounts in one shell.
      </QChoice>
    </QStep>

    <QStep
      id="trigger"
      title="Who runs `b2c mrt bundle deploy`?"
      :doc="{path: '/cli/mrt', hash: 'b2c-mrt-bundle-deploy', label: 'b2c mrt bundle deploy'}"
    >
      <QChoice
        id="manual"
        title="Manual"
        subtitle="Developer runs it locally"
        icon="mdi:account-hard-hat-outline"
        :contributes="{trigger: 'manual'}"
      >
        You build the bundle and run <code>b2c mrt bundle deploy</code> from your laptop. Add <code>--wait</code> to
        block until the deployment finishes.
      </QChoice>
      <QChoice
        id="ci"
        title="CI / CD"
        subtitle="GitHub Actions or other runner"
        icon="mdi:source-branch"
        :contributes="{trigger: 'ci'}"
      >
        A pipeline builds the storefront and runs <code>b2c mrt bundle deploy</code> with credentials from the runner's
        secret store. See the example workflow in the warnings panel.
      </QChoice>
    </QStep>
  </Wizard>
</template>
