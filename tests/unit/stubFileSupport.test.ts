import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Stub File Support', () => {
  const SCRIPT_PATH = resolve(__dirname, '../../scripts/generate-types.js');
  const TYPE_OUTPUT = resolve(__dirname, '../../src/types/generated.ts');
  const STUB_DIR = resolve(__dirname, '../../stubs');
  
  // Backup the original output file if it exists
  const BACKUP_OUTPUT = resolve(__dirname, '../../src/types/generated.backup.ts');
  let originalOutputExists = false;
  
  beforeAll(() => {
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
  
  test('should generate types using stub files when TYPESHED_PATH is set', () => {
    // Run the type generation script with TYPESHED_PATH set to the stubs directory
    const output = execSync(`TYPESHED_PATH=${STUB_DIR} node ${SCRIPT_PATH} --force`, { 
      encoding: 'utf-8',
      env: {
        ...process.env,
        DEBUG: 'true'
      }
    });
    
    // Verify that the output mentions using stub files
    expect(output).toContain('Added typeshed path');
    
    // Verify that the generated file exists
    expect(existsSync(TYPE_OUTPUT)).toBe(true);
    
    // Read the generated file
    const generatedContent = readFileSync(TYPE_OUTPUT, 'utf-8');
    
    // Verify that the EntitySet interface is present with properties from the stub
    expect(generatedContent).toContain('interface EntitySet');
    expect(generatedContent).toContain('id: string');
    expect(generatedContent).toContain('entities: Record<string, Entity>');
    expect(generatedContent).toContain('relationships: Relationship[]');
    
    // Verify that the add_entity method is present with the correct signature
    expect(generatedContent).toContain('add_entity(');
    expect(generatedContent).toContain('entity_id: string');
    expect(generatedContent).toContain('df: any'); // DataFrame becomes 'any' in TypeScript
    
    // Verify that docstrings from the stub are included
    expect(generatedContent).toContain('A collection of entities and relationships between them');
  });
  
  test('should fall back to runtime inspection when stub files are not available', () => {
    // Run the type generation script without TYPESHED_PATH
    const output = execSync(`node ${SCRIPT_PATH} --force`, { 
      encoding: 'utf-8',
      env: {
        ...process.env,
        DEBUG: 'true'
      }
    });
    
    // Verify that the output does not mention using stub files
    expect(output).not.toContain('Added typeshed path');
    
    // Verify that the generated file exists
    expect(existsSync(TYPE_OUTPUT)).toBe(true);
    
    // The content should still have EntitySet but might have different properties
    // depending on the runtime inspection
    const generatedContent = readFileSync(TYPE_OUTPUT, 'utf-8');
    expect(generatedContent).toContain('interface EntitySet');
  });
}); 