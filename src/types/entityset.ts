/**
 * EntitySet type definitions - represents the main container of entity data
 */
export interface EntitySet {
  id: string;
  entities: Record<string, Entity>;
  relationships: Relationship[];
}

export interface Entity {
  id: string;
  df: any; // DataFrame representation
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