import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import * as os from 'node:os';

describe('Custom Type Transformations', () => {
  const TEST_DIR = path.join(os.tmpdir(), 'ft-custom-transforms-test');
  const TRANSFORMS_FILE = path.join(TEST_DIR, 'custom-transforms.json');
  const OUTPUT_FILE = path.join(TEST_DIR, 'generated-types.ts');
  
  // Setup test environment
  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    
    // Create a custom transformations file
    const transforms = {
      transformations: {
        'featuretools.entityset.EntitySet.id': 'string & { readonly __entitySetId: unique symbol }',
        'pandas.core.frame.DataFrame': 'DataFrame<Record<string, unknown>>',
        'featuretools.feature_base.feature_base.FeatureBase': 
          '{BASE_TYPE} & { getOutputType(): string; isValid(): boolean }'
      }
    };
    
    fs.writeFileSync(TRANSFORMS_FILE, JSON.stringify(transforms, null, 2));
  });
  
  // Cleanup after tests
  afterAll(() => {
    if (fs.existsSync(TRANSFORMS_FILE)) {
      fs.unlinkSync(TRANSFORMS_FILE);
    }
    if (fs.existsSync(OUTPUT_FILE)) {
      fs.unlinkSync(OUTPUT_FILE);
    }
    if (fs.existsSync(TEST_DIR)) {
      fs.rmdirSync(TEST_DIR, { recursive: true });
    }
  });
  
  test('should apply string transformations correctly', () => {
    // Run the type generator with custom transforms
    const cmd = `CUSTOM_TRANSFORMS_PATH=${TRANSFORMS_FILE} DEBUG=1 ` +
      `node scripts/generate-types.js --force --output ${OUTPUT_FILE}`;
    
    try {
      execSync(cmd, { stdio: 'pipe' });
    } catch (error) {
      console.error('Error running type generation:', error);
      throw error;
    }
    
    // Check that the output file exists
    expect(fs.existsSync(OUTPUT_FILE)).toBe(true);
    
    // Read the generated file
    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    
    // Check for transformed types
    expect(content).toContain('string & { readonly __entitySetId: unique symbol }');
    expect(content).toContain('DataFrame<Record<string, unknown>>');
    expect(content).toContain('getOutputType(): string');
    expect(content).toContain('isValid(): boolean');
    
    // Check for the info comment about transformations
    expect(content).toContain('custom type transformations applied');
  });
  
  test('should handle errors in transformations gracefully', () => {
    // Create a transforms file with an invalid transformation
    const invalidTransforms = {
      transformations: {
        'featuretools.entityset.EntitySet': {
          'function': 'non_existent_module.transform_func'
        }
      }
    };
    
    fs.writeFileSync(TRANSFORMS_FILE, JSON.stringify(invalidTransforms, null, 2));
    
    // Run the type generator with invalid transforms
    const cmd = `CUSTOM_TRANSFORMS_PATH=${TRANSFORMS_FILE} DEBUG=1 ` +
      `node scripts/generate-types.js --force --output ${OUTPUT_FILE}`;
    
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    
    // Check that the output file exists despite errors
    expect(fs.existsSync(OUTPUT_FILE)).toBe(true);
    
    // Verify that it logs an error about the transformation
    expect(output).toContain('Error applying transformation');
  });
}); 