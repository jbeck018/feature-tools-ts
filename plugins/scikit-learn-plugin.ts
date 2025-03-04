import type { Plugin, PluginDefinition, PluginHook, PluginContext } from '../src/types/config';

/**
 * Scikit-learn Plugin for Featuretools TypeScript
 * 
 * This plugin adds support for scikit-learn types and integrates them with Featuretools
 */
export default class ScikitLearnPlugin implements Plugin {
  private config: PluginDefinition;
  private initialized = false;

  /**
   * Initialize the plugin with its configuration
   */
  initialize(config: PluginDefinition): void {
    this.config = config;
    this.initialized = true;
    console.log(`Initialized ${this.config.name} v${this.config.version}`);
  }

  /**
   * Handle plugin hook calls
   */
  async onHook(hook: PluginHook, context: PluginContext): Promise<PluginContext> {
    if (!this.initialized) {
      return context;
    }

    switch (hook) {
      case 'PRE_GENERATION':
        return this.handlePreGeneration(context);
      case 'PRE_CONVERSION':
        return this.handlePreConversion(context);
      case 'POST_CONVERSION':
        return this.handlePostConversion(context);
      default:
        return context;
    }
  }

  /**
   * Handle pre-generation hook
   * Add scikit-learn to the Python environment variables
   */
  private handlePreGeneration(context: PluginContext): PluginContext {
    // Add scikit-learn to the Python environment
    if (!context.metadata.env) {
      context.metadata.env = {};
    }
    
    context.metadata.env.INCLUDE_SCIKIT_LEARN = 'true';
    
    // Store plugin-specific data
    context.pluginData.scikitLearn = {
      enabled: true,
      version: this.config.version,
      options: this.config.options || {}
    };
    
    return context;
  }

  /**
   * Handle pre-conversion hook
   * Process Python types before conversion to TypeScript
   */
  private handlePreConversion(context: PluginContext): PluginContext {
    if (!context.pythonTypes) {
      return context;
    }

    // Add scikit-learn type mappings
    const typeMap = (context.config.typeMapping as Record<string, unknown>)?.typeMap || {};
    
    // Add scikit-learn specific type mappings
    const scikitLearnMappings = {
      'sklearn.base.BaseEstimator': 'ScikitLearnBaseEstimator',
      'sklearn.pipeline.Pipeline': 'ScikitLearnPipeline',
      'sklearn.ensemble.RandomForestClassifier': 'RandomForestClassifier',
      'sklearn.ensemble.RandomForestRegressor': 'RandomForestRegressor',
      'sklearn.linear_model.LogisticRegression': 'LogisticRegression',
      'sklearn.linear_model.LinearRegression': 'LinearRegression',
      'sklearn.cluster.KMeans': 'KMeans',
      'sklearn.preprocessing.StandardScaler': 'StandardScaler',
      'sklearn.preprocessing.MinMaxScaler': 'MinMaxScaler',
      'sklearn.model_selection.train_test_split': 'TrainTestSplit',
      'sklearn.metrics.accuracy_score': 'AccuracyScore',
      'sklearn.metrics.mean_squared_error': 'MeanSquaredError'
    };
    
    Object.assign(typeMap, scikitLearnMappings);
    
    // Update the context with the new type mappings
    if (!context.config.typeMapping) {
      context.config.typeMapping = { typeMap };
    } else {
      (context.config.typeMapping as Record<string, unknown>).typeMap = typeMap;
    }
    
    return context;
  }

  /**
   * Handle post-conversion hook
   * Process TypeScript output after conversion
   */
  private handlePostConversion(context: PluginContext): PluginContext {
    if (!context.tsOutput) {
      return context;
    }

    // Add scikit-learn interfaces to the TypeScript output
    const scikitLearnInterfaces = `
/**
 * Scikit-learn TypeScript interfaces
 * Generated by scikit-learn-plugin v${this.config.version}
 */

/**
 * Base estimator interface for all scikit-learn models
 */
export interface ScikitLearnBaseEstimator {
  fit(X: number[][] | Record<string, number>[], y?: number[] | string[]): ScikitLearnBaseEstimator;
  predict(X: number[][] | Record<string, number>[]): number[] | string[];
  score(X: number[][] | Record<string, number>[], y: number[] | string[]): number;
}

/**
 * Pipeline for chaining multiple estimators
 */
export interface ScikitLearnPipeline extends ScikitLearnBaseEstimator {
  steps: [string, ScikitLearnBaseEstimator][];
}

/**
 * Random Forest Classifier
 */
export interface RandomForestClassifier extends ScikitLearnBaseEstimator {
  n_estimators?: number;
  criterion?: 'gini' | 'entropy' | 'log_loss';
  max_depth?: number | null;
  feature_importances_?: number[];
}

/**
 * Random Forest Regressor
 */
export interface RandomForestRegressor extends ScikitLearnBaseEstimator {
  n_estimators?: number;
  criterion?: 'squared_error' | 'absolute_error' | 'poisson';
  max_depth?: number | null;
  feature_importances_?: number[];
}

/**
 * Logistic Regression
 */
export interface LogisticRegression extends ScikitLearnBaseEstimator {
  penalty?: 'l1' | 'l2' | 'elasticnet' | 'none';
  C?: number;
  solver?: 'newton-cg' | 'lbfgs' | 'liblinear' | 'sag' | 'saga';
  coef_?: number[][];
}

/**
 * Linear Regression
 */
export interface LinearRegression extends ScikitLearnBaseEstimator {
  fit_intercept?: boolean;
  normalize?: boolean;
  coef_?: number[];
  intercept_?: number;
}

/**
 * K-Means clustering
 */
export interface KMeans extends ScikitLearnBaseEstimator {
  n_clusters?: number;
  init?: 'k-means++' | 'random';
  n_init?: number;
  cluster_centers_?: number[][];
  labels_?: number[];
}

/**
 * Standard Scaler
 */
export interface StandardScaler extends ScikitLearnBaseEstimator {
  with_mean?: boolean;
  with_std?: boolean;
  scale_?: number[];
  mean_?: number[];
  var_?: number[];
  transform(X: number[][] | Record<string, number>[]): number[][];
  inverse_transform(X: number[][] | Record<string, number>[]): number[][];
}

/**
 * Min-Max Scaler
 */
export interface MinMaxScaler extends ScikitLearnBaseEstimator {
  feature_range?: [number, number];
  min_?: number[];
  scale_?: number[];
  transform(X: number[][] | Record<string, number>[]): number[][];
  inverse_transform(X: number[][] | Record<string, number>[]): number[][];
}

/**
 * Train-test split function type
 */
export type TrainTestSplit = (
  X: unknown[],
  y: unknown[],
  options?: {
    test_size?: number;
    train_size?: number;
    random_state?: number;
    shuffle?: boolean;
    stratify?: unknown[];
  }
) => [unknown[], unknown[], unknown[], unknown[]];

/**
 * Accuracy score function type
 */
export type AccuracyScore = (
  y_true: unknown[],
  y_pred: unknown[],
  options?: {
    normalize?: boolean;
    sample_weight?: number[];
  }
) => number;

/**
 * Mean squared error function type
 */
export type MeanSquaredError = (
  y_true: number[],
  y_pred: number[],
  options?: {
    sample_weight?: number[];
    multioutput?: 'uniform_average' | 'raw_values' | number[];
    squared?: boolean;
  }
) => number | number[];

/**
 * Integration with Featuretools
 */
export interface ScikitLearnFeatureTools {
  /**
   * Create a feature using a scikit-learn transformer
   */
  createTransformerFeature(
    transformer: StandardScaler | MinMaxScaler,
    input_features: unknown[],
    name?: string
  ): unknown;
  
  /**
   * Create a feature using a scikit-learn model
   */
  createModelFeature(
    model: ScikitLearnBaseEstimator,
    input_features: unknown[],
    name?: string
  ): unknown;
}
`;

    // Append scikit-learn interfaces to the TypeScript output
    context.tsOutput = `${context.tsOutput}\n${scikitLearnInterfaces}`;
    
    return context;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.initialized = false;
    console.log(`Cleaned up ${this.config.name}`);
  }
} 