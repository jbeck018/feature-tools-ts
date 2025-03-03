#!/usr/bin/env python
# version_compat.py
#
# This module provides version-compatible interfaces for Python's typing module
# across different versions of Python (3.6 through 3.11+).
#
# It handles differences in typing module imports, functionality, and syntax
# changes to ensure consistent behavior across Python versions.

import sys
import typing
from functools import lru_cache

# Get Python version info for compatibility checks
PY_VERSION = sys.version_info
PY36 = PY_VERSION[:2] == (3, 6)
PY37 = PY_VERSION[:2] == (3, 7)
PY38 = PY_VERSION[:2] == (3, 8)
PY39 = PY_VERSION[:2] == (3, 9)
PY310_PLUS = PY_VERSION[:2] >= (3, 10)

# Export the current Python version for other modules to use
VERSION_INFO = {
    'major': PY_VERSION.major,
    'minor': PY_VERSION.minor,
    'micro': PY_VERSION.micro,
    'py36': PY36,
    'py37': PY37,
    'py38': PY38,
    'py39': PY39,
    'py310_plus': PY310_PLUS
}

# -----------------------------------------------------------------------------
# Handle get_type_hints compatibility issues
# -----------------------------------------------------------------------------

@lru_cache(maxsize=128)
def get_type_hints_compat(obj, globalns=None, localns=None, include_extras=False):
    """
    Compatible version of get_type_hints that works across Python versions.
    
    Args:
        obj: The object to get type hints for
        globalns: Global namespace
        localns: Local namespace
        include_extras: Whether to include extras (Python 3.9+)
    
    Returns:
        Dict of parameter names to their type annotations
    """
    try:
        if PY39 or PY310_PLUS:
            # Python 3.9+ supports include_extras parameter
            return typing.get_type_hints(obj, globalns, localns, include_extras)
        else:
            # Earlier versions don't support include_extras
            return typing.get_type_hints(obj, globalns, localns)
    except (TypeError, ValueError, AttributeError):
        # Handle cases where get_type_hints fails
        return getattr(obj, '__annotations__', {})

# -----------------------------------------------------------------------------
# Handle Protocol compatibility issues
# -----------------------------------------------------------------------------

# Check if typing_extensions is available for older Python versions
try:
    import typing_extensions
    TYPING_EXTENSIONS_AVAILABLE = True
except ImportError:
    TYPING_EXTENSIONS_AVAILABLE = False

def get_protocol():
    """Get the Protocol class appropriate for the current Python version."""
    if hasattr(typing, 'Protocol'):
        # Python 3.8+ has Protocol in the typing module
        return typing.Protocol
    elif TYPING_EXTENSIONS_AVAILABLE and hasattr(typing_extensions, 'Protocol'):
        # Use typing_extensions for older versions
        return typing_extensions.Protocol
    else:
        # Create a dummy Protocol class for compatibility
        class DummyProtocol:
            pass
        return DummyProtocol

Protocol = get_protocol()

@lru_cache(maxsize=128)
def is_protocol(cls):
    """
    Check if a class is a Protocol across different Python versions.
    
    Args:
        cls: The class to check
    
    Returns:
        bool: True if the class is a Protocol, False otherwise
    """
    if PY38 or PY39 or PY310_PLUS:
        # Python 3.8+ can check _is_protocol directly
        return getattr(cls, '_is_protocol', False)
    else:
        # Older versions need more complex checks
        try:
            return any(base is Protocol for base in getattr(cls, '__mro__', []))
        except (TypeError, AttributeError):
            return False

# -----------------------------------------------------------------------------
# Handle get_origin and get_args compatibility issues
# -----------------------------------------------------------------------------

@lru_cache(maxsize=128)
def get_origin_compat(tp):
    """
    Compatible version of get_origin that works across Python versions.
    
    Args:
        tp: The type to get the origin of
    
    Returns:
        The origin of the type, or None if not applicable
    """
    if PY36 or PY37:
        # Python 3.6 and 3.7 don't have get_origin, so we handle common cases
        if hasattr(tp, '__origin__'):
            return tp.__origin__
        return None
    # Python 3.8+ has get_origin
    return typing.get_origin(tp)

@lru_cache(maxsize=128)
def get_args_compat(tp):
    """
    Compatible version of get_args that works across Python versions.
    
    Args:
        tp: The type to get the arguments of
    
    Returns:
        Tuple of the type arguments, or an empty tuple if not applicable
    """
    if PY36 or PY37:
        # Python 3.6 and 3.7 don't have get_args, so we handle common cases
        if hasattr(tp, '__args__'):
            return tp.__args__
        return ()
    # Python 3.8+ has get_args
    return typing.get_args(tp)

# -----------------------------------------------------------------------------
# Handle TypedDict compatibility issues
# -----------------------------------------------------------------------------

def get_typed_dict():
    """Get the TypedDict class appropriate for the current Python version."""
    if hasattr(typing, 'TypedDict'):
        # Python 3.8+ has TypedDict in the typing module
        return typing.TypedDict
    elif TYPING_EXTENSIONS_AVAILABLE and hasattr(typing_extensions, 'TypedDict'):
        # Use typing_extensions for older versions
        return typing_extensions.TypedDict
    else:
        # Create a dummy TypedDict class for compatibility
        class DummyTypedDict(dict):
            pass
        return DummyTypedDict

TypedDict = get_typed_dict()

@lru_cache(maxsize=128)
def is_typed_dict(cls):
    """
    Check if a class is a TypedDict across different Python versions.
    
    Args:
        cls: The class to check
    
    Returns:
        bool: True if the class is a TypedDict, False otherwise
    """
    if PY38 or PY39 or PY310_PLUS:
        # Python 3.8+ has a proper TypedDict we can compare against
        return isinstance(cls, type) and issubclass(cls, TypedDict)
    else:
        # For older versions, look for TypedDict specific attributes
        return hasattr(cls, '__annotations__') and hasattr(cls, '__total__')

# -----------------------------------------------------------------------------
# Handle Literal compatibility issues
# -----------------------------------------------------------------------------

def get_literal():
    """Get the Literal class appropriate for the current Python version."""
    if hasattr(typing, 'Literal'):
        # Python 3.8+ has Literal in the typing module
        return typing.Literal
    elif TYPING_EXTENSIONS_AVAILABLE and hasattr(typing_extensions, 'Literal'):
        # Use typing_extensions for older versions
        return typing_extensions.Literal
    else:
        # Create a dummy Literal class for compatibility
        def Literal(*values):
            # This is just a placeholder, it won't have the same functionality
            return typing.Any
        return Literal

Literal = get_literal()

# -----------------------------------------------------------------------------
# Handle Union and Optional type compatibility issues
# -----------------------------------------------------------------------------

@lru_cache(maxsize=128)
def is_union_type(tp):
    """
    Check if a type is a Union type across different Python versions.
    
    Args:
        tp: The type to check
    
    Returns:
        bool: True if the type is a Union, False otherwise
    """
    if PY310_PLUS:
        # In Python 3.10+, Union types are represented using the | operator
        # which creates types with a special __or__ method
        return get_origin_compat(tp) is typing.Union or hasattr(tp, '__or__')
    else:
        # In earlier versions, Union types have a specific origin
        return get_origin_compat(tp) is typing.Union

@lru_cache(maxsize=128)
def is_optional_type(tp):
    """
    Check if a type is an Optional type across different Python versions.
    
    Args:
        tp: The type to check
    
    Returns:
        bool: True if the type is Optional, False otherwise
    """
    if is_union_type(tp):
        args = get_args_compat(tp)
        return type(None) in args or None in args
    return False

# -----------------------------------------------------------------------------
# Export all compatibility functions and types
# -----------------------------------------------------------------------------

__all__ = [
    'VERSION_INFO',
    'PY36', 'PY37', 'PY38', 'PY39', 'PY310_PLUS',
    'get_type_hints_compat',
    'Protocol', 'is_protocol',
    'get_origin_compat', 'get_args_compat',
    'TypedDict', 'is_typed_dict',
    'Literal',
    'is_union_type', 'is_optional_type'
] 