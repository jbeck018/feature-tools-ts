/**
 * TypeScript 4.9+ Features Utility Module
 * 
 * This module provides utility types and functions that leverage newer TypeScript features,
 * improving type safety and developer experience. These utilities are used in the generated
 * types to enhance consistency and correctness of the Featuretools TypeScript API.
 * 
 * @module ts-features
 */

/**
 * The `satisfies` operator was introduced in TypeScript 4.9.
 * This type utility provides a similar check for TypeScript versions that don't support it.
 * 
 * @template T - The type to satisfy
 * @template U - The constraint type
 */
export type Satisfies<T, U> = T extends U ? T : never;

/**
 * Improves union type handling by representing more specific types first.
 * This prevents TypeScript from widening types too aggressively.
 * 
 * @template T - The preferred, more specific type
 * @template U - The fallback, more general type
 */
export type PreferType<T, U> = T | Exclude<U, T>;

/**
 * A stronger type guard function that helps with type narrowing.
 * 
 * @param obj - The object to check for the property
 * @param prop - The property to check
 * @returns Whether the object has the property
 */
export function hasProperty<K extends string>(obj: object, prop: K): obj is Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Extract method signatures from a class or interface.
 * 
 * @template T - The class or interface type
 * @template K - The method key
 */
export type ExtractMethod<T, K extends keyof T> = T[K] extends (...args: infer A) => infer R
  ? (...args: A) => R
  : never;

/**
 * Creates a type that requires at least one of the specified properties.
 * 
 * @template T - The base type
 * @template K - Keys that are required
 */
export type RequireAtLeastOne<T, K extends keyof T> = 
  & Omit<T, K>
  & { [P in K]: Required<Pick<T, P>> }[K];

/**
 * Similar to const assertions, but as a function for better readability.
 * Preserves the literal types of the object's properties.
 * 
 * @template T - The object type
 * @param obj - The object to treat as constant
 * @returns The object with its literal types preserved
 */
export const asConst = <T>(obj: T): Readonly<T> => obj;

/**
 * Type for method decorators in TypeScript classes.
 * 
 * @template T - The class type
 */
export type MethodDecorator<T> = <K extends keyof T>(
  target: T,
  propertyKey: K,
  descriptor: PropertyDescriptor
) => PropertyDescriptor | undefined;

/**
 * Type for class decorators with TypeScript 4.9+ compatibility.
 * 
 * @template T - The constructor type
 */
export type ClassDecorator<T extends new (...args: unknown[]) => unknown> = (
  target: T
) => T | undefined;

/**
 * Type for empty objects, ensuring they don't have extra properties.
 */
export type EmptyObject = Record<never, never>;

/**
 * Enforces exhaustive checking in switch statements.
 * 
 * @param value - The value that should be of type never
 * @returns Never returns, throws an error instead
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Type-safe branded type implementation for TypeScript 4.9+.
 * Used to create nominal types from structural types.
 * 
 * @template T - The base type
 * @template Brand - The brand identifier
 */
export type Branded<T, Brand extends string> = T & { __brand: Brand };

/**
 * Constructs a path string using template literals.
 * Useful for strongly-typed path expressions.
 * 
 * @template Entity - The entity name
 * @template Feature - The feature name
 */
export type FeaturePath<
  Entity extends string,
  Feature extends string
> = `${Entity}[${Feature}]`;

/**
 * Type-safe function overloads helper.
 * Helps define function overloads with better type inference in TypeScript 4.9+.
 * 
 * @template T - Array of function types
 */
export type Overloaded<T extends Array<(...args: unknown[]) => unknown>> = T[number];

// Additional TypeScript 4.9+ compatible utility types and functions can be added below 