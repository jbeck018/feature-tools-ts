const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Configuration
const config = {
  sourceFile: path.join(__dirname, '../src/types/generated.ts'),
  outputFile: path.join(__dirname, '../src/utils/generated-validators.ts'),
  verbose: process.argv.includes('--verbose'),
};

/**
 * Parse TypeScript file to extract interface definitions
 */
function parseTypeScriptFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const interfaces = [];

  function visit(node) {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      const properties = [];

      // Extract JSDoc comments if any
      const jsDoc = ts.getJSDocCommentsAndTags(node);
      const docs = jsDoc.length > 0 ? jsDoc[0].comment : '';

      // Extract properties
      for (const member of node.members) {
        if (ts.isPropertySignature(member)) {
          const propertyName = member.name.getText(sourceFile);
          const propertyType = member.type ? member.type.getText(sourceFile) : 'any';
          const optional = member.questionToken !== undefined;

          // Extract property JSDoc
          const propJsDoc = ts.getJSDocCommentsAndTags(member);
          const propDocs = propJsDoc.length > 0 ? propJsDoc[0].comment : '';

          properties.push({
            name: propertyName,
            type: propertyType,
            optional,
            docs: propDocs
          });
        }
      }

      interfaces.push({
        name: interfaceName,
        properties,
        docs
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return interfaces;
}

/**
 * Generate validator code for each interface
 */
function generateValidators(interfaces) {
  const output = [
    '/**',
    ' * Auto-generated validators for Featuretools TypeScript',
    ' * Generated from TypeScript interfaces',
    ' * DO NOT EDIT DIRECTLY',
    ' */',
    '',
    'import { registerValidator, objectValidator } from "./validation";',
    '',
    '/**',
    ' * Register validators for all generated types',
    ' */',
    'export function registerGeneratedValidators(): void {',
    ''
  ];

  // Add validator registration for each interface
  for (const iface of interfaces) {
    if (config.verbose) {
      console.log(`Generating validator for ${iface.name}...`);
    }

    if (iface.docs) {
      output.push(`  // ${iface.docs.replace(/\n/g, '\n  // ')}`);
    }

    // Create a validator function for the interface
    output.push(`  registerValidator('${iface.name}', objectValidator({`);

    // Add property validations
    for (const prop of iface.properties) {
      const requiredComment = prop.optional ? '// optional' : '';
      if (prop.docs) {
        output.push(`    // ${prop.docs}`);
      }
      output.push(`    ${prop.name}: '${getBaseType(prop.type)}', ${requiredComment}`);
    }

    output.push('  }));');
    output.push('');
  }

  output.push('}');
  output.push('');
  output.push('// Auto-register all validators when this module is imported');
  output.push('registerGeneratedValidators();');

  return output.join('\n');
}

/**
 * Extract base type from complex TypeScript types
 */
function getBaseType(tsType) {
  // Handle primitive types
  if (['string', 'number', 'boolean', 'any'].includes(tsType)) {
    return tsType;
  }

  // Handle arrays
  if (tsType.endsWith('[]')) {
    return 'array';
  }

  // Handle Record types
  if (tsType.startsWith('Record<')) {
    return 'object';
  }

  // Handle union types
  if (tsType.includes('|')) {
    // For optional types (union with null or undefined)
    if (tsType.includes('null') || tsType.includes('undefined')) {
      // Extract the non-null/undefined type
      const baseType = tsType
        .split('|')
        .map(t => t.trim())
        .filter(t => t !== 'null' && t !== 'undefined')[0];
      return getBaseType(baseType);
    }
    return 'any'; // Generic union types are harder to validate
  }

  // Handle interface references (custom types)
  // Assume it's a custom type
  return tsType;
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if source file exists
    if (!fs.existsSync(config.sourceFile)) {
      console.error(`Error: Source file not found: ${config.sourceFile}`);
      console.error('Run npm run generate-types first to create the TypeScript definitions');
      process.exit(1);
    }

    console.log(`Parsing TypeScript interfaces from ${config.sourceFile}...`);
    const interfaces = parseTypeScriptFile(config.sourceFile);

    console.log(`Found ${interfaces.length} interfaces`);
    if (config.verbose) {
      for (const iface of interfaces) {
        console.log(`- ${iface.name} (${iface.properties.length} properties)`);
      }
    }

    // Generate validator code
    const validatorCode = generateValidators(interfaces);

    // Ensure output directory exists
    const outDir = path.dirname(config.outputFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Write to output file
    fs.writeFileSync(config.outputFile, validatorCode);
    console.log(`Validators written to ${config.outputFile}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 