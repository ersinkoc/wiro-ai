import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSpinner, success, error, warn, info, heading, printTable, colors } from '../utils/output.js';

describe('createSpinner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a spinner with update and stop methods', () => {
    const spinner = createSpinner('Loading...');
    expect(spinner.update).toBeDefined();
    expect(spinner.stop).toBeDefined();
    spinner.stop();
  });

  it('stop clears the spinner', () => {
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const spinner = createSpinner('Loading...');
    vi.advanceTimersByTime(100);
    spinner.stop('Done!');
    expect(logSpy).toHaveBeenCalledWith('Done!');
    writeSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('update changes the displayed text', () => {
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const spinner = createSpinner('Step 1...');
    spinner.update('Step 2...');
    vi.advanceTimersByTime(100);
    // Verify write was called (spinner frame output)
    expect(writeSpy).toHaveBeenCalled();
    spinner.stop();
    writeSpy.mockRestore();
  });

  it('stop without final text does not log', () => {
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const spinner = createSpinner('Loading...');
    spinner.stop();
    expect(logSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('interval callback exits early when stopped', () => {
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const spinner = createSpinner('Test');
    // Let some frames render
    vi.advanceTimersByTime(100);
    const callsBefore = writeSpy.mock.calls.length;
    // Stop the spinner - this sets stopped=true but clearInterval may not prevent already-queued callbacks
    spinner.stop();
    // Advance past several intervals - the stopped check should prevent writes
    vi.advanceTimersByTime(500);
    // No additional writes should occur after stop (since stopped=true early return)
    expect(writeSpy.mock.calls.length).toBe(callsBefore + 1); // +1 for the clear line in stop()
    writeSpy.mockRestore();
  });
});

describe('success', () => {
  it('logs with green checkmark', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    success('ok');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ok'));
    logSpy.mockRestore();
  });
});

describe('error', () => {
  it('logs to stderr with red X', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    error('fail');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('fail'));
    errorSpy.mockRestore();
  });
});

describe('warn', () => {
  it('logs with yellow exclamation', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warn('caution');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('!'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('caution'));
    logSpy.mockRestore();
  });
});

describe('info', () => {
  it('logs with blue info marker', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    info('note');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('i'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('note'));
    logSpy.mockRestore();
  });
});

describe('heading', () => {
  it('logs with bold cyan formatting', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    heading('Title');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Title'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(colors.bold));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(colors.cyan));
    logSpy.mockRestore();
  });
});

describe('printTable', () => {
  it('prints headers, separator, and rows', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printTable(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']]);
    expect(logSpy).toHaveBeenCalledTimes(4); // header + separator + 2 rows
    // Header line includes bold
    expect(logSpy.mock.calls[0][0]).toContain('Name');
    expect(logSpy.mock.calls[0][0]).toContain('Age');
    // Separator line
    expect(logSpy.mock.calls[1][0]).toContain('---');
    // Data rows
    expect(logSpy.mock.calls[2][0]).toContain('Alice');
    expect(logSpy.mock.calls[3][0]).toContain('Bob');
    logSpy.mockRestore();
  });

  it('handles empty rows', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printTable(['Col'], []);
    expect(logSpy).toHaveBeenCalledTimes(2); // header + separator only
    logSpy.mockRestore();
  });

  it('handles rows with missing cells', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printTable(['A', 'B'], [['only-a']]);
    expect(logSpy).toHaveBeenCalledTimes(3);
    logSpy.mockRestore();
  });
});
