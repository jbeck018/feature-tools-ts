import type { PluginDefinition, Plugin, PluginHook, PluginContext } from '../types/config';
import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * Manages plugin loading and execution
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginConfigs: Map<string, PluginDefinition> = new Map();
  private initialized = false;
  private logger = {
    info: (message: string) => console.log(`[Plugin] ${message}`),
    warn: (message: string) => console.warn(`[Plugin] ${message}`),
    error: (message: string) => console.error(`[Plugin] ${message}`),
    debug: (message: string) => {
      if (process.env.DEBUG) {
        console.debug(`[Plugin Debug] ${message}`);
      }
    }
  };

  /**
   * Create a new plugin manager
   * @param pluginDefs Plugin definitions to load
   */
  constructor(private pluginDefs: PluginDefinition[] = []) {}

  /**
   * Initialize and load all plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Sort plugins by priority
    const sortedPlugins = [...this.pluginDefs].sort((a, b) => {
      return (a.priority ?? 100) - (b.priority ?? 100);
    });

    // Initialize each plugin
    for (const pluginDef of sortedPlugins) {
      if (pluginDef.enabled === false) {
        this.logger.info(`Skipping disabled plugin: ${pluginDef.name}`);
        continue;
      }

      try {
        const plugin = await this.loadPlugin(pluginDef);
        this.plugins.set(pluginDef.name, plugin);
        this.pluginConfigs.set(pluginDef.name, pluginDef);
        this.logger.info(`Loaded plugin: ${pluginDef.name} v${pluginDef.version}`);
      } catch (error) {
        this.logger.error(`Failed to load plugin ${pluginDef.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.initialized = true;
  }

  /**
   * Load a plugin from its definition
   */
  private async loadPlugin(pluginDef: PluginDefinition): Promise<Plugin> {
    try {
      // Determine if this is a local module or an npm module
      let modulePath = pluginDef.module;
      
      // Check if it's a relative path
      if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
        modulePath = path.resolve(process.cwd(), modulePath);
        if (!fs.existsSync(modulePath)) {
          throw new Error(`Plugin module not found: ${modulePath}`);
        }
      }

      // Import the plugin module
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pluginModule = require(modulePath);
      
      // Get the plugin constructor or object
      const PluginConstructor = pluginModule.default || pluginModule;
      
      // Create plugin instance
      let plugin: Plugin;
      if (typeof PluginConstructor === 'function') {
        plugin = new PluginConstructor();
      } else if (typeof PluginConstructor === 'object') {
        plugin = PluginConstructor;
      } else {
        throw new Error(`Invalid plugin export: ${typeof PluginConstructor}`);
      }
      
      // Initialize the plugin
      plugin.initialize(pluginDef);
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginDef.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute all plugins for a specific hook
   * @param hook The hook to execute
   * @param context Context data for the hook
   * @returns Updated context after all plugins have processed it
   */
  async executeHook(hook: PluginHook, context: PluginContext): Promise<PluginContext> {
    if (!this.initialized) {
      await this.initialize();
    }

    let currentContext = { ...context };
    
    // Add logger to context
    currentContext.logger = this.logger;
    
    // Execute each plugin
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        const result = await Promise.resolve(plugin.onHook(hook, currentContext));
        
        // Update context with plugin result
        if (result) {
          currentContext = result;
          
          // Always ensure logger is present
          if (!currentContext.logger) {
            currentContext.logger = this.logger;
          }
        }
      } catch (error) {
        this.logger.error(`Error executing plugin ${name} for hook ${hook}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return currentContext;
  }

  /**
   * Clean up all plugins
   */
  async cleanup(): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        if (plugin.cleanup) {
          await Promise.resolve(plugin.cleanup());
        }
      } catch (error) {
        this.logger.error(`Error cleaning up plugin ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    this.plugins.clear();
    this.pluginConfigs.clear();
    this.initialized = false;
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): Map<string, Plugin> {
    return new Map(this.plugins);
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if a plugin is loaded
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }
} 