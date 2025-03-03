# TypeScript 4.9+ Features in Featuretools-TS

This document describes the TypeScript 4.9+ features implemented in the Featuretools TypeScript bridge and how to use them effectively.

## Overview

Starting with version 4.9, TypeScript introduced several powerful features that enhance type safety and developer experience. The Featuretools TypeScript bridge leverages these features to provide more precise types, improved type inference, and better performance.

Key features implemented:

- **Satisfies Operator**: Type validation without changing the inferred type
- **Improved Union Types**: More specific type inference with `PreferType`
- **Const Assertions**: Better performance with `const enum` declarations
- **Enhanced Type Guards**: More precise type narrowing with custom type guards

## Enabling TypeScript 4.9+ Features

TypeScript 4.9+ features can be enabled in several ways:

### Command Line

When generating types, add the `--ts49-features` flag:

```bash
npm run generate-types -- --ts49-features
```

To disable these features:

```bash
npm run generate-types -- --no-ts49-features
```

### Environment Variables

Set the `USE_TS_49_FEATURES` environment variable:

```bash
USE_TS_49_FEATURES=true npm run generate-types
```

### Configuration

The default is to enable TypeScript 4.9+ features unless explicitly disabled.

## Utility Types

The implementation includes a utility module at `src/types/ts-features.ts` that provides several helper types and functions:

### Satisfies Type

```typescript
type Satisfies<T, U> = T extends U ? T : never;
```

This type utility provides a similar check to the `satisfies` operator in TypeScript 4.9+. It's used for validating that a type conforms to a specific shape without changing the inferred type.

### PreferType

```typescript
type PreferType<T, U> = T | Exclude<U, T>;
```

Improves handling of union types by preserving more specific types first. This is especially useful for nullable types where you want the non-null variant to be preferred in type inference.

### Type Narrowing Functions

```typescript
function hasProperty<K extends string>(obj: object, prop: K): obj is Record<K, unknown>;
```

Provides stronger type guards for narrowing types in conditional blocks.

### Method Extraction

```typescript
type ExtractMethod<T, K extends keyof T> = T[K] extends (...args: infer A) => infer R ? (...args: A) => R : never;
```

Allows extracting method signatures from classes or interfaces.

## Usage Examples

### Satisfies Operator

```typescript
// Using the satisfies operator with a FeatureDefinition
const myFeature = {
  name: "customer_age",
  entity: "customers",
  type: "numeric"
} satisfies Record<string, unknown>;
```

### Preferring More Specific Types

```typescript
// Instead of string | null, use PreferType for better inference
function getEntityName(id?: string): PreferType<string, null> {
  return id || null;
}

const name = getEntityName("customers");
// name is inferred as string instead of string | null
```

### Const Enums

```typescript
// Generated as const enum for better performance
const enum FeatureType {
  Numeric = "numeric",
  Categorical = "categorical",
  Datetime = "datetime"
}
```

### Property Type Guards

```typescript
// Using the hasProperty type guard
function processEntity(entity: unknown): string {
  if (hasProperty(entity, "id") && typeof entity.id === "string") {
    return entity.id; // entity.id is correctly typed as string
  }
  return "unknown";
}
```

## Implementation Details

The TypeScript 4.9+ features are integrated at several levels:

1. **Type Generation Script**: Detects environment variables and processes command-line options
2. **Python Type Extraction**: Enhances extracted types with TypeScript 4.9+ specific features
3. **Output Processing**: Transforms standard TypeScript to use 4.9+ features when enabled
4. **Utility Module**: Provides helpers that work even in older TypeScript versions

## Compatibility

These features require TypeScript 4.9 or later. If you're using an older version, you can disable these features with the `--no-ts49-features` flag.

The implementation is designed to be backward compatible, so projects using older TypeScript versions can still use the generated types by disabling the 4.9+ features.

## Performance Benefits

- **Const Enums**: Inline values at compile time, reducing runtime overhead
- **Improved Type Inference**: Reduces the need for type assertions
- **More Precise Types**: Catches more errors at compile time 