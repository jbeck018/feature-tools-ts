import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

describe('Type Generation Workflow', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/generate-types.js');
  const outputPath = path.join(process.cwd(), 'src/types/generated.ts');
  
  // Make sure script exists before running tests
  beforeAll(() => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });
  
  // Clean up after tests if needed
  afterAll(() => {
    // If we created a test output file, clean it up
    const testOutputPath = path.join(process.cwd(), 'tests/integration/test-generated.ts');
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });
  
  test('Script can be executed with Node.js', async () => {
    const { stdout, stderr } = await execPromise(`node ${scriptPath} --verbose`);
    
    // Should not have errors
    expect(stderr).not.toContain('Error:');
    
    // Should produce output
    expect(stdout).toContain('TypeScript definitions written to');
  }, 60000); // 60 second timeout
  
  test('Generated file includes expected interfaces', () => {
    // Verify output file exists
    expect(fs.existsSync(outputPath)).toBe(true);
    
    // Read the contents
    const fileContents = fs.readFileSync(outputPath, 'utf8');
    
    // Check for expected interfaces
    expect(fileContents).toContain('export interface EntitySet');
    expect(fileContents).toContain('export interface Entity');
    expect(fileContents).toContain('export interface Relationship');
    
    // Check for JSDoc comments
    expect(fileContents).toContain('/**');
    
    // Check that the file is valid TypeScript
    expect(() => {
      // A simple validation would be to check for matching braces
      const openBraces = (fileContents.match(/{/g) || []).length;
      const closeBraces = (fileContents.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
      
      // And that there are no syntax errors like missing semicolons at end of lines
      const lines = fileContents.split('\n');
      for (const line of lines) {
        if (line.trim().endsWith('{') || line.trim().endsWith('}') || 
            line.trim().endsWith(';') || line.trim().startsWith('//') || 
            line.trim().startsWith('*') || line.trim().startsWith('/*') || 
            line.trim().startsWith('export') || line.trim() === '') {
          // These are valid line endings
        } else if (line.includes('{') || line.includes('}')) {
          // Lines with braces are likely valid
        } else {
          // If we get here, it might be a syntax error
          console.warn('Possible syntax error:', line);
        }
      }
    }).not.toThrow();
  });
  
  test('Script detects when no changes are needed', async () => {
    // Run it once
    await execPromise(`node ${scriptPath} --verbose`);
    
    // Run it again - should indicate no changes needed
    const { stdout } = await execPromise(`node ${scriptPath} --verbose`);
    expect(stdout).toContain('Using existing TypeScript definitions');
  }, 60000); // 60 second timeout
  
  test('Force flag causes regeneration', async () => {
    // Get the current file stats
    const originalStats = fs.statSync(outputPath);
    
    // Wait 1 second to ensure timestamp will be different
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run with force flag
    const { stdout } = await execPromise(`node ${scriptPath} --force`);
    
    // Get new stats
    const newStats = fs.statSync(outputPath);
    
    // Should have newer modified time
    expect(newStats.mtimeMs).toBeGreaterThan(originalStats.mtimeMs);
    
    // Output should indicate generation
    expect(stdout).toContain('TypeScript definitions written to');
  }, 60000); // 60 second timeout
}); 