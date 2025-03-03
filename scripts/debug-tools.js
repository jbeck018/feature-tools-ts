#!/usr/bin/env node

/**
 * Debug Tools CLI
 * 
 * Command-line tool for debugging and analyzing the Featuretools TypeScript bridge,
 * particularly focusing on type generation and Python integration issues.
 */

const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');
const readline = require('node:readline');

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
  logFilePath: path.join(process.cwd(), 'debug-tools.log'),
  useColors: true
});

const logger = debug.createScopedLogger('DebugTools');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Debug Tools CLI for Featuretools TypeScript

Usage: 
  node debug-tools.js <command> [options]

Commands:
  analyze-types           Analyze type generation process and report issues
  trace-generation        Trace type generation with detailed logging
  inspect-ast             Inspect the Python AST for a specific type
  profile-memory          Profile memory usage during type generation
  check-py-compatibility  Check Python compatibility for type generation
  validate-types          Validate generated TypeScript types
  interactive             Start interactive debugging session
  help                    Show this help message

Options:
  --file <path>           Specify a file to analyze
  --type <name>           Specify a type name to focus on
  --verbose               Show verbose output
  --output <path>         Specify output file for results
  --force                 Force regeneration of data

Examples:
  node debug-tools.js analyze-types
  node debug-tools.js trace-generation --type EntitySet
  node debug-tools.js inspect-ast --file src/types/entityset.ts
  node debug-tools.js profile-memory
  `);
}

/**
 * Analyze type generation and report issues
 */
async function analyzeTypes(options) {
  logger.info('Analyzing type generation...');

  try {
    const { result: stats, timer } = await debug.timeAsync(
      'Type Analysis',
      async () => {
        // Run the type generation with a special flag to collect stats
        const result = execSync(
          'npm run generate-types -- --analyze',
          { encoding: 'utf8' }
        );

        // Find and parse the stats JSON that should be output by the generation process
        const statsMatch = result.match(/TYPE_STATS_BEGIN([\s\S]*?)TYPE_STATS_END/);
        if (statsMatch && statsMatch[1]) {
          try {
            return JSON.parse(statsMatch[1]);
          } catch (err) {
            logger.error('Failed to parse type stats JSON', err);
            return null;
          }
        }

        // If we couldn't find stats, manually gather some information
        logger.warn('Could not find type stats, gathering information manually...');
        
        // Count files and types
        const typeFiles = fs.readdirSync(path.join(process.cwd(), 'src/types'))
          .filter(file => file.endsWith('.ts'));
        
        const typeCounts = {};
        
        for (const file of typeFiles) {
          const content = fs.readFileSync(path.join(process.cwd(), 'src/types', file), 'utf8');
          
          // Count interfaces, types, and enums
          const interfaces = (content.match(/interface\s+\w+/g) || []).length;
          const types = (content.match(/type\s+\w+/g) || []).length;
          const enums = (content.match(/enum\s+\w+/g) || []).length;
          
          typeCounts[file] = { interfaces, types, enums, total: interfaces + types + enums };
        }
        
        return {
          fileCount: typeFiles.length,
          typeCounts,
          generatedAt: new Date().toISOString()
        };
      },
      true
    );

    // Display the results
    logger.info(`Analysis completed in ${timer.elapsedMs.toFixed(2)}ms`);
    
    if (stats) {
      console.log('\nType Generation Analysis:');
      console.log('------------------------');
      
      if (stats.fileCount) {
        console.log(`Total TypeScript files: ${stats.fileCount}`);
      }
      
      if (stats.typeCounts) {
        console.log('\nType counts by file:');
        for (const [file, counts] of Object.entries(stats.typeCounts)) {
          console.log(`  ${file}:`);
          console.log(`    Interfaces: ${counts.interfaces}`);
          console.log(`    Types: ${counts.types}`);
          console.log(`    Enums: ${counts.enums}`);
          console.log(`    Total: ${counts.total}`);
        }
      }
      
      // Display any errors or warnings
      if (stats.errors && stats.errors.length > 0) {
        console.log('\nErrors found during type generation:');
        stats.errors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err.message} (in ${err.file}:${err.line})`);
        });
      }
      
      if (stats.warnings && stats.warnings.length > 0) {
        console.log('\nWarnings during type generation:');
        stats.warnings.forEach((warn, i) => {
          console.log(`  ${i + 1}. ${warn.message} (in ${warn.file}:${warn.line})`);
        });
      }
      
      // Write the full stats to a file if requested
      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
        console.log(`\nDetailed analysis written to: ${outputPath}`);
      }
    } else {
      logger.error('No analysis data available');
    }
  } catch (err) {
    logger.error('Error during type analysis', err);
  }
}

/**
 * Trace type generation with detailed logging
 */
async function traceGeneration(options) {
  const typeName = options.type || '';
  
  logger.info(`Tracing type generation${typeName ? ` for type: ${typeName}` : ''}...`);
  
  try {
    // Set up high-detail tracing via environment variables
    const env = {
      ...process.env,
      DEBUG: 'true',
      DEBUG_LEVEL: '5', // Trace level
      DEBUG_LOG_FILE: 'true',
      DEBUG_LOG_FILE_PATH: path.join(process.cwd(), 'type-generation-trace.log'),
      TRACE_TYPE_GENERATION: 'true'
    };
    
    if (typeName) {
      env.TRACE_TYPE_NAME = typeName;
    }
    
    // Run the type generation with tracing enabled
    execSync('npm run generate-types', { 
      env,
      stdio: 'inherit'
    });
    
    logger.info('Tracing completed. Log file created at: type-generation-trace.log');
    
    // Show a snippet of the log file
    if (fs.existsSync(path.join(process.cwd(), 'type-generation-trace.log'))) {
      const logContent = fs.readFileSync(
        path.join(process.cwd(), 'type-generation-trace.log'), 
        'utf8'
      );
      
      const lines = logContent.split('\n');
      const lastLines = lines.slice(Math.max(0, lines.length - 20));
      
      console.log('\nLast 20 lines of trace log:');
      console.log('---------------------------');
      console.log(lastLines.join('\n'));
    }
  } catch (err) {
    logger.error('Error during trace generation', err);
  }
}

/**
 * Inspect the Python AST for a specific type
 */
async function inspectAst(options) {
  const typeName = options.type;
  
  if (!typeName) {
    logger.error('Type name is required. Use --type <name>');
    return;
  }
  
  logger.info(`Inspecting AST for type: ${typeName}...`);
  
  try {
    // Run a special mode of the Python script to dump the AST
    const pythonScript = path.join(process.cwd(), 'src/python/generate_types.py');
    const result = execSync(
      `python "${pythonScript}" --dump-ast --type-name "${typeName}"`,
      { encoding: 'utf8' }
    );
    
    console.log('\nAST for type:', typeName);
    console.log('---------------------------');
    console.log(result);
    
    // Write to file if requested
    if (options.output) {
      const outputPath = path.resolve(process.cwd(), options.output);
      fs.writeFileSync(outputPath, result);
      console.log(`\nAST data written to: ${outputPath}`);
    }
  } catch (err) {
    logger.error('Error inspecting AST', err);
  }
}

/**
 * Profile memory usage during type generation
 */
async function profileMemory(options) {
  logger.info('Profiling memory usage during type generation...');
  
  try {
    const { timer } = await debug.timeAsync(
      'Memory Profiling',
      async () => {
        // Initialize data collection
        const memoryData = [];
        const interval = 100; // ms
        let timerId;
        
        // Start monitoring
        const startMemory = process.memoryUsage();
        const startTime = Date.now();
        
        // Set up monitoring interval
        timerId = setInterval(() => {
          const memory = process.memoryUsage();
          const elapsed = Date.now() - startTime;
          
          memoryData.push({
            time: elapsed,
            rss: memory.rss / 1024 / 1024, // MB
            heapTotal: memory.heapTotal / 1024 / 1024, // MB
            heapUsed: memory.heapUsed / 1024 / 1024, // MB
            external: memory.external / 1024 / 1024 // MB
          });
        }, interval);
        
        // Run type generation in a separate process
        try {
          execSync('npm run generate-types', { stdio: 'ignore' });
        } finally {
          // Stop monitoring
          clearInterval(timerId);
        }
        
        const endMemory = process.memoryUsage();
        
        // Calculate results
        const result = {
          startMemory: {
            rss: startMemory.rss / 1024 / 1024,
            heapTotal: startMemory.heapTotal / 1024 / 1024,
            heapUsed: startMemory.heapUsed / 1024 / 1024,
            external: startMemory.external / 1024 / 1024
          },
          endMemory: {
            rss: endMemory.rss / 1024 / 1024,
            heapTotal: endMemory.heapTotal / 1024 / 1024,
            heapUsed: endMemory.heapUsed / 1024 / 1024,
            external: endMemory.external / 1024 / 1024
          },
          diff: {
            rss: (endMemory.rss - startMemory.rss) / 1024 / 1024,
            heapTotal: (endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024,
            heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024,
            external: (endMemory.external - startMemory.external) / 1024 / 1024
          },
          timeline: memoryData
        };
        
        return result;
      },
      true
    );
    
    logger.info(`Memory profiling completed in ${timer.elapsedMs.toFixed(2)}ms`);
    
    // Get the profiling results (stored in timer.result)
    const memoryProfile = timer.result;
    
    if (memoryProfile) {
      console.log('\nMemory Usage Profile:');
      console.log('---------------------');
      console.log(`Start Memory: ${memoryProfile.startMemory.heapUsed.toFixed(2)} MB`);
      console.log(`End Memory: ${memoryProfile.endMemory.heapUsed.toFixed(2)} MB`);
      console.log(`Difference: ${memoryProfile.diff.heapUsed.toFixed(2)} MB`);
      
      // Peak memory usage
      const peakMemory = memoryProfile.timeline.reduce(
        (max, point) => Math.max(max, point.heapUsed), 0
      );
      console.log(`Peak Memory Usage: ${peakMemory.toFixed(2)} MB`);
      
      // Write to file if requested
      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, JSON.stringify(memoryProfile, null, 2));
        console.log(`\nDetailed memory profile written to: ${outputPath}`);
      }
    } else {
      logger.error('No memory profile data available');
    }
  } catch (err) {
    logger.error('Error during memory profiling', err);
  }
}

/**
 * Check Python environment compatibility for type generation
 */
async function checkPythonCompatibility() {
  logger.info('Checking Python environment compatibility...');
  
  try {
    // Run a special mode of the Python script to check compatibility
    const pythonScript = path.join(process.cwd(), 'src/python/generate_types.py');
    const result = execSync(
      `python "${pythonScript}" --check-compatibility`,
      { encoding: 'utf8' }
    );
    
    console.log('\nPython Environment Compatibility:');
    console.log('-------------------------------');
    console.log(result);
  } catch (err) {
    logger.error('Error checking Python compatibility', err);
    
    if (err.stdout) {
      console.error('\nError details:');
      console.error(err.stdout.toString());
    }
  }
}

/**
 * Validate the generated TypeScript types
 */
async function validateTypes() {
  logger.info('Validating generated TypeScript types...');
  
  try {
    // Run the TypeScript compiler to validate types
    const result = execSync(
      'npx tsc --noEmit',
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    console.log('\nTypeScript Type Validation:');
    console.log('--------------------------');
    console.log('✅ All types are valid!');
  } catch (err) {
    logger.error('TypeScript validation failed');
    
    console.log('\nTypeScript Type Validation:');
    console.log('--------------------------');
    console.log('❌ Type validation failed!');
    
    if (err.stdout) {
      const output = err.stdout.toString();
      console.log('\nValidation errors:');
      
      // Extract and display specific errors
      const errorLines = output
        .split('\n')
        .filter(line => line.includes('error TS'));
      
      if (errorLines.length > 10) {
        console.log(errorLines.slice(0, 10).join('\n'));
        console.log(`...and ${errorLines.length - 10} more errors.`);
      } else {
        console.log(errorLines.join('\n'));
      }
    }
  }
}

/**
 * Start an interactive debugging session
 */
async function startInteractiveSession() {
  console.log('\nInteractive Debug Session:');
  console.log('------------------------');
  console.log('Enter a command or type "help" for available commands.');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'debug> '
  });
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    const parts = input.split(' ');
    const cmd = parts[0];
    const cmdArgs = parts.slice(1);
    
    switch (cmd) {
      case 'help':
        console.log('\nAvailable commands:');
        console.log('  analyze          - Analyze type generation');
        console.log('  trace [type]     - Trace type generation for a specific type');
        console.log('  inspect <type>   - Inspect AST for a type');
        console.log('  memory           - Profile memory usage');
        console.log('  check-py         - Check Python compatibility');
        console.log('  validate         - Validate generated types');
        console.log('  clear            - Clear the console');
        console.log('  exit             - Exit the interactive session');
        break;
        
      case 'analyze':
        await analyzeTypes({});
        break;
        
      case 'trace':
        await traceGeneration({ type: cmdArgs[0] });
        break;
        
      case 'inspect':
        if (!cmdArgs[0]) {
          console.log('Error: Type name is required.');
          console.log('Usage: inspect <type>');
        } else {
          await inspectAst({ type: cmdArgs[0] });
        }
        break;
        
      case 'memory':
        await profileMemory({});
        break;
        
      case 'check-py':
        await checkPythonCompatibility();
        break;
        
      case 'validate':
        await validateTypes();
        break;
        
      case 'clear':
        console.clear();
        break;
        
      case 'exit':
        rl.close();
        return;
        
      default:
        if (input) {
          console.log(`Unknown command: ${cmd}`);
          console.log('Type "help" for available commands.');
        }
        break;
    }
    
    rl.prompt();
  }).on('close', () => {
    console.log('Exiting interactive debug session.');
    process.exit(0);
  });
}

// Parse options
const options = {};
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    options[key] = value;
    if (value !== true) {
      i++;
    }
  }
}

// Execute the selected command
switch (command) {
  case 'analyze-types':
    analyzeTypes(options);
    break;

  case 'trace-generation':
    traceGeneration(options);
    break;

  case 'inspect-ast':
    inspectAst(options);
    break;

  case 'profile-memory':
    profileMemory(options);
    break;

  case 'check-py-compatibility':
    checkPythonCompatibility();
    break;

  case 'validate-types':
    validateTypes();
    break;

  case 'interactive':
    startInteractiveSession();
    break;

  case 'help':
    showHelp();
    break;

  default:
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    showHelp();
    break;
} 