/**
 * Tutorial 2: Working with EntitySets in Featuretools TypeScript
 * 
 * This tutorial covers:
 * - Creating EntitySets with various options
 * - Adding and updating entities
 * - Working with relationships
 * - Managing EntitySet metadata
 * - Using the type-safe APIs
 */

import FeatureTools from '../src';
import { EntityId, createEntityId, EntitySetId, createEntitySetId } from '../src/types/branded';

/**
 * INTRODUCTION
 * 
 * EntitySets are the core data structures in Featuretools. They represent collections
 * of entities (tables) and the relationships between them. Understanding how to create
 * and manipulate EntitySets is essential for effective feature engineering.
 * 
 * In this tutorial, we'll explore the EntitySet API in depth, along with the type
 * safety features provided by the TypeScript library.
 */

async function main() {
  console.log('=== Tutorial 2: Working with EntitySets ===');

  // Create a FeatureTools instance and initialize
  const ft = new FeatureTools();
  await ft.initialize();

  try {
    // Section 1: Creating EntitySets
    console.log('\n=== Section 1: Creating EntitySets ===');
    
    // Basic creation
    console.log('\nCreating a basic EntitySet:');
    const simpleEntitySet = await ft.entitySet.create('simple_entityset');
    console.log(`Created EntitySet with ID: ${simpleEntitySet.id}`);
    
    // Type-safe ID access - the ID is a branded type for type safety
    const entitySetId = simpleEntitySet.id;
    console.log(`The ID's underlying type is string, but with type branding: ${typeof entitySetId}`);
    
    // Creating with a predefined ID using the branded type
    const customId = createEntitySetId('custom_entityset');
    const customEntitySet = await ft.entitySet.create(customId);
    console.log(`Created EntitySet with custom ID: ${customId}`);
    
    // Section 2: Adding Entities
    console.log('\n=== Section 2: Adding Entities ===');
    
    // Create sample data
    const customerData = [
      { customer_id: 1, name: 'Alice', signup_date: '2022-01-15', age: 34 },
      { customer_id: 2, name: 'Bob', signup_date: '2022-02-10', age: 42 },
      { customer_id: 3, name: 'Charlie', signup_date: '2022-03-05', age: 28 }
    ];
    
    const orderData = [
      { order_id: 101, customer_id: 1, amount: 99.99, order_date: '2022-01-20' },
      { order_id: 102, customer_id: 1, amount: 49.99, order_date: '2022-02-15' },
      { order_id: 103, customer_id: 2, amount: 149.99, order_date: '2022-02-18' },
      { order_id: 104, customer_id: 3, amount: 199.99, order_date: '2022-03-10' },
      { order_id: 105, customer_id: 1, amount: 29.99, order_date: '2022-03-15' }
    ];
    
    // Add an entity with minimal configuration
    console.log('\nAdding basic entity:');
    await ft.entitySet.addEntity(customEntitySet, {
      id: 'customers',
      df: customerData,
      index: 'customer_id'
    });
    
    // Add an entity with more configuration options
    console.log('\nAdding entity with more options:');
    await ft.entitySet.addEntity(customEntitySet, {
      id: 'orders',
      df: orderData,
      index: 'order_id',
      time_index: 'order_date',  // Specify a time index for time-based analysis
      variable_types: {
        // Optional: specify explicit variable types
        'amount': 'numeric'
      }
    });
    
    console.log('Entities added successfully.');
    
    // Section 3: Working with Relationships
    console.log('\n=== Section 3: Working with Relationships ===');
    
    // Add a relationship
    console.log('\nAdding a relationship:');
    await ft.entitySet.addRelationship(customEntitySet, {
      parent_entity: 'customers',
      parent_variable: 'customer_id',
      child_entity: 'orders',
      child_variable: 'customer_id'
    });
    
    // Get entity info
    console.log('\nEntity information:');
    const entities = await ft.entitySet.getEntities(customEntitySet);
    console.log(`Number of entities: ${Object.keys(entities).length}`);
    console.log('Entity IDs:', Object.keys(entities));
    
    // Get relationship info
    console.log('\nRelationship information:');
    const relationships = await ft.entitySet.getRelationships(customEntitySet);
    console.log(`Number of relationships: ${relationships.length}`);
    if (relationships.length > 0) {
      console.log(`First relationship: ${relationships[0].parent_entity} -> ${relationships[0].child_entity}`);
    }
    
    // Section 4: Exploring and Manipulating EntitySets
    console.log('\n=== Section 4: Exploring and Manipulating EntitySets ===');
    
    // Get EntitySet info
    console.log('\nEntitySet info:');
    const esInfo = await ft.entitySet.getInfo(customEntitySet);
    console.log(`EntitySet ID: ${esInfo.id}`);
    console.log(`Number of entities: ${Object.keys(esInfo.entities).length}`);
    console.log(`Number of relationships: ${esInfo.relationships.length}`);
    
    // Checking if an entity exists
    const hasCustomers = await ft.entitySet.hasEntity(customEntitySet, 'customers');
    console.log(`Has 'customers' entity: ${hasCustomers}`);
    
    // Type-safe entity ID use
    const customersId = createEntityId('customers');
    const customerEntity = esInfo.entities[customersId];
    console.log(`Customer entity index: ${customerEntity ? customerEntity.index : 'not found'}`);
    
    // Section 5: Advanced EntitySet Operations
    console.log('\n=== Section 5: Advanced EntitySet Operations ===');
    
    // Create a deep copy of an EntitySet
    console.log('\nCreating a copy of the EntitySet:');
    const copiedEntitySet = await ft.entitySet.copy(customEntitySet, 'copied_entityset');
    console.log(`Created copy with ID: ${copiedEntitySet.id}`);
    
    // Add a new entity to the copied EntitySet
    const productData = [
      { product_id: 201, name: 'Laptop', category: 'Electronics', price: 1299.99 },
      { product_id: 202, name: 'Smartphone', category: 'Electronics', price: 899.99 },
      { product_id: 203, name: 'Headphones', category: 'Audio', price: 349.99 }
    ];
    
    await ft.entitySet.addEntity(copiedEntitySet, {
      id: 'products',
      df: productData,
      index: 'product_id'
    });
    
    // Add order_items to link orders and products
    const orderItemsData = [
      { item_id: 1001, order_id: 101, product_id: 201, quantity: 1 },
      { item_id: 1002, order_id: 102, product_id: 203, quantity: 1 },
      { item_id: 1003, order_id: 103, product_id: 202, quantity: 1 },
      { item_id: 1004, order_id: 104, product_id: 201, quantity: 1 },
      { item_id: 1005, order_id: 105, product_id: 203, quantity: 2 }
    ];
    
    await ft.entitySet.addEntity(copiedEntitySet, {
      id: 'order_items',
      df: orderItemsData,
      index: 'item_id'
    });
    
    // Add relationships for order_items
    await ft.entitySet.addRelationship(copiedEntitySet, {
      parent_entity: 'orders',
      parent_variable: 'order_id',
      child_entity: 'order_items',
      child_variable: 'order_id'
    });
    
    await ft.entitySet.addRelationship(copiedEntitySet, {
      parent_entity: 'products',
      parent_variable: 'product_id',
      child_entity: 'order_items',
      child_variable: 'product_id'
    });
    
    console.log('Added new entities and relationships to the copied EntitySet.');
    
    // Get info about the updated EntitySet
    const updatedEsInfo = await ft.entitySet.getInfo(copiedEntitySet);
    console.log(`Updated EntitySet has ${Object.keys(updatedEsInfo.entities).length} entities and ${updatedEsInfo.relationships.length} relationships.`);
    
    // Normalize the EntitySet - important for feature engineering
    console.log('\nNormalizing the EntitySet:');
    await ft.entitySet.normalize(copiedEntitySet);
    console.log('EntitySet normalized successfully.');

    console.log('\n=== Tutorial completed successfully! ===');
    console.log('Next, check out 03-feature-engineering.ts to learn about Deep Feature Synthesis.');
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