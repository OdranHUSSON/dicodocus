import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Text, Heading } from 'mdast';

export interface LinkJuiceItem {
  keyword: string;
  href: string;
  contentTypes: string[];
}

export interface MultiLangLinkJuiceConfig {
  [lang: string]: LinkJuiceItem[];
}

export function transformMarkdown(
  markdown: string,
  allLangConfigs: MultiLangLinkJuiceConfig,
  lang: string,
  contentType: string
): string {
  // 1) Extract front matter
  const frontmatterPattern = /^---\n([\s\S]*?)\n---\n?/;
  let frontmatter = '';
  let body = markdown;

  const fmMatch = frontmatterPattern.exec(markdown);
  if (fmMatch) {
    frontmatter = fmMatch[0];
    body = markdown.slice(fmMatch[0].length);
  }

  // 2) Gather linkjuice items for this lang/contentType
  const linkJuiceConfig = (allLangConfigs[lang] ?? []).filter((item) =>
    item.contentTypes.includes(contentType)
  );
  if (!linkJuiceConfig.length) {
    return markdown;
  }

  // 3) Parse the body into an AST
  const tree = unified()
    .use(remarkParse)
    .parse(body) as Root;

  // 4) Visit text nodes, skipping headings and existing links
  visit(tree, (node, index, parent) => {
    if (parent?.type === 'heading') {
      // Skip text nodes inside headings
      return;
    }

    if (node.type === 'text' && parent?.type !== 'link') {
      const textNode = node as Text;
      if (!textNode.value) return;

      let textValue = textNode.value;

      for (const { keyword, href } of linkJuiceConfig) {
        // Word-boundary, case-insensitive
        const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
        textValue = textValue.replace(pattern, (match, offset, full) => {
          // Skip if near link syntax ( ]( or [ ]( ) or already [match]( )
          const before = full.slice(Math.max(0, offset - 2), offset);
          const after = full.slice(offset + match.length, offset + match.length + 2);
          if (before.includes('](') || after.includes('](')) {
            return match;
          }
          const around = full.slice(offset - 5, offset + match.length + 5);
          if (around.includes(`[${match}](`)) {
            return match;
          }

          // Otherwise linkify
          return `[${match}](${href})`;
        });
      }

      textNode.value = textValue;
    }
  });

  // 5) Convert AST back to string with minimal escapes
  const transformedBody = unified()
    .use(remarkGfm)
    .use(remarkStringify as any, {
      entities: false, // Don’t convert special characters to HTML entities
      bullet: '*', // Use asterisks for unordered lists
      fences: true, // Use fenced code blocks
      commonmark: true, // Output CommonMark-compliant Markdown
      resourceLink: true, // Simplifies link handling
    })
    .stringify(tree);

  // Ensure `transformedBody` is treated as a string
  const stringifiedBody = String(transformedBody);

  // Final pass to remove ALL unnecessary backslashes:
  const noEscapes = stringifiedBody.replace(/\\([\[\]()])/g, '$1');

  // Reassemble front matter and body
  return frontmatter + noEscapes;
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
