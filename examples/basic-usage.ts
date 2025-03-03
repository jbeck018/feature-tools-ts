/**
 * Basic usage example for Featuretools TypeScript
 * 
 * This example demonstrates how to:
 * 1. Initialize the library
 * 2. Create an EntitySet
 * 3. Define entities and relationships
 * 4. Run Deep Feature Synthesis
 */
import FeatureTools from '../src';

async function main() {
  try {
    console.log('Initializing Featuretools...');
    const ft = new FeatureTools();
    await ft.initialize();
    
    // Create a new EntitySet
    console.log('Creating EntitySet...');
    const entityset = await ft.entitySet.create('customer_transactions');
    
    // Create a customers dataframe 
    // In a real app, you might load this from a database or CSV
    const customersData = [
      { customer_id: 1, signup_date: '2020-01-01', country: 'USA', age: 34 },
      { customer_id: 2, signup_date: '2020-01-15', country: 'Canada', age: 28 },
      { customer_id: 3, signup_date: '2020-02-01', country: 'UK', age: 45 },
    ];
    
    // Create a transactions dataframe
    const transactionsData = [
      { transaction_id: 1, customer_id: 1, amount: 100, date: '2020-01-05' },
      { transaction_id: 2, customer_id: 1, amount: 200, date: '2020-01-10' },
      { transaction_id: 3, customer_id: 2, amount: 50, date: '2020-01-20' },
      { transaction_id: 4, customer_id: 3, amount: 300, date: '2020-02-05' },
      { transaction_id: 5, customer_id: 1, amount: 150, date: '2020-02-10' },
    ];
    
    // Add entities to the EntitySet
    console.log('Adding entities...');
    await ft.entitySet.addEntity(entityset, {
      id: 'customers',
      df: customersData,
      index: 'customer_id',
      time_index: 'signup_date'
    });
    
    await ft.entitySet.addEntity(entityset, {
      id: 'transactions',
      df: transactionsData,
      index: 'transaction_id',
      time_index: 'date'
    });
    
    // Add relationship between entities
    console.log('Adding relationship...');
    await ft.entitySet.addRelationship(entityset, {
      parent_entity: 'customers',
      parent_variable: 'customer_id',
      child_entity: 'transactions',
      child_variable: 'customer_id'
    });
    
    // Run Deep Feature Synthesis
    console.log('Running DFS...');
    const result = await ft.dfs.dfs({
      entityset,
      target_entity: 'customers',
      agg_primitives: ['sum', 'mean', 'count'],
      trans_primitives: ['month', 'year'],
      max_depth: 2
    });
    
    // Output the results
    console.log('Feature matrix shape:', result.feature_matrix.length, 'rows');
    console.log('Number of features:', result.feature_defs.length);
    console.log('Features:', result.feature_defs.map(f => f.name));
    
    // Clean up when done
    ft.close();
    
    console.log('Example completed successfully!');
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
main().catch(console.error); 