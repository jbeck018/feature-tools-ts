import { Application, Converter, ReflectionKind, MarkdownEvent } from 'typedoc';

/**
 * TypeDoc plugin for integrating Mermaid.js diagrams into documentation.
 * 
 * This plugin enhances code blocks with the 'mermaid' language tag, transforming them
 * into interactive diagrams, and adds necessary initialization code to the output HTML.
 */
export function load(app: Application) {
  // Register a markdown handler to transform mermaid code blocks
  app.converter.on(MarkdownEvent.PARSE_CODE_BLOCK, (event: MarkdownEvent) => {
    const { lang, text } = event.code;

    if (lang === 'mermaid') {
      // Create container for the Mermaid diagram
      event.classList = 'interactive-diagram mermaid';
      
      // Keep the original mermaid syntax unchanged for rendering
      // The main.js script will initialize Mermaid.js on these elements
      return false;
    }
    
    return undefined;
  });

  // Handle TypeDoc comments that have mermaid diagrams
  app.converter.on(Converter.EVENT_RESOLVE_BEGIN, () => {
    // Process reflection documentation
    app.logger.info('Processing diagrams in documentation...');
    
    // Get all reflections with comments
    const reflections = app.project?.getReflectionsByKind(ReflectionKind.All);
    
    if (reflections) {
      for (const reflection of reflections) {
        if (reflection.comment?.summary) {
          processMermaidInComment(reflection.comment.summary);
        }
        
        if (reflection.comment?.blockTags) {
          for (const tag of reflection.comment.blockTags) {
            processMermaidInComment(tag.content);
          }
        }
      }
    }
  });
  
  /**
   * Process Mermaid code blocks within comment content
   * @param content The comment content to process
   */
  function processMermaidInComment(content: any[]) {
    if (!content || !Array.isArray(content)) return;
    
    for (let i = 0; i < content.length; i++) {
      const part = content[i];
      
      if (part.kind === 'code' && part.text && part.language === 'mermaid') {
        // Mark this code block as a mermaid diagram
        part.cssClasses = 'interactive-diagram mermaid';
      }
    }
  }
}

/**
 * Helper function to create a Mermaid diagram container
 * @param diagramCode The Mermaid diagram code
 * @returns HTML string for the diagram container
 */
export function createMermaidDiagram(diagramCode: string): string {
  return `
<div class="interactive-diagram">
  <div class="mermaid">
    ${diagramCode}
  </div>
</div>
  `;
}

/**
 * Export utility functions
 */
export const MermaidPlugin = {
  createDiagram: createMermaidDiagram,
}; 