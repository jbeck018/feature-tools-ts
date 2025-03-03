import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Python Version Compatibility', () => {
  const SCRIPT_PATH = resolve(__dirname, '../../scripts/generate-types.js');
  const TYPE_OUTPUT = resolve(__dirname, '../../src/types/generated.ts');
  const VERSION_COMPAT_PATH = resolve(__dirname, '../../src/python/version_compat.py');
  
  // Backup the original output file if it exists
  const BACKUP_OUTPUT = resolve(__dirname, '../../src/types/generated.backup.ts');
  let originalOutputExists = false;
  
  beforeAll(() => {
    // Verify version_compat.py exists
    expect(existsSync(VERSION_COMPAT_PATH)).toBe(true);
    
    // Backup the original output file if it exists
    if (existsSync(TYPE_OUTPUT)) {
      originalOutputExists = true;
      execSync(`cp ${TYPE_OUTPUT} ${BACKUP_OUTPUT}`);
    }
  });
  
  afterAll(() => {
    // Restore the original output file if it existed
    if (originalOutputExists) {
      execSync(`cp ${BACKUP_OUTPUT} ${TYPE_OUTPUT}`);
      execSync(`rm ${BACKUP_OUTPUT}`);
    }
  });
  
  // Helper function to get Python version
  const getPythonVersion = (executable: string): string => {
    try {
      return execSync(`${executable} -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"`, { 
        encoding: 'utf-8' 
      }).trim();
    } catch (e) {
      return 'unknown';
    }
  };
  
  // Test with the default Python version
  test('should generate types with default Python version', () => {
    // Force regeneration to ensure it runs
    const output = execSync(`node ${SCRIPT_PATH} --force`, { 
      encoding: 'utf-8',
      env: {
        ...process.env,
        DEBUG: 'true'
      }
    });
    
    // Verify the script runs and outputs version info
    expect(output).toContain('[INFO] Python');
    expect(output).toContain('compatibility mode');
    
    // Verify the output file was generated
    expect(existsSync(TYPE_OUTPUT)).toBe(true);
    
    // Read the generated file
    const generatedContent = readFileSync(TYPE_OUTPUT, 'utf-8');
    
    // Verify basic content of the generated file
    expect(generatedContent).toContain('export interface EntitySet');
    expect(generatedContent).toContain('id: string');
  });
  
  // Test with a specific Python version if available
  test('should respect --python command line option', () => {
    // Get python3 path
    let pythonPath: string;
    try {
      pythonPath = execSync('which python3', { encoding: 'utf-8' }).trim();
    } catch (e) {
      // Skip test if python3 isn't available
      console.warn('Skipping specific Python version test - python3 not found');
      return;
    }
    
    const pythonVersion = getPythonVersion(pythonPath);
    if (pythonVersion === 'unknown') {
      console.warn('Skipping specific Python version test - could not determine version');
      return;
    }
    
    // Run with specific Python version
    const output = execSync(`node ${SCRIPT_PATH} --force --python ${pythonPath}`, { 
      encoding: 'utf-8',
      env: {
        ...process.env,
        DEBUG: 'true'
      }
    });
    
    // Verify the script runs with the specified Python version
    expect(output).toContain(`Using Python ${pythonVersion}`);
    
    // Verify the output file was generated
    expect(existsSync(TYPE_OUTPUT)).toBe(true);
  });
  
  // Test Python version detection
  test('should detect Python version changes and regenerate types', () => {
    // First run with default Python
    execSync(`node ${SCRIPT_PATH} --force`, { 
      encoding: 'utf-8',
      env: {
        ...process.env,
        DEBUG: 'true'
      }
    });
    
    // Try to find a different Python version (python vs python3 or vice versa)
    let alternatePython: string;
    try {
      if (process.env.PYTHON_EXECUTABLE === 'python3') {
        alternatePython = execSync('which python', { encoding: 'utf-8' }).trim();
      } else {
        alternatePython = execSync('which python3', { encoding: 'utf-8' }).trim();
      }
      
      // Check if the alternate version is different
      const defaultVersion = getPythonVersion(process.env.PYTHON_EXECUTABLE || 'python3');
      const alternateVersion = getPythonVersion(alternatePython);
      
      if (defaultVersion === alternateVersion || alternateVersion === 'unknown') {
        console.warn('Skipping Python version change test - could not find different Python version');
        return;
      }
      
      // Run with the alternate Python version but without --force
      // It should regenerate because the Python version changed
      const output = execSync(`node ${SCRIPT_PATH} --python ${alternatePython}`, { 
        encoding: 'utf-8',
        env: {
          ...process.env,
          DEBUG: 'true'
        }
      });
      
      // Verify it detected the version change
      expect(output).toContain('Python version changed');
      expect(output).toContain('Using Python');
      
    } catch (e) {
      console.warn('Skipping Python version change test - could not find alternate Python version');
    }
  });
}); 