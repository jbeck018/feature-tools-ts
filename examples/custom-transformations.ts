/**
 * Custom Type Transformations Example
 * 
 * This example demonstrates how to use custom type transformations
 * to modify the TypeScript types generated from Python types.
 */

import type { FeatureToolsConfig, TransformationDefinition } from '../src/types/config';

/**
 * Example 1: Simple type transformation
 * 
 * This transformation adds a branded type for EntitySet IDs
 */
const brandedEntitySetId: TransformationDefinition = {
  sourceType: 'featuretools.entityset.EntitySet.id',
  description: 'Creates a branded type for EntitySet IDs',
  transform: (baseType: string) => {
    return 'string & { readonly __entitySetId: unique symbol }';
  }
};

/**
 * Example 2: Type transformation with generics
 * 
 * This transformation enhances the DataFrame type with additional type safety
 */
const enhancedDataFrame: TransformationDefinition = {
  sourceType: 'pandas.core.frame.DataFrame',
  description: 'Enhances DataFrame with column typing',
  transform: (baseType: string) => {
    return 'DataFrame<Record<string, unknown>>';
  },
  applyToSubtypes: true
};

/**
 * Example 3: Utility transformation for feature objects
 */
const featureTransformation: TransformationDefinition = {
  sourceType: 'featuretools.feature_base.feature_base.FeatureBase',
  description: 'Adds utility methods to feature objects',
  transform: (baseType: string) => {
    return `${baseType} & { 
      getOutputType(): string;
      isValid(): boolean;
      getEntityName(): string;
    }`;
  }
};

/**
 * Example configuration file with custom transformations
 */
const config: FeatureToolsConfig = {
  typeMapping: {
    typeMap: {
      // Basic type mappings
      'numpy.int64': 'number',
      'numpy.float64': 'number',
      'pandas.Timestamp': 'Date'
    },
    
    // Custom transformations
    transformations: {
      'featuretools.entityset.EntitySet.id': brandedEntitySetId.transform,
      'pandas.core.frame.DataFrame': enhancedDataFrame.transform,
      'featuretools.feature_base.feature_base.FeatureBase': featureTransformation.transform
    },
    
    // Exclude certain internal types
    excludeTypes: [
      'featuretools.utils.*',
      'featuretools.tests.*'
    ]
  },
  
  // Type generation settings
  typeGeneration: {
    verbose: true,
    force: false
  }
};

/**
 * Usage:
 * 
 * 1. Save the transformations to a JSON file
 * ```
 * const fs = require('fs');
 * fs.writeFileSync('custom-transforms.json', JSON.stringify({
 *   transformations: {
 *     'featuretools.entityset.EntitySet.id': 'string & { readonly __entitySetId: unique symbol }',
 *     'pandas.core.frame.DataFrame': 'DataFrame<Record<string, unknown>>'
 *   }
 * }, null, 2));
 * ```
 * 
 * 2. Set the environment variable for the Python script
 * ```
 * export CUSTOM_TRANSFORMS_PATH=./custom-transforms.json
 * ```
 * 
 * 3. Run the type generation
 * ```
 * npm run generate-types
 * ```
 */

export default config; 