/**
 * scripts/generateComponentsDocs.js
 *
 * Reads components.css, finds each `@layer components.<componentName> { … }` block,
 * and generates ONE HTML page per component under docs/components/<componentName>.html.
 *
 * Each page includes:
 *   1) <h1>Component Name</h1>
 *   2) A short explanatory paragraph.
 *   3) Three preview panes (first 3 class selectors) with live rendering.
 *   4) Under each preview, a copyable code snippet showing how to instantiate it.
 *   5) Wrapped in docs/index.html template (so header/sidebar/footer remain intact).
 *
 * Usage:
 *   cd <project-root>
 *   npm install postcss
 *   node scripts/generateComponentsDocs.js
 */

const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

// ───────────────── CONFIG ───────────────── //

const COMPONENTS_CSS_PATH = path.join(__dirname, "../dist/components.css");
const docsDir = path.join(__dirname, "../docs");
const templatePath = path.join(docsDir, "../index.html");
const outputDir = path.join(docsDir, "components");

// Ensure docs/components folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1) Read & split docs/index.html at <main>…</main>
function splitTemplate(html) {
  const openTag = "<main";
  const closeTag = "</main>";
  const openIdx = html.indexOf(openTag);
  const closeIdx = html.indexOf(closeTag, openIdx);
  if (openIdx === -1 || closeIdx === -1) {
    throw new Error("Could not locate <main>…</main> in template.");
  }
  // Grab everything up to the `>` of <main …>
  const openEnd = html.indexOf(">", openIdx) + 1;
  return {
    partA: html.slice(0, openEnd),
    partC: html.slice(closeIdx) // includes </main> + footer
  };
}

// 2) Build each component page: title + short blurb + three previews
function buildComponentPage(componentName, selectors) {
  // Deduplicate and sort
  const unique = Array.from(new Set(selectors)).sort();

  // If fewer than 1 selector, bail with a placeholder paragraph
  const examples = unique.slice(0, 3);

  // Safe ID for DOM references
  const compId = componentName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/\-+/g, "-");

  // Start output
  let html = `
    <section class="mb-12">
      <h1 class="font-size-6 font-weight-bold text-black dark-text-slate-100 mb-3">${componentName}</h1>
      <p class="font-size-4 text-gray-700 dark-text-gray-300 mb-6">
        Below are three examples of how to use this component. Copy the code under each preview to try it out.
      </p>
  `;

  if (examples.length === 0) {
    html += `
      <p class="font-size-4 text-gray-700 dark-text-gray-300">
        (No selectors found for this component.)
      </p>
    `;
  } else {
    examples.forEach((selector, idx) => {
      const cls = selector.replace(/^\./, "");
      const exampleId = `${compId}-example-${idx}`;
      html += `
      <!-- Example ${idx + 1} -->
      <div class="mt-6 mb-2 font-weight-medium">Example: <code>${selector}</code></div>
      <div id="${exampleId}" class="preview-pane border-solid border-slate-100 dark-border-slate-800 p-12 flex justify-center items-center rounded-lg mb-4">
        <div class="${cls} bg-slate-100 p-2 border inline-block">
          ${selector}
        </div>
      </div>
      <div class="code-wrapper w-full mb-6">
        <div class="code-topbar d-flex justify-between items-center px-2 py-1 bg-slate-100 dark-bg-slate-800 rounded-t-sm">
          <div class="win-dots d-flex gap-2">
            <span class="bg-red-500"></span>
            <span class="bg-yellow-500"></span>
            <span class="bg-green-500"></span>
          </div>
          <button onclick="copyCode(this)" class="copy-btn">Copy</button>
        </div>
        <pre class="language-html"><code>&lt;!-- ${selector} demo --&gt;
&lt;div class="${cls} bg-slate-100 p-2 border inline-block"&gt;
  ${selector}
&lt;/div&gt;</code></pre>
      </div>
      `;
    });
  }

  html += `</section>`;
  return html;
}

// ─────────── MAIN SCRIPT ─────────── //

(async () => {
  // 1) Read components.css
  let rawCss;
  try {
    rawCss = fs.readFileSync(COMPONENTS_CSS_PATH, "utf-8");
  } catch (err) {
    console.error(`❌ Failed to read ${COMPONENTS_CSS_PATH}: ${err.message}`);
    process.exit(1);
  }

  // 2) Parse CSS with PostCSS to locate each @layer components.<componentName>
  const root = postcss.parse(rawCss);
  const buckets = {}; // { componentName: Set([selectors]) }

  root.walkAtRules("layer", atRule => {
    // Expect atRule.params like "components.my-button", "components.my-alert", etc.
    const match = atRule.params.trim().match(/^components\.([\w\-\u0080-\uFFFF]+)$/);
    if (!match) return;
    const compName = match[1];

    if (!buckets[compName]) {
      buckets[compName] = new Set();
    }

    // Collect all simple selectors within this @layer block
    atRule.walkRules(rule => {
      rule.selectors.forEach(sel => {
        sel = sel.trim();
        if (!sel.startsWith(".") || sel.includes(",")) return;
        buckets[compName].add(sel);
      });
    });
  });

  // 3) Read & split docs/index.html (for header/sidebar/footer)
  let templateHtml;
  try {
    templateHtml = fs.readFileSync(templatePath, "utf-8");
  } catch (err) {
    console.error(`❌ Failed to read ${templatePath}: ${err.message}`);
    process.exit(1);
  }
  let partA, partC;
  try {
    ({ partA, partC } = splitTemplate(templateHtml));
  } catch (err) {
    console.error(`❌ Error splitting template: ${err.message}`);
    process.exit(1);
  }

  // 4) Generate one HTML file per component under docs/components/
  for (const [compName, selectorSet] of Object.entries(buckets)) {
    // Pretty title: remove any "quanta-" or similar prefix, then title-case
    const prettyTitle = compName
      .replace(/^quanta-/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());

    const selectors = Array.from(selectorSet);
    const mainInner = buildComponentPage(prettyTitle, selectors);
    const finalHtml = partA + "\n" + mainInner + "\n" + partC;

    const outPath = path.join(outputDir, `${compName}.html`);
    fs.writeFileSync(outPath, finalHtml, "utf-8");
    console.log(`✔ Generated docs/components/${compName}.html (showing up to 3 examples)`);
  }

  console.log("\n✅ All component docs generated under docs/components/");
})();
