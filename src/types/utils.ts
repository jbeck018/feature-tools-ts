/**
 * Utility types for Featuretools TypeScript
 */
import type { BrandedEntitySet, BrandedEntity, BrandedRelationship, EntityId } from './branded';

/**
 * Makes all properties in T optional
 */
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

/**
 * Extract properties from a type
 */
export type PropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];

/**
 * Filter to get only properties (no methods)
 */
export type Properties<T> = Pick<T, PropertyNames<T>>;

/**
 * Extract entity names from an EntitySet
 */
export type EntityNames<T extends BrandedEntitySet> = keyof T['entities'];

/**
 * Get the type of an entity in an EntitySet
 */
export type EntityType<T extends BrandedEntitySet, K extends EntityId> = 
  K extends keyof T['entities'] ? T['entities'][K] : never;

/**
 * Filter relationships by parent entity
 */
export type RelationshipsByParent<
  T extends BrandedEntitySet,
  E extends EntityId
> = T['relationships'] extends Array<infer R>
  ? R extends BrandedRelationship
    ? R['parent_entity'] extends E
      ? R
      : never
    : never
  : never;

/**
 * Filter relationships by child entity
 */
export type RelationshipsByChild<
  T extends BrandedEntitySet,
  E extends EntityId
> = T['relationships'] extends Array<infer R>
  ? R extends BrandedRelationship
    ? R['child_entity'] extends E
      ? R
      : never
    : never
  : never;

/**
 * Get all parent entities for a given entity
 */
export type ParentEntities<
  T extends BrandedEntitySet,
  E extends EntityId
> = T['relationships'] extends Array<infer R>
  ? R extends BrandedRelationship
    ? R['child_entity'] extends E
      ? R['parent_entity']
      : never
    : never
  : never;

/**
 * Get all child entities for a given entity
 */
export type ChildEntities<
  T extends BrandedEntitySet,
  E extends EntityId
> = T['relationships'] extends Array<infer R>
  ? R extends BrandedRelationship
    ? R['parent_entity'] extends E
      ? R['child_entity']
      : never
    : never
  : never;

/**
 * Type for a function that takes an entity and returns a feature
 */
export type FeatureExtractor<T extends BrandedEntity, R = unknown> = 
  (entity: T) => R;

/**
 * Ensure a value is an array
 */
export type EnsureArray<T> = T extends readonly unknown[] ? T : T[];

/**
 * Extract the type from a Promise
 */
export type Awaited<T> = T extends Promise<infer R> ? R : T;

/**
 * Utility type for feature transformation functions
 */
export type TransformFunction<T, R = T> = (value: T) => R;

/**
 * Utility type for feature aggregation functions
 */
export type AggregationFunction<T> = (values: T[]) => unknown;

/**
 * Parameter types extracting utility
 */
export type Parameters<T extends (...args: unknown[]) => unknown> = 
  T extends (...args: infer P) => unknown ? P : never;

/**
 * Return type extracting utility
 */
export type ReturnType<T extends (...args: unknown[]) => unknown> = 
  T extends (...args: unknown[]) => infer R ? R : unknown;

/**
 * Make specific properties of T required
 */
export type RequireProperties<T, K extends keyof T> = 
  T & { [P in K]-?: T[P] };

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Utility to map over object properties
 */
export type MapProperties<T, F extends (value: unknown) => unknown> = {
  [K in keyof T]: F extends (value: T[K]) => infer R ? R : never;
}; 