/**
 * Tutorial 4: Advanced Configuration Options in Featuretools TypeScript
 * 
 * This tutorial covers:
 * - Configuring the Python bridge
 * - Custom type mappings
 * - Performance optimization settings
 * - Type generation options
 * - Validation configuration
 */

import FeatureTools from '../src';
import type { FeatureToolsConfig } from '../src/types/config';

/**
 * INTRODUCTION
 * 
 * The Featuretools TypeScript library offers extensive configuration options that allow you
 * to customize its behavior for your specific needs. This tutorial explores the various
 * configuration options available and how they affect library behavior.
 * 
 * Key configuration categories:
 * - Python bridge configuration: Control how TypeScript communicates with Python
 * - Type generation configuration: Customize how Python types are converted to TypeScript
 * - Type mapping configuration: Define custom mappings between Python and TypeScript types
 * - Validation configuration: Configure runtime validation behavior
 */

async function main() {
  console.log('=== Tutorial 4: Advanced Configuration Options ===');

  try {
    // Section 1: Basic Configuration
    console.log('\n=== Section 1: Basic Configuration ===');
    
    // Default configuration (no custom options)
    console.log('\nCreating FeatureTools with default configuration:');
    const defaultFt = new FeatureTools();
    await defaultFt.initialize();
    console.log('FeatureTools initialized with default configuration.');
    
    // Basic custom configuration
    console.log('\nCreating FeatureTools with basic custom configuration:');
    const basicConfig: FeatureToolsConfig = {
      python: {
        // Specify the Python executable path (if you have multiple versions)
        pythonPath: 'python',
        
        // Set a custom timeout for Python operations (in milliseconds)
        timeout: 60000 // 60 seconds
      }
    };
    
    const basicConfigFt = new FeatureTools({ config: basicConfig });
    await basicConfigFt.initialize();
    console.log('FeatureTools initialized with basic custom configuration.');
    
    // Clean up
    defaultFt.close();
    basicConfigFt.close();
    
    // Section 2: Type Generation Configuration
    console.log('\n=== Section 2: Type Generation Configuration ===');
    
    // Type generation configuration
    console.log('\nConfiguring type generation options:');
    const typeGenConfig: FeatureToolsConfig = {
      typeGeneration: {
        // Path to the Python script that generates types
        pythonScript: 'src/python/generate_types.py',
        
        // Output file for generated TypeScript types
        outputFile: 'src/types/generated.ts',
        
        // Python executable path
        pythonPath: 'python',
        
        // Enable verbose logging for debugging
        verbose: true,
        
        // Force regeneration even if types haven't changed
        force: false,
        
        // Cache file path
        cacheFile: '.types-cache.json'
      }
    };
    
    console.log('Type generation configuration example:');
    console.log(JSON.stringify(typeGenConfig.typeGeneration, null, 2));
    
    // Section 3: Type Mapping Configuration
    console.log('\n=== Section 3: Type Mapping Configuration ===');
    
    // Type mapping configuration
    console.log('\nConfiguring custom type mappings:');
    const typeMappingConfig: FeatureToolsConfig = {
      typeMapping: {
        // Custom mappings from Python types to TypeScript types
        typeMap: {
          'numpy.ndarray': 'number[][]',
          'pandas.DataFrame': 'Record<string, unknown>[]',
          'typing.Dict[str, Any]': 'Record<string, unknown>',
          'typing.List[str]': 'string[]',
          'typing.Optional[str]': 'string | null',
          'datetime.datetime': 'Date'
        },
        
        // Types to exclude from generation
        excludeTypes: [
          'numpy.float32',
          'internal.PrivateClass'
        ],
        
        // Types to always include (overrides excludeTypes)
        includeTypes: [
          'featuretools.EntitySet',
          'featuretools.Relationship'
        ]
      }
    };
    
    console.log('Type mapping configuration example:');
    console.log(JSON.stringify(typeMappingConfig.typeMapping, null, 2));
    
    // Section 4: Validation Configuration
    console.log('\n=== Section 4: Validation Configuration ===');
    
    // Validation configuration
    console.log('\nConfiguring runtime validation:');
    const validationConfig: FeatureToolsConfig = {
      validation: {
        // Enable runtime validation
        enabled: true,
        
        // Throw error on validation failure (false would just log warnings)
        throwOnError: true,
        
        // Log validation failures
        logErrors: true,
        
        // Types to exclude from validation
        excludeTypes: [
          'internal.ComplexType',
          'featuretools.LargeObject'
        ]
      }
    };
    
    console.log('Validation configuration example:');
    console.log(JSON.stringify(validationConfig.validation, null, 2));
    
    // Section 5: Combining Configurations
    console.log('\n=== Section 5: Combining Configurations ===');
    
    // Create a comprehensive configuration
    const fullConfig: FeatureToolsConfig = {
      python: {
        pythonPath: 'python',
        timeout: 45000
      },
      
      typeGeneration: {
        pythonScript: 'src/python/generate_types.py',
        outputFile: 'src/types/generated.ts',
        pythonPath: 'python',
        verbose: false,
        force: false,
        cacheFile: '.types-cache.json'
      },
      
      typeMapping: {
        typeMap: {
          'pandas.DataFrame': 'Record<string, unknown>[]',
          'numpy.ndarray': 'number[][]'
        }
      },
      
      validation: {
        enabled: true,
        throwOnError: true,
        logErrors: true
      }
    };
    
    console.log('Complete configuration example:');
    console.log(JSON.stringify(fullConfig, null, 2));
    
    // Initialize with complete config
    console.log('\nInitializing FeatureTools with complete configuration:');
    const configuredFt = new FeatureTools({ config: fullConfig });
    await configuredFt.initialize();
    console.log('FeatureTools initialized with complete custom configuration.');
    
    // Section 6: Real-world Configuration Example
    console.log('\n=== Section 6: Real-world Configuration Example ===');
    
    // Create a sample EntitySet to demonstrate the effect of configuration
    const entityset = await configuredFt.entitySet.create('config_demo');
    
    // Sample data
    const customers = [
      { customer_id: 1, name: 'Alice', age: 30 },
      { customer_id: 2, name: 'Bob', age: 45 }
    ];
    
    await configuredFt.entitySet.addEntity(entityset, {
      id: 'customers',
      df: customers,
      index: 'customer_id'
    });
    
    // Run a simple DFS operation
    const result = await configuredFt.dfs.dfs({
      entityset,
      target_entity: 'customers',
      max_depth: 1
    });
    
    console.log(`Generated ${result.feature_defs.length} features with custom configuration.`);
    
    // Clean up resources
    configuredFt.close();
    
    console.log('\n=== Tutorial completed successfully! ===');
    console.log('Next, check out 05-type-safety-features.ts to learn about type safety features.');
  } catch (error) {
    console.error('Error in tutorial:', error);
  }
}

// Execute the tutorial
main().catch(error => {
  console.error('Error in tutorial:', error);
  process.exit(1);
}); 