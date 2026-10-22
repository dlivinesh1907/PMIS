const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak
} = require('docx');

const reportMdPath = path.resolve(__dirname, '../../DOCUMENTS/PROJECT_REPORT.md');
const outDocxPath = path.resolve(__dirname, '../../DOCUMENTS/PROJECT_REPORT.docx');
const outHtmlPath = path.resolve(__dirname, '../../DOCUMENTS/PROJECT_REPORT.html');

const mdContent = fs.readFileSync(reportMdPath, 'utf8');

// ==========================================
// 1. GENERATE RICH PRINTABLE HTML DOCUMENT
// ==========================================
function markdownToHtml(md) {
  const lines = md.split('\n');
  let html = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
        continue;
      } else {
        inCodeBlock = false;
        const codeEscaped = codeBlockLines
          .map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
          .join('\n');
        html.push(`<div class="code-container"><div class="code-header">${codeBlockLang || 'Code'}</div><pre><code>${codeEscaped}</code></pre></div>`);
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Table handling
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Check if it is separator row (e.g. |---|---|)
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        continue; // ignore separator row
      }
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      inTable = false;
      // Render table
      let tableHtml = '<div class="table-wrapper"><table>';
      tableRows.forEach((r, idx) => {
        const cells = r.split('|').slice(1, -1).map(c => c.trim());
        tableHtml += '<tr>';
        cells.forEach(c => {
          const tag = idx === 0 ? 'th' : 'td';
          const formatted = formatInline(c);
          tableHtml += `<${tag}>${formatted}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table></div>';
      html.push(tableHtml);
    }

    // List handling
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        inList = true;
        html.push('<ul>');
      }
      const itemText = formatInline(line.trim().slice(2));
      html.push(`<li>${itemText}</li>`);
      continue;
    } else if (/^\d+\.\s/.test(line.trim())) {
      if (!inList) {
        inList = true;
        html.push('<ol>');
      }
      const itemText = formatInline(line.trim().replace(/^\d+\.\s/, ''));
      html.push(`<li>${itemText}</li>`);
      continue;
    } else if (inList) {
      inList = false;
      html.push('</ul>');
    }

    // Headings
    if (line.startsWith('# ')) {
      const title = formatInline(line.slice(2).trim());
      html.push(`<h1 id="${slugify(line.slice(2))}">${title}</h1>`);
    } else if (line.startsWith('## ')) {
      const title = formatInline(line.slice(3).trim());
      html.push(`<h2 id="${slugify(line.slice(3))}">${title}</h2>`);
    } else if (line.startsWith('### ')) {
      const title = formatInline(line.slice(4).trim());
      html.push(`<h3 id="${slugify(line.slice(4))}">${title}</h3>`);
    } else if (line.startsWith('#### ')) {
      const title = formatInline(line.slice(5).trim());
      html.push(`<h4 id="${slugify(line.slice(5))}">${title}</h4>`);
    } else if (line.trim() === '---') {
      html.push('<hr />');
    } else if (line.trim().length > 0) {
      html.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inTable) {
    let tableHtml = '<div class="table-wrapper"><table>';
    tableRows.forEach((r, idx) => {
      const cells = r.split('|').slice(1, -1).map(c => c.trim());
      tableHtml += '<tr>';
      cells.forEach(c => {
        const tag = idx === 0 ? 'th' : 'td';
        tableHtml += `<${tag}>${formatInline(c)}</${tag}>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</table></div>';
    html.push(tableHtml);
  }

  if (inList) {
    html.push('</ul>');
  }

  return html.join('\n');
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function buildHtmlDocument() {
  const bodyHtml = markdownToHtml(mdContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Predictive Maintenance Intelligence System (PMIS) - Technical Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
      --border-color: #e2e8f0;
      --accent: #38bdf8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background-color: #f8fafc;
      line-height: 1.7;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
    }

    .top-actions {
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-color);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .top-actions .brand {
      font-weight: 700;
      font-size: 16px;
      color: var(--slate-900);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .top-actions .brand-badge {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      letter-spacing: 0.05em;
    }

    .top-actions .btn {
      background: #0284c7;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .top-actions .btn:hover {
      background: #0369a1;
    }

    .document-container {
      max-width: 960px;
      margin: 40px auto;
      background: #ffffff;
      padding: 64px 72px;
      border-radius: 12px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }

    h1, h2, h3, h4 {
      color: var(--slate-900);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    h1 {
      font-size: 32px;
      line-height: 1.25;
      margin-top: 24px;
      margin-bottom: 12px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
      color: #0f172a;
    }

    h2 {
      font-size: 24px;
      margin-top: 40px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #0369a1;
    }

    h3 {
      font-size: 19px;
      margin-top: 28px;
      margin-bottom: 12px;
      color: #1e293b;
    }

    h4 {
      font-size: 16px;
      margin-top: 20px;
      margin-bottom: 8px;
      color: #334155;
    }

    p {
      margin-bottom: 16px;
      color: #334155;
    }

    ul, ol {
      margin-bottom: 20px;
      padding-left: 28px;
      color: #334155;
    }

    li {
      margin-bottom: 6px;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 36px 0;
    }

    a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      background: #f1f5f9;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .code-container {
      margin: 24px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #334155;
      background: #0f172a;
    }

    .code-header {
      background: #1e293b;
      color: #94a3b8;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      padding: 6px 16px;
      border-bottom: 1px solid #334155;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    pre {
      padding: 16px;
      overflow-x: auto;
    }

    pre code {
      background: transparent;
      color: #f8fafc;
      border: none;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }

    .table-wrapper {
      margin: 24px 0;
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      text-align: left;
    }

    th {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    tr:nth-child(even) td {
      background: #fafbfc;
    }

    tr:hover td {
      background: #f0f9ff;
    }

    .doc-meta-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 20px 24px;
      margin: 24px 0 36px 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .doc-meta-item .label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #0369a1;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .doc-meta-item .val {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }

    /* Print stylesheet for clean PDF export */
    @media print {
      body {
        background: #ffffff;
        font-size: 12pt;
      }
      .top-actions {
        display: none !important;
      }
      .document-container {
        box-shadow: none;
        border: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      h1, h2 {
        page-break-after: avoid;
      }
      table, .code-container {
        page-break-inside: avoid;
      }
      h2 {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="top-actions">
    <div class="brand">
      Predictive Maintenance Intelligence System (PMIS)
      <span class="brand-badge">Official Report</span>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="document-container">
    <div class="doc-meta-card">
      <div class="doc-meta-item">
        <div class="label">Document ID</div>
        <div class="val">PMIS-TR-2026-V1</div>
      </div>
      <div class="doc-meta-item">
        <div class="label">Classification</div>
        <div class="val">Industrial AI & IIoT Platform</div>
      </div>
      <div class="doc-meta-item">
        <div class="label">Release Status</div>
        <div class="val">Verified Production Release</div>
      </div>
      <div class="doc-meta-item">
        <div class="label">Publication Date</div>
        <div class="val">October 2026</div>
      </div>
    </div>

    ${bodyHtml}
  </div>
</body>
</html>`;

  fs.writeFileSync(outHtmlPath, fullHtml, 'utf8');
  console.log(`[HTML] Generated document at: ${outHtmlPath}`);
}

// ==========================================
// 2. GENERATE MICROSOFT WORD .DOCX DOCUMENT
// ==========================================
async function buildDocxDocument() {
  const lines = mdContent.split('\n');
  const docChildren = [];

  // Title & Cover Header
  docChildren.push(
    new Paragraph({
      text: "Predictive Maintenance Intelligence System (PMIS)",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: "Comprehensive Technical Project Engineering Report",
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Document Reference: ", bold: true }),
        new TextRun("PMIS-TR-2026-V1  |  "),
        new TextRun({ text: "Release Date: ", bold: true }),
        new TextRun("October 2026  |  "),
        new TextRun({ text: "Status: ", bold: true }),
        new TextRun("Final Production Release")
      ],
      spacing: { after: 600 }
    }),
    new Paragraph({
      children: [new PageBreak()]
    })
  );

  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table parsing
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) continue;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      inTable = false;
      docChildren.push(createDocxTable(tableRows));
      docChildren.push(new Paragraph({ spacing: { after: 200 } }));
      tableRows = [];
    }

    if (line.trim().startsWith('```')) {
      // Code fence - read until closing
      let codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: codeLines.join('\n'),
              font: "Consolas",
              size: 19
            })
          ],
          shading: {
            type: ShadingType.SOLID,
            color: "F1F5F9"
          },
          spacing: { before: 150, after: 150 }
        })
      );
      continue;
    }

    if (line.startsWith('# ')) {
      docChildren.push(
        new Paragraph({
          text: line.slice(2).trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );
    } else if (line.startsWith('## ')) {
      docChildren.push(
        new Paragraph({
          text: line.slice(3).trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        })
      );
    } else if (line.startsWith('### ')) {
      docChildren.push(
        new Paragraph({
          text: line.slice(4).trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        })
      );
    } else if (line.startsWith('#### ')) {
      docChildren.push(
        new Paragraph({
          text: line.slice(5).trim(),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 80 }
        })
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      docChildren.push(
        new Paragraph({
          text: line.trim().slice(2),
          bullet: { level: 0 },
          spacing: { after: 60 }
        })
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      docChildren.push(
        new Paragraph({
          text: line.trim().replace(/^\d+\.\s/, ''),
          bullet: { level: 0 },
          spacing: { after: 60 }
        })
      );
    } else if (line.trim() === '---') {
      docChildren.push(new Paragraph({ spacing: { before: 200, after: 200 } }));
    } else if (line.trim().length > 0) {
      docChildren.push(
        new Paragraph({
          text: line.replace(/\*\*/g, '').replace(/`/g, ''),
          spacing: { after: 120 }
        })
      );
    }
  }

  if (inTable && tableRows.length > 0) {
    docChildren.push(createDocxTable(tableRows));
  }

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: "Predictive Maintenance Intelligence System (PMIS) — Technical Report",
                alignment: AlignmentType.RIGHT,
                style: "Header"
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun("Page "),
                  PageNumber.CURRENT,
                  new TextRun(" of "),
                  PageNumber.TOTAL_PAGES
                ]
              })
            ]
          })
        },
        children: docChildren
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outDocxPath, buffer);
  console.log(`[DOCX] Generated Microsoft Word document at: ${outDocxPath}`);
}

function createDocxTable(rows) {
  const docxRows = rows.map((r, rowIdx) => {
    const rawCells = r.split('|').slice(1, -1).map(c => c.trim());
    return new TableRow({
      children: rawCells.map(cellText => {
        return new TableCell({
          children: [
            new Paragraph({
              text: cellText.replace(/\*\*/g, '').replace(/`/g, ''),
              style: rowIdx === 0 ? "TableHeader" : "Normal"
            })
          ],
          shading: rowIdx === 0 ? { type: ShadingType.SOLID, color: "E2E8F0" } : undefined,
          width: { size: 100 / rawCells.length, type: WidthType.PERCENTAGE }
        });
      })
    });
  });

  return new Table({
    rows: docxRows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

// Run generators
buildHtmlDocument();
buildDocxDocument().catch(console.error);
