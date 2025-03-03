/**
 * Main JavaScript file for FeatureTools TypeScript interactive documentation
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Mermaid diagrams
  initializeMermaid();
  
  // Initialize code example tabs
  initializeCodeTabs();
  
  // Initialize type hierarchy visualizations
  initializeTypeHierarchy();
  
  // Add event handlers for expandable sections
  initializeExpandableSections();
});

/**
 * Initialize Mermaid.js for diagrams
 */
function initializeMermaid() {
  if (window.mermaid) {
    // Configure Mermaid for light/dark theme support
    const isDarkTheme = document.documentElement.classList.contains('dark');
    
    window.mermaid.initialize({
      startOnLoad: true,
      theme: isDarkTheme ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      fontSize: 14
    });
    
    // Process all mermaid diagrams
    window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    
    // Re-render on theme change
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDarkTheme = document.documentElement.classList.contains('dark');
          window.mermaid.initialize({
            theme: isDarkTheme ? 'dark' : 'default'
          });
          window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

/**
 * Initialize code example tabs
 */
function initializeCodeTabs() {
  document.querySelectorAll('.code-example-tabs').forEach(tabContainer => {
    const tabs = tabContainer.querySelectorAll('.code-example-tab');
    const panels = tabContainer.querySelectorAll('.code-example-panel');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs and panels
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding panel
        tab.classList.add('active');
        const target = tab.getAttribute('data-target');
        if (target) {
          tabContainer.querySelector(`#${target}`).classList.add('active');
        }
      });
    });
    
    // Activate the first tab by default
    if (tabs.length > 0) {
      tabs[0].click();
    }
  });
}

/**
 * Initialize type hierarchy visualizations
 */
function initializeTypeHierarchy() {
  document.querySelectorAll('.type-hierarchy-node').forEach(node => {
    node.addEventListener('click', function() {
      const typeId = node.getAttribute('data-type-id');
      if (typeId) {
        // Navigate to the type's documentation
        window.location.href = `#${typeId}`;
      }
    });
  });
}

/**
 * Initialize expandable documentation sections
 */
function initializeExpandableSections() {
  document.querySelectorAll('.expandable-section-header').forEach(header => {
    header.addEventListener('click', function() {
      const section = header.closest('.expandable-section');
      if (section) {
        section.classList.toggle('expanded');
        
        // Update icon
        const icon = header.querySelector('.expandable-icon');
        if (icon) {
          if (section.classList.contains('expanded')) {
            icon.textContent = '−';
          } else {
            icon.textContent = '+';
          }
        }
      }
    });
  });
}

/**
 * Create a dynamic code playground
 */
function createPlayground(container, initialCode, dependencies) {
  if (!container) return;
  
  // Create playground elements
  const header = document.createElement('div');
  header.className = 'interactive-playground-header';
  
  const title = document.createElement('div');
  title.className = 'interactive-playground-title';
  title.textContent = 'Interactive Example';
  
  const controls = document.createElement('div');
  controls.className = 'interactive-playground-controls';
  
  const runButton = document.createElement('button');
  runButton.textContent = 'Run';
  runButton.className = 'btn btn-primary btn-sm';
  
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.className = 'btn btn-secondary btn-sm';
  
  controls.appendChild(runButton);
  controls.appendChild(resetButton);
  
  header.appendChild(title);
  header.appendChild(controls);
  
  const editor = document.createElement('div');
  editor.className = 'interactive-playground-editor';
  
  const output = document.createElement('div');
  output.className = 'interactive-playground-output';
  output.innerHTML = '<em>Run the code to see the output</em>';
  
  // Append elements to container
  container.appendChild(header);
  container.appendChild(editor);
  container.appendChild(output);
  
  // Initialize code editor (placeholder for future implementation)
  const editorInstance = {
    getValue: () => initialCode,
    setValue: (value) => { initialCode = value; }
  };
  
  // Add event listeners
  runButton.addEventListener('click', function() {
    output.innerHTML = '<em>Running code...</em>';
    
    // This is a placeholder for actual execution
    // In a real implementation, you would use a sandbox solution
    setTimeout(() => {
      output.innerHTML = '<pre>Code executed successfully</pre>';
    }, 500);
  });
  
  resetButton.addEventListener('click', function() {
    editorInstance.setValue(initialCode);
    output.innerHTML = '<em>Code reset to initial state</em>';
  });
  
  return {
    container,
    editor: editorInstance,
    output
  };
}

// Export functions for potential use in other scripts
window.featureToolsDocs = {
  createPlayground,
  initializeMermaid
}; 