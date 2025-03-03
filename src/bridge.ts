import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { Observable } from 'rxjs';
import { validate } from './utils/validation';
import type { FeatureToolsConfig } from './types/config';

/**
 * PyBridge implementation for Featuretools
 * Manages communication between TypeScript and Python
 */
export class FeatureToolsBridge {
  private pythonProcess: ChildProcess | null = null;
  private initialized = false;
  private pythonPath: string;
  private config: FeatureToolsConfig;
  
  constructor(options?: { pythonPath?: string; config?: FeatureToolsConfig }) {
    this.pythonPath = options?.pythonPath || 'python';
    this.config = options?.config || {};
  }
  
  /**
   * Initialize the Python bridge
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const bridgeScriptPath = path.join(__dirname, '../python/featuretools_bridge.py');
    
    this.pythonProcess = spawn(this.pythonPath, [bridgeScriptPath]);
    
    // Setup communication channels
    this.pythonProcess.stdout?.on('data', (data: Buffer) => {
      // Process response data
    });
    
    this.pythonProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`Python Error: ${data.toString()}`);
    });
    
    this.initialized = true;
  }
  
  /**
   * Call a Python function with parameters
   */
  async callFunction<T>(functionName: string, params: Record<string, unknown>, expectedType?: string): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Serialize function call and parameters
    const request = JSON.stringify({
      function: functionName,
      params: params
    });
    
    return new Promise<T>((resolve, reject) => {
      // Send request to Python
      if (!this.pythonProcess?.stdin) {
        reject(new Error('Python process is not initialized'));
        return;
      }
      
      this.pythonProcess.stdin.write(`${request}\n`);
      
      // Handle response (simplified)
      // In real implementation, need to match responses to requests
      this.pythonProcess.stdout?.once('data', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.error) {
            reject(new Error(response.error));
          } else {
            const result = response.result as T;
            
            // Apply validation if type was specified and validation is enabled
            if (expectedType && this.config.validation?.enabled) {
              return resolve(validate<T>(result, expectedType, this.config.validation));
            }
            
            resolve(result);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }
  
  /**
   * Call a Python generator function
   */
  callGenerator<T>(functionName: string, params: Record<string, unknown>, expectedType?: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      // Implementation for generator functions
      // This would handle streaming data from Python generators
      
      // Apply validation if type was specified and validation is enabled
      if (expectedType && this.config.validation?.enabled) {
        // In a real implementation, we would validate each item in the stream
      }
    });
  }
  
  /**
   * Close the Python process
   */
  close(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.initialized = false;
    }
  }
} 