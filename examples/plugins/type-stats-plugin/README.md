# Featuretools TypeScript - Type Statistics Plugin

A plugin for Featuretools TypeScript that collects and reports statistics about the generated TypeScript types.

## Features

- Counts interfaces, methods, and properties in generated types
- Identifies the largest interface
- Measures type generation processing time
- Saves statistics to a JSON file
- Logs summary statistics to the console

## Installation

### Local Installation

1. Copy this directory to your project's `plugins` directory:

```bash
mkdir -p plugins
cp -r examples/plugins/type-stats-plugin plugins/
```

2. The plugin will be automatically discovered when you run the type generation.

### From npm (if published)

```bash
npm install featuretools-ts-type-stats-plugin
```

Then add to your plugins.json:

```json
{
  "plugins": [
    {
      "name": "type-stats",
      "description": "Collects statistics about generated types",
      "version": "0.1.0",
      "module": "featuretools-ts-type-stats-plugin",
      "options": {
        "outputPath": "./type-stats.json"
      }
    }
  ]
}
```

## Configuration

The plugin accepts the following configuration options:

- `outputPath`: Path where the JSON statistics file will be saved (default: `./type-stats.json`)

## Usage

Run type generation with plugins enabled:

```bash
npm run generate-types
```

The plugin will automatically collect statistics during the type generation process and save them to the specified output file.

## Example Output

```json
{
  "interfaceCount": 42,
  "methodCount": 156,
  "propertyCount": 385,
  "totalLineCount": 2341,
  "largestInterface": {
    "name": "EntitySet",
    "size": 128
  },
  "startTime": 1650123456789,
  "processingTime": 1234
}
```

## License

MIT 