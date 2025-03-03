/**
 * Type Statistics Plugin for Featuretools TypeScript
 * 
 * This plugin collects and reports statistics about the generated TypeScript types.
 */

const fs = require('node:fs');
const path = require('node:path');

class TypeStatsPlugin {
  /**
   * Initialize the plugin
   * @param {import('../../../src/types/config').PluginDefinition} config Plugin configuration
   */
  initialize(config) {
    this.name = config.name;
    this.stats = {
      interfaceCount: 0,
      methodCount: 0,
      propertyCount: 0,
      totalLineCount: 0,
      largestInterface: { name: '', size: 0 },
      startTime: Date.now(),
      processingTime: 0
    };
    
    this.options = config.options || {};
    this.outputPath = this.options.outputPath || './type-stats.json';
    
    console.log(`[${this.name}] Initialized`);
  }
  
  /**
   * Handle plugin hooks
   * @param {import('../../../src/types/config').PluginHook} hook The hook point
   * @param {import('../../../src/types/config').PluginContext} context Context data
   * @returns {import('../../../src/types/config').PluginContext} Updated context
   */
  async onHook(hook, context) {
    const { logger } = context;
    
    switch (hook) {
      case 'preGeneration':
        logger.info(`${this.name} - Starting type generation statistics collection`);
        this.stats.startTime = Date.now();
        break;
        
      case 'postConversion':
        if (context.tsOutput) {
          this.collectStats(context.tsOutput);
          logger.info(`${this.name} - Collected type statistics`);
        }
        break;
        
      case 'postGeneration':
        this.stats.processingTime = Date.now() - this.stats.startTime;
        await this.saveStats();
        this.logStats(logger);
        break;
        
      case 'onError':
        logger.error(`${this.name} - Error during type generation: ${context.error?.message || 'Unknown error'}`);
        break;
    }
    
    return context;
  }
  
  /**
   * Collect statistics from TypeScript output
   * @param {string} tsOutput Generated TypeScript content
   */
  collectStats(tsOutput) {
    // Count interfaces
    const interfaceMatches = tsOutput.match(/interface\s+([A-Za-z0-9_]+)/g) || [];
    this.stats.interfaceCount = interfaceMatches.length;
    
    // Count methods
    const methodMatches = tsOutput.match(/[A-Za-z0-9_]+\([^)]*\):/g) || [];
    this.stats.methodCount = methodMatches.length;
    
    // Count properties
    const propertyMatches = tsOutput.match(/[A-Za-z0-9_]+\??\s*:/g) || [];
    this.stats.propertyCount = propertyMatches.length - this.stats.methodCount; // Adjust for methods
    
    // Count lines
    const lines = tsOutput.split('\n');
    this.stats.totalLineCount = lines.length;
    
    // Find largest interface
    const interfaces = tsOutput.split(/interface\s+([A-Za-z0-9_]+)/);
    let largestSize = 0;
    let largestName = '';
    
    for (let i = 1; i < interfaces.length; i += 2) {
      const name = interfaces[i];
      const content = interfaces[i + 1];
      const size = content.split('\n').length;
      
      if (size > largestSize) {
        largestSize = size;
        largestName = name;
      }
    }
    
    this.stats.largestInterface = { name: largestName, size: largestSize };
  }
  
  /**
   * Save statistics to file
   */
  async saveStats() {
    try {
      const outputDir = path.dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(
        this.outputPath,
        JSON.stringify(this.stats, null, 2),
        'utf-8'
      );
      
      return true;
    } catch (error) {
      console.error(`[${this.name}] Error saving stats: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Log statistics to console
   * @param {object} logger Logger object
   */
  logStats(logger) {
    logger.info(`
Type Generation Statistics:
- Interfaces: ${this.stats.interfaceCount}
- Methods: ${this.stats.methodCount}
- Properties: ${this.stats.propertyCount}
- Total Lines: ${this.stats.totalLineCount}
- Largest Interface: ${this.stats.largestInterface.name} (${this.stats.largestInterface.size} lines)
- Processing Time: ${this.stats.processingTime}ms
    `);
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    console.log(`[${this.name}] Cleanup completed`);
  }
}

module.exports = TypeStatsPlugin; 