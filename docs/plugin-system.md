# Plugin System for Featuretools TypeScript

This document explains how to use and create plugins for extending the functionality of the Featuretools TypeScript type generation system.

## Overview

The plugin system allows you to customize and extend the type generation process by providing hooks at key points in the pipeline. Plugins can:

- Add custom processing for TypeScript types
- Generate additional files or documentation
- Collect metrics and statistics
- Perform validation or checks on generated types
- Modify the generated output

## Plugin Architecture

Plugins are loaded and executed by the plugin manager during the type generation process. The plugin manager calls registered plugins at specific hook points, passing a context object that may be modified by each plugin.

### Hook Points

The following hook points are available:

| Hook Point | Description | Context Data |
|------------|-------------|--------------|
| `PRE_GENERATION` | Before type generation begins | Configuration, metadata, cache |
| `PRE_CONVERSION` | After Python types are extracted but before conversion to TypeScript | Configuration, Python types |
| `POST_CONVERSION` | After TypeScript types are generated but before writing to file | Configuration, TypeScript output |
| `POST_GENERATION` | After type generation is complete | Configuration, metadata, success status |
| `ON_ERROR` | When an error occurs during type generation | Configuration, error object |

### Plugin Context

Each hook receives a context object containing relevant data for that stage of the pipeline. A plugin can modify this context, and the modifications are passed to subsequent plugins in the chain.

## Plugin Configuration

Plugins can be configured in the `plugins.json` file at the root of your project:

```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "description": "My custom plugin",
      "version": "1.0.0",
      "module": "./plugins/my-plugin",
      "options": {
        "customOption1": "value1",
        "customOption2": 42
      },
      "priority": 100,
      "enabled": true
    }
  ]
}
```

### Configuration Properties

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Unique identifier for the plugin | Yes |
| `description` | Plugin description | Yes |
| `version` | Plugin version | Yes |
| `module` | Module path or name | Yes |
| `options` | Plugin-specific options | No |
| `priority` | Execution order (lower numbers execute first) | No (default: 100) |
| `enabled` | Whether the plugin is enabled | No (default: true) |

## Creating a Plugin

To create a plugin, you need to create a JavaScript/TypeScript module that exports a class or object implementing the `Plugin` interface.

### Plugin Interface

```typescript
interface Plugin {
  // Initialize the plugin with its configuration
  initialize(config: PluginDefinition): void;
  
  // Handle hook calls
  onHook(hook: PluginHook, context: PluginContext): Promise<PluginContext> | PluginContext;
  
  // Clean up resources (optional)
  cleanup?(): void;
}
```

### Example Plugin

Here's a simple plugin that logs the number of interfaces generated:

```javascript
class InterfaceCounterPlugin {
  initialize(config) {
    this.name = config.name;
    console.log(`[${this.name}] Initialized`);
  }
  
  async onHook(hook, context) {
    if (hook === 'POST_CONVERSION' && context.tsOutput) {
      const interfaces = (context.tsOutput.match(/interface\s+([A-Za-z0-9_]+)/g) || []).length;
      console.log(`[${this.name}] Generated ${interfaces} interfaces`);
    }
    return context;
  }
  
  cleanup() {
    console.log(`[${this.name}] Cleanup completed`);
  }
}

module.exports = InterfaceCounterPlugin;
```

### Plugin Discovery

Plugins can be discovered in two ways:

1. **Configuration file**: Specified in the `plugins.json` file
2. **Plugin directory**: Automatically discovered in the `plugins` directory

For automatic discovery, plugins must:

1. Be in a subdirectory of the `plugins` directory
2. Have a `package.json` file
3. Include `"featuretools-ts-plugin"` in the `keywords` array

## Using Plugins

### Enabling/Disabling Plugins

Plugins can be enabled/disabled in the configuration file:

```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "enabled": false
    }
  ]
}
```

You can also disable all plugins with an environment variable:

```bash
DISABLE_PLUGINS=1 npm run generate-types
```

### Plugin Environment Variables

- `DISABLE_PLUGINS`: Disable all plugins (`true` or `1`)
- `PLUGINS_DIR`: Custom directory for plugin discovery (default: `./plugins`)
- `PLUGINS_CONFIG`: Custom path to plugins configuration file (default: `./plugins.json`)

## Creating Advanced Plugins

### Modifying TypeScript Output

Plugins can modify the TypeScript output before it's written to a file:

```javascript
async onHook(hook, context) {
  if (hook === 'POST_CONVERSION' && context.tsOutput) {
    // Add a header comment
    context.tsOutput = `/**
 * Generated with my custom plugin
 * Timestamp: ${new Date().toISOString()}
 */\n\n` + context.tsOutput;
  }
  return context;
}
```

### Adding Custom Environment Variables

Plugins can add environment variables for the Python process:

```javascript
async onHook(hook, context) {
  if (hook === 'PRE_CONVERSION') {
    // Add custom environment variables
    context.metadata.env.MY_CUSTOM_VAR = 'value';
  }
  return context;
}
```

### Forcing Type Regeneration

Plugins can force type regeneration even if the cache is valid:

```javascript
async onHook(hook, context) {
  if (hook === 'PRE_GENERATION') {
    // Force regeneration based on some condition
    if (someCondition) {
      context.metadata.forceRegeneration = true;
    }
  }
  return context;
}
```

## Example Plugins

The project includes examples of plugins that demonstrate different types of functionality:

- **Type Statistics Plugin**: Collects statistics about generated types
- **Documentation Plugin**: Generates supplementary documentation
- **Validation Plugin**: Validates generated types against custom rules

See the `examples/plugins` directory for complete examples.

## Best Practices

1. **Focus on a single responsibility**: Each plugin should have a clear, focused purpose
2. **Handle errors gracefully**: Don't throw errors in your plugin, handle them and log diagnostics
3. **Be mindful of performance**: Large or slow plugins can impact type generation time
4. **Don't modify the filesystem unnecessarily**: Unless your plugin's purpose is to write files
5. **Document your plugin**: Add a README.md with clear instructions for usage

## Troubleshooting

If your plugin isn't working as expected:

1. Enable debug mode: `DEBUG=1 npm run generate-types`
2. Check plugin initialization order: Plugins are executed in priority order
3. Verify your plugin path: Make sure the module path is correct
4. Check for errors in the plugin: Add try/catch blocks and log errors

## Plugin API Reference

See the TypeScript definition files in `src/types/config.ts` for detailed type definitions and interfaces for the plugin system. 