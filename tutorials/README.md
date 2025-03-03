# Featuretools TypeScript Tutorials

This directory contains step-by-step tutorials for common workflows using the Featuretools TypeScript library. Each tutorial focuses on specific aspects of the library and builds on concepts from previous tutorials.

## Tutorial List

1. **Getting Started** (`01-getting-started.ts`)
   - Basic setup and initialization
   - Understanding the core concepts
   - Simple end-to-end example

2. **Working with EntitySets** (`02-creating-entitysets.ts`)
   - Creating and managing EntitySets
   - Adding entities with different data types
   - Understanding indices and relationships

3. **Feature Engineering with DFS** (`03-feature-engineering.ts`)
   - Running Deep Feature Synthesis
   - Configuring primitives
   - Analyzing and using generated features 

4. **Advanced Configuration** (`04-advanced-configuration.ts`)
   - Custom type mappings
   - Performance optimization options
   - Working with validation settings

5. **Type Safety Benefits** (`05-type-safety-features.ts`)
   - Using branded types
   - Runtime validation
   - Utility types for better development experience

6. **Creating Plugins** (`06-creating-plugins.ts`)
   - Plugin architecture overview
   - Creating a custom plugin
   - Hooking into the type generation process

7. **VS Code Integration** (`07-vscode-integration.ts`)
   - Setting up the VS Code environment
   - Using custom tasks and commands
   - Code snippets for faster development
   - Debugging TypeScript and Python code
   - Optimizing your workflow with workspace settings

## Running the Tutorials

To run any tutorial, use the following command:

```bash
# Compile the TypeScript code first
npx tsc tutorials/01-getting-started.ts

# Then run the JavaScript output
node tutorials/01-getting-started.js
```

Or use ts-node to run directly:

```bash
npx ts-node tutorials/01-getting-started.ts
```

## Prerequisites

Before running these tutorials, make sure you have:

1. Node.js installed (v14 or newer)
2. Python with Featuretools package installed
3. The Featuretools TypeScript package built or installed

## Additional Resources

- See the [examples](../examples) directory for shorter, specific examples
- Refer to the [API documentation](https://github.com/your-repo/featuretools-ts/docs) for detailed reference 