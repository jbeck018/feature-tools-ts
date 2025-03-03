import { execSync } from 'node:child_process';
import { existsSync, unlinkSync, statSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const TEST_DIR = resolve(tmpdir(), 'featuretools-type-perf-test');
const SCRIPT_PATH = resolve(__dirname, '../../scripts/generate-types.js');
const TYPE_OUTPUT = resolve(__dirname, '../../src/types/generated.ts');
const CACHE_FILE = resolve(__dirname, '../../.types-cache.json');
const TEMP_OUTPUT = resolve(__dirname, '../../.types-temp.ts');
const BACKUP_OUTPUT = resolve(TEST_DIR, 'generated.ts.bak');
const BACKUP_CACHE = resolve(TEST_DIR, 'types-cache.json.bak');

// Create backup directory if it doesn't exist
beforeAll(() => {
  // Ensure TEST_DIR exists
  try {
    execSync(`mkdir -p ${TEST_DIR}`);
  } catch (error) {
    console.error('Error creating test directory:', error);
  }

  // Backup existing files if they exist
  if (existsSync(TYPE_OUTPUT)) {
    execSync(`cp "${TYPE_OUTPUT}" "${BACKUP_OUTPUT}"`);
  }
  
  if (existsSync(CACHE_FILE)) {
    execSync(`cp "${CACHE_FILE}" "${BACKUP_CACHE}"`);
  }
  
  // Clean up any existing temp files
  try {
    if (existsSync(TEMP_OUTPUT)) {
      unlinkSync(TEMP_OUTPUT);
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
});

// Restore backups and clean up
afterAll(() => {
  // Restore original files
  if (existsSync(BACKUP_OUTPUT)) {
    execSync(`cp "${BACKUP_OUTPUT}" "${TYPE_OUTPUT}"`);
  }
  
  if (existsSync(BACKUP_CACHE)) {
    execSync(`cp "${BACKUP_CACHE}" "${CACHE_FILE}"`);
  }

  // Clean up backup files
  try {
    if (existsSync(BACKUP_OUTPUT)) {
      unlinkSync(BACKUP_OUTPUT);
    }
    
    if (existsSync(BACKUP_CACHE)) {
      unlinkSync(BACKUP_CACHE);
    }
  } catch (error) {
    console.error('Error cleaning up backup files:', error);
  }
});

describe('Type Generation Performance Tests', () => {
  // Test for basic functionality
  it('should generate TypeScript types successfully', () => {
    // Force regeneration with clean state
    try {
      if (existsSync(CACHE_FILE)) {
        unlinkSync(CACHE_FILE);
      }
    } catch (error) {
      console.error('Error deleting cache file:', error);
    }
    
    // Run the script with timing
    const startTime = Date.now();
    const output = execSync(`node ${SCRIPT_PATH}`, { encoding: 'utf8' });
    const firstRunTime = Date.now() - startTime;
    
    // Verify the output file exists
    expect(existsSync(TYPE_OUTPUT)).toBe(true);
    
    // Check content of output file
    const fileContent = readFileSync(TYPE_OUTPUT, 'utf8');
    expect(fileContent).toContain('export interface EntitySet');
    expect(fileContent).toContain('export interface Entity');
    
    // Print the execution time
    console.log(`Initial type generation took ${firstRunTime}ms`);
    
    // Ensure cache file was created
    expect(existsSync(CACHE_FILE)).toBe(true);
    
    // Verify the cache file content
    const cacheContent = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    expect(cacheContent).toHaveProperty('lastGenerated');
    expect(cacheContent).toHaveProperty('scriptHash');
    expect(cacheContent).toHaveProperty('contentHash');
  });
  
  // Test for cached execution
  it('should use cache for subsequent runs', () => {
    // Ensure cache exists from previous test
    expect(existsSync(CACHE_FILE)).toBe(true);
    
    // Run the script again with timing
    const startTime = Date.now();
    const output = execSync(`node ${SCRIPT_PATH}`, { encoding: 'utf8' });
    const cachedRunTime = Date.now() - startTime;
    
    // Expect the output to indicate cache was used
    expect(output).toContain('TypeScript definitions are up to date');
    
    // Print the execution time
    console.log(`Cached execution took ${cachedRunTime}ms`);
    
    // This should be significantly faster
    // Note: Not asserting exact time as it depends on the system
    expect(cachedRunTime).toBeLessThan(200); // Assuming cached runs are fast
  });
  
  // Test for forced regeneration
  it('should regenerate when forced', () => {
    // Run the script with force flag
    const startTime = Date.now();
    const output = execSync(`node ${SCRIPT_PATH} --force`, { encoding: 'utf8' });
    const forcedRunTime = Date.now() - startTime;
    
    // Print the execution time
    console.log(`Forced regeneration took ${forcedRunTime}ms`);
    
    // This should update the cache file timestamp
    const cacheContent = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    const cacheDate = new Date(cacheContent.lastGenerated).getTime();
    const fiveSecondsAgo = Date.now() - 5000;
    
    // Verify the cache was updated recently
    expect(cacheDate).toBeGreaterThan(fiveSecondsAgo);
  });
  
  // Test debug mode
  it('should output performance metrics in debug mode', () => {
    // Run the script in debug mode
    const output = execSync(`DEBUG=1 node ${SCRIPT_PATH} --force`, { encoding: 'utf8', stdio: 'pipe' });
    
    // Verify performance metrics were included
    expect(output).toContain('[PERF]');
  });
  
  // Test with disabled parallel processing
  it('should work with disabled parallel processing', () => {
    // Run the script with parallel processing disabled
    const startTime = Date.now();
    execSync(`DISABLE_PARALLEL=1 node ${SCRIPT_PATH} --force`, { encoding: 'utf8' });
    const sequentialRunTime = Date.now() - startTime;
    
    console.log(`Sequential processing took ${sequentialRunTime}ms`);
    
    // Not asserting performance difference as it depends on the machine
    // Just verifying it completes successfully
    expect(existsSync(TYPE_OUTPUT)).toBe(true);
  });
}); 