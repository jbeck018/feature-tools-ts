# Featuretools TypeScript - JSDoc Enhancer Plugin

A plugin for Featuretools TypeScript that enhances the generated TypeScript types with more detailed JSDoc annotations and examples.

## Features

- Adds comprehensive JSDoc comments to generated interfaces
- Includes usage examples in the documentation
- Enhances IDE experiences with better tooltips and autocomplete
- Supports custom transformations for specific types

## Installation

### Local Installation

1. Copy this directory to your project's `plugins` directory:

```bash
mkdir -p plugins
cp -r examples/plugins/jsdoc-enhancer-plugin plugins/
```

2. The plugin will be automatically discovered when you run the type generation.

### From npm (if published)

```bash
npm install featuretools-ts-jsdoc-enhancer-plugin
```

Then add to your plugins.json:

```json
{
  "plugins": [
    {
      "name": "jsdoc-enhancer",
      "description": "Enhances JSDoc documentation in generated types",
      "version": "0.1.0",
      "module": "featuretools-ts-jsdoc-enhancer-plugin",
      "options": {
        "transformations": {
          "CustomType": "function customTransformer(match, existingDocs, body) { /* custom logic */ }"
        }
      }
    }
  ]
}
```

## Configuration

The plugin accepts the following configuration options:

- `transformations`: An object mapping type names to transformation functions that enhance their JSDoc comments
  - Each transformation is a function that receives the current JSDoc, interface body, and returns the enhanced version

## Usage

Run type generation with plugins enabled:

```bash
npm run generate-types
```

The plugin will automatically enhance JSDoc comments during the type generation process.

## Default Enhancements

By default, the plugin enhances the following types:

- `EntitySet`: Adds detailed description, purpose and example
- `Entity`: Adds information about what entities represent and usage examples
- `FeatureBase`: Adds documentation about feature engineering concepts
- `DFS`: Adds Deep Feature Synthesis documentation with usage examples

## Creating Custom Transformations

You can create custom transformations for specific types by providing them in the plugin configuration:

```javascript
// Example custom transformation
function enhanceCustomType(match, existingDocs, interfaceBody) {
  return `/**
 * Custom documentation for this type.
 * 
 * @example
 * ```typescript
 * // Example usage
 * const customObj = new CustomType();
 * ```
 */
export interface CustomType {${interfaceBody}}`;
}
```

Then add it to your plugin configuration:

```json
{
  "options": {
    "transformations": {
      "CustomType": "enhanceCustomType"
    }
  }
}
```

## Benefits

- Improved developer experience with rich documentation
- Better IDE support with examples and parameter descriptions
- More accessible API for new users
- Type information that's easier to understand

## License

MIT 