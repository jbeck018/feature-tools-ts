import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Protocol Type Generation', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'protocol-test-'));
  const pythonTestScript = path.join(tempDir, 'protocol_test.py');
  const typeOutputFile = path.join(tempDir, 'protocol_types.ts');
  
  beforeAll(() => {
    // Create a test Python file with Protocol classes
    const pythonTestCode = `
import json
import inspect
import sys
from typing import Protocol, List, Dict, Optional, Any, get_type_hints

# Sample Protocol class
class DataSource(Protocol):
    """A data source protocol for feature extraction"""
    name: str
    
    def get_data(self, query: str) -> List[Dict[str, Any]]:
        """Retrieve data based on query"""
        ...
        
    def connect(self, connection_string: str) -> bool:
        """Connect to the data source"""
        ...
        
    def close(self) -> None:
        """Close the connection"""
        ...

# Another Protocol with inheritance
class EnhancedDataSource(DataSource, Protocol):
    """Enhanced data source with additional capabilities"""
    version: str
    
    def get_schema(self) -> Dict[str, str]:
        """Get the schema of the data source"""
        ...
        
    def validate(self, data: List[Dict[str, Any]]) -> bool:
        """Validate the data against the schema"""
        ...

# Class implementing a Protocol
class PostgresDataSource:
    """PostgreSQL data source implementation"""
    
    def __init__(self, name: str, host: str, port: int = 5432):
        self.name = name
        self.host = host
        self.port = port
        
    def get_data(self, query: str) -> List[Dict[str, Any]]:
        return []
        
    def connect(self, connection_string: str) -> bool:
        return True
        
    def close(self) -> None:
        pass

# Import the type generation function from our project
sys.path.append('${path.resolve('src/python').replace(/\\/g, '\\\\')}')
from generate_types import is_protocol_class, extract_methods_from_protocol, generate_interface_from_class, render_ts_interface

# Test the Protocol detection
protocols = [
    ('DataSource', DataSource),
    ('EnhancedDataSource', EnhancedDataSource),
    ('PostgresDataSource', PostgresDataSource)
]

results = []
for name, cls in protocols:
    is_protocol = is_protocol_class(cls)
    interface_data = generate_interface_from_class(cls, name)
    rendered = render_ts_interface(interface_data)
    
    results.append({
        'name': name,
        'is_protocol': is_protocol,
        'has_methods': bool(interface_data.get('methods')),
        'method_count': len(interface_data.get('methods', {})),
        'property_count': len(interface_data.get('properties', {})),
        'rendered': rendered
    })

# Output the results as JSON
print(json.dumps(results, indent=2))
`;
    
    fs.writeFileSync(pythonTestScript, pythonTestCode);
  });
  
  afterAll(() => {
    // Clean up temporary files
    try {
      fs.unlinkSync(pythonTestScript);
      fs.unlinkSync(typeOutputFile);
      fs.rmdirSync(tempDir);
    } catch (err) {
      console.error('Error cleaning up test files:', err);
    }
  });
  
  const runPythonScript = (): any => {
    const result = spawnSync('python', [pythonTestScript], { 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    if (result.status !== 0) {
      console.error('Python script error:', result.stderr);
      throw new Error(`Python script failed with status ${result.status}`);
    }
    
    return JSON.parse(result.stdout);
  };
  
  test('Correctly identifies Protocol classes', () => {
    const results = runPythonScript();
    
    // DataSource should be identified as a Protocol
    const dataSource = results.find((r: any) => r.name === 'DataSource');
    expect(dataSource).toBeDefined();
    expect(dataSource.is_protocol).toBe(true);
    
    // EnhancedDataSource should be identified as a Protocol
    const enhancedSource = results.find((r: any) => r.name === 'EnhancedDataSource');
    expect(enhancedSource).toBeDefined();
    expect(enhancedSource.is_protocol).toBe(true);
    
    // PostgresDataSource should not be a Protocol
    const postgresSource = results.find((r: any) => r.name === 'PostgresDataSource');
    expect(postgresSource).toBeDefined();
    expect(postgresSource.is_protocol).toBe(false);
  });
  
  test('Extracts methods from Protocol classes', () => {
    const results = runPythonScript();
    
    // DataSource should have methods extracted
    const dataSource = results.find((r: any) => r.name === 'DataSource');
    expect(dataSource.has_methods).toBe(true);
    expect(dataSource.method_count).toBe(3); // get_data, connect, close
    
    // EnhancedDataSource should have methods from itself and parent
    const enhancedSource = results.find((r: any) => r.name === 'EnhancedDataSource');
    expect(enhancedSource.has_methods).toBe(true);
    expect(enhancedSource.method_count).toBeGreaterThanOrEqual(5); // get_data, connect, close, get_schema, validate
    
    // PostgresDataSource should have methods extracted but not marked as protocol
    const postgresSource = results.find((r: any) => r.name === 'PostgresDataSource');
    expect(postgresSource.method_count).toBeGreaterThan(0);
  });
  
  test('Generates correct TypeScript interfaces for Protocol classes', () => {
    const results = runPythonScript();
    
    // Check DataSource interface
    const dataSource = results.find((r: any) => r.name === 'DataSource');
    expect(dataSource.rendered).toContain('export interface DataSource {');
    expect(dataSource.rendered).toContain('name: string');
    expect(dataSource.rendered).toContain('get_data(query: string): any[]');
    expect(dataSource.rendered).toContain('connect(connection_string: string): boolean');
    expect(dataSource.rendered).toContain('close(): null');
    
    // Check EnhancedDataSource interface
    const enhancedSource = results.find((r: any) => r.name === 'EnhancedDataSource');
    expect(enhancedSource.rendered).toContain('export interface EnhancedDataSource {');
    expect(enhancedSource.rendered).toContain('version: string');
    expect(enhancedSource.rendered).toContain('get_schema(): Record<string, string>');
    expect(enhancedSource.rendered).toContain('validate(data: any[]): boolean');
    
    // Should also have inherited methods
    expect(enhancedSource.rendered).toContain('get_data(query: string)');
  });
}); 