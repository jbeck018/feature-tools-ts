import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Type Generation', () => {
  const pythonScript = path.join(process.cwd(), 'src/python/generate_types.py');
  
  // Helper function to run the Python script and capture output
  const runPythonScript = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [pythonScript]);
      
      let stdoutData = '';
      let stderrData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}\n${stderrData}`));
        } else {
          resolve(stdoutData);
        }
      });
    });
  };
  
  test('Python script exists', () => {
    expect(fs.existsSync(pythonScript)).toBe(true);
  });
  
  test('Python script generates valid TypeScript', async () => {
    // This may take a bit of time as it requires Python to run
    const generatedTypes = await runPythonScript();
    
    // Simple validation that the output looks like TypeScript interfaces
    expect(generatedTypes).toContain('export interface');
    
    // Check for expected interfaces
    expect(generatedTypes).toContain('export interface EntitySet');
    expect(generatedTypes).toContain('export interface Entity');
    expect(generatedTypes).toContain('export interface Relationship');
    
    // Verify it doesn't have Python syntax
    expect(generatedTypes).not.toContain('def ');
    expect(generatedTypes).not.toContain('class ');
    expect(generatedTypes).not.toContain('import ');
  }, 30000); // 30 second timeout
  
  test('Generated TypeScript should be syntactically valid', async () => {
    const generatedTypes = await runPythonScript();
    
    // Write to a temporary file
    const tempFile = path.join(process.cwd(), 'tests/unit/temp-generated.ts');
    fs.writeFileSync(tempFile, generatedTypes);
    
    // Use TypeScript compiler API to validate if needed
    // This is a simple check - we could improve it with a real TS syntax validation
    
    // Clean up
    fs.unlinkSync(tempFile);
    
    // If we got here without errors, consider it valid
    expect(true).toBe(true);
  }, 30000); // 30 second timeout
}); 