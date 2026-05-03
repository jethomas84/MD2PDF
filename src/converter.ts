import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import puppeteer from 'puppeteer-core';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { BrowserResolution, resolveBrowserExecutable } from './chromeFinder';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch { /* fall through */ }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

function getStyles(): string {
  return `
    <style>
      @page {
        margin: 1in 0.75in 1.2in 0.75in;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #1a1a1a;
        max-width: 100%;
        padding: 0;
        margin: 0;
      }
      h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0 0.4em 0; border-bottom: 2px solid #e1e4e8; padding-bottom: 0.3em; }
      h2 { font-size: 1.5em; font-weight: 600; margin: 1em 0 0.4em 0; border-bottom: 1px solid #e1e4e8; padding-bottom: 0.25em; }
      h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.4em 0; }
      h4 { font-size: 1em; font-weight: 600; margin: 1em 0 0.4em 0; }
      h5 { font-size: 0.875em; font-weight: 600; margin: 1em 0 0.4em 0; }
      h6 { font-size: 0.85em; font-weight: 600; margin: 1em 0 0.4em 0; color: #555; }
      p { margin: 0.5em 0; }
      a { color: #0366d6; text-decoration: none; }
      strong { font-weight: 700; }
      em { font-style: italic; }
      blockquote {
        margin: 0.5em 0;
        padding: 0.5em 1em;
        border-left: 4px solid #dfe2e5;
        color: #555;
        background: #f8f8f8;
      }
      blockquote p { margin: 0.25em 0; }
      code {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
        font-size: 0.9em;
        background: #f0f0f0;
        padding: 0.15em 0.35em;
        border-radius: 3px;
      }
      pre.hljs {
        background: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 1em;
        overflow-x: auto;
        margin: 0.75em 0;
      }
      pre.hljs code {
        background: none;
        padding: 0;
        font-size: 0.85em;
        line-height: 1.45;
      }
      ul, ol { padding-left: 2em; margin: 0.5em 0; }
      li { margin: 0.2em 0; }
      li > ul, li > ol { margin: 0.1em 0; }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 0.75em 0;
      }
      th, td {
        border: 1px solid #dfe2e5;
        padding: 0.5em 0.75em;
        text-align: left;
      }
      th { background: #f6f8fa; font-weight: 600; }
      tr:nth-child(even) { background: #fafbfc; }
      hr {
        border: none;
        border-top: 2px solid #e1e4e8;
        margin: 1.5em 0;
      }
      img { max-width: 100%; height: auto; }
      .task-list-item { list-style: none; margin-left: -1.5em; }
      .task-list-item input { margin-right: 0.5em; }

      /* highlight.js theme (GitHub-like) */
      .hljs-keyword, .hljs-selector-tag, .hljs-built_in { color: #d73a49; }
      .hljs-string, .hljs-attr { color: #032f62; }
      .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
      .hljs-number, .hljs-literal { color: #005cc5; }
      .hljs-title, .hljs-section { color: #6f42c1; }
      .hljs-type, .hljs-name { color: #22863a; }
      .hljs-variable, .hljs-template-variable { color: #e36209; }
      .hljs-deletion { color: #b31d28; background: #ffeef0; }
      .hljs-addition { color: #22863a; background: #f0fff4; }
    </style>
  `;
}

function buildHtml(markdownContent: string, title: string): string {
  const rendered = md.render(markdownContent);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  ${getStyles()}
</head>
<body>
  ${rendered}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resolveBrowser(): BrowserResolution {
  const config = vscode.workspace.getConfiguration('md2pdf');
  const configuredPath = config.get<string>('chromePath');
  return resolveBrowserExecutable(configuredPath);
}

function buildMissingBrowserMessage(resolution: BrowserResolution): string {
  const checkedLocations = resolution.diagnostics
    .map(candidate => {
      const lookup = candidate.source === 'command' ? `command "${candidate.location}"` : candidate.location;
      return `${candidate.browserName} via ${lookup}`;
    })
    .join(', ');

  const configuredPathMessage = resolution.configuredPath
    ? ` Configured md2pdf.chromePath was not found: ${resolution.configuredPath}.`
    : '';

  const checkedLocationsMessage = checkedLocations
    ? ` Checked: ${checkedLocations}.`
    : '';

  return [
    'No supported browser was found.',
    'Install Google Chrome, Microsoft Edge, or Brave, or set "md2pdf.chromePath" to the browser executable path.',
    configuredPathMessage,
    checkedLocationsMessage,
  ].join('');
}

export async function convertMarkdownToPdf(
  mdFilePath: string,
  outputPath?: string
): Promise<string> {
  const browserResolution = resolveBrowser();
  if (!browserResolution.executablePath) {
    throw new Error(buildMissingBrowserMessage(browserResolution));
  }
  const browserPath = browserResolution.executablePath;

  const mdContent = fs.readFileSync(mdFilePath, 'utf-8');
  const title = path.basename(mdFilePath, path.extname(mdFilePath));

  // Determine output path
  if (!outputPath) {
    const config = vscode.workspace.getConfiguration('md2pdf');
    const outDir = config.get<string>('outputDirectory');
    if (outDir && outDir.trim() !== '') {
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      outputPath = path.join(outDir, `${title}.pdf`);
    } else {
      outputPath = mdFilePath.replace(/\.md$/i, '.pdf');
    }
  }

  const config = vscode.workspace.getConfiguration('md2pdf');
  const pageFormat = config.get<string>('pageFormat') || 'Letter';
  const orientation = config.get<string>('pageOrientation') || 'portrait';

  const html = buildHtml(mdContent, title);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // Resolve image paths relative to the markdown file's directory
    const mdDir = path.dirname(mdFilePath);
    const baseUrl = `file:///${mdDir.replace(/\\/g, '/')}/`;
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluate((base: string) => {
      const imgs = document.querySelectorAll('img');
      imgs.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('file:')) {
          img.setAttribute('src', base + src);
        }
      });
    }, baseUrl);

    // Brief wait for any image loads
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });

    const footerHtml = `
      <div style="width:100%; text-align:center; font-size:9px; color:#888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 5px 0;">
        github.com/jethomas84/MD2PDF
      </div>
    `;

    await page.pdf({
      path: outputPath,
      format: pageFormat as any,
      landscape: orientation === 'landscape',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: footerHtml,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '1in',
        left: '0.75in',
      },
    });
  } finally {
    await browser.close();
  }

  return outputPath;
}
