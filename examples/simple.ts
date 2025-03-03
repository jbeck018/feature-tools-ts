import FeatureTools from 'featuretools-ts';

async function main() {
  // Create a new instance
  const ft = new FeatureTools();
  
  // Initialize bridge
  await ft.initialize();
  
  try {
    // Create an EntitySet
    const es = await ft.entitySet.create('my_entityset');
    
    // Add entities and relationships
    // (data would come from your application)
    const updatedEs = await ft.entitySet.addEntity(es, {
      id: 'customers',
      df: { /* customer data */ },
      index: 'customer_id'
    });
    
    // Perform DFS
    const result = await ft.dfs({
      entityset: updatedEs,
      target_entity: 'customers',
      agg_primitives: ['mean', 'sum', 'count'],
      trans_primitives: ['year', 'month', 'day'],
      max_depth: 2
    });
    
    console.log('Generated features:', result.feature_defs);
    console.log('Feature matrix shape:', 
      [result.feature_matrix.length, Object.keys(result.feature_matrix[0]).length]);
    
  } finally {
    // Close the bridge
    ft.close();
  }
}

main().catch(console.error); 