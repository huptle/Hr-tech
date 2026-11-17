import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const root = process.cwd();
const mdPath = join(root, "docs", "HUPTLE_APPLICATION_GUIDE.md");
const htmlPath = join(root, "docs", "HUPTLE_APPLICATION_GUIDE.html");
const pdfPath = join(root, "docs", "HUPTLE_APPLICATION_GUIDE.pdf");
const artifactPdfPath = "C:\\Users\\Aaryan\\.gemini\\antigravity\\brain\\a3d4bb9e-65d5-4eae-85eb-9a576796d2ea\\HUPTLE_APPLICATION_GUIDE.pdf";

const chromePath = existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

console.log("Using browser binary:", chromePath);

const md = readFileSync(mdPath, "utf8");

function inline(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function mdToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let inCode = false;
  let codeLang = "";
  let codeBuffer = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;

  const flushTable = () => {
    if (!tableRows.length) return;
    html += "<div class='table-container'><table>\n<thead>\n";
    const headerCells = tableRows[0]
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    html += "<tr>" + headerCells.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr>\n</thead>\n<tbody>\n";

    for (let i = 2; i < tableRows.length; i++) {
      const cells = tableRows[i]
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      html += "<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>\n";
    }
    html += "</tbody>\n</table></div>\n";
    tableRows = [];
    inTable = false;
  };

  const flushList = () => {
    if (inList) {
      html += "</ul>\n";
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks / Mermaid
    if (line.startsWith("```")) {
      flushTable();
      flushList();
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBuffer = [];
      } else {
        inCode = false;
        const codeContent = codeBuffer.join("\n");
        if (codeLang === "mermaid") {
          html += `<div class="mermaid-wrap"><pre class="mermaid">\n${codeContent}\n</pre></div>\n`;
        } else {
          html += `<pre><code>${codeContent
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</code></pre>\n`;
        }
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList();
      inTable = true;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      flushList();
      html += `<div class="cover">
        <div class="cover-badge">ENTERPRISE TECHNICAL DOCUMENTATION</div>
        <h1 class="cover-title">${inline(line.slice(2))}</h1>
        <div class="cover-meta">
          <p><strong>Lead Architect & Creator:</strong> Aaryan Gupta</p>
          <p><strong>Document Version:</strong> 1.0.0 Production Architecture &bull; November 2026</p>
          <p><strong>Ecosystem:</strong> Huptle HR Management + Placement Broker Network + Candidate Apply Portal</p>
        </div>
      </div>\n`;
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      html += `<h2>${inline(line.slice(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      html += `<h3>${inline(line.slice(4))}</h3>\n`;
      continue;
    }
    if (line.startsWith("#### ")) {
      flushList();
      html += `<h4>${inline(line.slice(5))}</h4>\n`;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      html += `<blockquote>${inline(line.slice(2))}</blockquote>\n`;
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***") {
      flushList();
      html += `<hr/>\n`;
      continue;
    }

    // Unordered lists
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      if (!inList) {
        html += "<ul>\n";
        inList = true;
      }
      const item = line.trim().slice(2);
      html += `<li>${inline(item)}</li>\n`;
      continue;
    }

    // Paragraph
    flushList();
    html += `<p>${inline(line)}</p>\n`;
  }

  flushTable();
  flushList();
  return html;
}

const bodyHtml = mdToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Huptle HR Tech Platform - Architecture Guide</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      themeVariables: {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        primaryColor: '#eef2ff',
        primaryBorderColor: '#6366f1',
        primaryTextColor: '#1e293b',
        lineColor: '#64748b',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#ffffff'
      }
    });
  </script>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .cover {
      text-align: center;
      padding: 70px 20px 40px;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
    }
    .cover-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 24px;
      border: 1px solid #c7d2fe;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #1e1b4b;
      margin: 0 0 24px;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }
    .cover-meta {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px solid #e2e8f0;
      max-width: 500px;
      width: 100%;
    }
    .cover-meta p {
      margin: 8px 0;
      font-size: 11pt;
      color: #475569;
    }
    .cover-meta strong {
      color: #0f172a;
    }
    h2 {
      font-size: 16pt;
      font-weight: 800;
      color: #1e1b4b;
      margin-top: 32px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 22px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    h4 {
      font-size: 11pt;
      font-weight: 700;
      color: #475569;
      margin-top: 16px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }
    p, li {
      color: #334155;
      margin: 6px 0;
    }
    ul {
      margin: 6px 0 14px 20px;
      padding: 0;
    }
    li {
      margin: 4px 0;
    }
    blockquote {
      margin: 14px 0;
      padding: 10px 16px;
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      border-radius: 4px;
      font-size: 10pt;
      color: #475569;
    }
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px 16px;
      border-radius: 8px;
      font-size: 9.5pt;
      overflow-x: auto;
      margin: 14px 0;
      page-break-inside: avoid;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }
    .mermaid-wrap {
      margin: 24px 0;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      text-align: center;
      page-break-inside: avoid;
    }
    .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }
    .table-container {
      margin: 18px 0;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 28px 0;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

writeFileSync(htmlPath, fullHtml, "utf8");
console.log("HTML written to:", htmlPath);

console.log("Generating PDF via Headless Browser...");
const chromeArgs = [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--run-all-compositor-stages-before-draw",
  "--no-pdf-header-footer",
  `--print-to-pdf=${pdfPath}`,
  htmlPath,
];

const res = spawnSync(chromePath, chromeArgs, { stdio: "inherit", timeout: 60000 });
if (res.status === 0 && existsSync(pdfPath)) {
  console.log("PDF successfully generated at:", pdfPath);
  copyFileSync(pdfPath, artifactPdfPath);
  console.log("Copied to artifact path:", artifactPdfPath);
} else {
  console.error("Failed to generate PDF. Exit code:", res.status);
  process.exit(1);
}
