const path = require('path');
const fs = require('fs');
const { DefaultTheme } = require('typedoc');

/**
 * Custom interactive theme for FeatureTools TypeScript documentation
 * 
 * This theme extends the default TypeDoc theme and adds:
 * - Integration with Mermaid.js for diagrams
 * - Interactive code examples
 * - Type hierarchy visualizations
 * - Enhanced navigation and search
 */
class InteractiveFeatureToolsTheme extends DefaultTheme {
  constructor(renderer) {
    super(renderer);

    // Register additional assets
    this.addAssets();
  }

  /**
   * Add custom CSS and JavaScript files to the theme
   */
  addAssets() {
    // Ensure CSS directory exists
    const cssOutDir = path.join(
      this.application.options.getValue('out'),
      'assets/css'
    );
    
    // Ensure JavaScript directory exists
    const jsOutDir = path.join(
      this.application.options.getValue('out'),
      'assets/js'
    );

    // Add custom css file
    this.application.renderer.hooks.on('renderEnd', () => {
      try {
        if (!fs.existsSync(cssOutDir)) {
          fs.mkdirSync(cssOutDir, { recursive: true });
        }
        
        if (!fs.existsSync(jsOutDir)) {
          fs.mkdirSync(jsOutDir, { recursive: true });
        }

        // Copy custom CSS
        const customCssSource = path.resolve(process.cwd(), 'docs/custom.css');
        const customCssTarget = path.join(cssOutDir, 'custom.css');
        if (fs.existsSync(customCssSource)) {
          fs.copyFileSync(customCssSource, customCssTarget);
        }

        // Copy Mermaid script
        const mermaidSource = path.join(__dirname, 'assets/mermaid.min.js');
        const mermaidTarget = path.join(jsOutDir, 'mermaid.min.js');
        if (fs.existsSync(mermaidSource)) {
          fs.copyFileSync(mermaidSource, mermaidTarget);
        }

        // Copy main script
        const mainJsSource = path.join(__dirname, 'assets/main.js');
        const mainJsTarget = path.join(jsOutDir, 'main.js');
        if (fs.existsSync(mainJsSource)) {
          fs.copyFileSync(mainJsSource, mainJsTarget);
        }

        // Modify the index.html to include our scripts and CSS
        this.insertScriptsAndStyles();
      } catch (error) {
        console.error('Error adding custom assets:', error);
      }
    });
  }

  /**
   * Insert scripts and styles into the generated HTML files
   */
  insertScriptsAndStyles() {
    const outDir = this.application.options.getValue('out');
    
    // Process all HTML files
    this.processHtmlFiles(outDir);
  }

  /**
   * Process all HTML files in the output directory
   * @param {string} dir - Directory to process
   */
  processHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        this.processHtmlFiles(filePath);
      } else if (file.endsWith('.html')) {
        // Modify HTML files
        this.modifyHtmlFile(filePath);
      }
    }
  }

  /**
   * Modify an HTML file to include our custom scripts and styles
   * @param {string} filePath - Path to the HTML file
   */
  modifyHtmlFile(filePath) {
    try {
      let html = fs.readFileSync(filePath, 'utf8');
      
      // Add custom CSS link
      if (!html.includes('custom.css')) {
        html = html.replace(
          '</head>',
          '    <link rel="stylesheet" href="./assets/css/custom.css">\n</head>'
        );
      }
      
      // Add Mermaid script
      if (!html.includes('mermaid.min.js')) {
        html = html.replace(
          '</body>',
          '    <script src="./assets/js/mermaid.min.js"></script>\n</body>'
        );
      }
      
      // Add main script
      if (!html.includes('main.js')) {
        html = html.replace(
          '</body>',
          '    <script src="./assets/js/main.js"></script>\n</body>'
        );
      }
      
      fs.writeFileSync(filePath, html);
    } catch (error) {
      console.error(`Error modifying HTML file ${filePath}:`, error);
    }
  }
}

/**
 * Export the theme
 */
exports.InteractiveFeatureToolsTheme = InteractiveFeatureToolsTheme;
exports.load = function(app) {
  app.renderer.defineTheme('interactive', InteractiveFeatureToolsTheme);
}; 