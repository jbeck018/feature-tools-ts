import { FeatureToolsBridge } from './bridge';
import { EntitySetAPI } from './api/entityset';
import { DeepFeatureSynthesis } from './api/dfs';

// Export all types
export * from './types';

/**
 * Main FeatureTools class
 */
export class FeatureTools {
  private bridge: FeatureToolsBridge;
  
  public entitySet: EntitySetAPI;
  public dfs: DeepFeatureSynthesis;
  
  constructor(options?: { pythonPath?: string }) {
    this.bridge = new FeatureToolsBridge(options);
    
    // Initialize API components
    this.entitySet = new EntitySetAPI(this.bridge);
    this.dfs = new DeepFeatureSynthesis(this.bridge);
  }
  
  /**
   * Initialize the bridge
   */
  async initialize(): Promise<void> {
    await this.bridge.initialize();
  }
  
  /**
   * Close the bridge connection
   */
  close(): void {
    this.bridge.close();
  }
}

// Default export
export default FeatureTools; 