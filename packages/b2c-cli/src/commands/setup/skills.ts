/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags, ux} from '@oclif/core';
import {BaseCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  type IdeType,
  type SkillSet,
  type SkillMetadata,
  type InstallSkillsResult,
  ALL_IDE_TYPES,
  detectInstalledIdes,
  downloadSkillsArtifact,
  scanSkills,
  installSkills,
  getIdeDisplayName,
  findSkillsByName,
} from '@salesforce/b2c-tooling-sdk/skills';
import {t} from '../../i18n/index.js';

/**
 * Simple confirmation prompt.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Simple selection prompt (returns selected indices).
 */
async function selectMultiple(message: string, options: string[]): Promise<number[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  // Display options
  process.stderr.write(`${message}\n`);
  for (const [i, opt] of options.entries()) {
    process.stderr.write(`  ${i + 1}. ${opt}\n`);
  }

  return new Promise((resolve) => {
    rl.question('Enter numbers separated by commas (or "all" for all): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'all') {
        resolve(options.map((_, i) => i));
        return;
      }
      const indices = answer
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10) - 1)
        .filter((n) => !Number.isNaN(n) && n >= 0 && n < options.length);
      resolve(indices);
    });
  });
}

/**
 * Table columns for skill listing.
 */
const SKILL_COLUMNS: Record<string, ColumnDef<SkillMetadata>> = {
  name: {
    header: 'Name',
    get: (s) => s.name,
  },
  description: {
    header: 'Description',
    get: (s) => s.description,
  },
  skillSet: {
    header: 'Set',
    get: (s) => s.skillSet,
  },
  hasReferences: {
    header: 'Refs',
    get: (s) => (s.hasReferences ? 'Yes' : '-'),
  },
};

const DEFAULT_SKILL_COLUMNS = ['name', 'description', 'skillSet'];

/**
 * Response type for JSON output.
 */
interface SetupSkillsResponse {
  skills?: SkillMetadata[];
  installed?: InstallSkillsResult['installed'];
  skipped?: InstallSkillsResult['skipped'];
  errors?: InstallSkillsResult['errors'];
}

export default class SetupSkills extends BaseCommand<typeof SetupSkills> {
  static args = {
    skillset: Args.string({
      description: 'Skill set to install: b2c, b2c-cli, or all',
      options: ['b2c', 'b2c-cli', 'all'],
      default: 'all',
    }),
  };

  static description = t('commands.setup.skills.description', 'Install agent skills for AI-powered IDEs');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> b2c-cli --ide cursor --global',
    '<%= config.bin %> <%= command.id %> --list',
    '<%= config.bin %> <%= command.id %> --skill b2c-code --skill b2c-webdav --ide cursor',
    '<%= config.bin %> <%= command.id %> --global --update --force',
    '<%= config.bin %> <%= command.id %> --version v0.1.0',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    list: Flags.boolean({
      char: 'l',
      description: 'List available skills without installing',
      default: false,
    }),
    skill: Flags.string({
      description: 'Install specific skill(s) (can be specified multiple times)',
      multiple: true,
    }),
    ide: Flags.string({
      description: 'Target IDE(s): claude-code, cursor, windsurf, github-copilot, codex, opencode, manual',
      options: ALL_IDE_TYPES,
      multiple: true,
    }),
    global: Flags.boolean({
      char: 'g',
      description: 'Install to user home directory (global)',
      default: false,
    }),
    update: Flags.boolean({
      char: 'u',
      description: 'Update existing skills (overwrite)',
      default: false,
    }),
    version: Flags.string({
      description: 'Specific release version (default: latest)',
    }),
    force: Flags.boolean({
      description: 'Skip confirmation prompts (non-interactive)',
      default: false,
    }),
  };

  async run(): Promise<SetupSkillsResponse> {
    const skillsets: SkillSet[] = this.args.skillset === 'all' ? ['b2c', 'b2c-cli'] : [this.args.skillset as SkillSet];

    // Download and scan skills
    this.log(
      t('commands.setup.skills.downloading', 'Downloading skills from release {{version}}...', {
        version: this.flags.version || 'latest',
      }),
    );

    // Download skills for all skillsets in parallel
    const downloadResults = await Promise.all(
      skillsets.map(async (skillset) => {
        const skillsDir = await downloadSkillsArtifact(skillset, {
          version: this.flags.version,
        });
        const skills = await scanSkills(skillsDir, skillset);
        return {skillset, skillsDir, skills};
      }),
    );

    const allSkills: SkillMetadata[] = [];
    const skillsDirs: Record<SkillSet, string> = {} as Record<SkillSet, string>;

    for (const {skillset, skillsDir, skills} of downloadResults) {
      skillsDirs[skillset] = skillsDir;
      allSkills.push(...skills);
    }

    // List mode
    if (this.flags.list) {
      if (this.jsonEnabled()) {
        return {skills: allSkills};
      }

      if (allSkills.length === 0) {
        ux.stdout(t('commands.setup.skills.noSkills', 'No skills found.'));
        return {skills: []};
      }

      createTable(SKILL_COLUMNS).render(allSkills, DEFAULT_SKILL_COLUMNS);
      return {skills: allSkills};
    }

    // Filter skills if --skill specified
    let skillsToInstall = allSkills;
    if (this.flags.skill && this.flags.skill.length > 0) {
      const {found, notFound} = findSkillsByName(allSkills, this.flags.skill);
      if (notFound.length > 0) {
        this.warn(
          t('commands.setup.skills.notFound', 'Skills not found: {{skills}}', {
            skills: notFound.join(', '),
          }),
        );
      }
      skillsToInstall = found;
    }

    if (skillsToInstall.length === 0) {
      this.log(t('commands.setup.skills.noSkillsToInstall', 'No skills to install.'));
      return {};
    }

    // Determine target IDEs
    let targetIdes: IdeType[] = (this.flags.ide as IdeType[]) || [];

    if (targetIdes.length === 0) {
      // Auto-detect installed IDEs
      this.log(t('commands.setup.skills.detecting', 'Detecting installed IDEs...'));
      const detectedIdes = await detectInstalledIdes();

      if (detectedIdes.length === 0) {
        this.log(
          t(
            'commands.setup.skills.noIdesDetected',
            'No IDEs detected. Use --ide to specify target (e.g., --ide cursor --ide manual).',
          ),
        );
        return {};
      }

      if (this.flags.force) {
        // Non-interactive: use all detected IDEs
        targetIdes = detectedIdes;
      } else {
        // Interactive: let user select
        const ideNames = detectedIdes.map((ide) => getIdeDisplayName(ide));
        const selected = await selectMultiple('Select target IDEs:', ideNames);
        targetIdes = selected.map((i) => detectedIdes[i]);
      }
    }

    if (targetIdes.length === 0) {
      this.log(t('commands.setup.skills.noIdesSelected', 'No IDEs selected.'));
      return {};
    }

    // Claude Code marketplace recommendation
    if (targetIdes.includes('claude-code')) {
      this.log('');
      this.log(
        t(
          'commands.setup.skills.claudeCodeRecommendation',
          'Note: For Claude Code, we recommend using the plugin marketplace for automatic updates:\n' +
            '  claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling\n' +
            '  claude plugin install b2c-cli\n' +
            '  claude plugin install b2c\n\n' +
            'Use --ide manual for manual installation to the same paths.',
        ),
      );

      if (!this.flags.force) {
        const proceed = await confirm('Continue with Claude Code installation? (y/n)');
        if (!proceed) {
          targetIdes = targetIdes.filter((ide) => ide !== 'claude-code');
          if (targetIdes.length === 0) {
            this.log(t('commands.setup.skills.cancelled', 'Installation cancelled.'));
            return {};
          }
        }
      }
    }

    // Show installation preview
    const scope = this.flags.global ? 'global (user home)' : 'project';
    this.log('');
    this.log(
      t('commands.setup.skills.preview', 'Installing {{count}} skills to {{ides}} ({{scope}})', {
        count: skillsToInstall.length,
        ides: targetIdes.map((ide) => getIdeDisplayName(ide)).join(', '),
        scope,
      }),
    );

    // Confirm installation
    if (!this.flags.force) {
      const proceed = await confirm('Proceed with installation? (y/n)');
      if (!proceed) {
        this.log(t('commands.setup.skills.cancelled', 'Installation cancelled.'));
        return {};
      }
    }

    // Install skills for each skillset
    // Install skills for all skillsets in parallel
    const installPromises = skillsets
      .map((skillset) => {
        const skillsForSet = skillsToInstall.filter((s) => s.skillSet === skillset);
        if (skillsForSet.length === 0) return null;
        return installSkills(skillsForSet, skillsDirs[skillset], {
          ides: targetIdes,
          global: this.flags.global,
          update: this.flags.update,
          projectRoot: process.cwd(),
        });
      })
      .filter((p): p is Promise<InstallSkillsResult> => p !== null);

    const installResults = await Promise.all(installPromises);

    const combinedResult: InstallSkillsResult = {
      installed: [],
      skipped: [],
      errors: [],
    };

    for (const result of installResults) {
      combinedResult.installed.push(...result.installed);
      combinedResult.skipped.push(...result.skipped);
      combinedResult.errors.push(...result.errors);
    }

    // Report results
    if (combinedResult.installed.length > 0) {
      this.log('');
      this.log(
        t('commands.setup.skills.installed', 'Successfully installed {{count}} skill(s):', {
          count: combinedResult.installed.length,
        }),
      );
      for (const item of combinedResult.installed) {
        this.log(`  - ${item.skill} → ${item.path}`);
      }
    }

    if (combinedResult.skipped.length > 0) {
      this.log('');
      this.log(
        t('commands.setup.skills.skippedCount', 'Skipped {{count}} skill(s):', {
          count: combinedResult.skipped.length,
        }),
      );
      for (const item of combinedResult.skipped) {
        this.log(`  - ${item.skill} (${getIdeDisplayName(item.ide)}): ${item.reason}`);
      }
    }

    if (combinedResult.errors.length > 0) {
      this.log('');
      this.warn(
        t('commands.setup.skills.errorsCount', 'Failed to install {{count}} skill(s):', {
          count: combinedResult.errors.length,
        }),
      );
      for (const item of combinedResult.errors) {
        this.log(`  - ${item.skill} (${getIdeDisplayName(item.ide)}): ${item.error}`);
      }
    }

    return {
      installed: combinedResult.installed,
      skipped: combinedResult.skipped,
      errors: combinedResult.errors,
    };
  }
}
