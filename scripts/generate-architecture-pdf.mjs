/**
 * Build docs/HUPTLE_APPLICATION_GUIDE.pdf with embedded diagram images.
 * 1) Extract Mermaid blocks → render PNG via @mermaid-js/mermaid-cli
 * 2) Build HTML with <img> tags
 * 3) Print PDF via Puppeteer
 *
 * Run: npm run docs:pdf
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mdPath = join(root, "docs", "HUPTLE_APPLICATION_GUIDE.md");
const diagramsDir = join(root, "docs", "diagrams");
const htmlPath = join(root, "docs", "HUPTLE_APPLICATION_GUIDE.html");
const pdfPath = join(root, "docs", "HUPTLE_APPLICATION_GUIDE.pdf");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    timeout: opts.timeout ?? 120000,
    ...opts,
  });
  return r.status === 0;
}

function ensureMermaidCli() {
  const mmdc = join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "mmdc.cmd" : "mmdc",
  );
  if (existsSync(mmdc)) return true;
  console.log("Installing @mermaid-js/mermaid-cli (one-time)...");
  return run("npm", ["install", "@mermaid-js/mermaid-cli@11", "--no-save"], {
    timeout: 300000,
  });
}

function ensurePuppeteer() {
  if (existsSync(join(root, "node_modules", "puppeteer"))) return true;
  console.log("Installing puppeteer (one-time)...");
  return run("npm", ["install", "puppeteer@23", "--no-save"], { timeout: 300000 });
}

function extractMermaidBlocks(md) {
  const re = /```mermaid\r?\n([\s\S]*?)```/g;
  const blocks = [];
  let m;
  while ((m = re.exec(md)) !== null) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

function renderDiagrams(blocks) {
  mkdirSync(diagramsDir, { recursive: true });
  for (const f of readdirSync(diagramsDir)) {
    if (/^diagram-\d+\.(mmd|png|svg)$/.test(f)) {
      try {
        unlinkSync(join(diagramsDir, f));
      } catch {
        /* ignore */
      }
    }
  }

  const mmdcBin = join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "mmdc.cmd" : "mmdc",
  );

  const imageNames = [];
  blocks.forEach((code, i) => {
    const id = String(i + 1).padStart(2, "0");
    const mmdFile = join(diagramsDir, `diagram-${id}.mmd`);
    const pngFile = join(diagramsDir, `diagram-${id}.png`);
    writeFileSync(mmdFile, code, "utf8");

    console.log(`Rendering diagram ${id}/${blocks.length}...`);
    const ok = run(
      mmdcBin,
      [
        "-i",
        mmdFile,
        "-o",
        pngFile,
        "-w",
        "1400",
        "-H",
        "900",
        "-b",
        "white",
        "-s",
        "2",
      ],
      { timeout: 180000 },
    );

    if (!ok || !existsSync(pngFile)) {
      console.error(`Failed to render diagram-${id}.mmd`);
      process.exit(1);
    }
    imageNames.push(`diagram-${id}.png`);
    console.log(`  → ${pngFile}`);
  });

  return imageNames;
}

function mdToHtml(md, imageNames) {
  const parts = md.split(/```mermaid\r?\n[\s\S]*?```/g);
  let html = "";
  let imgIdx = 0;

  for (let i = 0; i < parts.length; i++) {
    html += markdownChunkToHtml(parts[i]);
    if (imgIdx < imageNames.length) {
      const src = `diagrams/${imageNames[imgIdx]}`;
      html += `<figure class="diagram"><img src="${src}" alt="Diagram ${imgIdx + 1}"/></figure>\n`;
      imgIdx++;
    }
  }
  return html;
}

function markdownChunkToHtml(chunk) {
  const lines = chunk.split("\n");
  let out = "";
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    out += "<table>\n";
    tableRows.forEach((row, idx) => {
      const tag = idx === 0 ? "th" : "td";
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) return;
      out +=
        "<tr>" +
        cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("") +
        "</tr>\n";
    });
    out += "</table>\n";
    tableRows = [];
    inTable = false;
  };

  for (const line of lines) {
    if (line.startsWith("|")) {
      inTable = true;
      tableRows.push(line);
      continue;
    }
    if (inTable) flushTable();

    if (line.startsWith("# ")) {
      out += `<h1>${inline(line.slice(2))}</h1>\n`;
    } else if (line.startsWith("## ")) {
      out += `<h2>${inline(line.slice(3))}</h2>\n`;
    } else if (line.startsWith("### ")) {
      out += `<h3>${inline(line.slice(4))}</h3>\n`;
    } else if (line.startsWith("---")) {
      out += "<hr/>\n";
    } else if (line.startsWith("- ")) {
      out += `<li>${inline(line.slice(2))}</li>\n`;
    } else if (line.trim() === "") {
      out += "\n";
    } else if (!line.startsWith("```")) {
      out += `<p>${inline(line)}</p>\n`;
    }
  }
  if (inTable) flushTable();
  return out;
}

function inline(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

async function pdfFromHtml(expectedImages) {
  const puppeteer = await import("puppeteer");
  const url = pathToFileURL(htmlPath).href;
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  if (expectedImages > 0) {
    await page.waitForFunction(
      (expected) => {
        const imgs = document.querySelectorAll("figure.diagram img");
        if (imgs.length < expected) return false;
        return [...imgs].every(
          (img) => img.complete && img.naturalWidth > 0,
        );
      },
      { timeout: 90000 },
      expectedImages,
    );
  }
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
  });
  await browser.close();
  console.log("PDF:", pdfPath);
}

// ─── Main ───────────────────────────────────────────────────────────────────

const md = readFileSync(mdPath, "utf8");
const blocks = extractMermaidBlocks(md);
console.log(`Found ${blocks.length} Mermaid diagrams.`);

if (!ensureMermaidCli()) {
  console.error("Could not install mermaid-cli.");
  process.exit(1);
}

const imageNames = blocks.length > 0 ? renderDiagrams(blocks) : [];
const body = mdToHtml(md, imageNames);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Huptle Application Guide</title>
  <style>
    @page { margin: 18mm 14mm; size: A4; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1a1a2e;
      margin: 0;
      padding: 0 4mm;
    }
    h1 { font-size: 22pt; color: #3f64ba; border-bottom: 2px solid #3f64ba; padding-bottom: 8px; page-break-after: avoid; }
    h2 { font-size: 14pt; color: #2d4a8a; margin-top: 22px; page-break-after: avoid; }
    h3 { font-size: 12pt; page-break-after: avoid; }
    p, li { margin: 6px 0; }
    code { background: #f0f4ff; padding: 1px 5px; border-radius: 4px; font-size: 9.5pt; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; page-break-inside: avoid; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #eef2ff; }
    figure.diagram {
      margin: 18px 0 24px;
      page-break-inside: avoid;
      text-align: center;
    }
    figure.diagram img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    .cover {
      text-align: center;
      padding: 60px 20px 40px;
      page-break-after: always;
    }
    .cover h1 { border: none; font-size: 28pt; }
    .cover p { color: #555; font-size: 12pt; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>Huptle HR Platform</h1>
    <p>Application architecture, flows, and feature map</p>
    <p><strong>HR Portal + Candidate Apply Portal</strong></p>
    <p style="margin-top:40px;font-size:10pt;color:#888;">Generated from Huptle HR-tech repository</p>
  </div>
  ${body}
</body>
</html>`;

writeFileSync(htmlPath, fullHtml, "utf8");
console.log("Wrote", htmlPath);

if (!ensurePuppeteer()) {
  console.error("Could not install puppeteer.");
  process.exit(1);
}

await pdfFromHtml(imageNames.length);
