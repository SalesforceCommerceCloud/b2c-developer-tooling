export {run} from '@oclif/core';

// Re-export CLI utilities from b2c-tooling for convenience
export {
  // Command base classes
  BaseCommand,
  OAuthCommand,
  InstanceCommand,
  MrtCommand,
  // Config utilities
  loadConfig,
  findDwJson,
  ResolvedConfig,
  LoadConfigOptions,
} from '@salesforce/b2c-tooling/cli';
