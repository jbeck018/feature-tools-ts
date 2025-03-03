/**
 * TypeScript 4.9+ Features Example
 * 
 * This example demonstrates how to use the TypeScript 4.9+ features
 * implemented in the Featuretools TypeScript bridge.
 */

// Import the utility types from ts-features
import { hasProperty } from '../src/types/ts-features';
import type { 
  PreferType,
  FeaturePath,
  Satisfies 
} from '../src/types/ts-features';

// Define sample types to demonstrate with
interface FeatureDefinition {
  name: string;
  entity: string;
  type: string;
  base_features?: FeatureDefinition[];
}

interface Entity {
  id: string;
  df: unknown[];
  index: string;
  time_index?: string;
}

interface EntitySet {
  id: string;
  entities: Record<string, Entity>;
}

// Example enum similar to what would be generated
enum FeatureType {
  Numeric = "numeric",
  Categorical = "categorical",
  Datetime = "datetime",
  Boolean = "boolean",
  Text = "text",
  Unknown = "unknown"
}

// Example 1: Using the satisfies operator
// -----------------------------------------

// Define a feature with the satisfies operator
const ageFeature = {
  name: "customer_age",
  entity: "customers",
  type: "numeric"
} satisfies FeatureDefinition;

// The type is still inferred as the object literal type
// but validated against FeatureDefinition
console.log(`Feature name: ${ageFeature.name}`);

// You can still access the literal type
const featureType = ageFeature.type; // Type is "numeric" (literal), not string

// Example 2: Using PreferType for better union handling
// -----------------------------------------------------

// Function returning PreferType<string, null> for better inference
function getEntityName(entity?: Entity): PreferType<string, null> {
  return entity?.id || null;
}

const entityId = getEntityName({ id: "customers", df: [], index: "id" });
// entityId is inferred as string instead of string | null
if (entityId) {
  console.log(`Entity ID: ${entityId.toUpperCase()}`);
}

// Example 3: Using hasProperty type guard
// --------------------------------------

function processEntity(obj: unknown): string {
  // First check if obj is an object
  if (obj && typeof obj === 'object') {
    // Check if the object has the 'id' property
    if (hasProperty(obj, "id")) {
      // obj.id is now typed as unknown
      if (typeof obj.id === "string") {
        // obj.id is now typed as string
        return `Entity: ${obj.id}`;
      }
    }
  }
  return "Unknown entity";
}

// Example 4: Using FeaturePath template literal type
// --------------------------------------------------

// Type-safe feature path construction
type CustomerFeatures = "age" | "income" | "zip_code";

// Create a strongly-typed feature path
const featurePath: FeaturePath<"customers", CustomerFeatures> = "customers[age]";

// Usage in a function
function getFeatureValue<E extends string, F extends string>(
  entityset: EntitySet,
  path: FeaturePath<E, F>
): unknown {
  // Implementation would extract value from the entityset
  console.log(`Getting feature at path: ${path}`);
  return null;
}

// Using the function with type checking
getFeatureValue({} as EntitySet, "customers[age]"); // Valid
// getFeatureValue({} as EntitySet, "invalid_format"); // Error: Not assignable to FeaturePath

// Example 5: Using const enum generated from Python enums
// ------------------------------------------------------

// Using the enum for feature types
function describeFeatureType(type: FeatureType): string {
  switch (type) {
    case FeatureType.Numeric:
      return "A numeric feature";
    case FeatureType.Categorical:
      return "A categorical feature";
    case FeatureType.Datetime:
      return "A datetime feature";
    default:
      return "Unknown feature type";
  }
}

// Main example function
function runExamples(): void {
  console.log("TypeScript 4.9+ Features Example");
  console.log("================================");
  
  // Example 1: Satisfies operator
  console.log("\nExample 1: Satisfies Operator");
  console.log(`Feature: ${ageFeature.name} (${ageFeature.type})`);
  
  // Example 2: PreferType
  console.log("\nExample 2: PreferType");
  if (entityId) {
    console.log(`Entity ID: ${entityId}`);
  } else {
    console.log("No entity ID found");
  }
  
  // Example 3: hasProperty type guard
  console.log("\nExample 3: hasProperty Type Guard");
  console.log(processEntity({ id: "customers" }));
  console.log(processEntity({ name: "not an entity" }));
  
  // Example 4: FeaturePath
  console.log("\nExample 4: FeaturePath Template Literal");
  getFeatureValue({} as EntitySet, "customers[income]");
  
  // Example 5: Const Enum
  console.log("\nExample 5: Const Enum");
  console.log(describeFeatureType(FeatureType.Numeric));
}

// Export the examples function
export { runExamples };

// Run the examples if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runExamples();
} 