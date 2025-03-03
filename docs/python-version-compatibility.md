# Python Version Compatibility

This document explains the Python version compatibility features in the Featuretools TypeScript type generation system.

## Overview

The type generation system has been enhanced to support multiple Python versions, specifically versions 3.6 through 3.11+. This allows developers to use the type generation system with their preferred Python version or the version that matches their project requirements.

## Key Compatibility Features

The following enhancements have been made to ensure smooth operation across different Python versions:

### 1. Version Detection and Adaptation

- **Automatic Version Detection**: The system automatically detects the Python version being used and adapts its behavior accordingly.
- **Version-specific Code Paths**: Internal logic switches between different implementations based on the detected Python version.
- **Graceful Fallbacks**: If certain features are not available in a Python version, compatible alternatives are used.

### 2. Typing Module Compatibility

- **Unified Interface**: A compatibility layer abstracts away differences in the typing module across Python versions.
- **Backporting Features**: Modern typing features are backported to older Python versions when possible.
- **Consistent API**: The system provides a consistent API regardless of the underlying Python version.

### 3. AST Parsing Improvements

- **Version-Aware AST Parsing**: The system handles differences in Abstract Syntax Tree (AST) structures between Python versions.
- **Compatible Stub File Parsing**: `.pyi` stub files can be parsed correctly across all supported Python versions.

## Using Different Python Versions

### Specifying Python Version

You can specify which Python version to use for type generation:

1. **Environment Variable**:
   ```bash
   PYTHON_EXECUTABLE=python3.8 npm run generate-types
   ```

2. **Command Line Option**:
   ```bash
   npm run generate-types -- --python python3.9
   ```

### Version Range Configuration

You can configure the supported Python version range:

1. **Environment Variables**:
   ```bash
   PYTHON_MIN_VERSION=3.7 PYTHON_MAX_VERSION=3.10 npm run generate-types
   ```

2. **Preferred Version**:
   ```bash
   PYTHON_PREFERRED_VERSION=3.8 npm run generate-types
   ```

## Python Version Auto-Discovery

The system can automatically discover and select the best Python version available on your system:

1. It first checks if the configured Python executable is available and in the supported version range.
2. If not, it searches for available Python installations in standard locations.
3. It selects the version closest to the preferred version (default is 3.8).

## Platform-Specific Considerations

### macOS/Linux

On macOS and Linux, the system looks for Python executables with names like `python3.8`, `python3.9`, etc., as well as the standard `python` and `python3` commands.

### Windows

On Windows, the system checks standard installation paths in:
- Program Files directory
- Program Files (x86) directory 
- User's AppData/Local directory

## Troubleshooting

If you encounter issues with Python version compatibility:

1. **Enable Debug Mode**: 
   ```bash
   DEBUG=true npm run generate-types
   ```

2. **Check Python Version**:
   ```bash
   python --version
   ```

3. **Verify typing_extensions**:
   For Python 3.6-3.7, make sure the `typing_extensions` package is installed:
   ```bash
   pip install typing_extensions
   ```

## Technical Implementation

The compatibility system is implemented through:

1. **`version_compat.py`**: A Python module that provides version-compatible interfaces for the typing module.
2. **Script Detection Logic**: The JavaScript runner (`generate-types.js`) that detects Python versions and selects the appropriate executable.

## Supported Features Per Python Version

| Feature | 3.6 | 3.7 | 3.8 | 3.9 | 3.10+ |
|---------|-----|-----|-----|-----|-------|
| Basic Type Hints | ✅ | ✅ | ✅ | ✅ | ✅ |
| Protocol Classes | ❌ | ❌ | ✅ | ✅ | ✅ |
| TypedDict | ❌ | ❌ | ✅ | ✅ | ✅ |
| Literal Types | ❌ | ❌ | ✅ | ✅ | ✅ |
| Union Types | ✅* | ✅* | ✅ | ✅ | ✅ |
| Union Operator (`|`) | ❌ | ❌ | ❌ | ❌ | ✅ |

*Provided via typing_extensions if available

## Testing

The system includes tests to verify compatibility across Python versions:
```bash
npm test -- -t "Python Version Compatibility"
``` 