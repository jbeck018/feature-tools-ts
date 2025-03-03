import { FeatureToolsBridge } from '../bridge';
import { DFSOptions, DFSResult } from '../types/dfs';

export class DeepFeatureSynthesis {
  private bridge: FeatureToolsBridge;
  
  constructor(bridge: FeatureToolsBridge) {
    this.bridge = bridge;
  }
  
  /**
   * Perform Deep Feature Synthesis
   */
  async dfs(options: DFSOptions): Promise<DFSResult> {
    return this.bridge.callFunction<DFSResult>('ft_dfs', options);
  }
} 