import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin, PluginDefinition, PluginHook, PluginContext, PluginsConfig } from './types/config';

/**
 * PluginManager class responsible for loading and executing plugins
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginConfigs: Map<string, PluginDefinition> = new Map();
  private initialized = false;
  private pluginsEnabled = true;
  
  /**
   * Creates a new PluginManager instance
   */
  constructor() {
    // Check if plugins are disabled via environment variable
    if (process.env.DISABLE_PLUGINS === 'true' || process.env.DISABLE_PLUGINS === '1') {
      this.pluginsEnabled = false;
      console.log('Plugins are disabled via DISABLE_PLUGINS environment variable');
    }
  }
  
  /**
   * Initialize the plugin manager by loading plugins from the configuration
   */
  public async initialize(): Promise<void> {
    if (this.initialized || !this.pluginsEnabled) {
      return;
    }
    
    try {
      await this.loadPluginsFromConfig();
      await this.loadPluginsFromDirectory();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error);
      throw error;
    }
  }
  
  /**
   * Execute a hook on all registered plugins
   * @param hook The hook to execute
   * @param context The context to pass to the plugins
   * @returns Updated context after all plugins have processed it
   */
  public async executeHook(hook: PluginHook, context: PluginContext): Promise<PluginContext> {
    if (!this.initialized || !this.pluginsEnabled) {
      return context;
    }
    
    const debug = process.env.DEBUG === 'true' || process.env.DEBUG === '1';
    
    // Sort plugins by priority
    const sortedPlugins = [...this.plugins.entries()]
      .map(([name, plugin]) => ({
        name,
        plugin,
        config: this.pluginConfigs.get(name) || {
          name,
          description: 'Unknown plugin',
          version: '0.0.0',
          module: '',
          priority: 100
        }
      }))
      .filter(entry => entry.config.enabled !== false)
      .sort((a, b) => {
        const priorityA = a.config.priority ?? 100;
        const priorityB = b.config.priority ?? 100;
        return priorityA - priorityB;
      });
    
    // Execute plugins in order
    let currentContext = { ...context };
    
    for (const { name, plugin } of sortedPlugins) {
      try {
        if (debug) {
          console.log(`Executing plugin ${name} for hook ${hook}`);
          const startTime = Date.now();
          currentContext = await plugin.onHook(hook, currentContext);
          console.log(`Plugin ${name} executed in ${Date.now() - startTime}ms`);
        } else {
          currentContext = await plugin.onHook(hook, currentContext);
        }
      } catch (error) {
        console.error(`Error executing plugin ${name} for hook ${hook}:`, error);
        // Continue with other plugins even if one fails
      }
    }
    
    return currentContext;
  }
  
  /**
   * Clean up all loaded plugins
   */
  public cleanup(): void {
    if (!this.initialized || !this.pluginsEnabled) {
      return;
    }
    
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        if (typeof plugin.cleanup === 'function') {
          plugin.cleanup();
        }
      } catch (error) {
        console.error(`Error cleaning up plugin ${name}:`, error);
      }
    }
    
    this.plugins.clear();
    this.pluginConfigs.clear();
    this.initialized = false;
  }
  
  /**
   * Load plugins from the configuration file
   */
  private async loadPluginsFromConfig(): Promise<void> {
    const configPath = process.env.PLUGINS_CONFIG || './plugins.json';
    
    if (!fs.existsSync(configPath)) {
      console.log(`Plugins configuration file not found at ${configPath}`);
      return;
    }
    
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config: PluginsConfig = JSON.parse(configContent);
      
      if (!config.plugins || !Array.isArray(config.plugins)) {
        console.warn('Invalid plugins configuration: plugins array is missing');
        return;
      }
      
      for (const pluginConfig of config.plugins) {
        try {
          await this.loadPlugin(pluginConfig);
        } catch (error) {
          console.error(`Failed to load plugin ${pluginConfig.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load plugins from configuration:', error);
    }
  }
  
  /**
   * Load plugins from the plugins directory
   */
  private async loadPluginsFromDirectory(): Promise<void> {
    const pluginsDir = process.env.PLUGINS_DIR || './plugins';
    
    if (!fs.existsSync(pluginsDir)) {
      return;
    }
    
    // Get all subdirectories in the plugins directory
    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    const dirs = entries.filter(entry => entry.isDirectory());
    
    for (const dir of dirs) {
      const pluginDir = path.join(pluginsDir, dir.name);
      const packageJsonPath = path.join(pluginDir, 'package.json');
      
      // Skip directories without package.json
      if (!fs.existsSync(packageJsonPath)) {
        continue;
      }
      
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        // Check if this is a Featuretools TypeScript plugin
        if (packageJson.keywords?.includes('featuretools-ts-plugin')) {
          const pluginConfig: PluginDefinition = {
            name: packageJson.name,
            description: packageJson.description || `Plugin from ${dir.name}`,
            version: packageJson.version || '0.0.0',
            module: `./${path.relative(process.cwd(), pluginDir)}`,
            enabled: true,
            priority: 100
          };
          
          // Skip if already loaded from config
          if (this.pluginConfigs.has(pluginConfig.name)) {
            continue;
          }
          
          await this.loadPlugin(pluginConfig);
        }
      } catch (error) {
        console.error(`Failed to load plugin from directory ${dir.name}:`, error);
      }
    }
  }
  
  /**
   * Load a single plugin
   * @param config Plugin configuration
   */
  private async loadPlugin(config: PluginDefinition): Promise<void> {
    // Skip disabled plugins
    if (config.enabled === false) {
      console.log(`Plugin ${config.name} is disabled, skipping`);
      this.pluginConfigs.set(config.name, config);
      return;
    }
    
    try {
      // Load the plugin module
      const pluginModule = require(config.module);
      const PluginClass = pluginModule.default || pluginModule;
      
      // Create plugin instance
      const plugin: Plugin = typeof PluginClass === 'function' 
        ? new PluginClass() 
        : PluginClass;
      
      // Check if it implements the Plugin interface
      if (!plugin || typeof plugin.initialize !== 'function' || typeof plugin.onHook !== 'function') {
        throw new Error(`Plugin ${config.name} does not implement the Plugin interface`);
      }
      
      // Initialize the plugin
      plugin.initialize(config);
      
      // Store the plugin
      this.plugins.set(config.name, plugin);
      this.pluginConfigs.set(config.name, config);
      
      console.log(`Plugin ${config.name} v${config.version} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load plugin ${config.name}:`, error);
      throw error;
    }
  }
} 