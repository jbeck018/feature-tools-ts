# Contributing to Featuretools TypeScript

Thank you for considering contributing to Featuretools TypeScript! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Type Generation](#type-generation)
- [Testing](#testing)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/featuretools-ts.git
   cd featuretools-ts
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install Python dependencies:
   ```bash
   pip install featuretools typing_inspect
   ```

## Development Environment

To develop for this project, you'll need:

- Node.js (version 14 or higher)
- npm (version 6 or higher)
- Python (version 3.7 or higher)
- Featuretools Python package
- TypeScript knowledge
- Basic Python knowledge

## Development Workflow

1. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Run tests to ensure everything works:
   ```bash
   npm test
   ```
4. Generate fresh type definitions if needed:
   ```bash
   npm run generate-types
   ```
5. Build the project:
   ```bash
   npm run build
   ```

## Submitting Changes

1. Commit your changes with a clear commit message
2. Push to your fork
3. Submit a pull request to the main repository

Please provide a clear description of the problem your changes solve and how they solve it.

## Type Generation

This project auto-generates TypeScript types from the Python Featuretools package. When contributing to type generation:

1. Understand the mapping between Python and TypeScript types
2. Check that complex Python types are properly converted
3. Test with a variety of Python types
4. Ensure error handling is robust

The type generation happens in two parts:
- `src/python/generate_types.py` - Python script that extracts types from Featuretools
- `scripts/generate-types.js` - Node.js script that runs the Python script and saves the output

To run type generation manually:
```bash
npm run generate-types
```

Type generation flags:
- `--force` - Force regeneration even if no changes detected
- `--verbose` - Show detailed logging

## Testing

All changes should include tests. Place tests in the `tests/` directory:

- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`

To run tests:
```bash
npm test
```

## Coding Standards

- Follow the TypeScript style guide
- Use meaningful variable and function names
- Document all public APIs
- Add comments for complex logic
- Write tests for new features
- Ensure backward compatibility when possible

Thank you for contributing to Featuretools TypeScript! 