/**
 * Deep Feature Synthesis type definitions
 */
import type { EntitySet } from './entityset';

export interface DFSOptions extends Record<string, unknown> {
  entityset: EntitySet;
  target_entity: string;
  agg_primitives?: string[] | null;
  trans_primitives?: string[] | null;
  max_depth?: number;
  features_only?: boolean;
  drop_contains?: string[];
  drop_exact?: string[];
  where_primitives?: Record<string, string[]>;
  max_features?: number;
  cutoff_time?: unknown; // DataFrame representation
  training_window?: string;
  approximate?: string;
  chunk_size?: number;
  n_jobs?: number;
  dask_kwargs?: Record<string, unknown>;
  verbose?: boolean;
  return_variable_types?: string[];
  primitive_options?: Record<string, unknown>;
}

export interface DFSResult {
  feature_matrix: unknown; // DataFrame
  feature_defs: FeatureDefinition[];
}

export interface FeatureDefinition {
  name: string;
  entity: string;
  type: string;
  base_features?: FeatureDefinition[];
} 