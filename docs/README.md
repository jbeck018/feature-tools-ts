**Featuretools TypeScript API Reference v0.1.0**

***

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

This will create `src/types/generated.ts` with up-to-date type definitions.

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the package: `npm run build`
4. Run tests: `npm test`

## License

MIT

# FeatureTools TypeScript Documentation

This directory contains the documentation for the FeatureTools TypeScript library, including interactive examples, diagrams, and API reference.

## Documentation Topics

- [Interactive Documentation](#interactive-documentation)
- [Type Extraction Optimizations](type-extraction-optimizations.md)
- [Python Version Compatibility](python-version-compatibility.md)
- [Protocol Implementation](protocol-implementation.md)
- [Custom Type Transformations](custom-type-transformations.md)
- [Plugin System](plugin-system.md)
- [TypeScript 4.9+ Features](typescript-4.9-features.md)
- [VSCode Integration](vscode-integration.md)

## Interactive Documentation

The documentation includes interactive elements powered by [Mermaid.js](https://mermaid-js.github.io/mermaid/#/) for diagrams and visualizations. The interactive components include:

- **Type Hierarchy Visualizations**: Visualize the relationships between different types and interfaces
- **Workflow Diagrams**: Step-by-step visual guides for common workflows
- **Entity-Relationship Diagrams**: Visual representation of entity relationships and data structures
- **Code Examples**: Code snippets that demonstrate API usage

## Building the Documentation

To build the documentation:

```bash
npm run docs
```

This will generate the documentation site in the `docs/api` directory.

## Viewing the Documentation

You can view the documentation by running:

```bash
npm run docs:serve
```

This will start a local server and open the documentation in your browser.

## Documentation Structure

- `docs/api/`: Generated API documentation
- `docs/interactive-examples.ts`: Interactive examples used in the documentation
- `docs/custom.css`: Custom styles for the documentation
- `docs/typedoc-themes/interactive/`: Custom TypeDoc theme with Mermaid.js integration
- `docs/typedoc-plugins/`: Custom TypeDoc plugins for enhanced documentation

## Adding Interactive Examples

To add new interactive examples to the documentation:

1. Edit the `docs/interactive-examples.ts` file
2. Add a new entry to the `interactiveExamples` array
3. Include code examples and/or Mermaid diagrams
4. Rebuild the documentation with `npm run docs`

Example of adding a new interactive example:

```typescript
{
  title: 'My New Example',
  description: 'Description of what this example demonstrates',
  code: `
// TypeScript code goes here
import { FeatureTools } from 'featuretools-ts';

async function myExample() {
  const ft = await FeatureTools.initialize();
  // Example implementation
}
`,
  diagram: `
// Optional Mermaid diagram
flowchart TD
  A[Start] --> B[Process]
  B --> C[End]
`
}
```

## Mermaid Diagram Types

The documentation supports various types of Mermaid diagrams:

- **Class Diagrams**: For visualizing type hierarchies and relationships
- **Flowcharts**: For visualizing processes and workflows
- **Entity-Relationship Diagrams**: For visualizing data models
- **Sequence Diagrams**: For visualizing method calls and interactions
- **State Diagrams**: For visualizing state transitions

See the [Mermaid documentation](https://mermaid-js.github.io/mermaid/#/) for more information on creating these diagrams.
