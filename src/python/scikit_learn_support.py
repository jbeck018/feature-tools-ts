"""
Scikit-learn support for Featuretools TypeScript type generation
"""
import os
import sys
import importlib
import inspect
from typing import Dict, List, Any, Optional, Union, Tuple

def is_sklearn_available() -> bool:
    """Check if scikit-learn is available"""
    try:
        import sklearn
        return True
    except ImportError:
        return False

def get_sklearn_version() -> Optional[str]:
    """Get scikit-learn version if available"""
    if is_sklearn_available():
        import sklearn
        return sklearn.__version__
    return None

def import_sklearn_modules() -> Dict[str, Any]:
    """Import scikit-learn modules and return a dictionary of modules"""
    if not is_sklearn_available():
        return {}
    
    modules = {}
    
    # Core modules
    try:
        import sklearn.base
        modules['base'] = sklearn.base
    except ImportError:
        pass
    
    # Pipeline
    try:
        import sklearn.pipeline
        modules['pipeline'] = sklearn.pipeline
    except ImportError:
        pass
    
    # Preprocessing
    try:
        import sklearn.preprocessing
        modules['preprocessing'] = sklearn.preprocessing
    except ImportError:
        pass
    
    # Models
    try:
        import sklearn.linear_model
        modules['linear_model'] = sklearn.linear_model
    except ImportError:
        pass
    
    try:
        import sklearn.ensemble
        modules['ensemble'] = sklearn.ensemble
    except ImportError:
        pass
    
    try:
        import sklearn.cluster
        modules['cluster'] = sklearn.cluster
    except ImportError:
        pass
    
    # Model selection
    try:
        import sklearn.model_selection
        modules['model_selection'] = sklearn.model_selection
    except ImportError:
        pass
    
    # Metrics
    try:
        import sklearn.metrics
        modules['metrics'] = sklearn.metrics
    except ImportError:
        pass
    
    return modules

def get_sklearn_classes(modules: Dict[str, Any]) -> Dict[str, Any]:
    """Extract classes from scikit-learn modules"""
    classes = {}
    
    for module_name, module in modules.items():
        for name, obj in inspect.getmembers(module):
            # Skip private members and non-classes
            if name.startswith('_') or not inspect.isclass(obj):
                continue
            
            # Skip classes not defined in scikit-learn
            if not obj.__module__.startswith('sklearn'):
                continue
            
            # Add class to dictionary
            full_name = f"sklearn.{module_name}.{name}"
            classes[full_name] = obj
    
    return classes

def get_sklearn_functions(modules: Dict[str, Any]) -> Dict[str, Any]:
    """Extract functions from scikit-learn modules"""
    functions = {}
    
    for module_name, module in modules.items():
        for name, obj in inspect.getmembers(module):
            # Skip private members and non-functions
            if name.startswith('_') or not inspect.isfunction(obj):
                continue
            
            # Skip functions not defined in scikit-learn
            if not obj.__module__.startswith('sklearn'):
                continue
            
            # Add function to dictionary
            full_name = f"sklearn.{module_name}.{name}"
            functions[full_name] = obj
    
    return functions

def extract_sklearn_types() -> Dict[str, Any]:
    """Extract scikit-learn types for TypeScript generation"""
    if not is_sklearn_available():
        return {}
    
    # Import scikit-learn modules
    modules = import_sklearn_modules()
    
    # Extract classes and functions
    classes = get_sklearn_classes(modules)
    functions = get_sklearn_functions(modules)
    
    # Combine classes and functions
    types = {**classes, **functions}
    
    return types

def integrate_with_featuretools(types: Dict[str, Any]) -> Dict[str, Any]:
    """Integrate scikit-learn types with Featuretools"""
    if not is_sklearn_available():
        return types
    
    # Add integration types
    types['sklearn.featuretools.ScikitLearnFeatureTools'] = {
        'name': 'ScikitLearnFeatureTools',
        'module': 'sklearn.featuretools',
        'docstring': 'Integration between scikit-learn and Featuretools',
        'methods': {
            'createTransformerFeature': {
                'docstring': 'Create a feature using a scikit-learn transformer',
                'parameters': [
                    ('transformer', 'sklearn.preprocessing.StandardScaler | sklearn.preprocessing.MinMaxScaler'),
                    ('input_features', 'List[Any]'),
                    ('name', 'Optional[str]')
                ],
                'return_type': 'Any'
            },
            'createModelFeature': {
                'docstring': 'Create a feature using a scikit-learn model',
                'parameters': [
                    ('model', 'sklearn.base.BaseEstimator'),
                    ('input_features', 'List[Any]'),
                    ('name', 'Optional[str]')
                ],
                'return_type': 'Any'
            }
        }
    }
    
    return types

def main() -> Dict[str, Any]:
    """Main function to extract scikit-learn types"""
    # Check if scikit-learn support is enabled
    if os.environ.get('INCLUDE_SCIKIT_LEARN') != 'true':
        return {}
    
    # Check if scikit-learn is available
    if not is_sklearn_available():
        print("Warning: scikit-learn is not installed. Skipping scikit-learn type extraction.", file=sys.stderr)
        return {}
    
    # Extract scikit-learn types
    types = extract_sklearn_types()
    
    # Integrate with Featuretools
    types = integrate_with_featuretools(types)
    
    return types

if __name__ == '__main__':
    # This script is meant to be imported, not run directly
    print("This script is meant to be imported, not run directly.", file=sys.stderr)
    sys.exit(1) 