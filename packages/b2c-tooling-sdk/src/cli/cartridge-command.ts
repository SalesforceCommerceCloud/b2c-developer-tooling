import {Args, Command, Flags} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import type {FindCartridgesOptions} from '../operations/code/cartridges.js';

/**
 * Base command for cartridge operations (deploy, watch, etc.).
 *
 * Extends InstanceCommand with:
 * - cartridgePath argument for specifying cartridge directory
 * - cartridge include/exclude flags for filtering
 *
 * @example
 * export default class MyCartridgeCommand extends CartridgeCommand<typeof MyCartridgeCommand> {
 *   async run(): Promise<void> {
 *     const cartridges = findCartridges(this.cartridgePath, this.cartridgeOptions);
 *     // ...
 *   }
 * }
 */
export abstract class CartridgeCommand<T extends typeof Command> extends InstanceCommand<T> {
  static baseArgs = {
    cartridgePath: Args.string({
      description: 'Path to cartridges directory',
      default: '.',
    }),
  };

  static cartridgeFlags = {
    cartridge: Flags.string({
      char: 'c',
      description: 'Include specific cartridge(s) (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'exclude-cartridge': Flags.string({
      char: 'x',
      description: 'Exclude specific cartridge(s) (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
  };

  /**
   * Gets the cartridge path from args.
   */
  protected get cartridgePath(): string {
    return this.args.cartridgePath as string;
  }

  /**
   * Gets the cartridge filter options from flags.
   */
  protected get cartridgeOptions(): FindCartridgesOptions {
    return {
      include: this.flags.cartridge as string[] | undefined,
      exclude: this.flags['exclude-cartridge'] as string[] | undefined,
    };
  }
}
