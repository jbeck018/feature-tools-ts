#!/usr/bin/env python
import sys
import json
import featuretools as ft
import pandas as pd
import numpy as np
from io import StringIO

# Setup JSON serialization/deserialization for numpy/pandas objects
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, pd.DataFrame):
            return {
                'type': 'dataframe',
                'data': obj.to_dict(orient='records')
            }
        if isinstance(obj, pd.Series):
            return {
                'type': 'series',
                'data': obj.to_dict()
            }
        return json.JSONEncoder.default(self, obj)

# Function registry to map function names to actual functions
function_registry = {
    'ft_dfs': ft.dfs,
    'ft_create_entityset': ft.EntitySet,
    # Add more functions as needed
}

def process_request(request):
    try:
        # Parse request
        data = json.loads(request)
        function_name = data['function']
        params = data['params']
        
        # Get the function from registry
        if function_name not in function_registry:
            return json.dumps({'error': f'Function {function_name} not found'})
        
        function = function_registry[function_name]
        
        # Process DataFrame parameters if needed
        for key, value in params.items():
            if isinstance(value, dict) and value.get('type') == 'dataframe':
                params[key] = pd.DataFrame(value['data'])
        
        # Call the function
        result = function(**params)
        
        # Serialize and return the result
        return json.dumps({
            'result': result
        }, cls=NumpyEncoder)
    except Exception as e:
        return json.dumps({'error': str(e)})

# Main loop to process stdin requests
if __name__ == "__main__":
    for line in sys.stdin:
        response = process_request(line)
        sys.stdout.write(response + '\n')
        sys.stdout.flush() 