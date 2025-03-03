/**
 * Debug Utility Module
 * 
 * This module provides a set of tools for debugging and troubleshooting issues
 * in the Featuretools TypeScript project, with a focus on type generation and
 * Python integration.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';

/**
 * Debug levels for controlling verbosity
 */
export enum DebugLevel {
  None = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4,
  Trace = 5
}

/**
 * Configuration options for the debug utility
 */
export interface DebugOptions {
  /** The active debug level */
  level: DebugLevel;
  /** Whether to write to file */
  logToFile: boolean;
  /** Path to the log file */
  logFilePath?: string | undefined;
  /** Whether to show colors in console output */
  useColors: boolean;
  /** Whether to include timestamps */
  includeTimestamps: boolean;
  /** Whether to include call site information */
  includeCallSite: boolean;
  /** Maximum depth for object inspection */
  inspectDepth: number;
}

/**
 * Performance timer result
 */
export interface TimerResult {
  /** The unique identifier for the timer */
  id: string;
  /** The label for the timer */
  label: string;
  /** The elapsed time in milliseconds */
  elapsedMs: number;
  /** The memory usage difference */
  memoryDiff?: {
    /** The difference in heap used (in bytes) */
    heapUsed: number;
    /** The difference in heap total (in bytes) */
    heapTotal: number;
  } | undefined;
}

/**
 * Default debug options
 */
const DEFAULT_OPTIONS: DebugOptions = {
  level: DebugLevel.None,
  logToFile: false,
  useColors: true,
  includeTimestamps: true,
  includeCallSite: true,
  inspectDepth: 4
};

/**
 * The current active timers
 */
const activeTimers: Map<string, { 
  start: [number, number], 
  label: string,
  memoryStart?: NodeJS.MemoryUsage | undefined
}> = new Map();

/**
 * The current debug options
 */
let currentOptions: DebugOptions = { ...DEFAULT_OPTIONS };

/**
 * The log file stream
 */
let logFileStream: fs.WriteStream | null = null;

/**
 * Initialize the debug utility with the given options
 * 
 * @param options The debug options
 */
export function init(options?: Partial<DebugOptions>): void {
  currentOptions = { ...DEFAULT_OPTIONS, ...options };
  
  if (currentOptions.logToFile) {
    const logFilePath = currentOptions.logFilePath || path.join(process.cwd(), 'debug.log');
    closeLogFile(); // Close any existing stream
    logFileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  }
  
  log(DebugLevel.Info, `Debug utility initialized with level ${DebugLevel[currentOptions.level]}`);
}

/**
 * Close the log file if it's open
 */
export function closeLogFile(): void {
  if (logFileStream) {
    logFileStream.end();
    logFileStream = null;
  }
}

/**
 * Get the call site information
 * 
 * @returns The call site information
 */
function getCallSite(): string {
  const err = new Error();
  const stack = err.stack || '';
  const stackLines = stack.split('\n').slice(3); // Skip the getCallSite and log functions
  const callerLine = stackLines[0] || '';
  const match = callerLine.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?)\)?/);
  
  if (!match) {
    return 'unknown';
  }
  
  const [, fnName, filePath, line, col] = match;
  const fileName = filePath ? path.basename(filePath) : 'unknown';
  const fn = fnName || '<anonymous>';
  
  return `${fn} (${fileName}:${line}${col ? `:${col}` : ''})`;
}

/**
 * Get the current timestamp
 * 
 * @returns The current timestamp as a string
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format a message with color
 * 
 * @param msg The message to format
 * @param color The ANSI color code
 * @returns The formatted message
 */
function colorize(msg: string, color: number): string {
  return currentOptions.useColors ? `\x1b[${color}m${msg}\x1b[0m` : msg;
}

/**
 * Log a message at the given level
 * 
 * @param level The debug level
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function log(level: DebugLevel, message: string, ...args: unknown[]): void {
  if (level > currentOptions.level) {
    return;
  }
  
  const parts: string[] = [];
  
  // Add timestamp
  if (currentOptions.includeTimestamps) {
    parts.push(`[${getTimestamp()}]`);
  }
  
  // Add level
  const levelStr = DebugLevel[level].padEnd(5);
  let levelColor = 0;
  
  switch (level) {
    case DebugLevel.Error:
      levelColor = 31; // Red
      break;
    case DebugLevel.Warn:
      levelColor = 33; // Yellow
      break;
    case DebugLevel.Info:
      levelColor = 32; // Green
      break;
    case DebugLevel.Debug:
      levelColor = 36; // Cyan
      break;
    case DebugLevel.Trace:
      levelColor = 90; // Gray
      break;
  }
  
  parts.push(colorize(`[${levelStr}]`, levelColor));
  
  // Add call site
  if (currentOptions.includeCallSite) {
    parts.push(`[${getCallSite()}]`);
  }
  
  // Add message
  parts.push(message);
  
  // Format additional args
  const formattedArgs = args.map(arg => 
    typeof arg === 'object' 
      ? util.inspect(arg, { depth: currentOptions.inspectDepth, colors: currentOptions.useColors })
      : String(arg)
  );
  
  // Combine all parts
  const fullMessage = `${parts.join(' ')}${formattedArgs.length ? ' ' + formattedArgs.join(' ') : ''}`;
  
  // Output to console
  if (level === DebugLevel.Error) {
    console.error(fullMessage);
  } else {
    console.log(fullMessage);
  }
  
  // Output to file
  if (currentOptions.logToFile && logFileStream) {
    // Remove ANSI color codes for file output
    // eslint-disable-next-line no-control-regex
    logFileStream.write(`${fullMessage.replace(/\x1b\[\d+m/g, '')}\n`);
  }
}

/**
 * Log an error message
 * 
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function error(message: string, ...args: unknown[]): void {
  log(DebugLevel.Error, message, ...args);
}

/**
 * Log a warning message
 * 
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function warn(message: string, ...args: unknown[]): void {
  log(DebugLevel.Warn, message, ...args);
}

/**
 * Log an info message
 * 
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function info(message: string, ...args: unknown[]): void {
  log(DebugLevel.Info, message, ...args);
}

/**
 * Log a debug message
 * 
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function debug(message: string, ...args: unknown[]): void {
  log(DebugLevel.Debug, message, ...args);
}

/**
 * Log a trace message
 * 
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function trace(message: string, ...args: unknown[]): void {
  log(DebugLevel.Trace, message, ...args);
}

/**
 * Start a performance timer
 * 
 * @param label A descriptive label for the timer
 * @param trackMemory Whether to track memory usage
 * @returns The timer ID
 */
export function startTimer(label: string, trackMemory = false): string {
  const id = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const memoryStart = trackMemory ? process.memoryUsage() : undefined;
  
  activeTimers.set(id, { 
    start: process.hrtime(),
    label,
    memoryStart
  });
  
  debug(`Started timer "${label}" (${id})`);
  return id;
}

/**
 * Stop a performance timer and get the result
 * 
 * @param id The timer ID
 * @returns The timer result
 */
export function stopTimer(id: string): TimerResult | null {
  const timer = activeTimers.get(id);
  
  if (!timer) {
    error(`Timer with ID "${id}" not found`);
    return null;
  }
  
  const elapsed = process.hrtime(timer.start);
  const elapsedMs = (elapsed[0] * 1000) + (elapsed[1] / 1000000);
  
  let memoryDiff: { heapUsed: number; heapTotal: number; } | undefined;
  
  if (timer.memoryStart) {
    const memoryEnd = process.memoryUsage();
    memoryDiff = {
      heapUsed: memoryEnd.heapUsed - timer.memoryStart.heapUsed,
      heapTotal: memoryEnd.heapTotal - timer.memoryStart.heapTotal
    };
  }
  
  activeTimers.delete(id);
  
  const result: TimerResult = {
    id,
    label: timer.label,
    elapsedMs,
    memoryDiff
  };
  
  debug(
    `Stopped timer "${timer.label}" (${id}): ${elapsedMs.toFixed(2)}ms` +
    `${memoryDiff ? `, Memory: +${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB` : ''}`
  );
  
  return result;
}

/**
 * Run a function with performance timing
 * 
 * @param label A descriptive label for the timer
 * @param fn The function to time
 * @param trackMemory Whether to track memory usage
 * @returns The result of the function and the timer result
 */
export async function timeAsync<T>(
  label: string,
  fn: () => Promise<T>,
  trackMemory = false
): Promise<{ result: T; timer: TimerResult }> {
  const timerId = startTimer(label, trackMemory);
  try {
    const result = await fn();
    const timer = stopTimer(timerId);
    if (!timer) {
      throw new Error(`Failed to stop timer: ${timerId}`);
    }
    return { result, timer };
  } catch (err) {
    stopTimer(timerId);
    throw err;
  }
}

/**
 * Run a synchronous function with performance timing
 * 
 * @param label A descriptive label for the timer
 * @param fn The function to time
 * @param trackMemory Whether to track memory usage
 * @returns The result of the function and the timer result
 */
export function timeSync<T>(
  label: string,
  fn: () => T,
  trackMemory = false
): { result: T; timer: TimerResult } {
  const timerId = startTimer(label, trackMemory);
  try {
    const result = fn();
    const timer = stopTimer(timerId);
    if (!timer) {
      throw new Error(`Failed to stop timer: ${timerId}`);
    }
    return { result, timer };
  } catch (err) {
    stopTimer(timerId);
    throw err;
  }
}

/**
 * Group a set of logs together
 * 
 * @param label The group label
 * @param fn The function to execute within the group
 */
export async function group<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
  info(`┌─ ${label} ─`.padEnd(80, '─'));
  try {
    return await Promise.resolve(fn());
  } finally {
    info(`└${'─'.repeat(80)}`);
  }
}

/**
 * Create a scoped logger with a prefix
 * 
 * @param prefix The prefix to add to all log messages
 * @returns A scoped logger
 */
export function createScopedLogger(prefix: string) {
  return {
    error: (message: string, ...args: unknown[]) => error(`[${prefix}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => warn(`[${prefix}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => info(`[${prefix}] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => debug(`[${prefix}] ${message}`, ...args),
    trace: (message: string, ...args: unknown[]) => trace(`[${prefix}] ${message}`, ...args)
  };
}

/**
 * Initialize the debug utility from environment variables
 */
export function initFromEnv(): void {
  const level = process.env.DEBUG_LEVEL ? 
    Number.parseInt(process.env.DEBUG_LEVEL, 10) : 
    process.env.DEBUG === 'true' ? DebugLevel.Debug : DebugLevel.None;
  
  init({
    level,
    logToFile: process.env.DEBUG_LOG_FILE === 'true',
    logFilePath: process.env.DEBUG_LOG_FILE_PATH,
    useColors: process.env.DEBUG_COLORS !== 'false',
    includeTimestamps: process.env.DEBUG_TIMESTAMPS !== 'false',
    includeCallSite: process.env.DEBUG_CALL_SITE !== 'false',
    inspectDepth: process.env.DEBUG_INSPECT_DEPTH ? 
      Number.parseInt(process.env.DEBUG_INSPECT_DEPTH, 10) : 
      DEFAULT_OPTIONS.inspectDepth
  });
}

// Initialize from environment variables if this file is directly executed
if (require.main === module) {
  initFromEnv();
} 