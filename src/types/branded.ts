/**
 * Branded types for Featuretools TypeScript
 * 
 * Branded types provide additional type safety by creating unique types
 * that can't be accidentally mixed up with similar structural types.
 */

/**
 * Brand type to create a unique type
 */
export type Brand<K, T> = K & { __brand: T };

/**
 * EntityId type - a string that represents an entity ID
 */
export type EntityId = Brand<string, 'EntityId'>;

/**
 * EntitySetId type - a string that represents an entity set ID
 */
export type EntitySetId = Brand<string, 'EntitySetId'>;

/**
 * FeatureId type - a string that represents a feature ID
 */
export type FeatureId = Brand<string, 'FeatureId'>;

/**
 * VariableId type - a string that represents a variable ID
 */
export type VariableId = Brand<string, 'VariableId'>;

/**
 * RelationshipId type - a string that represents a relationship ID
 */
export type RelationshipId = Brand<string, 'RelationshipId'>;

/**
 * Create a branded entity ID
 */
export function createEntityId(id: string): EntityId {
  return id as EntityId;
}

/**
 * Create a branded entity set ID
 */
export function createEntitySetId(id: string): EntitySetId {
  return id as EntitySetId;
}

/**
 * Create a branded feature ID
 */
export function createFeatureId(id: string): FeatureId {
  return id as FeatureId;
}

/**
 * Create a branded variable ID
 */
export function createVariableId(id: string): VariableId {
  return id as VariableId;
}

/**
 * Create a branded relationship ID
 */
export function createRelationshipId(id: string): RelationshipId {
  return id as RelationshipId;
}

/**
 * Revised Entity interface using branded types
 */
export interface BrandedEntity {
  id: EntityId;
  df: unknown;
  index: string;
  time_index?: string;
  variable_types?: Record<VariableId, string>;
}

/**
 * Revised EntitySet interface using branded types
 */
export interface BrandedEntitySet {
  id: EntitySetId;
  entities: Record<EntityId, BrandedEntity>;
  relationships: BrandedRelationship[];
}

/**
 * Revised Relationship interface using branded types
 */
export interface BrandedRelationship {
  id?: RelationshipId;
  parent_entity: EntityId;
  parent_variable: VariableId;
  child_entity: EntityId;
  child_variable: VariableId;
}

/**
 * Revised Feature interface using branded types
 */
export interface BrandedFeatureDefinition {
  id: FeatureId;
  name: string;
  entity: EntityId;
  type: string;
  base_features?: BrandedFeatureDefinition[];
} 