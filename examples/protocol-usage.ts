/**
 * Example: Using Protocol interfaces in Featuretools TypeScript
 * 
 * This example demonstrates how to use Protocol interfaces for structural typing
 * to create flexible, loosely coupled components that work together without
 * explicit inheritance hierarchies.
 */

import FeatureTools from '../src';
import { 
  DataSource, 
  FeatureExtractor, 
  Pipeline, 
  CSVDataSource,
  processDataSource 
} from '../src/types/protocols';
import { createEntityId, createEntitySetId } from '../src/types/branded';

/**
 * Custom data source implementation that satisfies the DataSource protocol
 * without explicitly implementing it.
 */
class ApiDataSource {
  id: string;
  name: string;
  type = 'api';
  private apiKey: string;
  private isActive = false;
  
  constructor(id: string, name: string, apiKey: string) {
    this.id = id;
    this.name = name;
    this.apiKey = apiKey;
  }
  
  // Implements fetchData from DataSource protocol
  async fetchData(query: string): Promise<unknown[]> {
    console.log(`Fetching data from API with query: ${query}`);
    // In a real implementation, this would call an external API
    return [
      { id: 1, name: 'Feature 1', value: 100 },
      { id: 2, name: 'Feature 2', value: 200 }
    ];
  }
  
  // Implements isConnected from DataSource protocol
  isConnected(): boolean {
    return this.isActive;
  }
  
  // Implements close from DataSource protocol
  close(): void {
    console.log(`Closing connection to ${this.name}`);
    this.isActive = false;
  }
  
  // Connect to the API - custom method not in the protocol
  connect(): void {
    console.log(`Connecting to API ${this.name} with key ${this.apiKey.substring(0, 3)}***`);
    this.isActive = true;
  }
}

/**
 * Custom feature extractor that satisfies the FeatureExtractor protocol
 */
class SimpleFeatureExtractor implements FeatureExtractor {
  id: string;
  name: string;
  description: string;
  
  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }
  
  async extract(entityId: string, options?: Record<string, unknown>): Promise<unknown[]> {
    console.log(`Extracting features from entity ${entityId}`);
    return [
      { name: 'feature_1', value: 10 },
      { name: 'feature_2', value: 20 }
    ];
  }
  
  getFeatureNames(): string[] {
    return ['feature_1', 'feature_2'];
  }
  
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      features: this.getFeatureNames()
    };
  }
}

/**
 * Custom pipeline implementation that satisfies the Pipeline protocol
 */
class FeaturePipeline implements Pipeline {
  id: string;
  name: string;
  steps: Array<{
    name: string;
    executor: FeatureExtractor | DataSource<unknown>;
    options?: Record<string, unknown>;
  }> = [];
  
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  
  addStep(step: {
    name: string;
    executor: FeatureExtractor | DataSource<unknown>;
    options?: Record<string, unknown>;
  }): Pipeline {
    this.steps.push(step);
    return this;
  }
  
  async execute(entitySetId: string, targetEntity: string): Promise<{
    features: unknown[];
    metadata: Record<string, unknown>;
  }> {
    console.log(`Executing pipeline ${this.name} on entitySet ${entitySetId}, target ${targetEntity}`);
    
    const allFeatures: unknown[] = [];
    
    // Execute each step in sequence
    for (const step of this.steps) {
      console.log(`  Executing step: ${step.name}`);
      
      if ('extract' in step.executor) {
        // This is a FeatureExtractor
        const features = await step.executor.extract(targetEntity, step.options);
        allFeatures.push(...features);
      } else if ('fetchData' in step.executor) {
        // This is a DataSource
        const data = await step.executor.fetchData(targetEntity);
        allFeatures.push(...data);
      }
    }
    
    return {
      features: allFeatures,
      metadata: {
        pipelineId: this.id,
        pipelineName: this.name,
        timestamp: new Date().toISOString(),
        stepCount: this.steps.length
      }
    };
  }
  
  describe(): string {
    const stepDescriptions = this.steps.map(step => {
      const executorType = 'extract' in step.executor ? 'Extractor' : 'DataSource';
      return `- ${step.name} (${executorType}): ${step.executor.name}`;
    });
    
    return `Pipeline: ${this.name} (${this.id})\nSteps:\n${stepDescriptions.join('\n')}`;
  }
}

/**
 * Function that demonstrates how protocols enable composability
 */
async function createCompleteFeaturePipeline(customSource?: DataSource<unknown>): Promise<Pipeline> {
  // Create a new pipeline
  const pipeline = new FeaturePipeline('pipeline-1', 'Feature Generation Pipeline');
  
  // Create a CSV data source
  const csvSource = new CSVDataSource('csv-1', 'Customer Data', 'data/customers.csv');
  
  // Create an API data source 
  const apiSource = new ApiDataSource('api-1', 'Product API', 'api-key-12345');
  apiSource.connect();
  
  // Create a feature extractor
  const extractor = new SimpleFeatureExtractor(
    'ext-1', 
    'Basic Stats Extractor',
    'Extracts simple statistical features from entity data'
  );
  
  // Add steps to the pipeline
  pipeline.addStep({
    name: 'Load CSV Data',
    executor: csvSource,
    options: { limit: 1000 }
  });
  
  pipeline.addStep({
    name: 'Load API Data',
    executor: apiSource,
    options: { format: 'json' }
  });
  
  // Add the custom source if provided
  if (customSource) {
    pipeline.addStep({
      name: 'Load Custom Data',
      executor: customSource
    });
  }
  
  pipeline.addStep({
    name: 'Extract Basic Features',
    executor: extractor,
    options: { includeNulls: false }
  });
  
  return pipeline;
}

/**
 * Main function demonstrating the protocol usage
 */
async function main() {
  try {
    console.log('=== Protocol Interfaces Example ===\n');
    
    // Initialize FeatureTools
    const ft = new FeatureTools();
    await ft.initialize();
    
    console.log('Creating an EntitySet with sample data...');
    const entitySet = await ft.entitySet.create('protocol_demo');
    
    // Add a simple entity
    const customers = [
      { customer_id: 1, name: 'Alice', age: 30 },
      { customer_id: 2, name: 'Bob', age: 45 }
    ];
    
    await ft.entitySet.addEntity(entitySet, {
      id: createEntityId('customers'),
      df: customers,
      index: 'customer_id'
    });
    
    console.log('Creating a feature pipeline using protocol interfaces...');
    const pipeline = await createCompleteFeaturePipeline();
    
    console.log('\nPipeline structure:');
    console.log(pipeline.describe());
    
    console.log('\nExecuting the pipeline...');
    const results = await pipeline.execute(
      entitySet.id,
      createEntityId('customers')
    );
    
    console.log(`\nGenerated ${results.features.length} features`);
    console.log('Sample features:', results.features.slice(0, 2));
    console.log('Metadata:', results.metadata);
    
    console.log('\nDemonstrating protocol utility function with CSV source...');
    const csvSource = new CSVDataSource('csv-demo', 'Demo CSV', 'data/demo.csv');
    const csvData = await processDataSource(csvSource);
    console.log('CSV Data:', csvData);
    
    console.log('\nDemonstrating protocol utility function with API source...');
    const apiSource = new ApiDataSource('api-demo', 'Demo API', 'test-key');
    apiSource.connect();
    const apiData = await processDataSource(apiSource);
    console.log('API Data:', apiData);
    
    console.log('\n=== Example completed successfully ===');
    
    // Clean up
    ft.close();
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
main().catch(console.error); 