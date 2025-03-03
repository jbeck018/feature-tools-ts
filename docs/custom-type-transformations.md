# Custom Type Transformations

This document explains how to use custom type transformations to modify the TypeScript types generated from Python types in the Featuretools TypeScript project.

## Overview

Custom type transformations allow you to:

1. Enhance generated TypeScript types with additional properties or methods
2. Apply specialized type mappings for specific Python classes
3. Create branded or utility types for better type safety
4. Implement domain-specific type adjustments

## Configuration

Custom type transformations can be configured in two ways:

### 1. Using a JSON Configuration File

Create a JSON file with your transformations:

```json
{
  "transformations": {
    "featuretools.entityset.EntitySet.id": "string & { readonly __entitySetId: unique symbol }",
    "pandas.core.frame.DataFrame": "DataFrame<Record<string, unknown>>",
    "featuretools.feature_base.feature_base.FeatureBase": {
      "function": "your_module.transforms.transform_feature"
    }
  }
}
```

Then set the environment variable before running type generation:

```bash
export CUSTOM_TRANSFORMS_PATH=./path/to/transforms.json
npm run generate-types
```

### 2. Using the TypeScript Configuration API

You can define transformations in your TypeScript code:

```typescript
import { FeatureToolsConfig } from 'featuretools-ts';

const config: FeatureToolsConfig = {
  typeMapping: {
    transformations: {
      'featuretools.entityset.EntitySet.id': (baseType) => 
        'string & { readonly __entitySetId: unique symbol }',
      'pandas.core.frame.DataFrame': (baseType) => 
        'DataFrame<Record<string, unknown>>'
    }
  }
};

// Apply the configuration
applyConfig(config);
```

## Transformation Types

### String Replacements

The simplest form of transformation is a string replacement:

```json
{
  "transformations": {
    "numpy.ndarray": "Array<number> & { shape: number[] }"
  }
}
```

You can use `{BASE_TYPE}` as a placeholder for the original type:

```json
{
  "transformations": {
    "featuretools.Feature": "{BASE_TYPE} & { getParentEntityId(): string }"
  }
}
```

### Function Transformations

For more complex transformations, you can use a function:

```json
{
  "transformations": {
    "featuretools.EntitySet": {
      "function": "my_module.transformations.transform_entity_set"
    }
  }
}
```

Then implement the function in your Python code:

```python
# my_module/transformations.py
def transform_entity_set(base_type, py_type):
    """Custom transformation for EntitySet"""
    return f"{base_type} & {{ getEntityById(id: string): Entity | undefined }}"
```

## Examples

### Branded Types

Create branded types for better type safety:

```typescript
// Type is string but cannot be assigned to other string variables
type EntityId = string & { readonly __entityId: unique symbol };
```

### Enhanced Utility Types

Add utility methods to generated types:

```typescript
// Add validation methods
type Feature = BaseFeature & {
  isValid(): boolean;
  getEntityName(): string;
};
```

### Type Guards

Add type guard capabilities:

```typescript
type EntitySet = BaseEntitySet & {
  isEntitySet(obj: unknown): obj is EntitySet;
};
```

## Advanced Usage

### Type Transformation with Generics

```typescript
// Transform a type to use generics
type DataFrame<T> = {
  columns: (keyof T)[];
  get(column: keyof T): Array<T[keyof T]>;
};

// Then use in transformation
const transform = (baseType) => `DataFrame<Record<string, unknown>>`;
```

### Conditional Transformations

Your transformation function can examine the Python type and make decisions:

```python
def transform_by_attributes(base_type, py_type):
    """Apply different transformations based on attributes"""
    if hasattr(py_type, 'is_feature'):
        return f"{base_type} & {{ feature: true }}"
    elif hasattr(py_type, 'is_entity'):
        return f"{base_type} & {{ entity: true }}"
    return base_type
```

## Best Practices

1. **Keep transformations focused**: Each transformation should have a clear purpose
2. **Document your transformations**: Add comments explaining what each transformation does
3. **Use type-safe patterns**: Follow TypeScript best practices in your transformations
4. **Test thoroughly**: Verify that transformed types work correctly in practice
5. **Be cautious with inheritance**: When transforming base classes, consider how it affects derived classes

## Limitations

- Circular type references may not transform correctly
- Excessive transformations may slow down type generation
- Some complex Python types may not be fully representable in TypeScript

## Reference

For more details, see the [TypeScript Configuration API](../src/types/config.ts) and the [example transformations](../examples/custom-transformations.ts). 