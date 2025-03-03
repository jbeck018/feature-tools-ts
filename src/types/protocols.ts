/**
 * Protocol interfaces for structural typing in FeatureTools TypeScript
 * 
 * These interfaces define structural contracts that classes can implement
 * without explicitly extending or implementing the interface.
 */

import { EntityId, EntitySetId } from './branded';

/**
 * DataSource protocol for accessing various data sources
 * 
 * Implements the structural typing pattern, allowing any object
 * with the required methods and properties to be used as a DataSource.
 */
export interface DataSource<T = unknown> {
  /** Unique identifier for the data source */
  id: string;
  
  /** Name of the data source */
  name: string;
  
  /** Type of the data source */
  type: string;
  
  /**
   * Fetch data from the source
   * @param query Query string or parameters
   * @returns Data from the source
   */
  fetchData(query: string): Promise<T[]>;
  
  /**
   * Check if the data source is connected
   * @returns Connection status
   */
  isConnected(): boolean;
  
  /**
   * Close the data source connection
   */
  close(): void;
}

/**
 * FeatureExtractor protocol for feature generation
 * 
 * Defines the structure for objects that can extract features
 * from entities in an EntitySet.
 */
export interface FeatureExtractor {
  /** Unique identifier for the extractor */
  id: string;
  
  /** Name of the feature extractor */
  name: string;
  
  /** Description of what the extractor does */
  description?: string;
  
  /**
   * Extract features from an entity
   * @param entityId Target entity ID
   * @param options Feature extraction options
   * @returns Extracted features
   */
  extract(entityId: EntityId, options?: Record<string, unknown>): Promise<unknown[]>;
  
  /**
   * Get the feature names this extractor produces
   * @returns Array of feature names
   */
  getFeatureNames(): string[];
  
  /**
   * Get information about the extractor
   * @returns Metadata about the extractor
   */
  getInfo(): Record<string, unknown>;
}

/**
 * Pipeline protocol for feature engineering pipelines
 * 
 * Defines a structure for objects that can perform a sequence
 * of operations on entity data to produce features.
 */
export interface Pipeline {
  /** Unique identifier for the pipeline */
  id: string;
  
  /** Name of the pipeline */
  name: string;
  
  /** Steps in the pipeline */
  steps: Array<{
    name: string;
    executor: FeatureExtractor | DataSource<unknown>;
    options?: Record<string, unknown>;
  }>;
  
  /**
   * Add a step to the pipeline
   * @param step Step definition to add
   * @returns Updated pipeline
   */
  addStep(step: {
    name: string;
    executor: FeatureExtractor | DataSource<unknown>;
    options?: Record<string, unknown>;
  }): Pipeline;
  
  /**
   * Execute the pipeline on an EntitySet
   * @param entitySetId ID of the EntitySet to process
   * @param targetEntity Target entity to generate features for
   * @returns Result of pipeline execution
   */
  execute(entitySetId: EntitySetId, targetEntity: EntityId): Promise<{
    features: unknown[];
    metadata: Record<string, unknown>;
  }>;
  
  /**
   * Get a description of the pipeline
   * @returns Pipeline description
   */
  describe(): string;
}

/**
 * Example of how to use structural typing with Protocol interfaces
 * 
 * This sample class implements the DataSource protocol without explicitly
 * declaring that it implements the interface.
 */
export class CSVDataSource implements DataSource<Record<string, string>> {
  id: string;
  name: string;
  type: string = 'csv';
  private connected: boolean = false;
  private filePath: string;
  
  constructor(id: string, name: string, filePath: string) {
    this.id = id;
    this.name = name;
    this.filePath = filePath;
  }
  
  async fetchData(query: string): Promise<Record<string, string>[]> {
    // In a real implementation, this would parse the CSV file
    // and filter based on the query
    return [{ id: '1', name: 'Sample', value: query }];
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  close(): void {
    this.connected = false;
  }
}

/**
 * Function that demonstrates using structural typing
 * 
 * This function accepts any object that satisfies the DataSource
 * protocol, regardless of its actual class or inheritance.
 */
export async function processDataSource<T>(source: DataSource<T>): Promise<T[]> {
  if (!source.isConnected()) {
    console.log(`Data source ${source.name} is not connected`);
  }
  
  try {
    const data = await source.fetchData('SELECT * FROM data');
    console.log(`Retrieved ${data.length} records from ${source.name}`);
    return data;
  } finally {
    source.close();
  }
} 