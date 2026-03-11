const ESC = '\x1b';

export const colors = {
  reset: `${ESC}[0m`,
  bold: `${ESC}[1m`,
  dim: `${ESC}[2m`,
  red: `${ESC}[31m`,
  green: `${ESC}[32m`,
  yellow: `${ESC}[33m`,
  blue: `${ESC}[34m`,
  magenta: `${ESC}[35m`,
  cyan: `${ESC}[36m`,
  white: `${ESC}[37m`,
};

export function success(msg: string): void {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${colors.red}✗${colors.reset} ${msg}`);
}

export function warn(msg: string): void {
  console.log(`${colors.yellow}!${colors.reset} ${msg}`);
}

export function info(msg: string): void {
  console.log(`${colors.blue}i${colors.reset} ${msg}`);
}

export function heading(msg: string): void {
  console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`);
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export interface Spinner {
  update(text: string): void;
  stop(finalText?: string): void;
}

export function createSpinner(text: string): Spinner {
  let frameIndex = 0;
  let currentText = text;
  let stopped = false;

  const interval = setInterval(() => {
    if (stopped) return;
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]!;
    process.stderr.write(`\r${colors.cyan}${frame}${colors.reset} ${currentText}`);
    frameIndex++;
  }, 80);

  return {
    update(newText: string) {
      currentText = newText;
    },
    stop(finalText?: string) {
      stopped = true;
      clearInterval(interval);
      process.stderr.write('\r' + ' '.repeat(currentText.length + 4) + '\r');
      if (finalText) {
        console.log(finalText);
      }
    },
  };
}

export function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0);
    return Math.max(h.length, maxRow);
  });

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i]!)).join('  ');
  const separator = colWidths.map((w) => '-'.repeat(w)).join('  ');

  console.log(`${colors.bold}${headerLine}${colors.reset}`);
  console.log(`${colors.dim}${separator}${colors.reset}`);

  for (const row of rows) {
    const line = row.map((cell, i) => cell.padEnd(colWidths[i]!)).join('  ');
    console.log(line);
  }
}
