import { parseArgs } from 'node:util';
import { loadConfig, getConfigValue, setConfigValue } from '../utils/config.js';
import { success, error, heading, printTable } from '../utils/output.js';

const VALID_KEYS = ['apiKey', 'apiSecret', 'defaultTimeout', 'outputDir'] as const;

export async function configCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'set': {
      const key = args[1];
      const value = args[2];
      if (!key || !value) {
        error('Usage: wiro config set <key> <value>');
        error('Valid keys: ' + VALID_KEYS.join(', '));
        process.exitCode = 1;
        return;
      }
      if (!VALID_KEYS.includes(key as typeof VALID_KEYS[number])) {
        error(`Invalid key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
        process.exitCode = 1;
        return;
      }
      setConfigValue(key, value);
      success(`Set ${key} = ${key.includes('Secret') || key.includes('Key') ? '****' : value}`);
      break;
    }

    case 'get': {
      const key = args[1];
      if (!key) {
        error('Usage: wiro config get <key>');
        process.exitCode = 1;
        return;
      }
      const val = getConfigValue(key);
      if (val !== undefined) {
        console.log(val);
      } else {
        error(`Key "${key}" is not set.`);
        process.exitCode = 1;
      }
      break;
    }

    case 'list': {
      heading('Wiro Configuration');
      const config = loadConfig();
      const rows: string[][] = [];
      for (const key of VALID_KEYS) {
        const val = config[key];
        if (val !== undefined) {
          const display = key.includes('Secret') || key.includes('Key')
            ? String(val).slice(0, 4) + '****'
            : String(val);
          rows.push([key, display]);
        } else {
          rows.push([key, '(not set)']);
        }
      }
      printTable(['Key', 'Value'], rows);
      break;
    }

    default:
      error('Usage: wiro config <set|get|list>');
      error('  wiro config set <key> <value>');
      error('  wiro config get <key>');
      error('  wiro config list');
      process.exitCode = 1;
  }
}
