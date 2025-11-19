import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ResolvedConfig {
  hostname?: string;
  codeVersion?: string;
  username?: string; // For Basic Auth
  password?: string; // For Basic Auth
  clientId?: string; // For OAuth
  clientSecret?: string; // For OAuth
  mrtApiKey?: string; // For MRT
}

interface DwJson {
  hostname?: string;
  'code-version'?: string;
  username?: string;
  password?: string;
  'client-id'?: string;
  'client-secret'?: string;
}

/**
 * Loads configuration with precedence: CLI flags > Environment variables > dw.json
 */
export async function loadConfig(flags: Partial<ResolvedConfig> = {}): Promise<ResolvedConfig> {
  // Load dw.json if it exists
  const dwJsonConfig = loadDwJson();

  // Load from environment variables
  const envConfig: ResolvedConfig = {
    hostname: process.env.DW_HOSTNAME || process.env.SFCC_HOSTNAME,
    codeVersion: process.env.DW_CODE_VERSION || process.env.SFCC_CODE_VERSION,
    username: process.env.DW_USERNAME || process.env.SFCC_USERNAME,
    password: process.env.DW_PASSWORD || process.env.SFCC_PASSWORD,
    clientId: process.env.DW_CLIENT_ID || process.env.SFCC_CLIENT_ID,
    clientSecret: process.env.DW_CLIENT_SECRET || process.env.SFCC_CLIENT_SECRET,
    mrtApiKey: process.env.DW_MRT_API_KEY || process.env.SFCC_MRT_API_KEY,
  };

  // Merge with precedence: flags > env > dw.json
  return {
    hostname: flags.hostname || envConfig.hostname || dwJsonConfig.hostname,
    codeVersion: flags.codeVersion || envConfig.codeVersion || dwJsonConfig.codeVersion,
    username: flags.username || envConfig.username || dwJsonConfig.username,
    password: flags.password || envConfig.password || dwJsonConfig.password,
    clientId: flags.clientId || envConfig.clientId || dwJsonConfig.clientId,
    clientSecret: flags.clientSecret || envConfig.clientSecret || dwJsonConfig.clientSecret,
    mrtApiKey: flags.mrtApiKey || envConfig.mrtApiKey,
  };
}

/**
 * Loads configuration from dw.json file in current directory or parents.
 */
function loadDwJson(): ResolvedConfig {
  const dwJsonPath = findDwJson();
  if (!dwJsonPath) {
    return {};
  }

  try {
    const content = fs.readFileSync(dwJsonPath, 'utf8');
    const json = JSON.parse(content) as DwJson;

    return {
      hostname: json.hostname,
      codeVersion: json['code-version'],
      username: json.username,
      password: json.password,
      clientId: json['client-id'],
      clientSecret: json['client-secret'],
    };
  } catch {
    // Silently ignore parse errors
    return {};
  }
}

/**
 * Finds dw.json by walking up from current directory.
 */
function findDwJson(): string | null {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const dwJsonPath = path.join(dir, 'dw.json');
    if (fs.existsSync(dwJsonPath)) {
      return dwJsonPath;
    }
    dir = path.dirname(dir);
  }

  return null;
}
