/**
 * @packageDocumentation
 * @module featuretools-ts
 * 
 * # Featuretools TypeScript API
 * 
 * This is the API reference for the TypeScript bridge to Featuretools Python package.
 * The library provides type-safe access to Featuretools functionality.
 * 
 * ## Key Components
 * 
 * The library is organized around the following key components:
 * 
 * - {@link FeatureTools} - The main class for interacting with Featuretools
 * - {@link FeatureToolsBridge} - Low-level bridge for communicating with Python
 * - {@link EntitySetAPI} - API for working with EntitySets
 * - {@link DeepFeatureSynthesis} - API for performing Deep Feature Synthesis
 * 
 * ## Type System
 * 
 * The library provides a comprehensive type system:
 * 
 * - Generated TypeScript interfaces from Python types
 * - Branded types for enhanced type safety
 * - Runtime validation for Python return values
 * 
 * ## Basic Usage
 * 
 * ```typescript
 * import FeatureTools from 'featuretools-ts';
 * 
 * async function example() {
 *   // Initialize FeatureTools
 *   const ft = new FeatureTools();
 *   await ft.initialize();
 *   
 *   // Create an EntitySet
 *   const entityset = await ft.entitySet.create('my_entityset');
 *   
 *   // Add entities and relationships
 *   // ...
 *   
 *   // Run Deep Feature Synthesis
 *   const result = await ft.dfs.dfs({
 *     entityset,
 *     target_entity: 'target',
 *     // ...
 *   });
 *   
 *   // Clean up when done
 *   ft.close();
 * }
 * ```
 * 
 * ## Type Safety with Branded Types
 * 
 * ```typescript
 * import { createEntityId, EntityId } from 'featuretools-ts';
 * 
 * // Type-safe way to reference entities
 * const customerId: EntityId = createEntityId('customers');
 * ```
 * 
 * ## Advanced Configuration
 * 
 * ```typescript
 * import FeatureTools, { FeatureToolsConfig } from 'featuretools-ts';
 * 
 * const config: FeatureToolsConfig = {
 *   python: {
 *     pythonPath: '/usr/bin/python3',
 *     timeout: 60000
 *   },
 *   validation: {
 *     enabled: true,
 *     throwOnError: true
 *   }
 * };
 * 
 * const ft = new FeatureTools({ config });
 * ```
 */

// Re-export key components for documentation
export * from './index'; 