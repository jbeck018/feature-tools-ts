const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const os = require('node:os');

// For performance tracking
const startTime = Date.now();

// Configuration
const config = {
  pythonScript: path.resolve(__dirname, '../src/python/generate_types.py'),
  outputFile: path.resolve(__dirname, '../src/types/featuretools.ts'),
  cacheFile: path.resolve(__dirname, '../.type-cache.json'),
  tempOutputFile: path.resolve(os.tmpdir(), `featuretools-types-${Date.now()}.ts`),
  hashFile: path.resolve(__dirname, '../.types-hash.txt'),
  debugMode: process.env.DEBUG === 'true' || process.env.DEBUG === '1',
  pythonExecutable: process.env.PYTHON_EXECUTABLE || 'python3',
  forceRegeneration: process.argv.includes('--force'),
  
  // TypeScript features
  useTS49Features: process.env.USE_TS_49_FEATURES !== 'false' && process.env.USE_TS_49_FEATURES !== '0',
  
  // Python version compatibility
  pythonMinVersion: process.env.PYTHON_MIN_VERSION || '3.6',
  pythonMaxVersion: process.env.PYTHON_MAX_VERSION || '3.11',
  pythonPreferredVersion: process.env.PYTHON_PREFERRED_VERSION || '3.8',
  
  // Plugin configuration
  pluginsEnabled: !(process.env.DISABLE_PLUGINS === 'true' || process.env.DISABLE_PLUGINS === '1'),
  pluginsDir: process.env.PLUGINS_DIR || path.resolve(__dirname, '../plugins'),
  pluginsConfigFile: process.env.PLUGINS_CONFIG || path.resolve(__dirname, '../plugins.json')
};

// Output override from command line
const outputIndex = process.argv.indexOf('--output');
if (outputIndex !== -1 && process.argv.length > outputIndex + 1) {
  config.outputFile = path.resolve(process.cwd(), process.argv[outputIndex + 1]);
}

// TypeScript features override from command line
if (process.argv.includes('--no-ts49-features')) {
  config.useTS49Features = false;
} else if (process.argv.includes('--ts49-features')) {
  config.useTS49Features = true;
}

// Python version override from command line
const pythonIndex = process.argv.indexOf('--python');
if (pythonIndex !== -1 && process.argv.length > pythonIndex + 1) {
  config.pythonExecutable = process.argv[pythonIndex + 1];
}

// Utility for performance logging
function logPerf(message) {
  if (config.debugMode) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[PERF] ${elapsed}s - ${message}`);
  }
}

// Check Python version compatibility
function checkPythonVersion() {
  try {
    const result = spawnSync(config.pythonExecutable, ['-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")'], {
      encoding: 'utf8'
    });
    
    if (result.status !== 0) {
      console.error(`Error checking Python version: ${result.stderr}`);
      return null;
    }
    
    const version = result.stdout.trim();
    logPerf(`Detected Python version: ${version}`);
    
    // Parse version components
    const [major, minor, micro] = version.split('.').map(Number);
    const fullVersion = { major, minor, micro, raw: version };
    
    // Check if version is in supported range
    const minComponents = config.pythonMinVersion.split('.').map(Number);
    const maxComponents = config.pythonMaxVersion.split('.').map(Number);
    
    const isSupported = 
      (major > minComponents[0] || (major === minComponents[0] && minor >= minComponents[1])) &&
      (major < maxComponents[0] || (major === maxComponents[0] && minor <= maxComponents[1]));
    
    if (!isSupported) {
      console.warn(`Warning: Python version ${version} is outside the supported range (${config.pythonMinVersion} - ${config.pythonMaxVersion})`);
    }
    
    return { ...fullVersion, isSupported };
  } catch (error) {
    console.error(`Error checking Python version: ${error.message}`);
    return null;
  }
}

// Find the best Python executable version
function findBestPythonExecutable() {
  // Check if the current executable works and is in supported range
  const currentVersion = checkPythonVersion();
  if (currentVersion?.isSupported) {
    return { executable: config.pythonExecutable, version: currentVersion };
  }
  
  // Try to find a better version
  const possibleVersions = [];
  
  // On macOS and Linux, try common Python executables
  if (os.platform() !== 'win32') {
    const candidateExecutables = [
      'python3.11', 'python3.10', 'python3.9', 'python3.8', 'python3.7', 'python3.6',
      'python3', 'python'
    ];
    
    for (const executable of candidateExecutables) {
      try {
        const result = spawnSync('which', [executable], { encoding: 'utf8' });
        if (result.status === 0 && result.stdout.trim()) {
          const execPath = result.stdout.trim();
          const versionResult = spawnSync(execPath, ['-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")'], {
            encoding: 'utf8'
          });
          
          if (versionResult.status === 0) {
            const version = versionResult.stdout.trim();
            const [major, minor, micro] = version.split('.').map(Number);
            
            // Check if version is in supported range
            const minComponents = config.pythonMinVersion.split('.').map(Number);
            const maxComponents = config.pythonMaxVersion.split('.').map(Number);
            
            const isSupported = 
              (major > minComponents[0] || (major === minComponents[0] && minor >= minComponents[1])) &&
              (major < maxComponents[0] || (major === maxComponents[0] && minor <= maxComponents[1]));
            
            if (isSupported) {
              possibleVersions.push({
                executable: execPath,
                version: { major, minor, micro, raw: version, isSupported }
              });
            }
          }
        }
      } catch (error) {
        // Ignore errors and try next executable
      }
    }
  } else {
    // On Windows, try common Python installations
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    let localAppData = 'C:\\Users\\Default\\AppData\\Local';
    try {
      if (process.env.LOCALAPPDATA) {
        localAppData = process.env.LOCALAPPDATA;
      } else {
        const username = os.userInfo().username;
        localAppData = `C:\\Users\\${username}\\AppData\\Local`;
      }
    } catch (e) {
      // Fallback to default if userInfo fails
    }
    
    const candidatePaths = [
      `${programFiles}\\Python311\\python.exe`,
      `${programFiles}\\Python310\\python.exe`,
      `${programFiles}\\Python39\\python.exe`,
      `${programFiles}\\Python38\\python.exe`,
      `${programFiles}\\Python37\\python.exe`,
      `${programFiles}\\Python36\\python.exe`,
      `${programFilesX86}\\Python311\\python.exe`,
      `${programFilesX86}\\Python310\\python.exe`,
      `${programFilesX86}\\Python39\\python.exe`,
      `${programFilesX86}\\Python38\\python.exe`,
      `${programFilesX86}\\Python37\\python.exe`,
      `${programFilesX86}\\Python36\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python311\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python310\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python39\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python38\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python37\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python36\\python.exe`
    ];
    
    for (const execPath of candidatePaths) {
      try {
        if (fs.existsSync(execPath)) {
          const versionResult = spawnSync(execPath, ['-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")'], {
            encoding: 'utf8'
          });
          
          if (versionResult.status === 0) {
            const version = versionResult.stdout.trim();
            const [major, minor, micro] = version.split('.').map(Number);
            
            // Check if version is in supported range
            const minComponents = config.pythonMinVersion.split('.').map(Number);
            const maxComponents = config.pythonMaxVersion.split('.').map(Number);
            
            const isSupported = 
              (major > minComponents[0] || (major === minComponents[0] && minor >= minComponents[1])) &&
              (major < maxComponents[0] || (major === maxComponents[0] && minor <= maxComponents[1]));
            
            if (isSupported) {
              possibleVersions.push({
                executable: execPath,
                version: { major, minor, micro, raw: version, isSupported }
              });
            }
          }
        }
      } catch (error) {
        // Ignore errors and try next executable
      }
    }
  }
  
  if (possibleVersions.length === 0) {
    console.warn(`No supported Python version found. Proceeding with default executable: ${config.pythonExecutable}`);
    return { executable: config.pythonExecutable, version: currentVersion };
  }
  
  // Try to find preferred version
  const preferredVersion = config.pythonPreferredVersion.split('.').map(Number);
  
  // Sort by preference (closest to preferred version first)
  possibleVersions.sort((a, b) => {
    const aDistance = Math.abs(a.version.major - preferredVersion[0]) * 100 + Math.abs(a.version.minor - preferredVersion[1]);
    const bDistance = Math.abs(b.version.major - preferredVersion[0]) * 100 + Math.abs(b.version.minor - preferredVersion[1]);
    return aDistance - bDistance;
  });
  
  const bestMatch = possibleVersions[0];
  logPerf(`Using Python ${bestMatch.version.raw} at ${bestMatch.executable}`);
  
  return bestMatch;
}

// Load plugins if enabled
let pluginManager = null;
async function setupPlugins() {
  if (!config.pluginsEnabled) {
    logPerf('Plugins disabled');
    return;
  }
  
  try {
    // Import the plugin manager
    const { PluginManager } = require('../dist/utils/plugin-manager');
    
    // Load plugin configuration
    let pluginDefs = [];
    
    // Load from configuration file if it exists
    if (fs.existsSync(config.pluginsConfigFile)) {
      try {
        const pluginsConfig = JSON.parse(fs.readFileSync(config.pluginsConfigFile, 'utf8'));
        if (Array.isArray(pluginsConfig.plugins)) {
          pluginDefs = pluginsConfig.plugins;
          logPerf(`Loaded ${pluginDefs.length} plugins from configuration file`);
        }
      } catch (error) {
        console.error(`Error loading plugin configuration: ${error.message}`);
      }
    }
    
    // Look for plugins in plugins directory
    if (fs.existsSync(config.pluginsDir)) {
      const pluginDirs = fs.readdirSync(config.pluginsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const dir of pluginDirs) {
        const pluginPath = path.join(config.pluginsDir, dir);
        const packageJsonPath = path.join(pluginPath, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Check if this is a featuretools-ts plugin
            if (packageJson.keywords?.includes('featuretools-ts-plugin')) {
              
              // Check if this plugin is already in pluginDefs
              const existingPlugin = pluginDefs.find(p => p.name === packageJson.name);
              if (!existingPlugin) {
                pluginDefs.push({
                  name: packageJson.name,
                  description: packageJson.description || '',
                  version: packageJson.version || '0.1.0',
                  module: pluginPath,
                  enabled: true,
                  priority: 100
                });
                logPerf(`Discovered plugin: ${packageJson.name}`);
              }
            }
          } catch (error) {
            console.error(`Error loading plugin from ${pluginPath}: ${error.message}`);
          }
        }
      }
    }
    
    // Create plugin manager
    if (pluginDefs.length > 0) {
      pluginManager = new PluginManager(pluginDefs);
      await pluginManager.initialize();
      logPerf(`Initialized plugin manager with ${pluginDefs.length} plugins`);
    } else {
      logPerf('No plugins found');
    }
  } catch (error) {
    console.error(`Error setting up plugins: ${error.message}`);
  }
}

// Execute plugins for a specific hook
async function executePluginHook(hook, context) {
  if (!pluginManager) return context;
  
  try {
    const result = await pluginManager.executeHook(hook, context);
    return result;
  } catch (error) {
    console.error(`Error executing plugin hook ${hook}: ${error.message}`);
    return context;
  }
}

logPerf('Starting type generation');

// Add support for finding stub directories
const findStubDirectories = () => {
  const stubDirs = [];
  
  // Check common stub locations
  const potentialLocations = [
    path.resolve(__dirname, '../stubs'),                   // Project stubs
    path.resolve(__dirname, '../node_modules/@types'),     // Installed @types
    path.resolve(os.homedir(), '.local/lib/python3/stubs') // User Python stubs
  ];
  
  for (const dir of potentialLocations) {
    if (fs.existsSync(dir)) {
      stubDirs.push(dir);
      logPerf(`Found stub directory: ${dir}`);
    }
  }
  
  // Check environment variables
  const envStubPath = process.env.TYPESHED_PATH || process.env.MYPY_CONFIG_FILE_PATH;
  if (envStubPath && fs.existsSync(envStubPath)) {
    stubDirs.push(envStubPath);
    logPerf(`Found stub directory from environment: ${envStubPath}`);
  }
  
  return stubDirs;
};

// Update needsRegeneration to check for changes in stub files
async function needsRegeneration() {
  // If force flag is set, always regenerate
  if (config.forceRegeneration) {
    logPerf('Force regeneration requested');
    return true;
  }

  try {
    // Check if cache file exists
    if (!fs.existsSync(config.cacheFile)) {
      logPerf('No cache file found - generating types');
      return true;
    }

    // Read cache file
    const cacheData = JSON.parse(fs.readFileSync(config.cacheFile, 'utf-8'));
    
    // Check if python script exists
    if (!fs.existsSync(config.pythonScript)) {
      logPerf('Python script not found - generating types');
      return true;
    }
    
    // Get script modification time
    const scriptStats = fs.statSync(config.pythonScript);
    const scriptMtime = new Date(scriptStats.mtime);
    
    // Check if cache is older than script
    if (new Date(cacheData.lastGenerated) < scriptMtime) {
      logPerf('Python script modified since last generation');
      return true;
    }
    
    // Check if version_compat.py is modified
    const versionCompatPath = path.resolve(path.dirname(config.pythonScript), 'version_compat.py');
    if (fs.existsSync(versionCompatPath)) {
      const versionCompatStats = fs.statSync(versionCompatPath);
      const versionCompatMtime = new Date(versionCompatStats.mtime);
      
      if (new Date(cacheData.lastGenerated) < versionCompatMtime) {
        logPerf('Python version compatibility script modified since last generation');
        return true;
      }
    }
    
    // Check if used Python version has changed
    if (cacheData.pythonVersion) {
      const pythonVersion = checkPythonVersion();
      if (pythonVersion && pythonVersion.raw !== cacheData.pythonVersion) {
        logPerf(`Python version changed from ${cacheData.pythonVersion} to ${pythonVersion.raw}`);
        return true;
      }
    }
    
    // Check if output file exists
    if (!fs.existsSync(config.outputFile)) {
      logPerf('Output file not found - generating types');
      return true;
    }
    
    // Check for stub file changes
    if (cacheData.stubFilesHash) {
      // Find all stub files and compute a hash of their contents
      const stubDirs = findStubDirectories();
      const stubFiles = [];
      
      // Collect all .pyi files from stub directories
      for (const dir of stubDirs) {
        const findStubFiles = (currentDir) => {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
              findStubFiles(fullPath);
            } else if (entry.name.endsWith('.pyi')) {
              stubFiles.push(fullPath);
            }
          }
        };
        
        try {
          findStubFiles(dir);
        } catch (err) {
          // Ignore permission errors and continue
          console.warn(`Couldn't read directory ${dir}: ${err.message}`);
        }
      }
      
      logPerf(`Found ${stubFiles.length} stub files`);
      
      // Compute a hash of all stub files (or a sample if there are many)
      if (stubFiles.length > 0) {
        const samplesToCheck = stubFiles.length > 100 
          ? stubFiles.slice(0, 5).concat(stubFiles.slice(-5)) // Sample first and last 5 if many files
          : stubFiles;
          
        // Create a hash combining the paths and modification times
        const stubsHashInput = samplesToCheck
          .map(file => {
            const stats = fs.statSync(file);
            return `${file}:${stats.mtime.getTime()}`;
          })
          .join('|');
        
        const currentStubsHash = crypto.createHash('md5').update(stubsHashInput).digest('hex');
        
        if (cacheData.stubFilesHash !== currentStubsHash) {
          logPerf('Stub files changed since last generation');
          return true;
        }
      }
    } else {
      // No previous stub hash, force regeneration
      logPerf('No stub files hash in cache');
      return true;
    }
    
    // Check script hash
    const scriptContent = fs.readFileSync(config.pythonScript, 'utf-8');
    const currentScriptHash = crypto.createHash('md5').update(scriptContent).digest('hex');
    
    if (cacheData.scriptHash !== currentScriptHash) {
      logPerf('Python script content changed - generating types');
      return true;
    }
    
    // Check version_compat.py hash
    if (fs.existsSync(versionCompatPath)) {
      const versionCompatContent = fs.readFileSync(versionCompatPath, 'utf-8');
      const currentVersionCompatHash = crypto.createHash('md5').update(versionCompatContent).digest('hex');
      
      if (cacheData.versionCompatHash !== currentVersionCompatHash) {
        logPerf('Python version compatibility script content changed - generating types');
        return true;
      }
    }

    // Trigger plugin hook
    const pluginContext = await executePluginHook('PRE_GENERATION', {
      config,
      metadata: {
        cache: cacheData,
        pythonScriptPath: config.pythonScript,
        outputFilePath: config.outputFile,
        forceRegeneration: config.forceRegeneration
      }
    });
    
    // Allow plugins to force regeneration
    if (pluginContext.metadata.forceRegeneration) {
      logPerf('Regeneration forced by plugin');
      return true;
    }

    logPerf('No regeneration needed - using cached types');
    return false;
  } catch (error) {
    logPerf(`Error checking if regeneration needed: ${error.message}`);
    return true;
  }
}

// Add stub directories as environment variables for the Python script
async function generateTypes() {
  logPerf('Generating TypeScript types');
  
  // Find the best Python executable
  const pythonInfo = findBestPythonExecutable();
  const pythonExecutable = pythonInfo.executable;
  
  if (pythonInfo.version) {
    logPerf(`Using Python ${pythonInfo.version.raw} for type generation`);
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Setup environment variables
      const env = { ...process.env };
      if (config.debugMode) {
        env.DEBUG = '1';
      }
      
      // Set TypeScript features env
      env.USE_TS_49_FEATURES = config.useTS49Features ? 'true' : 'false';
      if (config.debugMode) {
        logPerf(`TypeScript 4.9+ features ${config.useTS49Features ? 'enabled' : 'disabled'}`);
      }
      
      // Find stub directories and add to environment
      const stubDirs = findStubDirectories();
      if (stubDirs.length > 0) {
        env.TYPESHED_PATH = stubDirs.join(path.delimiter);
        logPerf(`Set TYPESHED_PATH environment variable with ${stubDirs.length} directories`);
      }
      
      // Trigger pre-conversion plugin hook
      executePluginHook('PRE_CONVERSION', {
        config,
        metadata: {
          pythonScript: config.pythonScript,
          pythonVersion: pythonInfo.version ? pythonInfo.version.raw : null,
          env
        }
      }).then(preContext => {
        // Use any environment variables added by plugins
        if (preContext.metadata.env) {
          Object.assign(env, preContext.metadata.env);
        }
        
        // Create a temporary file for output instead of using memory
        const tempFile = fs.openSync(config.tempOutputFile, 'w');
        
        // Spawn Python process
        const pythonProcess = spawn(pythonExecutable, [config.pythonScript], {
          env,
          stdio: ['ignore', tempFile, 'pipe']
        });
        
        let errorData = '';
        
        // Collect error data
        pythonProcess.stderr.on('data', (data) => {
          const chunk = data.toString();
          errorData += chunk;
          
          // Log performance messages to stderr
          if (chunk.includes('[PERF]') && config.debugMode) {
            console.error(chunk);
          }
        });
        
        // Handle process completion
        pythonProcess.on('close', (code) => {
          fs.closeSync(tempFile);
          
          logPerf(`Python process exited with code ${code}`);
          
          if (code !== 0) {
            // Trigger error plugin hook
            executePluginHook('ON_ERROR', {
              config,
              error: new Error(`Python process exited with code ${code}`),
              metadata: {
                errorOutput: errorData,
                pythonVersion: pythonInfo.version ? pythonInfo.version.raw : null
              }
            }).finally(() => {
              reject(new Error(`Python process exited with code ${code}\n${errorData}`));
            });
            return;
          }
          
          // Check warnings in error output
          const warnings = errorData
            .split('\n')
            .filter(line => line.toLowerCase().includes('warning') && !line.includes('[PERF]'))
            .join('\n');
          
          if (warnings && config.debugMode) {
            console.warn('Warnings during type generation:\n', warnings);
          }
          
          try {
            // Read from temporary file instead of keeping large string in memory
            const output = fs.readFileSync(config.tempOutputFile, 'utf-8');
            
            // Trigger post-conversion plugin hook
            executePluginHook('POST_CONVERSION', {
              config,
              tsOutput: output,
              metadata: {
                warnings,
                errorOutput: errorData,
                pythonVersion: pythonInfo.version ? pythonInfo.version.raw : null
              }
            }).then(postContext => {
              // Use potentially modified output from plugins
              const finalOutput = postContext.tsOutput || output;
              
              resolve({ 
                output: finalOutput, 
                error: errorData,
                pythonVersion: pythonInfo.version ? pythonInfo.version.raw : null
              });
            }).catch(error => {
              // Use original output if plugin execution fails
              resolve({ 
                output, 
                error: errorData,
                pythonVersion: pythonInfo.version ? pythonInfo.version.raw : null
              });
            });
          } catch (readError) {
            reject(new Error(`Failed to read generated types: ${readError.message}`));
          }
        });
        
        pythonProcess.on('error', (error) => {
          // Trigger error plugin hook
          executePluginHook('ON_ERROR', {
            config,
            error,
            metadata: {
              message: 'Failed to start Python process',
              errorOutput: errorData,
              pythonVersion: pythonInfo.version ? pythonInfo.version.raw : null
            }
          }).finally(() => {
            reject(new Error(`Failed to start Python process: ${error.message}`));
          });
        });
      }).catch(error => {
        reject(new Error(`Failed to execute plugin hook: ${error.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Write output to the TypeScript definitions file
 * 
 * @param {string} output The TypeScript definitions
 * @returns {Promise<void>}
 */
async function writeOutput(output) {
  logPerf('Writing generated types to file');
  
  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(config.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write the output file
    fs.writeFileSync(config.outputFile, output);
    logPerf(`Types written to ${config.outputFile}`);
    return true;
  } catch (error) {
    console.error(`Error writing output: ${error.message}`);
    return false;
  }
}

// Update updateCache to include stub files hash and Python version
async function updateCache(output, pythonVersion) {
  logPerf('Updating cache');
  
  try {
    const scriptContent = fs.readFileSync(config.pythonScript, 'utf-8');
    const scriptHash = crypto.createHash('md5').update(scriptContent).digest('hex');
    const outputHash = crypto.createHash('md5').update(output).digest('hex');
    
    // Check for version_compat.py and include its hash if it exists
    let versionCompatHash = '';
    const versionCompatPath = path.resolve(path.dirname(config.pythonScript), 'version_compat.py');
    if (fs.existsSync(versionCompatPath)) {
      const versionCompatContent = fs.readFileSync(versionCompatPath, 'utf-8');
      versionCompatHash = crypto.createHash('md5').update(versionCompatContent).digest('hex');
    }
    
    // Compute stub files hash
    let stubFilesHash = '';
    const stubDirs = findStubDirectories();
    if (stubDirs.length > 0) {
      const stubFiles = [];
      
      // Collect stub file paths
      for (const dir of stubDirs) {
        const findStubFiles = (currentDir) => {
          try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(currentDir, entry.name);
              if (entry.isDirectory()) {
                findStubFiles(fullPath);
              } else if (entry.name.endsWith('.pyi')) {
                stubFiles.push(fullPath);
              }
            }
          } catch (err) {
            // Ignore permission errors
            console.warn(`Couldn't read directory ${currentDir}: ${err.message}`);
          }
        };
        
        findStubFiles(dir);
      }
      
      // Create a hash of stub file paths and modification times
      if (stubFiles.length > 0) {
        const samplesToCheck = stubFiles.length > 100 
          ? stubFiles.slice(0, 5).concat(stubFiles.slice(-5)) // Sample first and last 5 if many files
          : stubFiles;
          
        const stubsHashInput = samplesToCheck
          .map(file => {
            const stats = fs.statSync(file);
            return `${file}:${stats.mtime.getTime()}`;
          })
          .join('|');
        
        stubFilesHash = crypto.createHash('md5').update(stubsHashInput).digest('hex');
        logPerf(`Computed hash for ${stubFiles.length} stub files`);
      }
    }
    
    const cacheData = {
      lastGenerated: new Date().toISOString(),
      scriptHash,
      outputHash,
      stubFilesHash,
      versionCompatHash,
      pythonVersion
    };
    
    fs.writeFileSync(config.cacheFile, JSON.stringify(cacheData, null, 2));
    logPerf('Cache updated');
    return true;
  } catch (error) {
    console.error(`Error updating cache: ${error.message}`);
    return false;
  }
}

/**
 * Cleanup temporary files
 */
function cleanup() {
  try {
    if (fs.existsSync(config.tempOutputFile)) {
      fs.unlinkSync(config.tempOutputFile);
    }
  } catch (error) {
    console.error(`Error cleaning up: ${error.message}`);
  }
}

/**
 * Main execution function
 */
async function main() {
  logPerf('Starting type generation');
  
  try {
    // Setup plugins
    await setupPlugins();
    
    // Check if we need to regenerate the types
    const shouldRegenerate = await needsRegeneration();
    
    if (shouldRegenerate) {
      // Generate the types
      const { output, pythonVersion } = await generateTypes();
      
      // Write the output to a file
      await writeOutput(output);
      
      // Update the cache
      await updateCache(output, pythonVersion);
      
      // Trigger post-generation plugin hook
      await executePluginHook('POST_GENERATION', {
        config,
        tsOutput: output,
        metadata: {
          success: true,
          regenerated: true,
          outputPath: config.outputFile,
          pythonVersion
        }
      });
      
      logPerf('Type generation completed successfully');
    } else {
      logPerf('Using cached types');
      
      // Trigger post-generation plugin hook
      await executePluginHook('POST_GENERATION', {
        config,
        metadata: {
          success: true,
          regenerated: false,
          outputPath: config.outputFile
        }
      });
    }
  } catch (error) {
    console.error(`Error generating types: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up temporary files
    cleanup();
    
    // Clean up plugins
    if (pluginManager) {
      await pluginManager.cleanup();
    }
  }
}

// Run the main function
main(); 