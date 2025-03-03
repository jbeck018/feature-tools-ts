"use strict";
/**
 * TypeScript 4.9+ Features Example
 *
 * This example demonstrates how to use the TypeScript 4.9+ features
 * implemented in the Featuretools TypeScript bridge.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExamples = runExamples;
// Import the utility types from ts-features
const ts_features_1 = require("../src/types/ts-features");
// Example enum similar to what would be generated
var FeatureType;
(function (FeatureType) {
    FeatureType["Numeric"] = "numeric";
    FeatureType["Categorical"] = "categorical";
    FeatureType["Datetime"] = "datetime";
    FeatureType["Boolean"] = "boolean";
    FeatureType["Text"] = "text";
    FeatureType["Unknown"] = "unknown";
})(FeatureType || (FeatureType = {}));
// Example 1: Using the satisfies operator
// -----------------------------------------
// Define a feature with the satisfies operator
const ageFeature = {
    name: "customer_age",
    entity: "customers",
    type: "numeric"
};
// The type is still inferred as the object literal type
// but validated against FeatureDefinition
console.log(`Feature name: ${ageFeature.name}`);
// You can still access the literal type
const featureType = ageFeature.type; // Type is "numeric" (literal), not string
// Example 2: Using PreferType for better union handling
// -----------------------------------------------------
// Function returning PreferType<string, null> for better inference
function getEntityName(entity) {
    return (entity === null || entity === void 0 ? void 0 : entity.id) || null;
}
const entityId = getEntityName({ id: "customers", df: [], index: "id" });
// entityId is inferred as string instead of string | null
if (entityId) {
    console.log(`Entity ID: ${entityId.toUpperCase()}`);
}
// Example 3: Using hasProperty type guard
// --------------------------------------
function processEntity(obj) {
    // First check if obj is an object
    if (obj && typeof obj === 'object') {
        // Check if the object has the 'id' property
        if ((0, ts_features_1.hasProperty)(obj, "id")) {
            // obj.id is now typed as unknown
            if (typeof obj.id === "string") {
                // obj.id is now typed as string
                return `Entity: ${obj.id}`;
            }
        }
    }
    return "Unknown entity";
}
// Create a strongly-typed feature path
const featurePath = "customers[age]";
// Usage in a function
function getFeatureValue(entityset, path) {
    // Implementation would extract value from the entityset
    console.log(`Getting feature at path: ${path}`);
    return null;
}
// Using the function with type checking
getFeatureValue({}, "customers[age]"); // Valid
// getFeatureValue({} as EntitySet, "invalid_format"); // Error: Not assignable to FeaturePath
// Example 5: Using const enum generated from Python enums
// ------------------------------------------------------
// Using the enum for feature types
function describeFeatureType(type) {
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
function runExamples() {
    console.log("TypeScript 4.9+ Features Example");
    console.log("================================");
    // Example 1: Satisfies operator
    console.log("\nExample 1: Satisfies Operator");
    console.log(`Feature: ${ageFeature.name} (${ageFeature.type})`);
    // Example 2: PreferType
    console.log("\nExample 2: PreferType");
    if (entityId) {
        console.log(`Entity ID: ${entityId}`);
    }
    else {
        console.log("No entity ID found");
    }
    // Example 3: hasProperty type guard
    console.log("\nExample 3: hasProperty Type Guard");
    console.log(processEntity({ id: "customers" }));
    console.log(processEntity({ name: "not an entity" }));
    // Example 4: FeaturePath
    console.log("\nExample 4: FeaturePath Template Literal");
    getFeatureValue({}, "customers[income]");
    // Example 5: Const Enum
    console.log("\nExample 5: Const Enum");
    console.log(describeFeatureType(FeatureType.Numeric));
}
// Run the examples if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runExamples();
}
