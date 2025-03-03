# Python Stub Files for Featuretools

This directory contains Python stub files (`.pyi`) for the Featuretools library. These stub files provide enhanced type information that is used by the TypeScript type generation system.

## What are Stub Files?

Stub files (`.pyi` files) are Python files that contain type annotations for modules, classes, functions, and variables. They are used by type checkers like mypy to provide better type checking for Python code. In our case, we use them to extract more accurate type information for generating TypeScript definitions.

## Structure

The stub files are organized to mirror the structure of the Featuretools package:

- `featuretools/__init__.pyi` - Main package stub
- `featuretools/entityset.pyi` - EntitySet related classes
- `featuretools/primitives/standard.pyi` - Feature primitives
- `featuretools/feature_defs/__init__.pyi` - Feature definitions

## How They're Used

When the type generation script runs, it looks for these stub files in the following order:

1. First, it checks for stub files in the directories specified by the `TYPESHED_PATH` environment variable
2. If a stub file is found, it parses it to extract type information
3. If no stub file is found, it falls back to runtime inspection of the actual Python objects

## Benefits

Using stub files provides several advantages:

1. **More accurate types**: Stub files can provide more precise type information than what can be extracted from runtime inspection
2. **Documentation**: Stub files can include docstrings that are used to generate JSDoc comments
3. **Consistency**: Stub files ensure consistent type information even if the runtime behavior changes
4. **No runtime dependency**: Type generation can work even without Featuretools installed

## Creating New Stub Files

To create a new stub file:

1. Create a `.pyi` file with the same name as the Python module
2. Add type annotations for classes, methods, and functions
3. Use ellipsis (`...`) for method bodies
4. Add docstrings to provide documentation

Example:

```python
from typing import List, Optional

class MyClass:
    """Documentation for MyClass."""
    
    x: int
    y: Optional[str]
    
    def __init__(self, x: int, y: Optional[str] = None) -> None: ...
    
    def my_method(self, z: float) -> List[str]: ...
```

## Testing Stub Files

You can test your stub files by running the type generation script with the `TYPESHED_PATH` environment variable set to the path of this directory:

```bash
TYPESHED_PATH=./stubs node scripts/generate-types.js
``` 