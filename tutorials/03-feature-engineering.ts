/**
 * Tutorial 3: Feature Engineering with Deep Feature Synthesis
 * 
 * This tutorial covers:
 * - Understanding Deep Feature Synthesis (DFS)
 * - Configuring primitives for feature generation
 * - Controlling feature depth and complexity
 * - Analyzing and using the generated features
 * - Runtime type validation
 */

import FeatureTools from '../src';

/**
 * INTRODUCTION
 * 
 * Deep Feature Synthesis (DFS) is the core algorithm in Featuretools that
 * automatically creates features from relational data. It works by traversing
 * the relationships in an EntitySet and applying primitive operations to generate
 * new features.
 * 
 * There are two main types of primitives:
 * - Aggregation primitives: Applied across relationships (e.g., mean, sum, count)
 * - Transform primitives: Applied to individual variables (e.g., year, month, day)
 * 
 * In this tutorial, we'll explore how to configure and run DFS effectively.
 */

async function main() {
  console.log('=== Tutorial 3: Feature Engineering with DFS ===');

  // Create a FeatureTools instance and initialize
  const ft = new FeatureTools();
  await ft.initialize();

  try {
    // Set up an EntitySet with sample data
    console.log('\nSetting up sample data...');
    
    // Create the EntitySet
    const entityset = await ft.entitySet.create('retail_data');
    
    // Sample data: Customers
    const customers = [
      { customer_id: 1, name: 'Alice', signup_date: '2022-01-01', region: 'North', age: 32 },
      { customer_id: 2, name: 'Bob', signup_date: '2022-01-15', region: 'South', age: 45 },
      { customer_id: 3, name: 'Charlie', signup_date: '2022-02-01', region: 'East', age: 27 },
      { customer_id: 4, name: 'Diana', signup_date: '2022-02-15', region: 'West', age: 38 },
      { customer_id: 5, name: 'Eva', signup_date: '2022-03-01', region: 'North', age: 51 }
    ];
    
    // Sample data: Orders
    const orders = [
      { order_id: 101, customer_id: 1, order_date: '2022-01-10', total: 99.99 },
      { order_id: 102, customer_id: 1, order_date: '2022-02-20', total: 149.99 },
      { order_id: 103, customer_id: 2, order_date: '2022-01-25', total: 199.99 },
      { order_id: 104, customer_id: 2, order_date: '2022-03-05', total: 49.99 },
      { order_id: 105, customer_id: 3, order_date: '2022-02-10', total: 299.99 },
      { order_id: 106, customer_id: 3, order_date: '2022-03-15', total: 99.99 },
      { order_id: 107, customer_id: 4, order_date: '2022-03-01', total: 149.99 },
      { order_id: 108, customer_id: 5, order_date: '2022-03-10', total: 79.99 }
    ];
    
    // Sample data: Products
    const products = [
      { product_id: 201, name: 'Laptop', category: 'Electronics', price: 1299.99 },
      { product_id: 202, name: 'Phone', category: 'Electronics', price: 899.99 },
      { product_id: 203, name: 'Headphones', category: 'Audio', price: 199.99 },
      { product_id: 204, name: 'Camera', category: 'Electronics', price: 599.99 },
      { product_id: 205, name: 'Speaker', category: 'Audio', price: 149.99 }
    ];
    
    // Sample data: Order Items (linking orders and products)
    const orderItems = [
      { item_id: 1001, order_id: 101, product_id: 201, quantity: 1, price: 1299.99 },
      { item_id: 1002, order_id: 102, product_id: 203, quantity: 1, price: 199.99 },
      { item_id: 1003, order_id: 103, product_id: 202, quantity: 1, price: 899.99 },
      { item_id: 1004, order_id: 103, product_id: 203, quantity: 1, price: 199.99 },
      { item_id: 1005, order_id: 104, product_id: 205, quantity: 1, price: 149.99 },
      { item_id: 1006, order_id: 105, product_id: 201, quantity: 1, price: 1299.99 },
      { item_id: 1007, order_id: 105, product_id: 203, quantity: 1, price: 199.99 },
      { item_id: 1008, order_id: 106, product_id: 204, quantity: 1, price: 599.99 },
      { item_id: 1009, order_id: 107, product_id: 202, quantity: 1, price: 899.99 },
      { item_id: 1010, order_id: 108, product_id: 205, quantity: 1, price: 149.99 }
    ];
    
    // Add entities to the EntitySet
    await ft.entitySet.addEntity(entityset, {
      id: 'customers',
      df: customers,
      index: 'customer_id',
      time_index: 'signup_date'
    });
    
    await ft.entitySet.addEntity(entityset, {
      id: 'orders',
      df: orders,
      index: 'order_id',
      time_index: 'order_date'
    });
    
    await ft.entitySet.addEntity(entityset, {
      id: 'products',
      df: products,
      index: 'product_id'
    });
    
    await ft.entitySet.addEntity(entityset, {
      id: 'order_items',
      df: orderItems,
      index: 'item_id'
    });
    
    // Add relationships to the EntitySet
    await ft.entitySet.addRelationship(entityset, {
      parent_entity: 'customers',
      parent_variable: 'customer_id',
      child_entity: 'orders',
      child_variable: 'customer_id'
    });
    
    await ft.entitySet.addRelationship(entityset, {
      parent_entity: 'orders',
      parent_variable: 'order_id',
      child_entity: 'order_items',
      child_variable: 'order_id'
    });
    
    await ft.entitySet.addRelationship(entityset, {
      parent_entity: 'products',
      parent_variable: 'product_id',
      child_entity: 'order_items',
      child_variable: 'product_id'
    });
    
    console.log('EntitySet created successfully with sample retail data.');
    
    // Section 1: Basic DFS Usage
    console.log('\n=== Section 1: Basic DFS Usage ===');
    
    console.log('\nRunning DFS with default settings:');
    const basicResult = await ft.dfs.dfs({
      entityset,
      target_entity: 'customers',
      max_depth: 2
    });
    
    console.log(`Generated ${basicResult.feature_defs.length} features.`);
    console.log('Sample feature names:');
    for (const feature of basicResult.feature_defs.slice(0, 5)) {
      console.log(`- ${feature.name}`);
    }
    
    // Section 2: Configuring Aggregation Primitives
    console.log('\n=== Section 2: Configuring Aggregation Primitives ===');
    
    console.log('\nRunning DFS with specific aggregation primitives:');
    const aggResult = await ft.dfs.dfs({
      entityset,
      target_entity: 'customers',
      agg_primitives: ['mean', 'sum', 'count', 'max', 'min', 'std'],
      max_depth: 2
    });
    
    console.log(`Generated ${aggResult.feature_defs.length} features.`);
    console.log('Sample aggregation features:');
    const aggFeatures = aggResult.feature_defs.filter(f => 
      f.name.includes('MEAN') || 
      f.name.includes('SUM') || 
      f.name.includes('COUNT') ||
      f.name.includes('MAX') ||
      f.name.includes('MIN') ||
      f.name.includes('STD')
    ).slice(0, 5);
    
    for (const feature of aggFeatures) {
      console.log(`- ${feature.name}`);
    }
    
    // Section 3: Configuring Transform Primitives
    console.log('\n=== Section 3: Configuring Transform Primitives ===');
    
    console.log('\nRunning DFS with specific transform primitives:');
    const transResult = await ft.dfs.dfs({
      entityset,
      target_entity: 'customers',
      trans_primitives: ['year', 'month', 'week', 'day', 'hour'],
      max_depth: 1
    });
    
    console.log(`Generated ${transResult.feature_defs.length} features.`);
    console.log('Sample transform features:');
    const transFeatures = transResult.feature_defs.filter(f => 
      f.name.includes('YEAR') || 
      f.name.includes('MONTH') || 
      f.name.includes('WEEK') ||
      f.name.includes('DAY') ||
      f.name.includes('HOUR')
    ).slice(0, 5);
    
    for (const feature of transFeatures) {
      console.log(`- ${feature.name}`);
    }
    
    // Section 4: Controlling Feature Depth
    console.log('\n=== Section 4: Controlling Feature Depth ===');
    
    // Compare different depths
    const depths = [1, 2];
    for (const depth of depths) {
      console.log(`\nRunning DFS with max_depth = ${depth}:`);
      const depthResult = await ft.dfs.dfs({
        entityset,
        target_entity: 'customers',
        agg_primitives: ['mean', 'sum', 'count'],
        trans_primitives: ['year', 'month'],
        max_depth: depth
      });
      
      console.log(`Generated ${depthResult.feature_defs.length} features.`);
      
      // Count features at each depth level
      const depthCounts = {};
      for (const feature of depthResult.feature_defs) {
        // Base features are null for primitive features
        const featureDepth = feature.base_features ? 
          (feature.base_features.length === 0 ? 1 : feature.base_features.length) : 0;
        
        if (!depthCounts[featureDepth]) {
          depthCounts[featureDepth] = 0;
        }
        depthCounts[featureDepth]++;
      }
      
      console.log('Feature count by complexity level:');
      Object.keys(depthCounts).sort().forEach(d => {
        console.log(`- Level ${d}: ${depthCounts[d]} features`);
      });
    }
    
    // Section 5: Advanced DFS Options
    console.log('\n=== Section 5: Advanced DFS Options ===');
    
    console.log('\nRunning DFS with filtering options:');
    const filteredResult = await ft.dfs.dfs({
      entityset,
      target_entity: 'customers',
      agg_primitives: ['mean', 'sum', 'count'],
      trans_primitives: ['year', 'month'],
      max_depth: 2,
      // Filter out features containing these strings
      drop_contains: ['item_id', 'order_id'],
      // Only include numeric features
      return_variable_types: ['numeric']
    });
    
    console.log(`Generated ${filteredResult.feature_defs.length} filtered features.`);
    
    // Section 6: Using the Feature Matrix
    console.log('\n=== Section 6: Using the Feature Matrix ===');
    
    // Generate a feature matrix for all customers
    const featureMatrix = await ft.dfs.dfs({
      entityset,
      target_entity: 'customers',
      agg_primitives: ['mean', 'sum', 'count'],
      trans_primitives: ['year', 'month'],
      max_depth: 2,
      // Get just the feature definitions
      features_only: false
    });
    
    console.log(`Feature matrix shape: ${featureMatrix.feature_matrix.length} rows × ${featureMatrix.feature_defs.length} columns`);
    
    if (featureMatrix.feature_matrix.length > 0) {
      console.log('\nSample feature values for first customer:');
      const firstRow = featureMatrix.feature_matrix[0];
      const featureNames = featureMatrix.feature_defs.map(f => f.name);
      
      // Display a few sample values
      for (let i = 0; i < Math.min(5, featureNames.length); i++) {
        const name = featureNames[i];
        console.log(`- ${name}: ${firstRow[name] === undefined ? 'undefined' : firstRow[name]}`);
      }
    }
    
    console.log('\n=== Tutorial completed successfully! ===');
    console.log('Next, check out 04-advanced-configuration.ts to learn about advanced configuration options.');
  } finally {
    // Clean up resources
    ft.close();
  }
}

// Execute the tutorial
main().catch(error => {
  console.error('Error in tutorial:', error);
  process.exit(1);
}); 