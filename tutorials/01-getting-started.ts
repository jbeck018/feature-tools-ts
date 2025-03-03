/**
 * Tutorial 1: Getting Started with Featuretools TypeScript
 * 
 * This tutorial covers:
 * - Installation and setup
 * - Initializing the library
 * - Basic concepts and terminology
 * - A simple end-to-end example
 */

import FeatureTools from '../src';
// Note: If you've installed the package via npm, use:
// import FeatureTools from 'featuretools-ts';

/**
 * INTRODUCTION
 * 
 * Featuretools TypeScript provides a type-safe bridge to the Python Featuretools library,
 * allowing you to perform automated feature engineering with the safety and convenience
 * of TypeScript's type system.
 * 
 * Core concepts:
 * - EntitySet: A collection of entities and their relationships
 * - Entity: A table-like data structure with rows and columns
 * - Relationship: Defines how entities are connected
 * - Deep Feature Synthesis (DFS): The algorithm that automatically creates features
 */

async function main() {
  console.log('=== Tutorial 1: Getting Started ===');

  // Step 1: Create an instance of FeatureTools
  console.log('\nStep 1: Create and initialize FeatureTools');
  console.log('------------------------------------------');
  const ft = new FeatureTools();
  
  // Step 2: Initialize the Python bridge
  // This starts the Python process and ensures communication is established
  console.log('\nInitializing Python bridge...');
  await ft.initialize();
  console.log('Python bridge initialized successfully.');
  
  // Step 3: Create a simple example with mock data
  console.log('\nStep 3: Creating a simple example');
  console.log('--------------------------------');
  
  // Create an EntitySet
  console.log('Creating an EntitySet...');
  const entitySetId = 'tutorial_entityset';
  const entitySet = await ft.entitySet.create(entitySetId);
  console.log(`EntitySet "${entitySetId}" created.`);
  
  // Create some sample data for customers
  const customerData = [
    { customerId: 1, signupDate: '2021-01-15', country: 'USA', age: 30 },
    { customerId: 2, signupDate: '2021-02-20', country: 'Canada', age: 25 },
    { customerId: 3, signupDate: '2021-03-10', country: 'UK', age: 35 }
  ];
  
  // Create some sample data for purchases
  const purchaseData = [
    { purchaseId: 1, customerId: 1, amount: 100, date: '2021-01-20' },
    { purchaseId: 2, customerId: 1, amount: 50, date: '2021-02-10' },
    { purchaseId: 3, customerId: 2, amount: 200, date: '2021-02-25' },
    { purchaseId: 4, customerId: 3, amount: 150, date: '2021-03-15' },
    { purchaseId: 5, customerId: 1, amount: 75, date: '2021-03-01' }
  ];
  
  // Add the entities to the EntitySet
  console.log('Adding entities to the EntitySet...');
  
  // Adding customers entity
  await ft.entitySet.addEntity(entitySet, {
    id: 'customers',
    df: customerData,
    index: 'customerId',
    time_index: 'signupDate'
  });
  
  // Adding purchases entity
  await ft.entitySet.addEntity(entitySet, {
    id: 'purchases',
    df: purchaseData,
    index: 'purchaseId',
    time_index: 'date'
  });
  
  console.log('Entities added successfully.');
  
  // Add a relationship between customers and purchases
  console.log('Adding relationship between entities...');
  await ft.entitySet.addRelationship(entitySet, {
    parent_entity: 'customers',
    parent_variable: 'customerId',
    child_entity: 'purchases',
    child_variable: 'customerId'
  });
  
  console.log('Relationship added successfully.');
  
  // Step 4: Run Deep Feature Synthesis
  console.log('\nStep 4: Running Deep Feature Synthesis');
  console.log('------------------------------------');
  
  const dfsResult = await ft.dfs.dfs({
    entityset: entitySet,
    target_entity: 'customers',
    agg_primitives: ['sum', 'mean', 'count'],
    trans_primitives: ['month', 'year'],
    max_depth: 1
  });
  
  console.log(`Generated ${dfsResult.feature_defs.length} features.`);
  console.log('\nFeature definitions:');
  for (const feature of dfsResult.feature_defs.slice(0, 5)) {
    console.log(`- ${feature.name} (${feature.type})`);
  }
  
  if (dfsResult.feature_defs.length > 5) {
    console.log(`... and ${dfsResult.feature_defs.length - 5} more features`);
  }
  
  console.log('\nFeature matrix (first row):');
  if (dfsResult.feature_matrix.length > 0) {
    const firstRow = dfsResult.feature_matrix[0];
    const truncatedRow = {};
    Object.keys(firstRow).slice(0, 5).forEach(key => {
      truncatedRow[key] = firstRow[key];
    });
    console.log(truncatedRow);
    
    if (Object.keys(firstRow).length > 5) {
      console.log(`... and ${Object.keys(firstRow).length - 5} more columns`);
    }
  }
  
  // Step 5: Clean up resources
  console.log('\nStep 5: Cleaning up');
  console.log('------------------');
  console.log('Closing the Python bridge...');
  ft.close();
  console.log('Python bridge closed.');
  
  console.log('\n=== Tutorial completed successfully! ===');
  console.log('Next, check out 02-creating-entitysets.ts to learn more about working with EntitySets.');
}

// Execute the tutorial
main().catch(error => {
  console.error('Error in tutorial:', error);
  process.exit(1);
}); 