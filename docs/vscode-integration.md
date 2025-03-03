# VSCode Integration Guide

This project includes integrated support for Visual Studio Code to enhance your development experience. This guide explains the available VSCode features and how to use them effectively.

## Recommended Extensions

When you open this project in VSCode, you'll be prompted to install the recommended extensions. These extensions provide significant benefits for development:

- **Python and Pylance**: Enhanced Python language support and static type checking
- **TypeScript Next**: Support for the latest TypeScript features
- **ESLint and Prettier**: Code linting and formatting
- **Jest**: Test runner integration
- **Code Spell Checker**: Helps catch spelling mistakes in code and documentation
- **GitLens**: Enhanced Git integration
- **Markdown Mermaid**: Preview Mermaid diagrams in markdown files
- **JS Debug**: Advanced JavaScript debugging

## Tasks

The project includes pre-configured tasks for common development operations. Access them from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) by selecting "Tasks: Run Task", then choose from:

### Build Tasks

- **Generate TypeScript Types**: Generate TypeScript type definitions from Python code
- **Generate TypeScript Types (with TS 4.9+ features)**: Generate types with TypeScript 4.9+ enhancements
- **Generate Types (watch mode)**: Run type generation in watch mode for development
- **Build Project**: Compile the TypeScript code
- **Generate Documentation**: Generate API documentation with TypeDoc

### Test Tasks

- **Run Tests**: Run all Jest tests
- **Validate TypeScript Types**: Validate the generated TypeScript type definitions
- **Lint**: Run ESLint to check code quality

### Example Tasks

- **Run Example: Basic Usage**: Run the basic usage example
- **Run Example: TypeScript 4.9+ Features**: Run the TypeScript 4.9+ features example

## Debugging

The project includes several debug configurations:

- **Debug Current File**: Debug the currently active file
- **Debug Type Generation**: Debug the type generation process
- **Debug Type Generation (TS 4.9+ features)**: Debug type generation with TS 4.9+ features
- **Debug Jest Tests**: Run and debug all Jest tests
- **Debug Current Test File**: Debug the currently open test file
- **Debug Python Type Extraction**: Debug the Python type extraction script
- **Debug Example: Basic Usage**: Run and debug the basic usage example
- **Debug Example: TypeScript 4.9+ Features**: Run and debug the TypeScript 4.9+ features example
- **Debug Full Type Generation Workflow**: Debug both the JS and Python parts of type generation

To use these configurations, open the Debug panel (`Ctrl+Shift+D` / `Cmd+Shift+D`), select a configuration from the dropdown, and press the Play button.

## Code Snippets

Custom code snippets are available for common patterns in this project. Type the prefix in a TypeScript file and press `Tab` to expand the snippet:

- `ft-init`: Initialize FeatureTools with proper cleanup
- `ft-entityset`: Create a new EntitySet and add an entity
- `ft-relationship`: Add a relationship between entities
- `ft-dfs`: Run Deep Feature Synthesis
- `ft-feature`: Define a custom feature with the satisfies operator
- `ft-type-guard`: Create a type guard function
- `ft-path`: Create a type-safe feature path
- `ft-prefer-type`: Create a function using PreferType for better union handling

## Workspace Settings

The project includes optimized workspace settings:

- TypeScript configuration using the workspace version of TypeScript
- Python linting with pylint and formatting with black
- File exclusions for improved performance
- File nesting for cleaner Explorer view
- Jest integration for test running
- Custom dictionary for spell checking

## Tips for Efficient Development

1. **Use Tasks**: Run common operations quickly with the Task Runner
2. **Leverage Debugging**: Set breakpoints and use the debugger to understand code execution
3. **Utilize Snippets**: Speed up development with code snippets for common patterns
4. **Explorer Organization**: Use the nested file view to reduce clutter
5. **Command Palette**: Learn keyboard shortcuts for frequent commands
6. **Problems Panel**: Check the Problems panel (`Ctrl+Shift+M` / `Cmd+Shift+M`) for linting and compilation issues

## Troubleshooting

If you encounter issues with the VSCode integration:

1. **Reload Window**: Sometimes reloading VSCode (`Developer: Reload Window` in the Command Palette) can resolve extension issues
2. **Check Extension Versions**: Ensure your extensions are updated to the latest versions
3. **Verify Settings**: Check that workspace settings are being applied correctly
4. **Python Path**: Make sure your Python environment is correctly set up and detected by VSCode 