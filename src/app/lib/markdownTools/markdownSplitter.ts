
/**
 * A more advanced function that splits Markdown into blocks:
 * - Front matter (if present at top)
 * - Code blocks (fenced using triple backticks ``` )
 * - Headings (#, ##, ###, etc.)
 * - Paragraphs (split by two new lines)
 */

export type MarkdownBlock = {
    type: 'frontmatter' | 'code' | 'heading' | 'paragraph';
    content: string;
  }

export function splitMarkdownByBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let remaining = content.trimStart();

  // 1) Extract Front Matter if present at top: ---
  //    We'll look for a leading line with "---" and another on its own line
  //    before any other content.
  const frontMatterMatch = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(remaining);
  if (frontMatterMatch) {
    const fmFull = frontMatterMatch[0];       // Includes the --- delimiters
    const fmContent = frontMatterMatch[1];    // Inside the delimiters

    blocks.push({
      type: 'frontmatter',
      content: fmFull.trim() // keep the delimiters
    });

    // Remove front matter from "remaining" text
    remaining = remaining.slice(fmFull.length).trimStart();
  }

  // 2) Regex for fenced code blocks: ```lang ... ```
  //    We'll scan repeatedly using a while loop, because code blocks
  //    can appear multiple times.
  const codeBlockRegex = /^```[\s\S]*?```/m;

  // We’ll collect everything in order:
  while (true) {
    // Find the first code block
    const match = codeBlockRegex.exec(remaining);
    if (!match) break; // no code block found

    const codeBlock = match[0];
    // The code block starts at match.index
    const beforeCode = remaining.slice(0, match.index).trim();

    // If there's text before the code block, parse it for headings & paragraphs
    if (beforeCode) {
      blocks.push(...parseHeadingsAndParagraphs(beforeCode));
    }

    // Then push the code block
    blocks.push({
      type: 'code',
      content: codeBlock
    });

    // Move forward in the string
    remaining = remaining.slice(match.index + codeBlock.length).trimStart();
  }

  // If anything remains after the last code block, parse it for headings/paragraphs
  if (remaining) {
    blocks.push(...parseHeadingsAndParagraphs(remaining));
  }

  return blocks;
}

/**
 * Helper to parse any chunk that may contain headings and paragraphs
 */
function parseHeadingsAndParagraphs(content: string): MarkdownBlock[] {
  // We'll split on headings first, capturing the heading lines as separate blocks
  // Then we'll handle paragraphs on the non-heading segments.
  //
  // Heading pattern:  ^(#{1,6})\s+(.*)
  // We'll do a manual parse approach for better control.

  const blocks: MarkdownBlock[] = [];
  let textToProcess = content;

  const headingRegex = /^(#{1,6}[^\n]*)(?:\r?\n|$)/gm;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(textToProcess)) !== null) {
    const headingFull = match[0];
    const headingStartIndex = match.index;

    // The text before this heading is "body text", so handle paragraphs for it
    const before = textToProcess.slice(lastIndex, headingStartIndex).trim();
    if (before) {
      blocks.push(...splitByParagraphs(before));
    }

    // Now push the heading as a block
    blocks.push({
      type: 'heading',
      content: headingFull.trimEnd()
    });

    lastIndex = headingRegex.lastIndex;
  }

  // leftover after last heading
  const tail = textToProcess.slice(lastIndex).trim();
  if (tail) {
    blocks.push(...splitByParagraphs(tail));
  }

  return blocks;
}

/**
 * Splits a chunk of text by double new lines into paragraph blocks.
 */
function splitByParagraphs(chunk: string): MarkdownBlock[] {
  // \r?\n\s*\r?\n matches at least one blank line (possibly with spaces).
  const paragraphs = chunk.split(/\r?\n\s*\r?\n/g).map((s) => s.trim());
  return paragraphs
    .filter((p) => p.length > 0)
    .map((p) => ({
      type: 'paragraph' as const,
      content: p
    }));
}

/**
 * Splits Markdown content by paragraphs (two consecutive new lines).
 */
export function splitMarkdownByParagraphs(content: string): string[] {
    // The pattern \r?\n\s*\r?\n matches at least one blank line (possibly with spaces).
    return content.split(/\r?\n\s*\r?\n/g).map((s) => s.trimStart());
  }
  
  /**
   * Joins paragraphs back together using two consecutive new lines.
   */
  export function joinParagraphs(paragraphs: string[]): string {
    return paragraphs.join('\n\n');
  }
  

  export function joinMarkdownBlocks(blocks: MarkdownBlock[]): string {
    let output = '';
  
    blocks.forEach((block, i) => {
      switch (block.type) {
        case 'frontmatter':
        case 'code':
        case 'heading':
          // Insert a blank line before headings/code if the previous block was a paragraph
          // or heading. This is optional, just to ensure spacing is consistent.
          if (i > 0 && blocks[i - 1].type !== 'frontmatter') {
            output += '\n';
          }
          output += block.content.trimEnd() + '\n';
          break;
  
        case 'paragraph':
          // If this is the first block or after frontmatter/code, etc., ensure spacing
          if (i > 0 && blocks[i - 1].type !== 'frontmatter') {
            output += '\n';
          }
          output += block.content;
          output += '\n';
          break;
      }
    });
  
    return output.trimEnd() + '\n';
  }