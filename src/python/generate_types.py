#!/usr/bin/env python
import inspect
import json
import sys
import os
import textwrap
import warnings
import time
import multiprocessing
from functools import lru_cache
# Replace direct typing imports with our compatibility module
from typing import Any, Dict, List, Optional, Union

# Import our compatibility layer for version-specific features
import version_compat as vc
from version_compat import (
    get_type_hints_compat, get_origin_compat, get_args_compat,
    Protocol, TypedDict, Literal, is_protocol, is_typed_dict,
    is_union_type, is_optional_type, VERSION_INFO
)

from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
import importlib
import typing
import re
import glob
import ast
from pathlib import Path
import datetime

# Log Python version info for debugging
if os.environ.get('DEBUG'):
    print(f"[INFO] Python {VERSION_INFO['major']}.{VERSION_INFO['minor']}.{VERSION_INFO['micro']}", file=sys.stderr)
    if vc.PY36:
        print("[INFO] Running in Python 3.6 compatibility mode", file=sys.stderr)
    elif vc.PY37:
        print("[INFO] Running in Python 3.7 compatibility mode", file=sys.stderr)
    elif vc.PY38:
        print("[INFO] Running in Python 3.8 compatibility mode", file=sys.stderr)
    elif vc.PY39:
        print("[INFO] Running in Python 3.9 compatibility mode", file=sys.stderr)
    elif vc.PY310_PLUS:
        print(f"[INFO] Running in Python 3.10+ compatibility mode", file=sys.stderr)

# Performance measurement
start_time = time.time()
def log_perf(message):
    """Log performance message with elapsed time"""
    if os.environ.get('DEBUG'):
        elapsed = time.time() - start_time
        print(f"[PERF] {elapsed:.3f}s - {message}", file=sys.stderr)

log_perf("Starting type generation script")

# Check for stub directories from environment variable
TYPESHED_PATHS = []
if os.environ.get('TYPESHED_PATH'):
    paths = os.environ.get('TYPESHED_PATH').split(':')
    for path in paths:
        if os.path.exists(path):
            TYPESHED_PATHS.append(path)
            log_perf(f"Added typeshed path: {path}")

# Try to import featuretools - handle the case where it's not installed
try:
    import featuretools as ft
    FEATURETOOLS_AVAILABLE = True
    log_perf("Imported featuretools")
except ImportError:
    FEATURETOOLS_AVAILABLE = False
    warnings.warn("Featuretools package is not installed. Using mock definitions for type generation.")
    
    # Define mock classes for when featuretools isn't available
    class EntitySetMock:
        def __init__(self, id, entities=None, relationships=None):
            pass
            
    class EntityMock:
        def __init__(self, id, df, index, time_index=None, variable_types=None):
            pass
            
    class RelationshipMock:
        def __init__(self, parent_entity, parent_variable, child_entity, child_variable):
            pass
    
    # Create mock module structure        
    class FTMock:
        EntitySet = EntitySetMock
        Entity = EntityMock
        Relationship = RelationshipMock
        
        def dfs(self, entityset, target_entity, **kwargs):
            pass
            
        def calculate_feature_matrix(self, features, entityset, **kwargs):
            pass
            
        class primitives:
            class AggregationPrimitive:
                pass
                
            class TransformPrimitive:
                pass
    
    ft = FTMock()
    log_perf("Created mock featuretools module")

# Check for typing_inspect, but now we'll use our compatibility layer as fallback
try:
    import typing_inspect
    TYPING_INSPECT_AVAILABLE = True
    log_perf("Imported typing_inspect")
except ImportError:
    TYPING_INSPECT_AVAILABLE = False
    log_perf("typing_inspect not available, using version_compat fallbacks")

# Cache for storing processed types to avoid redundant computation
TYPE_CACHE = {}

# Target classes/functions to extract types from
TARGET_OBJECTS = {
    'EntitySet': ft.EntitySet,
    'Entity': ft.Entity,
    'Relationship': ft.Relationship,
    'dfs': ft.dfs,
    'calculate_feature_matrix': ft.calculate_feature_matrix,
    'primitives': {
        'AggregationPrimitive': ft.primitives.AggregationPrimitive,
        'TransformPrimitive': ft.primitives.TransformPrimitive
    }
}

# Map Python types to TypeScript types
TYPE_MAPPING = {
    str: 'string',
    int: 'number',
    float: 'number',
    bool: 'boolean',
    list: 'any[]',
    dict: 'Record<string, any>',
    Any: 'any',
    None: 'null',
    type(None): 'null',
}

# Load custom type transformations from environment
TRANSFORMATIONS = {}
try:
    custom_transforms_path = os.environ.get('CUSTOM_TRANSFORMS_PATH')
    if custom_transforms_path and os.path.exists(custom_transforms_path):
        with open(custom_transforms_path, 'r') as f:
            custom_transforms = json.load(f)
            TRANSFORMATIONS = custom_transforms.get('transformations', {})
        log_perf(f"Loaded {len(TRANSFORMATIONS)} custom transformations")
except Exception as e:
    print(f"Error loading custom transformations: {str(e)}", file=sys.stderr)

# Function to find stub files for a module
def find_stub_file(module_name):
    """Find a .pyi stub file for the given module name"""
    module_path = module_name.replace('.', '/')
    
    # Check in all typeshed paths
    for typeshed_path in TYPESHED_PATHS:
        # Check for direct module stub
        stub_path = os.path.join(typeshed_path, f"{module_path}.pyi")
        if os.path.exists(stub_path):
            return stub_path
            
        # Check for package __init__ stub
        init_stub_path = os.path.join(typeshed_path, module_path, "__init__.pyi")
        if os.path.exists(init_stub_path):
            return init_stub_path
            
    return None

# Parse a stub file to extract type information
def parse_stub_file(stub_path, target_name=None):
    """Parse a .pyi stub file and extract type information for the target"""
    log_perf(f"Parsing stub file: {stub_path}")
    
    try:
        with open(stub_path, 'r') as f:
            stub_content = f.read()
            
        # Parse the stub file
        tree = ast.parse(stub_content)
        
        # If we're looking for a specific target, find it
        if target_name:
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef) and node.name == target_name:
                    return extract_class_from_stub(node, stub_content)
                elif isinstance(node, ast.FunctionDef) and node.name == target_name:
                    return extract_function_from_stub(node, stub_content)
        else:
            # Extract all top-level definitions
            result = {}
            for node in tree.body:
                if isinstance(node, ast.ClassDef):
                    result[node.name] = extract_class_from_stub(node, stub_content)
                elif isinstance(node, ast.FunctionDef):
                    result[node.name] = extract_function_from_stub(node, stub_content)
            return result
    except Exception as e:
        if os.environ.get('DEBUG'):
            print(f"Error parsing stub file {stub_path}: {str(e)}", file=sys.stderr)
        return None

def extract_class_from_stub(node, source):
    """Extract class information from an AST ClassDef node"""
    class_info = {
        'type': 'class',
        'name': node.name,
        'methods': {},
        'properties': {},
        'doc': ast.get_docstring(node) or ""
    }
    
    # Extract methods and properties
    for item in node.body:
        if isinstance(item, ast.FunctionDef):
            # Skip dunder methods except __init__
            if item.name.startswith('__') and item.name != '__init__':
                continue
                
            method_info = extract_function_from_stub(item, source)
            class_info['methods'][item.name] = method_info
        elif isinstance(item, ast.AnnAssign):
            # This is a property with a type annotation
            if isinstance(item.target, ast.Name):
                prop_name = item.target.id
                prop_type = extract_annotation_from_stub(item.annotation, source)
                class_info['properties'][prop_name] = {
                    'type': prop_type,
                    'optional': False  # Assume required unless marked optional
                }
    
    return class_info

def extract_function_from_stub(node, source):
    """Extract function information from an AST FunctionDef node"""
    func_info = {
        'type': 'function',
        'name': node.name,
        'params': [],
        'return_type': 'any',
        'doc': ast.get_docstring(node) or ""
    }
    
    # Extract return type
    if node.returns:
        func_info['return_type'] = extract_annotation_from_stub(node.returns, source)
    
    # Extract parameters
    for param in node.args.args:
        # Skip 'self' parameter
        if param.arg == 'self':
            continue
            
        param_info = {
            'name': param.arg,
            'type': 'any',
            'optional': False
        }
        
        # Extract parameter type
        if param.annotation:
            param_info['type'] = extract_annotation_from_stub(param.annotation, source)
        
        func_info['params'].append(param_info)
    
    # Handle default values (optional parameters)
    defaults_offset = len(node.args.args) - len(node.args.defaults)
    for i, default in enumerate(node.args.defaults):
        param_index = i + defaults_offset
        if param_index < len(func_info['params']):
            func_info['params'][param_index]['optional'] = True
    
    return func_info

def extract_annotation_from_stub(annotation, source):
    """Extract type annotation from an AST node with Python version compatibility"""
    if isinstance(annotation, ast.Name):
        # Simple type like 'str', 'int', etc.
        type_name = annotation.id
        return TYPE_MAPPING.get(type_name, type_name)
    elif isinstance(annotation, ast.Subscript):
        # Generic type like List[str], Dict[str, int], etc.
        if isinstance(annotation.value, ast.Name):
            container_type = annotation.value.id
            
            # Get the slice part based on Python version
            if vc.PY36 or vc.PY37 or vc.PY38:
                # Python 3.6-3.8 uses Index
                if isinstance(annotation.slice, ast.Index):
                    slice_value = annotation.slice.value
                    if isinstance(slice_value, ast.Tuple):
                        slice_elts = slice_value.elts
                    else:
                        slice_elts = [slice_value]
                else:
                    # Fallback for other slice types
                    return container_type
            else:
                # Python 3.9+ changed the AST for subscripts
                slice_value = annotation.slice
                if isinstance(slice_value, ast.Tuple):
                    slice_elts = slice_value.elts
                else:
                    slice_elts = [slice_value]
            
            # Process different container types
            if container_type in ('List', 'list'):
                if len(slice_elts) > 0:
                    value_type = extract_annotation_from_stub(slice_elts[0], source)
                    return f"{value_type}[]"
                return "any[]"
            elif container_type in ('Dict', 'dict'):
                if len(slice_elts) >= 2:
                    key_type = extract_annotation_from_stub(slice_elts[0], source)
                    value_type = extract_annotation_from_stub(slice_elts[1], source)
                    
                    if key_type == 'str' or key_type == 'string':
                        return f"Record<string, {value_type}>"
                    else:
                        return f"Record<{key_type}, {value_type}>"
                return "Record<string, any>"
            elif container_type == 'Optional':
                if len(slice_elts) > 0:
                    inner_type = extract_annotation_from_stub(slice_elts[0], source)
                    return f"{inner_type} | null"
                return "any | null"
            elif container_type == 'Union':
                types = [extract_annotation_from_stub(elt, source) for elt in slice_elts]
                
                # Check if it's an Optional (Union with None)
                if 'None' in types or 'null' in types:
                    non_none_types = [t for t in types if t != 'None' and t != 'null']
                    if len(non_none_types) == 1:
                        return f"{non_none_types[0]} | null"
                    else:
                        return f"({' | '.join(non_none_types)}) | null"
                else:
                    return ' | '.join(types)
            elif container_type == 'Literal':
                literals = []
                for elt in slice_elts:
                    if isinstance(elt, ast.Constant):
                        if isinstance(elt.value, str):
                            literals.append(f"'{elt.value}'")
                        elif elt.value is None:
                            literals.append('null')
                        else:
                            literals.append(str(elt.value).lower())
                    elif isinstance(elt, ast.Str):  # Python 3.6-3.7
                        literals.append(f"'{elt.s}'")
                    elif isinstance(elt, ast.Num):  # Python 3.6-3.7
                        literals.append(str(elt.n).lower())
                    elif isinstance(elt, ast.NameConstant):  # Python 3.6-3.7
                        if elt.value is None:
                            literals.append('null')
                        else:
                            literals.append(str(elt.value).lower())
                return ' | '.join(literals) if literals else 'any'
            else:
                # Other generic types
                return container_type
    elif isinstance(annotation, ast.Constant):
        # Literal values (Python 3.8+)
        if annotation.value is None:
            return 'null'
        else:
            return str(annotation.value)
    elif isinstance(annotation, ast.Str):  # Python 3.6-3.7
        return f"'{annotation.s}'"
    elif isinstance(annotation, ast.Num):  # Python 3.6-3.7
        return str(annotation.n)
    elif isinstance(annotation, ast.NameConstant):  # Python 3.6-3.7
        if annotation.value is None:
            return 'null'
        return str(annotation.value).lower()
    elif isinstance(annotation, ast.Attribute):
        # Qualified names like module.Type
        return annotation.attr
    elif isinstance(annotation, ast.Ellipsis):
        # ... (ellipsis)
        return 'any'
    
    # Default to 'any' for complex or unsupported annotations
    return 'any'

# Use version_compat for Protocol class checks
@lru_cache(maxsize=128)
def is_protocol_class(cls):
    """Check if a class is a Protocol class (structural type)"""
    if TYPING_INSPECT_AVAILABLE:
        # If typing_inspect is available, use it to check Protocol
        return typing_inspect.is_protocol(cls)
    else:
        # Use our compatibility layer
        return is_protocol(cls)

def extract_methods_from_protocol(cls):
    """Extract method signatures from a Protocol class"""
    # Check cache first
    cache_key = f"methods_{cls.__name__}"
    if cache_key in TYPE_CACHE:
        return TYPE_CACHE[cache_key]
        
    methods = {}
    
    # Get all attributes that look like methods
    for name, value in inspect.getmembers(cls):
        # Skip magic methods and private attributes
        if name.startswith('_') and name != '__call__':
            continue
            
        if inspect.isfunction(value) or inspect.ismethod(value) or inspect.ismethoddescriptor(value):
            try:
                # Get method signature and docstring
                signature = inspect.signature(value)
                doc = inspect.getdoc(value) or ""
                
                # Try to get type hints with our compatibility function
                try:
                    type_hints = get_type_hints_compat(value)
                except Exception:
                    type_hints = {}
                    
                # Process parameters
                params = []
                for param_name, param in signature.parameters.items():
                    if param_name == 'self':
                        continue
                        
                    param_type = 'any'
                    if param_name in type_hints:
                        param_type = get_ts_type(type_hints[param_name])
                        
                    optional = param.default != inspect.Parameter.empty
                    params.append({
                        'name': param_name,
                        'type': param_type,
                        'optional': optional
                    })
                
                # Get return type
                return_type = 'any'
                if 'return' in type_hints:
                    return_type = get_ts_type(type_hints['return'])
                
                methods[name] = {
                    'params': params,
                    'return_type': return_type,
                    'doc': doc
                }
            except Exception as e:
                if os.environ.get('DEBUG'):
                    print(f"Warning: Failed to process method {name} in Protocol {cls.__name__}: {str(e)}", file=sys.stderr)
    
    # Cache the result
    TYPE_CACHE[cache_key] = methods
    return methods

# Update to use version_compat functions
@lru_cache(maxsize=256)
def get_ts_type(py_type):
    """Convert Python type to TypeScript type with custom transformation support"""
    if py_type is None:
        return 'any'
    
    # Check if the type is already in the cache
    type_key = str(py_type)
    if type_key in TYPE_CACHE:
        return TYPE_CACHE[type_key]
        
    result = None
    
    if py_type is None:
        result = 'any'
    
    # Handle Protocol classes (structural types)
    elif inspect.isclass(py_type) and is_protocol_class(py_type):
        result = py_type.__name__
    
    # Handle Union types (e.g., Optional)
    elif is_union_type(py_type):
        args = get_args_compat(py_type)
        # Handle Optional (Union with None)
        if type(None) in args or None in args:
            non_none_args = [arg for arg in args if arg is not type(None) and arg is not None]
            if len(non_none_args) == 1:
                result = f"{get_ts_type(non_none_args[0])} | null"
            else:
                result = f"({' | '.join([get_ts_type(arg) for arg in non_none_args])}) | null"
        else:
            result = ' | '.join([get_ts_type(arg) for arg in args])
    
    # Handle List[X], Sequence[X], Iterable[X], etc.
    elif get_origin_compat(py_type) in (list, List) or str(get_origin_compat(py_type)) == 'list':
        args = get_args_compat(py_type)
        if args:
            result = f"{get_ts_type(args[0])}[]"
        else:
            result = "any[]"
    
    # Handle Dict[K, V]
    elif get_origin_compat(py_type) in (dict, Dict) or str(get_origin_compat(py_type)) == 'dict':
        args = get_args_compat(py_type)
        if len(args) == 2:
            key_type = get_ts_type(args[0])
            value_type = get_ts_type(args[1])
            if key_type == 'string':
                result = f"Record<string, {value_type}>"
            else:
                result = f"Record<{key_type}, {value_type}>"
        else:
            result = "Record<string, any>"
    
    # Handle Literal types
    elif get_origin_compat(py_type) is Literal or str(get_origin_compat(py_type)) == 'Literal':
        args = get_args_compat(py_type)
        literals = []
        for arg in args:
            if isinstance(arg, str):
                literals.append(f"'{arg}'")
            elif isinstance(arg, (int, float, bool)):
                literals.append(str(arg).lower())
            else:
                literals.append(f"'{str(arg)}'")
        result = ' | '.join(literals)
    
    # Handle TypedDict
    elif is_typed_dict(py_type):
        # Get TypedDict annotations
        annotations = py_type.__annotations__ if hasattr(py_type, '__annotations__') else {}
        properties = []
        for key, value in annotations.items():
            properties.append(f"  {key}: {get_ts_type(value)}")
        result = "{\n" + ",\n".join(properties) + "\n}"
    
    # For standard types
    elif py_type in TYPE_MAPPING:
        result = TYPE_MAPPING[py_type]
    
    # For custom classes, convert to interface name
    elif hasattr(py_type, '__name__'):
        result = py_type.__name__
    
    # Default case
    else:
        result = 'any'
    
    # Apply custom transformations if available
    type_name = getattr(py_type, '__name__', str(py_type))
    module_name = getattr(py_type, '__module__', '')
    
    # Fully qualified name for the type
    fq_name = f"{module_name}.{type_name}" if module_name else type_name
    
    # Check if a custom transformation exists for this type
    if fq_name in TRANSFORMATIONS:
        transform_spec = TRANSFORMATIONS[fq_name]
        try:
            if isinstance(transform_spec, dict) and 'function' in transform_spec:
                # Import and execute transformation function
                mod_name, func_name = transform_spec['function'].rsplit('.', 1)
                module = __import__(mod_name, fromlist=[func_name])
                transform_func = getattr(module, func_name)
                result = transform_func(result, py_type)
            elif isinstance(transform_spec, str):
                # Simple string replacement
                result = transform_spec.replace('{BASE_TYPE}', result)
        except Exception as e:
            print(f"Error applying transformation for {fq_name}: {str(e)}", file=sys.stderr)
    
    # Cache the result
    if result is not None:
        TYPE_CACHE[type_key] = result
    
    return result

@lru_cache(maxsize=128)
def extract_docstring(obj):
    """Extract docstring from a Python object"""
    doc = inspect.getdoc(obj)
    if doc:
        # Convert multiline docstring to JSDoc format
        lines = doc.split('\n')
        if len(lines) > 1:
            return '/**\n * ' + '\n * '.join(lines) + '\n */'
        return '/** ' + doc + ' */'
    return ''

def generate_interface_from_class(cls, name=None):
    """Generate TypeScript interface from Python class with docstring support"""
    if name is None:
        name = cls.__name__
    
    # Check cache first
    cache_key = f"interface_{name}"
    if cache_key in TYPE_CACHE:
        return TYPE_CACHE[cache_key]
    
    properties = {}
    methods = {}
    docstring = extract_docstring(cls)
    
    # Check if this is a Protocol class
    if is_protocol_class(cls):
        # For Protocol classes, focus on extracting methods
        methods = extract_methods_from_protocol(cls)
        
        # Also check for property annotations in the Protocol
        if hasattr(cls, '__annotations__'):
            for prop_name, prop_type in cls.__annotations__.items():
                properties[prop_name] = {
                    'type': get_ts_type(prop_type),
                    'optional': True,  # Protocols often have optional properties
                    'doc': ""
                }
    else:
        # Get init params for regular classes
        try:
            signature = inspect.signature(cls.__init__)
            # Use our compatibility function
            type_hints = get_type_hints_compat(cls.__init__)
        except (ValueError, TypeError) as e:
            if os.environ.get('DEBUG'):
                print(f"Warning: Couldn't get signature for {name}: {str(e)}", file=sys.stderr)
            signature = inspect.Signature()
            type_hints = {}
        
        # Skip self
        for param_name, param in list(signature.parameters.items())[1:]:
            param_doc = ""
            if param_name in type_hints:
                py_type = type_hints[param_name]
                ts_type = get_ts_type(py_type)
                optional = param.default != inspect.Parameter.empty
                properties[param_name] = {
                    'type': ts_type,
                    'optional': optional,
                    'doc': param_doc
                }
            else:
                # If no type hint, use any
                optional = param.default != inspect.Parameter.empty
                properties[param_name] = {
                    'type': 'any',
                    'optional': optional,
                    'doc': param_doc
                }
    
    result = {
        'name': name,
        'properties': properties,
        'methods': methods,
        'docstring': docstring,
        'is_protocol': is_protocol_class(cls)
    }
    
    # Cache the result
    TYPE_CACHE[cache_key] = result
    return result

def generate_interface_from_function(func, name=None):
    """Generate TypeScript interface for function parameters with docstring support"""
    if name is None:
        name = func.__name__ + 'Options'
    
    # Check cache first
    cache_key = f"interface_{name}"
    if cache_key in TYPE_CACHE:
        return TYPE_CACHE[cache_key]
    
    properties = {}
    docstring = extract_docstring(func)
    
    # Get params
    try:
        signature = inspect.signature(func)
        # Use our compatibility function
        type_hints = get_type_hints_compat(func)
    except (ValueError, TypeError) as e:
        if os.environ.get('DEBUG'):
            print(f"Warning: Couldn't get signature for {name}: {str(e)}", file=sys.stderr)
        signature = inspect.Signature()
        type_hints = {}
    
    for param_name, param in signature.parameters.items():
        param_doc = ""
        if param_name in type_hints:
            py_type = type_hints[param_name]
            ts_type = get_ts_type(py_type)
            optional = param.default != inspect.Parameter.empty
            properties[param_name] = {
                'type': ts_type,
                'optional': optional,
                'doc': param_doc
            }
        else:
            # If no type hint, use any
            optional = param.default != inspect.Parameter.empty
            properties[param_name] = {
                'type': 'any',
                'optional': optional,
                'doc': param_doc
            }
    
    # Try to get return type
    return_type = 'any'
    if 'return' in type_hints:
        return_type = get_ts_type(type_hints['return'])
    
    result = {
        'name': name,
        'properties': properties,
        'returnType': return_type,
        'docstring': docstring
    }
    
    # Cache the result
    TYPE_CACHE[cache_key] = result
    return result

def render_ts_interface(interface_data):
    """Render TypeScript interface as string with JSDoc comments"""
    lines = []
    
    # Add docstring if available
    if interface_data.get('docstring'):
        lines.append(interface_data['docstring'])
    
    lines.append(f"export interface {interface_data['name']} {{")
    
    # Add properties
    for prop_name, prop_data in interface_data.get('properties', {}).items():
        # Add property docstring if available
        if prop_data.get('doc'):
            lines.append(f"  /** {prop_data['doc']} */")
            
        optional = '?' if prop_data['optional'] else ''
        lines.append(f"  {prop_name}{optional}: {prop_data['type']};")
    
    # Add methods for Protocol interfaces
    for method_name, method_data in interface_data.get('methods', {}).items():
        # Add method docstring if available
        if method_data.get('doc'):
            lines.append(f"  /** {method_data['doc']} */")
        
        # Format method parameters
        params = []
        for param in method_data['params']:
            optional = '?' if param['optional'] else ''
            params.append(f"{param['name']}{optional}: {param['type']}")
        
        # Add method declaration
        lines.append(f"  {method_name}({', '.join(params)}): {method_data['return_type']};")
    
    lines.append("}")
    return "\n".join(lines)

def process_object(obj_name, obj, is_class=True):
    """Process a single object (class or function) to extract type information"""
    # Check if we have a stub file for this object
    module_name = obj.__module__
    stub_path = find_stub_file(module_name)
    
    if stub_path:
        # Try to extract from stub file first
        stub_info = parse_stub_file(stub_path, obj_name)
        if stub_info:
            log_perf(f"Extracted {obj_name} from stub file: {stub_path}")
            return stub_info
    
    # If no stub file or extraction failed, fall back to runtime inspection
    if is_class:
        return extract_class_info(obj)
    else:
        return extract_function_info(obj)

def extract_class_info(obj):
    """Extract class information through runtime inspection"""
    interface_data = generate_interface_from_class(obj)
    
    # Convert to common format
    result = {
        'type': 'class',
        'name': interface_data['name'],
        'properties': interface_data['properties'],
        'methods': interface_data['methods'],
        'doc': interface_data['docstring']
    }
    
    return result

def extract_function_info(obj):
    """Extract function information through runtime inspection"""
    interface_data = generate_interface_from_function(obj)
    
    # Convert to common format
    result = {
        'type': 'function',
        'name': interface_data['name'],
        'params': [],
        'return_type': interface_data['returnType'],
        'doc': interface_data['docstring']
    }
    
    # Convert properties to params format
    for name, prop in interface_data['properties'].items():
        result['params'].append({
            'name': name,
            'type': prop['type'],
            'optional': prop['optional']
        })
    
    return result

def generate_ts_types():
    """Generate TypeScript type definitions from either runtime or AST analysis"""
    ft_module = import_featuretools()
    
    # Check if TypeScript 4.9+ features should be used
    use_ts49 = os.environ.get('USE_TS_49_FEATURES', 'true').lower() not in ('false', '0')
    log_perf(f"TypeScript 4.9+ features {'enabled' if use_ts49 else 'disabled'}")
    
    # Generate definitions based on what's available
    if ft_module:
        # Extract types using runtime inspection
        definitions = {
            'interfaces': {},
            'types': {},
            'enums': {},
            'classes': {},
            'functions': {}
        }
        
        # Add EntitySet interface
        definitions['interfaces']['EntitySet'] = """export interface EntitySet {
  id: string;
  entities: Record<string, Entity>;
  relationships: Relationship[];
  
  add_entity(entity: Entity): EntitySet;
  normalize_entity(base_entity_id: string, new_entity_id: string, index: string): EntitySet;
}"""
        
        # Add Entity interface
        definitions['interfaces']['Entity'] = """export interface Entity {
  id: string;
  df: any;
  index: string;
  time_index?: string;
  variable_types?: Record<string, string>;
}"""
        
        # Add Relationship interface
        definitions['interfaces']['Relationship'] = """export interface Relationship {
  parent_entity: string;
  parent_variable: string;
  child_entity: string;
  child_variable: string;
}"""
        
        # Add FeatureDefinition type
        definitions['types']['FeatureDefinition'] = """export type FeatureDefinition = {
  name: string;
  entity: string;
  type: string;
  base_features?: FeatureDefinition[];
};"""
        
        # Add example enum for features
        definitions['enums']['FeatureType'] = """export enum FeatureType {
  Numeric = "numeric",
  Categorical = "categorical",
  Datetime = "datetime",
  Boolean = "boolean",
  Text = "text",
  Unknown = "unknown"
}"""
        
        # Add functions
        definitions['functions']['dfs'] = """export function dfs(options: DFSOptions): DFSResult;"""
        
        return definitions
    else:
        # Fallback to a simple string of definitions
        return """declare module 'featuretools' {
  export interface EntitySet {
    id: string;
    entities: Record<string, Entity>;
    relationships: Relationship[];
  }
  
  export interface Entity {
    id: string;
    df: any;
    index: string;
    time_index?: string;
    variable_types?: Record<string, string>;
  }
  
  export interface Relationship {
    parent_entity: string;
    parent_variable: string;
    child_entity: string;
    child_variable: string;
  }
  
  export interface DFSOptions {
    entityset: EntitySet;
    target_entity: string;
    [key: string]: any;
  }
  
  export interface DFSResult {
    feature_matrix: any;
    feature_defs: FeatureDefinition[];
  }
  
  export type FeatureDefinition = {
    name: string;
    entity: string;
    type: string;
    base_features?: FeatureDefinition[];
  };
  
  export function dfs(options: DFSOptions): DFSResult;
}"""

# Function to import featuretools - returns the module or a mock
def import_featuretools():
    """Import the featuretools module or return a mock if not available"""
    if FEATURETOOLS_AVAILABLE:
        return ft
    else:
        # Return the mock module
        log_perf("Using featuretools mock")
        return FTMock()

# Add the ts_type_for_python_type function back
def ts_type_for_python_type(py_type, nullable=False):
    """Convert Python type to TypeScript type with TypeScript 4.9+ features if enabled"""
    # Get the base type using an existing function
    if callable(getattr(py_type, "__origin__", None)):
        base_type = py_type.__origin__.__name__
    else:
        base_type = getattr(py_type, "__name__", str(py_type))
        
    # Convert common Python types to TypeScript
    if base_type == "str":
        base_type = "string"
    elif base_type == "int" or base_type == "float":
        base_type = "number"
    elif base_type == "bool":
        base_type = "boolean"
    elif base_type == "list" or base_type == "tuple":
        base_type = "any[]"  # Would be better to process element type
    elif base_type == "dict":
        base_type = "Record<string, any>"
    else:
        base_type = "any"
    
    # Check if we should use TypeScript 4.9+ features
    use_ts49 = os.environ.get('USE_TS_49_FEATURES', 'true').lower() not in ('false', '0')
    
    # If it's a nullable string, use PreferType for better type inference
    if base_type == 'string' and nullable and use_ts49:
        return 'PreferType<string, null>'
    elif nullable:
        return f'{base_type} | null'
    else:
        return base_type

# Fix the main function to properly format the output with declare module
def main():
    """Main function with error handling and performance tracking"""
    try:
        # Track performance
        start_time = time.time()
        log_perf("Starting type generation")
        
        # Check if TypeScript 4.9+ features should be used
        use_ts49_features = os.environ.get('USE_TS_49_FEATURES', 'true').lower() not in ('false', '0')
        log_perf(f"TypeScript 4.9+ features {'enabled' if use_ts49_features else 'disabled'}")
        
        # Generate TypeScript definitions
        ts_definitions = generate_ts_types()
        
        # Add TypeScript 4.9+ feature imports if enabled
        ts_feature_imports = ""
        if use_ts49_features:
            ts_feature_imports = """
// Import TypeScript 4.9+ feature utilities
import { 
  Satisfies, 
  PreferType, 
  hasProperty, 
  ExtractMethod, 
  RequireAtLeastOne,
  asConst,
  Branded,
  FeaturePath
} from './ts-features';
"""
        
        # Enhance type definitions with TypeScript 4.9+ features if enabled
        if use_ts49_features and isinstance(ts_definitions, dict):
            # Enhance enum declarations to use const enums
            if 'enums' in ts_definitions:
                for enum_name, enum_def in ts_definitions['enums'].items():
                    if enum_def.startswith('export enum '):
                        ts_definitions['enums'][enum_name] = enum_def.replace(
                            'export enum ', 
                            'export const enum '
                        )
            
            # Enhance FeatureDefinition type to use satisfies operator
            if 'types' in ts_definitions and 'FeatureDefinition' in ts_definitions['types']:
                feature_def_type = ts_definitions['types']['FeatureDefinition']
                if feature_def_type.endswith('};'):
                    # Add satisfies Record<string, unknown> before the closing }
                    ts_definitions['types']['FeatureDefinition'] = feature_def_type.replace(
                        '};', 
                        '} satisfies Record<string, unknown>;'
                    )
                    
            # Replace nullable string unions with PreferType
            for section in ['types', 'interfaces']:
                if section in ts_definitions:
                    for type_name, type_def in ts_definitions[section].items():
                        if ' | null;' in type_def and 'string | null;' in type_def:
                            ts_definitions[section][type_name] = type_def.replace(
                                'string | null;', 
                                'PreferType<string, null>;'
                            )
        
        # Convert the definitions to the expected format and output
        version = getattr(ft, "__version__", "unknown") if FEATURETOOLS_AVAILABLE else "unknown"
        
        # Build the final TypeScript definitions
        ts_output = f"""/**
 * TypeScript type definitions for Featuretools
 * 
 * Generated automatically from Python types.
 * DO NOT EDIT BY HAND.
 * 
 * Featuretools Version: {version}
 * Generation Timestamp: {datetime.datetime.now().isoformat()}
 */

{ts_feature_imports if use_ts49_features else ''}
"""
        
        # Add the actual type definitions
        if isinstance(ts_definitions, dict):
            # Start the module declaration
            ts_output += "declare module 'featuretools' {\n\n"
            
            # Format each section
            for section, items in ts_definitions.items():
                for name, definition in items.items():
                    # Remove any existing export and declare module
                    definition = definition.replace('export ', '')
                    if 'declare module' in definition:
                        definition = definition.replace('declare module', '// module')
                    
                    # Add export back
                    definition = 'export ' + definition
                    ts_output += f"{definition}\n\n"
            
            # Close the module declaration
            ts_output += "}"
        else:
            # Already a string with module declaration
            ts_output += ts_definitions
            
        # Output the final results
        print(ts_output)
        log_perf(f"Type generation completed in {time.time() - start_time:.2f}s")
        return 0
            
    except Exception as e:
        # Log the error
        if '--debug' in sys.argv or os.environ.get('DEBUG'):
            import traceback
            traceback.print_exc()
        else:
            print(f"Error generating TypeScript definitions: {str(e)}", file=sys.stderr)
        
        # Output a minimal definition set as a fallback
        print("""/**
 * ERROR: Failed to generate complete TypeScript definitions
 * Fallback minimal definitions are provided
 */
        
export interface EntitySet {
  id: string;
  entities: Record<string, Entity>;
  relationships: Relationship[];
}

export interface Entity {
  id: string;
  df: any;
  index: string;
  time_index?: string;
  variable_types?: Record<string, string>;
}

export interface Relationship {
  parent_entity: string;
  parent_variable: string;
  child_entity: string;
  child_variable: string;
}

export interface DFSOptions {
  entityset: EntitySet;
  target_entity: string;
  [key: string]: any;
}

export interface DFSResult {
  feature_matrix: any;
  feature_defs: FeatureDefinition[];
}

export interface FeatureDefinition {
  name: string;
  entity: string;
  type: string;
  base_features?: FeatureDefinition[];
}
""")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 