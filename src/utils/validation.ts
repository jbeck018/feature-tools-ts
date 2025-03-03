/**
 * Runtime type validation utilities for Featuretools TypeScript
 */
import type { ValidationConfig } from '../types/config';

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
  constructor(message: string, public readonly value: unknown, public readonly expectedType: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Basic type validator functions
 */
const validators = {
  string: (value: unknown): value is string => typeof value === 'string',
  number: (value: unknown): value is number => typeof value === 'number' && !Number.isNaN(value),
  boolean: (value: unknown): value is boolean => typeof value === 'boolean',
  null: (value: unknown): value is null => value === null,
  undefined: (value: unknown): value is undefined => value === undefined,
  array: (value: unknown): value is unknown[] => Array.isArray(value),
  object: (value: unknown): value is Record<string, unknown> => 
    typeof value === 'object' && value !== null && !Array.isArray(value),
  any: () => true,
  
  // For more complex types
  EntitySet: (value: unknown): boolean => 
    typeof value === 'object' && 
    value !== null && 
    'id' in value && 
    'entities' in value && 
    'relationships' in value,
    
  Entity: (value: unknown): boolean => 
    typeof value === 'object' && 
    value !== null && 
    'id' in value && 
    'df' in value && 
    'index' in value,
    
  Relationship: (value: unknown): boolean => 
    typeof value === 'object' && 
    value !== null && 
    'parent_entity' in value && 
    'parent_variable' in value && 
    'child_entity' in value && 
    'child_variable' in value,
};

/**
 * Configuration for validation behavior
 */
let validationConfig: ValidationConfig = {
  enabled: false,
  throwOnError: true,
  logErrors: true
};

/**
 * Configure the validation behavior
 */
export function configureValidation(config: Partial<ValidationConfig>): void {
  validationConfig = { ...validationConfig, ...config };
}

/**
 * Validate that a value matches the expected type
 * 
 * @param value The value to validate
 * @param expectedType The expected type name
 * @param options Optional validation options that override global config
 * @returns The value if valid, throws or logs error if invalid
 */
export function validate<T>(
  value: unknown, 
  expectedType: string, 
  options?: Partial<ValidationConfig>
): T {
  // Combine global config with per-call options
  const config = { ...validationConfig, ...(options || {}) };
  
  // Skip validation if disabled
  if (!config.enabled) {
    return value as T;
  }
  
  // Skip validation for excluded types
  if (config.excludeTypes?.includes(expectedType)) {
    return value as T;
  }
  
  // Get validator function
  const validator = validators[expectedType as keyof typeof validators] || validators.any;
  
  // Perform validation
  if (validator(value)) {
    return value as T;
  }
  
  // Handle validation failure
  const errorMessage = `Validation error: Expected ${expectedType}, but got ${typeof value}`;
  
  // Log error if configured
  if (config.logErrors) {
    console.error(errorMessage, { value });
  }
  
  // Throw error if configured
  if (config.throwOnError) {
    throw new ValidationError(errorMessage, value, expectedType);
  }
  
  // Return value anyway if not throwing
  return value as T;
}

/**
 * Register a custom validator for a type
 * 
 * @param typeName The name of the type to validate
 * @param validatorFn The validation function
 */
export function registerValidator(
  typeName: string, 
  validatorFn: (value: unknown) => boolean
): void {
  (validators as Record<string, (value: unknown) => boolean>)[typeName] = validatorFn;
}

/**
 * Generate a validator for an object with specific properties
 * 
 * @param properties The properties to validate
 * @returns A validator function
 */
export function objectValidator(
  properties: Record<string, string>
): (value: unknown) => boolean {
  return (value: unknown): boolean => {
    if (!validators.object(value)) {
      return false;
    }
    
    const obj = value as Record<string, unknown>;
    
    // Check each required property
    for (const [key, type] of Object.entries(properties)) {
      if (!(key in obj)) {
        return false;
      }
      
      const propValidator = validators[type as keyof typeof validators] || validators.any;
      if (!propValidator(obj[key])) {
        return false;
      }
    }
    
    return true;
  };
}

/**
 * Generate validators for all types in the generated file
 * This is a placeholder for now - would be auto-generated in the future
 */
export function generateValidators(): void {
  // This would parse the generated.ts file and create validators for each interface
  // For now, we have manually defined validators for the core types
}

// Initialize validators
generateValidators(); 