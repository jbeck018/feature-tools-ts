"use strict";
/**
 * TypeScript 4.9+ Features Utility Module
 *
 * This module provides utility types and functions that leverage newer TypeScript features,
 * improving type safety and developer experience. These utilities are used in the generated
 * types to enhance consistency and correctness of the Featuretools TypeScript API.
 *
 * @module ts-features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asConst = void 0;
exports.hasProperty = hasProperty;
exports.assertNever = assertNever;
/**
 * A stronger type guard function that helps with type narrowing.
 *
 * @param obj - The object to check for the property
 * @param prop - The property to check
 * @returns Whether the object has the property
 */
function hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
/**
 * Similar to const assertions, but as a function for better readability.
 * Preserves the literal types of the object's properties.
 *
 * @template T - The object type
 * @param obj - The object to treat as constant
 * @returns The object with its literal types preserved
 */
const asConst = (obj) => obj;
exports.asConst = asConst;
/**
 * Enforces exhaustive checking in switch statements.
 *
 * @param value - The value that should be of type never
 * @returns Never returns, throws an error instead
 */
function assertNever(value) {
    throw new Error(`Unexpected value: ${value}`);
}
// Additional TypeScript 4.9+ compatible utility types and functions can be added below 
