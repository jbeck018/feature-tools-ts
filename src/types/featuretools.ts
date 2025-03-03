/**
 * TypeScript type definitions for Featuretools
 * 
 * Generated automatically from Python types.
 * DO NOT EDIT BY HAND.
 * 
 * Featuretools Version: unknown
 * Generation Timestamp: 2025-03-03T14:18:00.146380
 */


// Import TypeScript 4.9+ feature utilities
import { 
  Satisfies, 
  PreferType, 
  hasProperty, 
  ExtractMethod, 
  RequireAtLeastOne,
  asConst,
  Branded,
  FeaturePath
} from './ts-features';

declare module 'featuretools' {

export interface EntitySet {
  id: string;
  entities: Record<string, Entity>;
  relationships: Relationship[];
  
  add_entity(entity: Entity): EntitySet;
  normalize_entity(base_entity_id: string, new_entity_id: string, index: string): EntitySet;
}

export interface Entity {
  id: string;
  df: any;
  index: string;
  time_index?: string;
  variable_types?: Record<string, string>;
}

export interface Relationship {
  parent_entity: string;
  parent_variable: string;
  child_entity: string;
  child_variable: string;
}

export type FeatureDefinition = {
  name: string;
  entity: string;
  type: string;
  base_features?: FeatureDefinition[];
} satisfies Record<string, unknown>;

export const enum FeatureType {
  Numeric = "numeric",
  Categorical = "categorical",
  Datetime = "datetime",
  Boolean = "boolean",
  Text = "text",
  Unknown = "unknown"
}

export function dfs(options: DFSOptions): DFSResult;

}
