# Featuretools TypeScript

A TypeScript bridge for the Featuretools Python package, providing type-safe access to Featuretools functionality.

## Features

- Type-safe access to Featuretools functionality
- Auto-generated TypeScript interfaces from Python types
- Simple API for feature engineering

## Installation

```bash
npm install featuretools-ts
```

Make sure you have Python installed with the Featuretools package:

```bash
pip install featuretools
```

## Usage

```typescript
import FeatureTools from 'featuretools-ts';

async function example() {
  // Initialize FeatureTools
  const ft = new FeatureTools();
  await ft.initialize();
  
  // Create an EntitySet
  const entityset = await ft.entitySet.create('my_entityset');
  
  // Add entities, relationships, and perform DFS
  // ...
  
  // Clean up when done
  ft.close();
}

example().catch(console.error);
```

## Type Generation

This package includes auto-generated TypeScript types directly from the Python Featuretools package. This ensures that the TypeScript interfaces match the actual Python implementation.

The types are automatically generated during the build process using Python introspection. If you want to regenerate the types manually:

```bash
npm run generate-types
```

### TypeScript 4.9+ Features

This package supports enhanced TypeScript features introduced in TypeScript 4.9 and later:

- **Satisfies Operator**: Validate object literals against interfaces while preserving literal types
- **Improved Union Types**: Better type inference with `PreferType<T, U>` utility
- **Const Assertions**: Optimal performance with `const enum` declarations
- **Type Guards**: Enhanced type narrowing with custom property checks

To generate types with TypeScript 4.9+ features enabled:

```bash
npm run generate-types -- --ts49-features
```

Or using environment variables:

```bash
USE_TS_49_FEATURES=1 npm run generate-types
```

For more details and examples, see [docs/typescript-4.9-features.md](docs/typescript-4.9-features.md) and check out the [examples/typescript-4.9-features.ts](examples/typescript-4.9-features.ts) file.

### Performance Optimizations

The type generation system includes several performance optimizations:

- **Smart caching**: Types are only regenerated when the source Python code changes
- **Parallel processing**: Uses multiple CPU cores for faster processing on large codebases
- **Memory efficiency**: Optimized memory usage for handling large type definitions
- **Incremental updates**: Avoids redundant type processing

To force regeneration of types regardless of the cache:

```bash
npm run generate-types -- --force
```

For detailed information about the optimizations, see [docs/type-extraction-optimizations.md](docs/type-extraction-optimizations.md).

### Python Stub Files

The type generation system supports Python `.pyi` stub files, which provide enhanced type information. Stub files can:

- Provide more accurate type definitions
- Add documentation via docstrings
- Ensure consistent type information
- Allow type generation without installing the Featuretools package

To specify the directory for stub files:

```bash
TYPESHED_PATH=./stubs npm run generate-types
```

See [stubs/README.md](stubs/README.md) for more information.

### Python Version Compatibility

The type generation system supports multiple Python versions (3.6 through 3.11+). You can:

- Use your preferred Python version with the `--python` flag:
  ```bash
  npm run generate-types -- --python python3.8
  ```

- Set a specific Python executable via environment variable:
  ```bash
  PYTHON_EXECUTABLE=python3.9 npm run generate-types
  ```

- Configure the supported version range:
  ```bash
  PYTHON_MIN_VERSION=3.7 PYTHON_MAX_VERSION=3.10 npm run generate-types
  ```

The system will automatically detect and adapt to the Python version being used. For detailed information about Python version compatibility, see [docs/python-version-compatibility.md](docs/python-version-compatibility.md).

## Debugging Tools

This project provides several debugging tools to help developers understand and troubleshoot type generation issues:

### Basic Debugging

For basic debugging, use the debug command:

```bash
npm run debug
```

This provides information about the type generation process and can help identify issues.

### Interactive Debugging

For an interactive debugging session:

```bash
npm run debug:interactive
```

This starts an interactive console where you can run commands to debug the type generation process.

### Advanced Debugging with Debug Inspector

The Debug Inspector tool provides advanced visual and interactive debugging capabilities:

```bash
npm run debug:inspector <command> [options]
```

Available commands:

- `visualize`: Generate visual representations of type generation process
- `monitor`: Real-time monitoring of type generation
- `analyze-bridge`: Analyze Python-TypeScript bridge operations
- `debug-live`: Start a live debugging server with web interface
- `inspect-dependencies`: Analyze and visualize project dependencies
- `generate-diagram`: Generate type relationship diagrams

Examples:

```bash
# Visualize type generation for a specific type
npm run debug:inspector visualize --type EntitySet

# Start real-time monitoring
npm run debug:inspector monitor

# Start a live debugging server on port 8080
npm run debug:inspector debug-live --port 8080

# Generate a diagram of type relationships
npm run debug:inspector generate-diagram --output types-diagram.svg
```

For more information and options, run:

```bash
npm run debug:inspector help
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the package: `npm run build`
4. Run tests: `npm test`

For the best development experience, we recommend using Visual Studio Code with our integrated setup:
- Recommended extensions for TypeScript and Python development
- Pre-configured tasks for common operations
- Debugging configurations for all project components
- Custom snippets for frequently used patterns

See [docs/vscode-integration.md](docs/vscode-integration.md) for detailed information on the VSCode integration features.

## License

MIT 