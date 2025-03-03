/**
 * Auto-generated TypeScript definitions for Featuretools
 * Generated from Python types using generate_types.py
 * Date: 2025-03-03 10:37:02
 */

export interface EntitySet {
  id: any;
  entities?: any;
  relationships?: any;
}

export interface Entity {
  id: any;
  df: any;
  index: any;
  time_index?: any;
  variable_types?: any;
}

export interface Relationship {
  parent_entity: any;
  parent_variable: any;
  child_entity: any;
  child_variable: any;
}

export interface AggregationPrimitive {
  args: any;
  kwargs: any;
}

export interface TransformPrimitive {
  args: any;
  kwargs: any;
}

/** Definition of a generated feature */
export interface FeatureDefinition {
  /** Name of the feature */
  name: string;
  /** Entity this feature belongs to */
  entity: string;
  /** Type of the feature */
  type: string;
  /** Features this feature is derived from */
  base_features?: FeatureDefinition[];
}

