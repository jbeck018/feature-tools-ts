/**
 * @fileoverview Interactive examples for FeatureTools TypeScript documentation
 * 
 * This file contains interactive examples that demonstrate key concepts 
 * and usage patterns for the FeatureTools TypeScript API. These examples
 * are designed to be embedded in the documentation to provide an
 * interactive learning experience.
 */

import { FeatureTools } from '../src/index';
import type { EntitySet } from '../src/types';

/**
 * @example Basic FeatureTools Initialization
 * 
 * This example demonstrates how to initialize the FeatureTools client
 * and establish a connection to the Python backend.
 * 
 * ```typescript
 * import { FeatureTools } from 'featuretools-ts';
 * 
 * async function initializeFeatureTools() {
 *   // Initialize with default settings
 *   const ft = await FeatureTools.initialize();
 *   
 *   // Check if connection is successful
 *   console.log('FeatureTools initialized:', ft.isConnected());
 *   
 *   // Get version information
 *   const version = await ft.getVersion();
 *   console.log('FeatureTools version:', version);
 *   
 *   return ft;
 * }
 * 
 * // Run the example
 * initializeFeatureTools().catch(console.error);
 * ```
 */

/**
 * @example Creating an EntitySet
 * 
 * This example demonstrates how to create an EntitySet from data
 * and establish relationships between entities.
 * 
 * ```typescript
 * import { FeatureTools } from 'featuretools-ts';
 * 
 * async function createEntitySet() {
 *   const ft = await FeatureTools.initialize();
 *   
 *   // Sample data
 *   const customers = [
 *     { customer_id: 1, name: 'John', signup_date: '2021-01-01' },
 *     { customer_id: 2, name: 'Jane', signup_date: '2021-01-15' },
 *   ];
 *   
 *   const transactions = [
 *     { transaction_id: 1, customer_id: 1, amount: 100, date: '2021-01-05' },
 *     { transaction_id: 2, customer_id: 1, amount: 200, date: '2021-01-10' },
 *     { transaction_id: 3, customer_id: 2, amount: 150, date: '2021-01-20' },
 *   ];
 *   
 *   // Create EntitySet
 *   const es = await ft.createEntitySet('retail_data');
 *   
 *   // Add entities
 *   await es.addEntity(customers, 'customers', 'customer_id');
 *   await es.addEntity(transactions, 'transactions', 'transaction_id');
 *   
 *   // Add relationship
 *   await es.addRelationship('customers', 'customer_id', 'transactions', 'customer_id');
 *   
 *   // View EntitySet details
 *   console.log('EntitySet created:', await es.getInfo());
 *   
 *   return es;
 * }
 * 
 * // Run the example
 * createEntitySet().catch(console.error);
 * ```
 */

/**
 * @example Running Deep Feature Synthesis
 * 
 * This example demonstrates how to run Deep Feature Synthesis (DFS)
 * on an EntitySet to automatically generate features.
 * 
 * ```typescript
 * import { FeatureTools } from 'featuretools-ts';
 * 
 * async function runDFS() {
 *   const ft = await FeatureTools.initialize();
 *   
 *   // Assuming createEntitySet function from the previous example
 *   const es = await createEntitySet();
 *   
 *   // Run DFS
 *   const featureMatrix = await ft.dfs({
 *     entitySet: es,
 *     targetEntity: 'customers',
 *     agg_primitives: ['count', 'sum', 'mean'],
 *     trans_primitives: ['year', 'month'],
 *     maxDepth: 2
 *   });
 *   
 *   // Display generated feature matrix
 *   console.log('Generated features:', featureMatrix.features);
 *   console.log('Feature matrix:', featureMatrix.data);
 *   
 *   return featureMatrix;
 * }
 * 
 * // Run the example
 * runDFS().catch(console.error);
 * ```
 */

/**
 * @example Working with Branded Types
 * 
 * This example demonstrates how to use branded types for enhanced type safety
 * when working with entity identifiers and feature types.
 * 
 * ```typescript
 * import { FeatureTools } from 'featuretools-ts';
 * import type { BrandedType, EntityId, FeatureType } from 'featuretools-ts';
 * 
 * // Define branded types for our domain
 * type CustomerIdBrand = { readonly __brand: unique symbol };
 * type CustomerId = BrandedType<number, CustomerIdBrand>;
 * 
 * type TransactionIdBrand = { readonly __brand: unique symbol };
 * type TransactionId = BrandedType<number, TransactionIdBrand>;
 * 
 * // Type-safe function that only works with CustomerIds
 * function getCustomerDetails(id: CustomerId) {
 *   console.log(`Getting details for customer ${id}`);
 *   // Implementation would fetch customer data
 * }
 * 
 * async function demonstrateBrandedTypes() {
 *   const ft = await FeatureTools.initialize();
 *   
 *   // Creating branded values
 *   const customerId = 1 as CustomerId;
 *   
 *   // This works
 *   getCustomerDetails(customerId);
 *   
 *   // This would cause a TypeScript error:
 *   // const transactionId = 1 as TransactionId;
 *   // getCustomerDetails(transactionId); // Error: Argument of type 'TransactionId' is not assignable to parameter of type 'CustomerId'
 *   
 *   console.log('Type safety demonstrated successfully');
 * }
 * 
 * // Run the example
 * demonstrateBrandedTypes().catch(console.error);
 * ```
 */

/**
 * @example Interactive Type Hierarchy Diagram
 * 
 * The following Mermaid diagram shows the type hierarchy in FeatureTools TypeScript.
 * 
 * ```mermaid
 * classDiagram
 *   class FeatureTools {
 *     +initialize() Promise~FeatureTools~
 *     +createEntitySet(id) Promise~EntitySetAPI~
 *     +dfs(options) Promise~FeatureMatrix~
 *     +isConnected() boolean
 *   }
 *   
 *   class EntitySetAPI {
 *     +getInfo() Promise~EntitySetInfo~
 *     +addEntity(data, id, indexColumn) Promise~void~
 *     +addRelationship(parentId, parentColumn, childId, childColumn) Promise~void~
 *   }
 *   
 *   class DeepFeatureSynthesis {
 *     +run(options) Promise~FeatureMatrix~
 *   }
 *   
 *   class BrandedType~T, Brand~ {
 *     <<interface>>
 *   }
 *   
 *   class FeatureType {
 *     <<interface>>
 *   }
 *   
 *   class EntitySet {
 *     <<interface>>
 *   }
 *   
 *   FeatureTools ..> EntitySetAPI : creates
 *   FeatureTools ..> DeepFeatureSynthesis : uses
 *   EntitySetAPI ..> EntitySet : manages
 *   DeepFeatureSynthesis ..> FeatureType : generates
 * ```
 */

/**
 * @example Workflow Diagram
 * 
 * The following Mermaid diagram illustrates the workflow for generating features 
 * with FeatureTools TypeScript.
 * 
 * ```mermaid
 * flowchart TD
 *   A[Initialize FeatureTools] --> B[Create EntitySet]
 *   B --> C[Add Entities]
 *   C --> D[Define Relationships]
 *   D --> E[Run Deep Feature Synthesis]
 *   E --> F[Get Feature Matrix]
 *   F --> G[Use Generated Features]
 *   
 *   subgraph "TypeScript Client"
 *     A
 *     B
 *     C
 *     D
 *     E
 *     F
 *     G
 *   end
 *   
 *   A -.-> PY[Python Backend]
 *   E -.-> PY
 *   
 *   subgraph "Python Processing"
 *     PY
 *   end
 * ```
 */

/**
 * @example Entity Relationship Diagram
 * 
 * This Mermaid diagram shows a typical entity relationship model that can be 
 * represented in FeatureTools.
 * 
 * ```mermaid
 * erDiagram
 *   CUSTOMER ||--o{ TRANSACTION : makes
 *   CUSTOMER {
 *     int customer_id PK
 *     string name
 *     datetime signup_date
 *   }
 *   
 *   TRANSACTION {
 *     int transaction_id PK
 *     int customer_id FK
 *     float amount
 *     datetime date
 *   }
 *   
 *   PRODUCT ||--o{ TRANSACTION_PRODUCT : included_in
 *   TRANSACTION ||--o{ TRANSACTION_PRODUCT : contains
 *   
 *   PRODUCT {
 *     int product_id PK
 *     string name
 *     float price
 *     string category
 *   }
 *   
 *   TRANSACTION_PRODUCT {
 *     int transaction_id FK
 *     int product_id FK
 *     int quantity
 *   }
 * ```
 */

// Export a type definition for interactive examples
export interface InteractiveExample {
  title: string;
  description: string;
  code: string;
  diagram?: string;
}

// Export interactive examples for documentation
export const interactiveExamples: InteractiveExample[] = [
  {
    title: 'Basic FeatureTools Initialization',
    description: 'Initialize the FeatureTools client and establish a connection to the Python backend.',
    code: `
import { FeatureTools } from 'featuretools-ts';

async function initializeFeatureTools() {
  // Initialize with default settings
  const ft = await FeatureTools.initialize();
  
  // Check if connection is successful
  console.log('FeatureTools initialized:', ft.isConnected());
  
  // Get version information
  const version = await ft.getVersion();
  console.log('FeatureTools version:', version);
  
  return ft;
}

// Run the example
initializeFeatureTools().catch(console.error);
`
  },
  {
    title: 'Creating an EntitySet',
    description: 'Create an EntitySet from data and establish relationships between entities.',
    code: `
import { FeatureTools } from 'featuretools-ts';

async function createEntitySet() {
  const ft = await FeatureTools.initialize();
  
  // Sample data
  const customers = [
    { customer_id: 1, name: 'John', signup_date: '2021-01-01' },
    { customer_id: 2, name: 'Jane', signup_date: '2021-01-15' },
  ];
  
  const transactions = [
    { transaction_id: 1, customer_id: 1, amount: 100, date: '2021-01-05' },
    { transaction_id: 2, customer_id: 1, amount: 200, date: '2021-01-10' },
    { transaction_id: 3, customer_id: 2, amount: 150, date: '2021-01-20' },
  ];
  
  // Create EntitySet
  const es = await ft.createEntitySet('retail_data');
  
  // Add entities
  await es.addEntity(customers, 'customers', 'customer_id');
  await es.addEntity(transactions, 'transactions', 'transaction_id');
  
  // Add relationship
  await es.addRelationship('customers', 'customer_id', 'transactions', 'customer_id');
  
  // View EntitySet details
  console.log('EntitySet created:', await es.getInfo());
  
  return es;
}

// Run the example
createEntitySet().catch(console.error);
`
  },
  {
    title: 'Running Deep Feature Synthesis',
    description: 'Run Deep Feature Synthesis (DFS) on an EntitySet to automatically generate features.',
    code: `
import { FeatureTools } from 'featuretools-ts';

async function runDFS() {
  const ft = await FeatureTools.initialize();
  
  // Create EntitySet (simplified for example)
  const es = await ft.createEntitySet('retail_data');
  // ... add entities and relationships
  
  // Run DFS
  const featureMatrix = await ft.dfs({
    entitySet: es,
    targetEntity: 'customers',
    agg_primitives: ['count', 'sum', 'mean'],
    trans_primitives: ['year', 'month'],
    maxDepth: 2
  });
  
  // Display generated feature matrix
  console.log('Generated features:', featureMatrix.features);
  console.log('Feature matrix:', featureMatrix.data);
  
  return featureMatrix;
}

// Run the example
runDFS().catch(console.error);
`
  },
  {
    title: 'Type Hierarchy Diagram',
    description: 'Visual representation of the core types in FeatureTools TypeScript',
    code: `
// TypeScript code for demonstrating type hierarchy
import { FeatureTools } from 'featuretools-ts';

// This is just a placeholder. The diagram is rendered using Mermaid.js
console.log('Type hierarchy visualization via Mermaid diagram');
`,
    diagram: `
classDiagram
  class FeatureTools {
    +initialize() Promise~FeatureTools~
    +createEntitySet(id) Promise~EntitySetAPI~
    +dfs(options) Promise~FeatureMatrix~
    +isConnected() boolean
  }
  
  class EntitySetAPI {
    +getInfo() Promise~EntitySetInfo~
    +addEntity(data, id, indexColumn) Promise~void~
    +addRelationship(parentId, parentColumn, childId, childColumn) Promise~void~
  }
  
  class DeepFeatureSynthesis {
    +run(options) Promise~FeatureMatrix~
  }
  
  class BrandedType~T, Brand~ {
    <<interface>>
  }
  
  class FeatureType {
    <<interface>>
  }
  
  class EntitySet {
    <<interface>>
  }
  
  FeatureTools ..> EntitySetAPI : creates
  FeatureTools ..> DeepFeatureSynthesis : uses
  EntitySetAPI ..> EntitySet : manages
  DeepFeatureSynthesis ..> FeatureType : generates
`
  },
  {
    title: 'Feature Generation Workflow',
    description: 'The process flow for generating features with FeatureTools',
    code: `
// TypeScript code for demonstrating workflow
import { FeatureTools } from 'featuretools-ts';

// This is just a placeholder. The workflow is visualized using Mermaid.js
async function workflowDemo() {
  const ft = await FeatureTools.initialize();
  console.log('Feature generation workflow visualization via Mermaid diagram');
}

workflowDemo().catch(console.error);
`,
    diagram: `
flowchart TD
  A[Initialize FeatureTools] --> B[Create EntitySet]
  B --> C[Add Entities]
  C --> D[Define Relationships]
  D --> E[Run Deep Feature Synthesis]
  E --> F[Get Feature Matrix]
  F --> G[Use Generated Features]
  
  subgraph "TypeScript Client"
    A
    B
    C
    D
    E
    F
    G
  end
  
  A -.-> PY[Python Backend]
  E -.-> PY
  
  subgraph "Python Processing"
    PY
  end
`
  }
]; 