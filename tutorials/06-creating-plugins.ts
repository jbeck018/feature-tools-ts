/**
 * Tutorial 06 - Creating Plugins for Featuretools TypeScript
 * 
 * This tutorial demonstrates how to create custom plugins for
 * extending the functionality of Featuretools TypeScript.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PluginDefinition, PluginHook, PluginContext } from '../src/types/config';
import { FeatureTools } from '../src';

/**
 * Interface for hook tracking data structure
 */
interface HookTracking {
  hooks: Array<{
    hook: PluginHook;
    timestamp: string;
  }>;
}

/**
 * Simple logging plugin that demonstrates the plugin lifecycle
 */
class LoggingPlugin {
  private name: string;
  private options: Record<string, unknown>;
  private logFile: string;

  /**
   * Initialize the plugin
   */
  initialize(config: PluginDefinition) {
    this.name = config.name;
    this.options = config.options || {};
    this.logFile = (this.options.logFile as string) || 'featuretools-plugin.log';
    
    console.log(`[${this.name}] Initialized with options:`, this.options);
    this.log('Plugin initialized');
  }

  /**
   * Handle a plugin hook
   */
  async onHook(hook: PluginHook, context: PluginContext) {
    this.log(`Hook triggered: ${hook}`);
    
    // Store custom data in the pluginData section of the context
    if (!context.pluginData[this.name]) {
      context.pluginData[this.name] = {
        hooks: []
      } as HookTracking;
    }
    
    // Add this hook to the list of hooks we've handled
    (context.pluginData[this.name] as HookTracking).hooks.push({
      hook,
      timestamp: new Date().toISOString()
    });
    
    // Log progress based on the hook
    switch (hook) {
      case 'PRE_GENERATION':
        this.log('Starting type generation');
        break;
      case 'PRE_CONVERSION':
        this.log('Python types extracted, converting to TypeScript');
        break;
      case 'POST_CONVERSION':
        this.log(`Generated ${context.tsOutput?.length || 0} characters of TypeScript`);
        break;
      case 'POST_GENERATION':
        this.log('Type generation completed');
        break;
      case 'ON_ERROR':
        this.log(`Error occurred: ${context.metadata.error?.message || 'Unknown error'}`);
        break;
    }
    
    return context;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.log('Plugin cleanup completed');
    console.log(`[${this.name}] Cleanup completed`);
  }

  /**
   * Log a message to the log file
   */
  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.name}] ${message}\n`;
    
    try {
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }
}

/**
 * Custom type transformation plugin that modifies generated TypeScript types
 */
class TypeTransformPlugin {
  private name: string;
  private options: Record<string, unknown>;
  private transformations: Record<string, (tsInterface: string) => string>;

  /**
   * Initialize the plugin
   */
  initialize(config: PluginDefinition) {
    this.name = config.name;
    this.options = config.options || {};
    
    // Set up transformations for specific types
    this.transformations = {
      // Add a custom method to EntitySet
      'EntitySet': (tsInterface: string) => {
        return tsInterface.replace(
          /export interface EntitySet \{/,
          'export interface EntitySet {\n  /** Custom helper method added by plugin */\n  findEntityByName(name: string): Entity | undefined;'
        );
      },
      
      // Make all Entity properties optional for flexibility
      'Entity': (tsInterface: string) => {
        return tsInterface.replace(
          /([a-zA-Z_][a-zA-Z0-9_]*): /g,
          '$1?: '
        );
      }
    };
    
    console.log(`[${this.name}] Initialized with ${Object.keys(this.transformations).length} transformations`);
  }

  /**
   * Handle a plugin hook
   */
  async onHook(hook: PluginHook, context: PluginContext) {
    // Only process during the POST_CONVERSION hook
    if (hook === 'POST_CONVERSION' && context.tsOutput) {
      console.log(`[${this.name}] Applying type transformations`);
      
      let modifiedOutput = context.tsOutput;
      
      // Apply each transformation
      for (const [typeName, transformFn] of Object.entries(this.transformations)) {
        const typeRegex = new RegExp(`export interface ${typeName} \\{[\\s\\S]*?\\}`, 'g');
        modifiedOutput = modifiedOutput.replace(typeRegex, transformFn);
      }
      
      // Update the context with the modified output
      context.tsOutput = modifiedOutput;
      
      console.log(`[${this.name}] Transformations applied`);
    }
    
    return context;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log(`[${this.name}] Cleanup completed`);
  }
}

/**
 * Create plugin configuration file
 */
function createPluginConfig() {
  const pluginsDir = path.resolve(__dirname, '../plugins');
  const configPath = path.resolve(__dirname, '../plugins.json');
  
  // Create plugins directory if it doesn't exist
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }
  
  // Create plugin directories
  const loggingPluginDir = path.join(pluginsDir, 'logging-plugin');
  const transformPluginDir = path.join(pluginsDir, 'transform-plugin');
  
  if (!fs.existsSync(loggingPluginDir)) {
    fs.mkdirSync(loggingPluginDir, { recursive: true });
  }
  
  if (!fs.existsSync(transformPluginDir)) {
    fs.mkdirSync(transformPluginDir, { recursive: true });
  }
  
  // Create plugin.json configuration
  const pluginConfig = {
    plugins: [
      {
        name: 'logging-plugin',
        description: 'Logs the type generation process',
        version: '0.1.0',
        module: './plugins/logging-plugin',
        options: {
          logFile: './featuretools-plugin.log'
        },
        priority: 100,
        enabled: true
      },
      {
        name: 'transform-plugin',
        description: 'Transforms generated TypeScript types',
        version: '0.1.0',
        module: './plugins/transform-plugin',
        options: {},
        priority: 200,
        enabled: true
      }
    ]
  };
  
  fs.writeFileSync(configPath, JSON.stringify(pluginConfig, null, 2));
  console.log(`Created plugin configuration at ${configPath}`);
  
  return { loggingPluginDir, transformPluginDir };
}

/**
 * Create plugin files
 */
function createPluginFiles(dirs: { loggingPluginDir: string, transformPluginDir: string }) {
  // Create logging plugin
  const loggingPluginCode = `
class LoggingPlugin {
  initialize(config) {
    this.name = config.name;
    this.options = config.options || {};
    this.logFile = this.options.logFile || 'featuretools-plugin.log';
    
    console.log(\`[\${this.name}] Initialized\`);
    this.log('Plugin initialized');
  }

  async onHook(hook, context) {
    this.log(\`Hook triggered: \${hook}\`);
    
    if (!context.pluginData[this.name]) {
      context.pluginData[this.name] = { hooks: [] };
    }
    
    context.pluginData[this.name].hooks.push({
      hook,
      timestamp: new Date().toISOString()
    });
    
    return context;
  }

  cleanup() {
    this.log('Plugin cleanup completed');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = \`[\${timestamp}] [\${this.name}] \${message}\\n\`;
    
    try {
      require('fs').appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error(\`Failed to write to log file: \${error}\`);
    }
  }
}

module.exports = LoggingPlugin;
`;
  
  // Create transform plugin
  const transformPluginCode = `
class TypeTransformPlugin {
  initialize(config) {
    this.name = config.name;
    this.options = config.options || {};
    
    this.transformations = {
      // Add a custom method to EntitySet
      'EntitySet': (tsInterface) => {
        return tsInterface.replace(
          /export interface EntitySet \\{/,
          'export interface EntitySet {\\n  /** Custom helper method added by plugin */\\n  findEntityByName(name: string): Entity | undefined;'
        );
      },
      
      // Make all Entity properties optional for flexibility
      'Entity': (tsInterface) => {
        return tsInterface.replace(
          /([a-zA-Z_][a-zA-Z0-9_]*): /g,
          '$1?: '
        );
      }
    };
    
    console.log(\`[\${this.name}] Initialized\`);
  }

  async onHook(hook, context) {
    if (hook === 'POST_CONVERSION' && context.tsOutput) {
      console.log(\`[\${this.name}] Applying type transformations\`);
      
      let modifiedOutput = context.tsOutput;
      
      for (const [typeName, transformFn] of Object.entries(this.transformations)) {
        const typeRegex = new RegExp(\`export interface \${typeName} \\\\{[\\\\s\\\\S]*?\\\\}\`, 'g');
        modifiedOutput = modifiedOutput.replace(typeRegex, transformFn);
      }
      
      context.tsOutput = modifiedOutput;
    }
    
    return context;
  }

  cleanup() {
    console.log(\`[\${this.name}] Cleanup completed\`);
  }
}

module.exports = TypeTransformPlugin;
`;
  
  // Create package.json files for plugins
  const packageJson = {
    name: "",
    version: "0.1.0",
    description: "",
    main: "index.js",
    keywords: ["featuretools-ts-plugin"],
    author: "Featuretools TypeScript Team",
    license: "MIT"
  };
  
  // Write files
  fs.writeFileSync(path.join(dirs.loggingPluginDir, 'index.js'), loggingPluginCode.trim());
  fs.writeFileSync(path.join(dirs.transformPluginDir, 'index.js'), transformPluginCode.trim());
  
  // Write package.json files with appropriate names and descriptions
  const loggingPackageJson = { 
    ...packageJson, 
    name: "featuretools-ts-logging-plugin",
    description: "A plugin for Featuretools TypeScript that logs type generation process" 
  };
  
  const transformPackageJson = { 
    ...packageJson, 
    name: "featuretools-ts-transform-plugin",
    description: "A plugin for Featuretools TypeScript that transforms generated types" 
  };
  
  fs.writeFileSync(
    path.join(dirs.loggingPluginDir, 'package.json'), 
    JSON.stringify(loggingPackageJson, null, 2)
  );
  
  fs.writeFileSync(
    path.join(dirs.transformPluginDir, 'package.json'), 
    JSON.stringify(transformPackageJson, null, 2)
  );
  
  console.log('Created plugin files in plugin directories');
}

/**
 * Demonstrates how to register and run a plugin
 */
async function demonstratePluginUsage() {
  console.log('\n=== Creating and Running Plugins ===\n');
  
  // Create plugin files and configuration
  const dirs = createPluginConfig();
  createPluginFiles(dirs);
  
  console.log('\nPlugins created. To use these plugins:');
  console.log('1. Run: npm run generate-types');
  console.log('2. The plugins will be automatically discovered and used');
  console.log('3. Check the log file for output from the logging plugin');
  console.log('4. Examine the generated types to see transformations applied');
  
  console.log('\n=== Plugin System Overview ===\n');
  console.log('Featuretools TypeScript plugins can:');
  console.log('• Modify the TypeScript output');
  console.log('• Generate additional files');
  console.log('• Collect statistics');
  console.log('• Extend functionality');
  console.log('• Add documentation');
  
  console.log('\nPlugins are called at these hook points:');
  console.log('• PRE_GENERATION: Before type generation begins');
  console.log('• PRE_CONVERSION: After Python types are extracted');
  console.log('• POST_CONVERSION: After TypeScript is generated');
  console.log('• POST_GENERATION: After generation is complete');
  console.log('• ON_ERROR: When an error occurs');
  
  console.log('\nSee docs/plugin-system.md for detailed documentation');
}

/**
 * Tutorial main function
 */
async function main() {
  try {
    await demonstratePluginUsage();
  } catch (error) {
    console.error('Error in plugin tutorial:', error);
  }
}

// Run the tutorial
if (require.main === module) {
  main().catch(console.error);
} 