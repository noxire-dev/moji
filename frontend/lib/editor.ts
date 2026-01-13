import TurndownService from "turndown";
import { marked } from "marked";

// Configure marked to output HTML
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

/**
 * Convert HTML to Markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html.trim() === "") return "";
  try {
    return turndownService.turndown(html);
  } catch (err) {
    console.error("Failed to convert HTML to markdown:", err);
    return "";
  }
}

/**
 * Convert Markdown to HTML (for Tiptap)
 * Tiptap uses HTML internally
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || markdown.trim() === "") {
    return "<p></p>";
  }
  try {
    const html = marked.parse(markdown) as string;
    return html;
  } catch (err) {
    console.error("Failed to convert markdown to HTML:", err);
    return `<p>${markdown}</p>`;
  }
}
