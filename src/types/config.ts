/**
 * Configuration types for Featuretools TypeScript
 */

/**
 * Type generation configuration
 */
export interface TypeGenerationConfig {
  /**
   * Python script path to use for type generation
   * @default 'src/python/generate_types.py'
   */
  pythonScript: string;
  
  /**
   * Output file path for generated TypeScript types
   * @default 'src/types/generated.ts'
   */
  outputFile: string;
  
  /**
   * Python executable path
   * @default 'python'
   */
  pythonPath: string;
  
  /**
   * Enable verbose logging
   * @default false
   */
  verbose: boolean;
  
  /**
   * Force regeneration of types even if not needed
   * @default false
   */
  force: boolean;
  
  /**
   * Cache file path to store metadata about previous type generation
   * @default '.types-cache.json'
   */
  cacheFile: string;
}

/**
 * Python type mapping configuration
 */
export interface TypeMappingConfig {
  /**
   * Map of Python types to TypeScript types
   */
  typeMap: Record<string, string>;
  
  /**
   * Custom type handlers for complex Python types
   */
  customHandlers?: Record<string, (type: unknown) => string>;
  
  /**
   * Types to exclude from generation
   */
  excludeTypes?: string[];
  
  /**
   * Types to include in generation (overrides excludeTypes)
   */
  includeTypes?: string[];

  /**
   * Custom transformations for specific Python types
   * Key is the full Python type name, value is a transformation function
   * that takes the TypeScript representation and returns a modified version
   */
  transformations?: Record<string, TypeTransformation>;
}

/**
 * Type transformation function
 * @param baseType The base TypeScript type generated for the Python type
 * @param pythonType The original Python type information
 * @returns The transformed TypeScript type
 */
export type TypeTransformation = (baseType: string, pythonType?: unknown) => string;

/**
 * Custom transformation configuration with metadata
 */
export interface TransformationDefinition {
  /**
   * Source Python type name (fully qualified)
   */
  sourceType: string;
  
  /**
   * Description of the transformation
   */
  description: string;
  
  /**
   * The transformation function
   */
  transform: TypeTransformation;
  
  /**
   * Whether to apply to subtypes/derived types
   * @default false
   */
  applyToSubtypes?: boolean;
}

/**
 * Runtime validation configuration
 */
export interface ValidationConfig {
  /**
   * Enable runtime validation of types
   * @default false
   */
  enabled: boolean;
  
  /**
   * Throw error on validation failure
   * @default true
   */
  throwOnError: boolean;
  
  /**
   * Log validation failures
   * @default true
   */
  logErrors: boolean;
  
  /**
   * Types to exclude from validation
   */
  excludeTypes?: string[];
}

/**
 * Plugin hook points that plugins can register for
 */
export type PluginHook = 
  | 'PRE_GENERATION' 
  | 'PRE_CONVERSION' 
  | 'POST_CONVERSION' 
  | 'POST_GENERATION'
  | 'ON_ERROR';

/**
 * Plugin definition in configuration
 */
export interface PluginDefinition {
  /** Unique name of the plugin */
  name: string;
  
  /** Description of what the plugin does */
  description: string;
  
  /** Plugin version */
  version: string;
  
  /** Path to plugin module or npm package name */
  module: string;
  
  /** Plugin-specific options */
  options?: Record<string, unknown>;
  
  /** Execution priority (lower numbers execute first) */
  priority?: number;
  
  /** Whether the plugin is enabled */
  enabled?: boolean;
}

/**
 * Context object passed to plugin hooks
 */
export interface PluginContext {
  /** Current configuration */
  config: Record<string, unknown>;
  
  /** Metadata about the generation process */
  metadata: {
    /** Start time of generation */
    startTime: number;
    
    /** Whether regeneration is forced */
    forceRegeneration?: boolean;
    
    /** Cache information */
    cache?: {
      /** Whether cache is valid */
      valid: boolean;
      /** Last generation timestamp */
      lastGenerated?: number;
    };
    
    /** Environment variables for Python process */
    env?: Record<string, string>;
    
    /** Success status */
    success?: boolean;
    
    /** Error information */
    error?: Error;
  };
  
  /** Extracted Python types (available in PRE_CONVERSION and later) */
  pythonTypes?: Record<string, unknown>;
  
  /** Generated TypeScript output (available in POST_CONVERSION and later) */
  tsOutput?: string;
  
  /** Plugin-specific data that can be shared between plugins */
  pluginData: Record<string, unknown>;
}

/**
 * Plugin interface that all plugins must implement
 */
export interface Plugin {
  /**
   * Initialize the plugin with its configuration
   * @param config Plugin configuration from plugins.json
   */
  initialize(config: PluginDefinition): void;
  
  /**
   * Handle a plugin hook call
   * @param hook The hook being called
   * @param context Context object containing data relevant to the hook
   * @returns Updated context object
   */
  onHook(hook: PluginHook, context: PluginContext): Promise<PluginContext> | PluginContext;
  
  /**
   * Clean up any resources used by the plugin
   */
  cleanup?(): void;
}

/**
 * Plugin configuration file structure
 */
export interface PluginsConfig {
  /** List of configured plugins */
  plugins: PluginDefinition[];
}

/**
 * Main Configuration interface
 */
export interface FeatureToolsConfig {
  /**
   * Python bridge configuration
   */
  python?: {
    /**
     * Python executable path
     * @default 'python'
     */
    pythonPath?: string;
    
    /**
     * Timeout for Python operations in milliseconds
     * @default 30000
     */
    timeout?: number;
  };
  
  /**
   * Type generation configuration
   */
  typeGeneration?: Partial<TypeGenerationConfig>;
  
  /**
   * Type mapping configuration
   */
  typeMapping?: TypeMappingConfig;
  
  /**
   * Validation configuration
   */
  validation?: ValidationConfig;

  /**
   * Plugins for extending functionality
   */
  plugins?: PluginDefinition[];
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: FeatureToolsConfig = {
  python: {
    pythonPath: 'python',
    timeout: 30000
  },
  validation: {
    enabled: false,
    throwOnError: true,
    logErrors: true
  }
}; 