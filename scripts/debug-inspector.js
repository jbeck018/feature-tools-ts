#!/usr/bin/env node

/**
 * Debug Inspector Tool
 * 
 * Advanced visual debugging and inspection tools for the Featuretools TypeScript project.
 * This tool provides interactive visualization of type generation, real-time debugging,
 * and analysis of Python-TypeScript bridge operations.
 */

const path = require('node:path');
const fs = require('node:fs');
const util = require('node:util');
const { execSync, spawn } = require('node:child_process');
const readline = require('node:readline');
const http = require('node:http');
const open = require('open');

// Check if we need to build the TypeScript files first
const debugUtilPath = path.join(__dirname, '../dist/utils/debug.js');
if (!fs.existsSync(debugUtilPath)) {
  console.log('Building TypeScript files...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Import the debug utility
const debug = require('../dist/utils/debug');

// Initialize the debug utility
debug.init({
  level: debug.DebugLevel.Debug,
  logToFile: true,
  logFilePath: path.join(process.cwd(), 'debug-inspector.log'),
  useColors: true
});

const logger = debug.createScopedLogger('DebugInspector');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const options = parseOptions(args.slice(1));

// Main function
async function main() {
  switch (command) {
    case 'visualize':
      await visualizeTypeGeneration(options);
      break;
    case 'monitor':
      await monitorTypeGeneration(options);
      break;
    case 'analyze-bridge':
      await analyzePythonBridge(options);
      break;
    case 'debug-live':
      await startLiveDebugging(options);
      break;
    case 'inspect-dependencies':
      await inspectDependencies(options);
      break;
    case 'generate-diagram':
      await generateTypeDiagram(options);
      break;
    default:
      showHelp();
      break;
  }
}

/**
 * Parse command line options
 */
function parseOptions(args) {
  const options = {
    type: null,
    file: null,
    verbose: false,
    output: null,
    force: false,
    port: 8080,
    format: 'json',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i];
    } else if (arg === '--file' && i + 1 < args.length) {
      options.file = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--port' && i + 1 < args.length) {
      options.port = Number.parseInt(args[++i], 10);
    } else if (arg === '--format' && i + 1 < args.length) {
      options.format = args[++i];
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Debug Inspector Tool for Featuretools TypeScript

Usage: 
  node debug-inspector.js <command> [options]

Commands:
  visualize             Generate visual representation of type generation
  monitor               Real-time monitoring of type generation process
  analyze-bridge        Analyze Python-TypeScript bridge operations
  debug-live            Start live debugging server for real-time monitoring
  inspect-dependencies  Analyze and visualize project dependencies
  generate-diagram      Generate type relationship diagrams
  help                  Show this help message

Options:
  --type <name>         Specify a type name to focus on
  --file <path>         Specify a file to analyze
  --verbose             Show verbose output
  --output <path>       Specify output file for results
  --force               Force regeneration of data
  --port <number>       Port for debug server (default: 8080)
  --format <format>     Output format (json, html, svg, mermaid)

Examples:
  node debug-inspector.js visualize --type EntitySet
  node debug-inspector.js monitor
  node debug-inspector.js analyze-bridge --verbose
  node debug-inspector.js debug-live --port 8888
  node debug-inspector.js generate-diagram --output types-diagram.svg
  `);
}

/**
 * Visualize type generation process
 * Generates a visual representation of how Python types are converted to TypeScript
 */
async function visualizeTypeGeneration(options) {
  logger.info('Generating visualization of type generation process...');

  try {
    // Create a temp directory to store visualization data
    const visualDir = path.join(process.cwd(), '.debug', 'visual');
    fs.mkdirSync(visualDir, { recursive: true });

    // Run type generation with special flags to collect visualization data
    logger.info('Running type generation with visualization flags...');
    execSync('npm run generate-types -- --collect-visual-data', { 
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: { ...process.env, DEBUG_VISUAL: 'true', VISUAL_OUTPUT: visualDir }
    });

    // Check if visualization data was generated
    const dataFile = path.join(visualDir, 'type-gen-data.json');
    if (!fs.existsSync(dataFile)) {
      logger.error('No visualization data was generated');
      return;
    }

    // Read the data
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    // Generate output based on format
    const outputPath = options.output || path.join(visualDir, `type-visualization.${options.format}`);
    
    logger.info(`Generating ${options.format} visualization at ${outputPath}`);
    
    switch (options.format) {
      case 'html':
        generateHtmlVisualization(data, outputPath);
        break;
      case 'svg':
        generateSvgVisualization(data, outputPath);
        break;
      case 'mermaid':
        generateMermaidDiagram(data, outputPath);
        break;
      default:
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        break;
    }
    
    logger.info(`Visualization completed and saved to ${outputPath}`);
    
    // Open the visualization if it's HTML or SVG
    if (['html', 'svg'].includes(options.format)) {
      await open(outputPath);
    }
    
  } catch (err) {
    logger.error('Failed to generate visualization', err);
  }
}

/**
 * Generate HTML visualization
 */
function generateHtmlVisualization(data, outputPath) {
  // Basic HTML template with embedded visualization
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Featuretools TypeScript Type Generation Visualization</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { margin-bottom: 20px; }
    .type-flow { display: flex; flex-direction: column; gap: 20px; }
    .type-node { border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
    .python-type { background-color: #e6f7ff; }
    .ts-type { background-color: #f6ffed; }
    .transformation { background-color: #fff7e6; }
    .node-title { font-weight: bold; margin-bottom: 10px; }
    .details { font-family: monospace; white-space: pre-wrap; }
    .arrow { text-align: center; font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Type Generation Visualization</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    <div class="type-flow">
      ${generateTypeFlowHtml(data)}
    </div>
  </div>
  <script>
    // Add any interactive elements here
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Visualization loaded');
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
}

/**
 * Generate type flow HTML
 */
function generateTypeFlowHtml(data) {
  let html = '';
  
  // For each type transformation
  for (const type of data.types || []) {
    html += `<div class="type-node python-type">
      <div class="node-title">Python Type: ${escapeHtml(type.pythonType)}</div>
      <div class="details">${escapeHtml(JSON.stringify(type.pythonDetails, null, 2))}</div>
    </div>
    <div class="arrow">↓</div>
    <div class="type-node transformation">
      <div class="node-title">Transformation Process</div>
      <div class="details">${escapeHtml(type.transformationSteps.join('\n'))}</div>
    </div>
    <div class="arrow">↓</div>
    <div class="type-node ts-type">
      <div class="node-title">TypeScript Type: ${escapeHtml(type.tsType)}</div>
      <div class="details">${escapeHtml(type.tsCode)}</div>
    </div>`;
    
    // Add separator between types
    if (data.types.indexOf(type) < data.types.length - 1) {
      html += '<hr style="margin: 30px 0; border-top: 2px dashed #ccc;" />';
    }
  }
  
  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate SVG visualization
 */
function generateSvgVisualization(data, outputPath) {
  // This is a simplified implementation
  // In a real implementation, use a proper SVG generation library
  logger.info('SVG visualization not fully implemented yet');
  
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="400" y="50" font-family="Arial" font-size="24" text-anchor="middle">Type Generation Visualization</text>
  <text x="400" y="80" font-family="Arial" font-size="14" text-anchor="middle">Generated on ${new Date().toLocaleString()}</text>
  <!-- SVG visualization would be generated here -->
  <text x="400" y="300" font-family="Arial" font-size="18" text-anchor="middle">SVG visualization not fully implemented yet</text>
</svg>`;

  fs.writeFileSync(outputPath, svgContent);
}

/**
 * Generate Mermaid diagram
 */
function generateMermaidDiagram(data, outputPath) {
  let mermaid = 'graph TD\n';
  
  // For each type transformation
  for (let i = 0; i < (data.types || []).length; i++) {
    const type = data.types[i];
    const idPrefix = `type${i}`;
    
    mermaid += `  ${idPrefix}py[${type.pythonType}] --> ${idPrefix}trans[Transformation]\n`;
    mermaid += `  ${idPrefix}trans --> ${idPrefix}ts[${type.tsType}]\n`;
    
    // Add styling
    mermaid += `  class ${idPrefix}py pythonType\n`;
    mermaid += `  class ${idPrefix}trans transformation\n`;
    mermaid += `  class ${idPrefix}ts tsType\n\n`;
  }
  
  // Add styles
  mermaid += `
  classDef pythonType fill:#e6f7ff,stroke:#1890ff,stroke-width:1px
  classDef transformation fill:#fff7e6,stroke:#faad14,stroke-width:1px
  classDef tsType fill:#f6ffed,stroke:#52c41a,stroke-width:1px
  `;
  
  fs.writeFileSync(outputPath, mermaid);
}

/**
 * Real-time monitoring of type generation process
 */
async function monitorTypeGeneration(options) {
  logger.info('Starting real-time monitoring of type generation...');
  
  try {
    // Create a process that runs the type generation with monitoring flags
    const child = spawn('npm', ['run', 'generate-types', '--', '--monitor'], {
      env: { ...process.env, DEBUG_LEVEL: '5', DEBUG_MONITOR: 'true' }
    });
    
    // Track stats
    const stats = {
      typesProcessed: 0,
      errors: 0,
      warnings: 0,
      startTime: Date.now()
    };
    
    // Set up event listeners
    child.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Parse progress information
      if (output.includes('TYPE_PROCESSED:')) {
        stats.typesProcessed++;
        updateProgress(stats);
      }
      
      if (output.includes('WARNING:')) {
        stats.warnings++;
      }
      
      if (output.includes('ERROR:')) {
        stats.errors++;
      }
      
      // Print output if verbose
      if (options.verbose) {
        process.stdout.write(output);
      }
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
      stats.errors++;
    });
    
    // Handle process completion
    child.on('close', (code) => {
      const elapsedTime = ((Date.now() - stats.startTime) / 1000).toFixed(2);
      logger.info(`Monitoring completed. Process exited with code ${code}`);
      logger.info(`Summary: ${stats.typesProcessed} types processed, ${stats.warnings} warnings, ${stats.errors} errors`);
      logger.info(`Total time: ${elapsedTime} seconds`);
      
      // Save report if output specified
      if (options.output) {
        const report = {
          timestamp: new Date().toISOString(),
          elapsedTime: Number.parseFloat(elapsedTime),
          exitCode: code,
          typesProcessed: stats.typesProcessed,
          warnings: stats.warnings,
          errors: stats.errors
        };
        
        fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
        logger.info(`Report saved to ${options.output}`);
      }
    });
    
    // Function to update progress display
    function updateProgress(stats) {
      const elapsedTime = ((Date.now() - stats.startTime) / 1000).toFixed(2);
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`Types processed: ${stats.typesProcessed} | Warnings: ${stats.warnings} | Errors: ${stats.errors} | Time: ${elapsedTime}s`);
    }
    
  } catch (err) {
    logger.error('Failed to monitor type generation', err);
  }
}

/**
 * Analyze Python-TypeScript bridge
 */
async function analyzePythonBridge(options) {
  logger.info('Analyzing Python-TypeScript bridge operations...');
  
  try {
    // Analyze the bridge module
    const bridgePath = path.join(process.cwd(), 'src/bridge.ts');
    
    if (!fs.existsSync(bridgePath)) {
      logger.error(`Bridge file not found at ${bridgePath}`);
      return;
    }
    
    const bridgeContent = fs.readFileSync(bridgePath, 'utf8');
    
    // Extract information about bridge operations
    const functionMatches = bridgeContent.match(/export\s+function\s+(\w+)/g) || [];
    const functions = functionMatches.map(match => {
      const name = match.replace(/export\s+function\s+/, '');
      return name;
    });
    
    // Extract Python script paths used in the bridge
    const pythonPathMatches = bridgeContent.match(/['"]\.\.?\/?src\/python\/[\w/.-]+\.py['"]/g) || [];
    const pythonPaths = pythonPathMatches.map(match => {
      return match.replace(/['"]/g, '');
    });
    
    // Analyze Python scripts
    const pythonScripts = {};
    
    for (const relativePath of pythonPaths) {
      const fullPath = path.join(process.cwd(), relativePath.replace(/^\.\.?\/?/, ''));
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Extract Python functions
        const pyFunctionMatches = content.match(/def\s+(\w+)\s*\(/g) || [];
        const pyFunctions = pyFunctionMatches.map(match => {
          return match.replace(/def\s+/, '').replace(/\s*\($/, '');
        });
        
        pythonScripts[relativePath] = {
          path: fullPath,
          functions: pyFunctions,
          size: content.length
        };
      }
    }
    
    // Create analysis report
    const report = {
      timestamp: new Date().toISOString(),
      bridge: {
        path: bridgePath,
        functions,
        size: bridgeContent.length
      },
      pythonScripts,
      analysis: {
        bridgeFunctions: functions.length,
        pythonScriptsCount: Object.keys(pythonScripts).length,
        totalPythonFunctions: Object.values(pythonScripts).reduce((sum, script) => sum + script.functions.length, 0)
      }
    };
    
    // Display report
    logger.info('Bridge Analysis Report:');
    logger.info(`Bridge functions: ${report.analysis.bridgeFunctions}`);
    logger.info(`Python scripts: ${report.analysis.pythonScriptsCount}`);
    logger.info(`Total Python functions: ${report.analysis.totalPythonFunctions}`);
    
    if (options.verbose) {
      console.log('\nBridge functions:');
      for (const func of functions) {
        console.log(`  - ${func}`);
      }
      
      console.log('\nPython scripts:');
      for (const [path, script] of Object.entries(pythonScripts)) {
        console.log(`  - ${path} (${script.functions.length} functions)`);
        
        if (options.verbose) {
          for (const func of script.functions) {
            console.log(`    - ${func}`);
          }
        }
      }
    }
    
    // Save report if output specified
    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
      logger.info(`Report saved to ${options.output}`);
    }
    
  } catch (err) {
    logger.error('Failed to analyze Python-TypeScript bridge', err);
  }
}

/**
 * Start live debugging server
 */
async function startLiveDebugging(options) {
  logger.info(`Starting live debugging server on port ${options.port}...`);
  
  // Create debug data directory
  const debugDir = path.join(process.cwd(), '.debug', 'live');
  fs.mkdirSync(debugDir, { recursive: true });
  
  // Create a simple HTTP server
  const server = http.createServer((req, res) => {
    // Handle API requests
    if (req.url?.startsWith('/api/')) {
      handleApiRequest(req, res);
      return;
    }
    
    // Serve the debug UI
    serveDebugUI(req, res);
  });
  
  // Start the server
  server.listen(options.port, () => {
    logger.info(`Live debugging server running at http://localhost:${options.port}`);
    
    // Automatically open in browser
    open(`http://localhost:${options.port}`);
  });
  
  // Handle API requests
  function handleApiRequest(req, res) {
    res.setHeader('Content-Type', 'application/json');
    
    // Get project stats
    if (req.url === '/api/stats') {
      const stats = getProjectStats();
      res.end(JSON.stringify(stats));
      return;
    }
    
    // Get type information
    if (req.url?.startsWith('/api/type/')) {
      const typeName = req.url.substring('/api/type/'.length);
      const typeInfo = getTypeInfo(typeName);
      res.end(JSON.stringify(typeInfo));
      return;
    }
    
    // 404 for unknown API endpoints
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
  
  // Serve the debug UI
  function serveDebugUI(req, res) {
    res.setHeader('Content-Type', 'text/html');
    
    // Simple debug UI
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Featuretools TypeScript Debug Inspector</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    header { background-color: #333; color: white; padding: 15px; }
    .container { padding: 20px; }
    .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
    .tabset { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 15px; }
    .tab { padding: 10px 15px; cursor: pointer; }
    .tab.active { border-bottom: 2px solid #1890ff; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
  </style>
</head>
<body>
  <header>
    <h1>Featuretools TypeScript Debug Inspector</h1>
  </header>
  
  <div class="container">
    <div class="tabset">
      <div class="tab active" data-tab="dashboard">Dashboard</div>
      <div class="tab" data-tab="types">Types</div>
      <div class="tab" data-tab="bridge">Python Bridge</div>
      <div class="tab" data-tab="logs">Logs</div>
    </div>
    
    <div class="tab-content active" id="dashboard-tab">
      <div class="card">
        <h2>Project Overview</h2>
        <div id="project-stats">Loading...</div>
      </div>
      
      <div class="card">
        <h2>Recent Activity</h2>
        <div id="recent-activity">Loading...</div>
      </div>
    </div>
    
    <div class="tab-content" id="types-tab">
      <div class="card">
        <h2>Type Explorer</h2>
        <input type="text" id="type-search" placeholder="Search for a type..." style="width: 100%; padding: 8px; margin-bottom: 15px;">
        <div id="type-list">Loading types...</div>
        <div id="type-details"></div>
      </div>
    </div>
    
    <div class="tab-content" id="bridge-tab">
      <div class="card">
        <h2>Python-TypeScript Bridge</h2>
        <div id="bridge-info">Loading...</div>
      </div>
    </div>
    
    <div class="tab-content" id="logs-tab">
      <div class="card">
        <h2>Debug Logs</h2>
        <div id="log-filters">
          <label>
            <input type="checkbox" checked data-level="error"> Errors
          </label>
          <label>
            <input type="checkbox" checked data-level="warn"> Warnings
          </label>
          <label>
            <input type="checkbox" checked data-level="info"> Info
          </label>
          <label>
            <input type="checkbox" data-level="debug"> Debug
          </label>
          <label>
            <input type="checkbox" data-level="trace"> Trace
          </label>
        </div>
        <pre id="logs">Loading logs...</pre>
      </div>
    </div>
  </div>
  
  <script>
    // Simple client-side JavaScript
    document.addEventListener('DOMContentLoaded', function() {
      // Tab switching
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
          tab.classList.add('active');
          document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
        });
      });
      
      // Load project stats
      fetch('/api/stats')
        .then(response => response.json())
        .then(stats => {
          document.getElementById('project-stats').innerHTML = formatStats(stats);
        })
        .catch(err => {
          console.error('Failed to load stats', err);
        });
      
      // Helper function to format stats
      function formatStats(stats) {
        return '<table>' +
          '<tr><td>TypeScript Files:</td><td>' + stats.fileCount + '</td></tr>' +
          '<tr><td>Generated Types:</td><td>' + stats.typeCount + '</td></tr>' +
          '<tr><td>Python Scripts:</td><td>' + stats.pythonFileCount + '</td></tr>' +
          '</table>';
      }
    });
  </script>
</body>
</html>`;
    
    res.end(html);
  }
  
  // Get project stats
  function getProjectStats() {
    // Count TypeScript files
    const tsFiles = countFiles(path.join(process.cwd(), 'src'), '.ts');
    
    // Count Python files
    const pyFiles = countFiles(path.join(process.cwd(), 'src'), '.py');
    
    // Count generated types (estimate from type files)
    const typesDir = path.join(process.cwd(), 'src/types');
    let typeCount = 0;
    
    if (fs.existsSync(typesDir)) {
      const typeFiles = fs.readdirSync(typesDir)
        .filter(file => file.endsWith('.ts'));
      
      for (const file of typeFiles) {
        const content = fs.readFileSync(path.join(typesDir, file), 'utf8');
        
        // Count interfaces, types, and enums
        const interfaces = (content.match(/interface\s+\w+/g) || []).length;
        const types = (content.match(/type\s+\w+/g) || []).length;
        const enums = (content.match(/enum\s+\w+/g) || []).length;
        
        typeCount += interfaces + types + enums;
      }
    }
    
    return {
      fileCount: tsFiles,
      pythonFileCount: pyFiles,
      typeCount
    };
  }
  
  // Helper function to count files with a specific extension
  function countFiles(dir, extension) {
    if (!fs.existsSync(dir)) {
      return 0;
    }
    
    let count = 0;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        count += countFiles(path.join(dir, item.name), extension);
      } else if (item.name.endsWith(extension)) {
        count++;
      }
    }
    
    return count;
  }
  
  // Get information about a specific type
  function getTypeInfo(typeName) {
    // This is a stub implementation
    // In a real implementation, we would analyze type files to find the requested type
    return {
      name: typeName,
      found: false,
      message: `Type information for ${typeName} not implemented yet`
    };
  }
}

/**
 * Analyze and visualize project dependencies
 */
async function inspectDependencies(options) {
  logger.info('Analyzing project dependencies...');
  
  try {
    // Use TypeScript compiler API to analyze import dependencies
    
    // For now, a simpler approach - scan files for imports
    const srcDir = path.join(process.cwd(), 'src');
    const dependencies = {};
    
    scanDirectory(srcDir, dependencies);
    
    // Display the results
    console.log('\nDependency Graph:');
    
    for (const [file, imports] of Object.entries(dependencies)) {
      console.log(`\n${file}:`);
      
      if (imports.length === 0) {
        console.log('  No imports');
      } else {
        for (const imp of imports) {
          console.log(`  - ${imp}`);
        }
      }
    }
    
    // Save report if output specified
    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(dependencies, null, 2));
      logger.info(`Dependency report saved to ${options.output}`);
    }
    
  } catch (err) {
    logger.error('Failed to analyze dependencies', err);
  }
  
  // Scan directory for TypeScript files and extract imports
  function scanDirectory(dir, dependencies) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        scanDirectory(fullPath, dependencies);
      } else if (item.name.endsWith('.ts')) {
        const relativePath = path.relative(process.cwd(), fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Find import statements
        const importMatches = content.match(/import.*?from\s+['"](.+?)['"]/g) || [];
        const imports = importMatches.map(match => {
          const importPath = match.match(/from\s+['"](.+?)['"]/)[1];
          return importPath;
        });
        
        dependencies[relativePath] = imports;
      }
    }
  }
}

/**
 * Generate type relationship diagrams
 */
async function generateTypeDiagram(options) {
  logger.info('Generating type relationship diagram...');
  
  try {
    // Focus on a specific type or analyze all types
    const typeName = options.type;
    const format = options.format || 'mermaid';
    
    // Path to type definitions
    const typesDir = path.join(process.cwd(), 'src/types');
    
    if (!fs.existsSync(typesDir)) {
      logger.error(`Types directory not found at ${typesDir}`);
      return;
    }
    
    // Collect type information
    const allTypes = {};
    const relationships = [];
    
    const typeFiles = fs.readdirSync(typesDir)
      .filter(file => file.endsWith('.ts'));
    
    for (const file of typeFiles) {
      const content = fs.readFileSync(path.join(typesDir, file), 'utf8');
      
      // Find interfaces
      const interfaceMatches = content.match(/interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{/g) || [];
      
      for (const interfaceMatch of interfaceMatches) {
        const nameMatch = interfaceMatch.match(/interface\s+(\w+)/);
        const extendsMatch = interfaceMatch.match(/extends\s+([^{]+)/);
        
        if (nameMatch) {
          const name = nameMatch[1];
          allTypes[name] = { kind: 'interface', file };
          
          if (extendsMatch) {
            const extensions = extendsMatch[1].trim().split(/\s*,\s*/);
            
            for (const ext of extensions) {
              relationships.push({
                source: name,
                target: ext,
                type: 'extends'
              });
            }
          }
        }
      }
      
      // Find types
      const typeMatches = content.match(/type\s+(\w+)\s*=\s*([^;]+)/g) || [];
      
      for (const typeMatch of typeMatches) {
        const nameMatch = typeMatch.match(/type\s+(\w+)/);
        
        if (nameMatch) {
          const name = nameMatch[1];
          allTypes[name] = { kind: 'type', file };
          
          // Find referenced types in the type definition
          const definition = typeMatch.match(/=\s*([^;]+)/)?.[1] || '';
          
          // This is a simplified approach - a real implementation would need
          // to parse the TypeScript AST to find all type references
          const typeRefs = [...definition.matchAll(/\b([A-Z]\w*)\b/g)]
            .map(m => m[1])
            .filter(ref => ref in allTypes);
          
          for (const ref of typeRefs) {
            relationships.push({
              source: name,
              target: ref,
              type: 'uses'
            });
          }
        }
      }
    }
    
    // Filter to focus on a specific type if requested
    let diagramTypes = { ...allTypes };
    let diagramRelationships = [...relationships];
    
    if (typeName) {
      // Include the specified type and its direct relationships
      const relatedTypes = new Set([typeName]);
      
      // Add related types (one level deep)
      for (const rel of relationships) {
        if (rel.source === typeName) {
          relatedTypes.add(rel.target);
        }
        if (rel.target === typeName) {
          relatedTypes.add(rel.source);
        }
      }
      
      // Filter types and relationships
      diagramTypes = Object.fromEntries(
        Object.entries(allTypes)
          .filter(([name]) => relatedTypes.has(name))
      );
      
      diagramRelationships = relationships.filter(rel => 
        relatedTypes.has(rel.source) && relatedTypes.has(rel.target)
      );
    }
    
    // Generate diagram
    const outputPath = options.output || path.join(process.cwd(), '.debug', 'type-diagram.' + format);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    switch (format) {
      case 'json':
        fs.writeFileSync(outputPath, JSON.stringify({
          types: diagramTypes,
          relationships: diagramRelationships
        }, null, 2));
        break;
        
      default:
        generateMermaidTypeDiagram(diagramTypes, diagramRelationships, outputPath);
        break;
    }
    
    logger.info(`Type diagram generated at ${outputPath}`);
    
  } catch (err) {
    logger.error('Failed to generate type diagram', err);
  }
  
  // Generate a Mermaid diagram for types
  function generateMermaidTypeDiagram(types, relationships, outputPath) {
    let mermaid = 'classDiagram\n';
    
    // Add classes for each type
    for (const [name, info] of Object.entries(types)) {
      mermaid += `  class ${name} {\n`;
      mermaid += `    ${info.kind}\n`;
      mermaid += `    ${info.file}\n`;
      mermaid += `  }\n`;
    }
    
    // Add relationships
    for (const rel of relationships) {
      if (rel.type === 'extends') {
        mermaid += `  ${rel.target} <|-- ${rel.source}\n`;
      } else {
        mermaid += `  ${rel.source} --> ${rel.target}\n`;
      }
    }
    
    fs.writeFileSync(outputPath, mermaid);
  }
}

// Run the main function
main().catch(err => {
  logger.error('Unhandled error', err);
  process.exit(1);
}); 