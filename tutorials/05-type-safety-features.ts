/**
 * Tutorial 5: Type Safety Features in Featuretools TypeScript
 * 
 * This tutorial covers:
 * - Working with branded types for type safety
 * - Runtime validation techniques
 * - Utility types for better development experience
 * - Avoiding common type errors
 */

import FeatureTools from '../src';
import { 
  EntityId, 
  EntitySetId, 
  FeatureId, 
  VariableId, 
  RelationshipId,
  createEntityId,
  createEntitySetId,
  createFeatureId,
  createVariableId,
  createRelationshipId
} from '../src/types/branded';
import { 
  PartialDeep, 
  Properties, 
  PropertyNames,
  EntityNames,
  EntityType,
  RelationshipsByParent,
  RelationshipsByChild,
  ParentEntities,
  ChildEntities
} from '../src/types/utils';
import { validate, ValidationError } from '../src/utils/validation';

/**
 * INTRODUCTION
 * 
 * TypeScript offers powerful type checking capabilities that help catch errors at compile time.
 * Featuretools TypeScript enhances these capabilities with:
 * 
 * 1. Branded types - Special types that prevent accidental mixing of similar types (like IDs)
 * 2. Runtime validation - Verifying types at runtime when interacting with Python
 * 3. Utility types - Additional type helpers for working with Featuretools data
 * 
 * This tutorial demonstrates how to leverage these features for more robust code.
 */

async function main() {
  console.log('=== Tutorial 5: Type Safety Features ===');

  try {
    // Initialize FeatureTools
    const ft = new FeatureTools();
    await ft.initialize();

    // Section 1: Working with Branded Types
    console.log('\n=== Section 1: Working with Branded Types ===');
    
    console.log('\nBranded Types for IDs:');
    console.log('Branded types ensure that you cannot accidentally use the wrong type of ID.');
    
    // Creating branded types
    const entitySetId: EntitySetId = createEntitySetId('my_entity_set');
    const entityId: EntityId = createEntityId('customers');
    const variableId: VariableId = createVariableId('customer_id');
    const featureId: FeatureId = createFeatureId('customers.COUNT');
    const relationshipId: RelationshipId = createRelationshipId('customers_orders');
    
    console.log('Created branded IDs:');
    console.log(`- EntitySetId: ${entitySetId}`);
    console.log(`- EntityId: ${entityId}`);
    console.log(`- VariableId: ${variableId}`);
    console.log(`- FeatureId: ${featureId}`);
    console.log(`- RelationshipId: ${relationshipId}`);
    
    /**
     * TYPE SAFETY EXAMPLE 1: Preventing ID Type Mixing
     * 
     * The following code would cause a TypeScript compile error:
     * 
     * // Error: Type 'EntityId' is not assignable to type 'EntitySetId'
     * const wrongId: EntitySetId = entityId;
     * 
     * This prevents accidentally passing an entity ID where an entity set ID is expected.
     */
    
    // Create and use a proper EntitySet with branded types
    console.log('\nCreating EntitySet with branded types:');
    const entitySet = await ft.entitySet.create('branded_demo');
    
    console.log(`Created EntitySet with ID: ${entitySet.id}`);
    console.log('Type of entitySet.id:', 'EntitySetId (branded string)');
    
    // Add customers entity
    const customers = [
      { customer_id: 1, name: 'Alice', age: 30 },
      { customer_id: 2, name: 'Bob', age: 45 }
    ];
    
    // Add entity with branded ID
    await ft.entitySet.addEntity(entitySet, {
      id: createEntityId('customers'),
      df: customers,
      index: 'customer_id'
    });
    
    // Section 2: Runtime Validation
    console.log('\n=== Section 2: Runtime Validation ===');
    
    console.log('\nRuntime validation ensures type safety when interacting with Python:');
    
    // Example of using validate function
    function validateExample() {
      console.log('\nValidation Examples:');
      
      // Valid validation examples
      try {
        // Validate a number
        const validNumber = validate<number>(42, 'number');
        console.log('Validated number:', validNumber);
        
        // Validate an object
        const validObject = validate<{name: string, age: number}>(
          {name: 'Alice', age: 30}, 
          'object'
        );
        console.log('Validated object:', validObject);
        
        // Validate an array
        const validArray = validate<string[]>(
          ['apple', 'banana', 'orange'], 
          'array'
        );
        console.log('Validated array:', validArray);
      } catch (error) {
        if (error instanceof ValidationError) {
          console.error('Validation error:', error.message);
          console.error('Expected type:', error.expectedType);
          console.error('Actual value:', error.value);
        } else {
          console.error('Error:', error);
        }
      }
      
      // Invalid validation examples
      console.log('\nInvalid validation examples (will show errors):');
      
      try {
        // Type mismatch: string instead of number
        validate<number>('not a number', 'number');
      } catch (error) {
        if (error instanceof ValidationError) {
          console.error('Expected error caught: ', error.message);
        }
      }
      
      try {
        // Type mismatch: missing property in object
        validate<{name: string, age: number}>(
          {name: 'Bob'} as any, 
          'object'
        );
      } catch (error) {
        if (error instanceof ValidationError) {
          console.error('Expected error caught: ', error.message);
        }
      }
    }
    
    validateExample();
    
    // Section 3: Utility Types
    console.log('\n=== Section 3: Utility Types ===');
    
    console.log('\nUtility Types Examples:');
    
    // Example: PartialDeep
    type ComplexType = {
      id: string;
      data: {
        values: number[];
        metadata: {
          created: Date;
          author: string;
        };
      };
    };
    
    // PartialDeep allows deep optional properties
    const partialData: PartialDeep<ComplexType> = {
      id: 'test',
      data: {
        values: [1, 2, 3]
        // metadata is optional and can be omitted
      }
    };
    
    console.log('PartialDeep example (allows deeply nested optional properties):', partialData);
    
    // Example: Working with entity relationships using utility types
    console.log('\nEntity relationship utility types:');
    
    // Add orders entity and relationship
    const orders = [
      { order_id: 101, customer_id: 1, amount: 100 },
      { order_id: 102, customer_id: 2, amount: 200 }
    ];
    
    await ft.entitySet.addEntity(entitySet, {
      id: createEntityId('orders'),
      df: orders,
      index: 'order_id'
    });
    
    await ft.entitySet.addRelationship(entitySet, {
      parent_entity: createEntityId('customers'),
      parent_variable: createVariableId('customer_id'),
      child_entity: createEntityId('orders'),
      child_variable: createVariableId('customer_id')
    });
    
    // TypeScript helps understand entity relationships
    type MyEntityNames = EntityNames<typeof entitySet>;
    console.log('Entity names in entitySet:', '(EntityId branded strings)');
    
    // In actual code, this would help with relationship type checking:
    /**
     * TYPE SAFETY EXAMPLE 2: Entity Relationships
     * 
     * The following code would have TypeScript type safety:
     * 
     * type CustomerRelationships = RelationshipsByParent<typeof entitySet, 'customers'>;
     * type OrderRelationships = RelationshipsByChild<typeof entitySet, 'orders'>;
     * type CustomerParents = ParentEntities<typeof entitySet, 'customers'>;
     * type CustomerChildren = ChildEntities<typeof entitySet, 'customers'>;
     */
    
    // Section 4: Practical Type Safety
    console.log('\n=== Section 4: Practical Type Safety ===');
    
    console.log('\nPractical type safety with DFS:');
    
    // Run DFS with type safety
    const dfsResult = await ft.dfs.dfs({
      entityset: entitySet,
      target_entity: 'customers',
      max_depth: 1
    });
    
    console.log(`Generated ${dfsResult.feature_defs.length} features with type safety.`);
    
    // Use branded types with feature definitions
    if (dfsResult.feature_defs.length > 0) {
      console.log('\nFeature definition with branded types:');
      const firstFeature = dfsResult.feature_defs[0];
      
      // In a real application, you would convert this to a branded type
      const brandedFeature = {
        id: createFeatureId(firstFeature.name),
        name: firstFeature.name,
        entity: createEntityId(firstFeature.entity),
        type: firstFeature.type,
        base_features: firstFeature.base_features
      };
      
      console.log('Feature:', brandedFeature.name);
      console.log('Entity:', brandedFeature.entity);
      console.log('Type:', brandedFeature.type);
    }
    
    // Clean up
    ft.close();
    
    console.log('\n=== Tutorial completed successfully! ===');
    console.log('You now understand how to leverage TypeScript\'s type system in Featuretools!');
  } catch (error) {
    console.error('Error in tutorial:', error);
  }
}

// Execute the tutorial
main().catch(error => {
  console.error('Error in tutorial:', error);
  process.exit(1);
}); 