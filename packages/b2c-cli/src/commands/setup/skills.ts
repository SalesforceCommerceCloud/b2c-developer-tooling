/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {checkbox, confirm} from '@inquirer/prompts';
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
  getIdeDocsUrl,
  findSkillsByName,
} from '@salesforce/b2c-tooling-sdk/skills';
import {t} from '../../i18n/index.js';

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
      description: 'Skill set to install: b2c or b2c-cli',
      options: ['b2c', 'b2c-cli'],
    }),
  };

  static description = t('commands.setup.skills.description', 'Install agent skills for AI-powered IDEs');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> b2c',
    '<%= config.bin %> <%= command.id %> b2c-cli --ide cursor --global',
    '<%= config.bin %> <%= command.id %> b2c --list',
    '<%= config.bin %> <%= command.id %> b2c-cli --skill b2c-code --skill b2c-webdav --ide cursor',
    '<%= config.bin %> <%= command.id %> b2c --global --update --force',
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
      description: 'Target IDE(s): claude-code, cursor, windsurf, vscode, codex, opencode, manual',
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
    // Determine skillsets - prompt if not provided
    let skillsets: SkillSet[];
    if (this.args.skillset) {
      skillsets = [this.args.skillset as SkillSet];
    } else if (this.flags.force) {
      this.error(
        t(
          'commands.setup.skills.skillsetRequired',
          'Skillset argument required in non-interactive mode. Specify b2c or b2c-cli.',
        ),
      );
    } else {
      skillsets = await checkbox({
        message: t('commands.setup.skills.selectSkillset', 'Select skill set(s) to install:'),
        choices: [
          {name: 'b2c - B2C Commerce development patterns', value: 'b2c' as SkillSet},
          {name: 'b2c-cli - B2C CLI commands and operations', value: 'b2c-cli' as SkillSet},
        ],
      });
      if (skillsets.length === 0) {
        ux.stdout(t('commands.setup.skills.noSkillsetsSelected', 'No skill sets selected.'));
        return {};
      }
    }

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
      ux.stdout(t('commands.setup.skills.noSkillsToInstall', 'No skills to install.'));
      return {};
    }

    // Determine target IDEs
    let targetIdes: IdeType[] = (this.flags.ide as IdeType[]) || [];

    if (targetIdes.length === 0) {
      // Auto-detect installed IDEs
      this.log(t('commands.setup.skills.detecting', 'Detecting installed IDEs...'));
      const detectedIdes = await detectInstalledIdes();

      if (detectedIdes.length === 0) {
        ux.stdout(
          t(
            'commands.setup.skills.noIdesDetected',
            'No IDEs detected. Use --ide to specify target (e.g., --ide cursor --ide manual).',
          ),
        );
        return {};
      }

      // Non-interactive: use all detected IDEs; Interactive: let user select
      targetIdes = this.flags.force
        ? detectedIdes
        : await checkbox({
            message: t('commands.setup.skills.selectIdes', 'Select target IDEs:'),
            choices: detectedIdes.map((ide) => ({
              name: getIdeDisplayName(ide),
              value: ide,
            })),
          });
    }

    if (targetIdes.length === 0) {
      ux.stdout(t('commands.setup.skills.noIdesSelected', 'No IDEs selected.'));
      return {};
    }

    // Claude Code marketplace recommendation
    if (targetIdes.includes('claude-code')) {
      ux.stdout('');
      ux.stdout(
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
        const proceed = await confirm({
          message: t('commands.setup.skills.confirmClaudeCode', 'Continue with Claude Code installation?'),
          default: true,
        });
        if (!proceed) {
          targetIdes = targetIdes.filter((ide) => ide !== 'claude-code');
          if (targetIdes.length === 0) {
            ux.stdout(t('commands.setup.skills.cancelled', 'Installation cancelled.'));
            return {};
          }
        }
      }
    }

    // Show installation preview
    const scope = this.flags.global ? 'global (user home)' : 'project';
    ux.stdout('');
    ux.stdout(
      t('commands.setup.skills.preview', 'Installing {{count}} skills to {{ides}} ({{scope}})', {
        count: skillsToInstall.length,
        ides: targetIdes.map((ide) => getIdeDisplayName(ide)).join(', '),
        scope,
      }),
    );

    // Confirm installation
    if (!this.flags.force) {
      const proceed = await confirm({
        message: t('commands.setup.skills.confirmInstall', 'Proceed with installation?'),
        default: true,
      });
      if (!proceed) {
        ux.stdout(t('commands.setup.skills.cancelled', 'Installation cancelled.'));
        return {};
      }
    }

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

    const result: InstallSkillsResult = {
      installed: [],
      skipped: [],
      errors: [],
    };

    for (const r of installResults) {
      result.installed.push(...r.installed);
      result.skipped.push(...r.skipped);
      result.errors.push(...r.errors);
    }

    // Report results
    if (result.installed.length > 0) {
      ux.stdout('');
      ux.stdout(
        t('commands.setup.skills.installed', 'Successfully installed {{count}} skill(s):', {
          count: result.installed.length,
        }),
      );
      for (const item of result.installed) {
        ux.stdout(`  - ${item.skill} → ${item.path}`);
      }
    }

    if (result.skipped.length > 0) {
      ux.stdout('');
      ux.stdout(
        t('commands.setup.skills.skippedCount', 'Skipped {{count}} skill(s):', {
          count: result.skipped.length,
        }),
      );
      for (const item of result.skipped) {
        ux.stdout(`  - ${item.skill} (${getIdeDisplayName(item.ide)}): ${item.reason}`);
      }
    }

    if (result.errors.length > 0) {
      ux.stdout('');
      this.warn(
        t('commands.setup.skills.errorsCount', 'Failed to install {{count}} skill(s):', {
          count: result.errors.length,
        }),
      );
      for (const item of result.errors) {
        ux.stdout(`  - ${item.skill} (${getIdeDisplayName(item.ide)}): ${item.error}`);
      }
    }

    // Show IDE-specific documentation notes
    if (result.installed.length > 0) {
      const installedIdes = [...new Set(result.installed.map((item) => item.ide))];
      const ideNotes: Array<{displayName: string; docsUrl: string}> = [];

      for (const ide of installedIdes) {
        if (ide === 'manual') continue;
        const docsUrl = getIdeDocsUrl(ide);
        if (docsUrl) {
          ideNotes.push({displayName: getIdeDisplayName(ide), docsUrl});
        }
      }

      if (ideNotes.length > 0) {
        ux.stdout('');
        ux.stdout(t('commands.setup.skills.ideNotes', 'See IDE documentation for skill configuration:'));
        for (const note of ideNotes) {
          ux.stdout(`  - ${note.displayName}: ${note.docsUrl}`);
        }
      }
    }

    return {
      installed: result.installed,
      skipped: result.skipped,
      errors: result.errors,
    };
  }
}
