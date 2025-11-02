/**
 * scripts/generateTailwindStyleDocs.js
 *
 * Reads your local dist/utilities.css, parses all .class rules
 * (including dark-/pseudo-/responsive- variants), and buckets them into:
 *
 *   docs/core.html
 *   docs/padding.html
 *   docs/margin.html
 *   docs/spacing.html
 *   docs/colors.html
 *   docs/typography.html
 *   docs/borders.html
 *   docs/layout.html
 *   docs/size.html
 *   docs/effects.html
 *   docs/transitions.html
 *   docs/animations.html
 *   docs/transforms.html
 *   docs/tables.html
 *   docs/interactivity.html
 *   docs/object-fit.html
 *   docs/flexbox.html
 *   docs/grid.html
 *
 *   docs/gradients.html
 *   docs/mixblend.html
 *   docs/isolate.html
 *   docs/margin-block.html
 *   docs/padding-block.html
 *   docs/shadow.html
 *   docs/visibility.html
 *   docs/clip.html
 *   docs/color-scheme.html
 *   docs/contain.html
 *   docs/decoration.html
 *   docs/field-sizing.html
 *   docs/ring.html
 *   docs/caret.html
 *   docs/aspect-ratio.html
 *
 *   docs/dark.html
 *   docs/pseudo.html
 *   docs/responsive.html
 *   docs/misc.html   (if truly uncategorized remain)
 *
 * Each page includes:
 *   1) <h1>Category</h1>
 *   2) A two-column table: Class | Styles (only the declarations)
 *   3) “Show more” toggle if > 8 rows (except Dark/Pseudo/Responsive capped at 10)
 *   4) Three separate “Example Preview” panes + code snippets (auto-picked first 3)
 *   5) Wrapped in docs/index.html template so header/sidebar/footer remain intact
 */

const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

// ───────────────── CONFIG ───────────────── //

// 1) Path to your local utilities.css file
const UTIL_CSS_PATH = path.join(__dirname, "../dist/utilities.css");

// 2) Paths
const docsDir = path.join(__dirname, "../docs");
const templatePath = path.join(docsDir, "../index.html");

// 3) Verify that docs/index.html exists
if (!fs.existsSync(templatePath)) {
  console.error(`❌ docs/index.html not found at ${templatePath}`);
  process.exit(1);
}

// 4) Category → prefixes (base, no variants)
//    Added new categories per request
const categoryMap = {
  core: ["container", "box-border", "box-content"],
  appearance: ["appearance-"],
  // Spacing/margin/padding
  padding: ["p-", "pt-", "pr-", "pb-", "pl-", "px-", "py-"],
  "padding-block": ["padding-block"],
  margin: ["m-", "mt-", "mr-", "mb-", "ml-", "mx-", "my-"],
  "margin-block": ["margin-block"],
  spacing: ["space-x-", "space-y-"],

  // Layout and display
  layout: [
    "flex", "inline-flex", "grid", "inline-grid",
    "block", "inline-block", "table", "hidden",
    "float-", "clear-",
    "d-" // catches d-flex, d-block, etc.
  ],

  // Size/width/height
  width: ["w-", "min-w-", "max-w-"],
  height: ["h-", "min-h-", "max-h-"],

  // Typography/text
  typography: [
    "font-", "text-", "leading-", "tracking-",
    "underline",    // text-underline
    "line-clamp",   // line-clamp-…
    "line-height"   // line-height-…
  ],

  // Colors
  colors: ["bg-", "text-", "border-", "placeholder-", "divide-", "accent-"],

  // Borders/radius/ring
  borders: ["border-", "rounded-", "rounded", "ring-"],

  // Effects: filters, shadows, blend modes, etc.
  effects: [
    "filter-",       // filter-…
    "backdrop-",     // backdrop-filter-…
    "blur",          // .blur or .blur-…
    "drop-shadow-",  // .drop-shadow-…
    "contrast-", "brightness-", "grayscale-", "invert-",
    "sepia-", "saturate-", "hue-rotate-",
    "opacity-"       // opacity-…
  ],

  // Transitions + animations
  transitions: ["transition", "duration-", "ease-", "delay-"],
  animations: ["animate-"],

  // Transforms
  transforms: ["transform", "translate-", "rotate-", "scale-", "skew-"],

  // Tables
  tables: ["table-", "border-collapse", "border-separate"],

  // Interactivity
  interactivity: ["cursor-", "pointer-events-", "select-", "resize", "resize-", "user-select-", "touch-action-"],

  // Object-fit
  "object-fit": ["object-"],

  // Flexbox
  flexbox: ["flex-", "items-", "justify-", "content-", "self-", "order-", "flex-wrap-", "flex-grow-", "flex-shrink-"],

  // Grid
  grid: ["grid-", "col-", "row-", "gap-", "auto-", "place-"],

  // New categories per your list:
  gradients: ["gradient-to-", "gradient-from-", "gradient-via-", "bg-gradient-"],
  mixblend: ["mix-blend-", "background-blend-"],
  isolate: ["isolation-"],

  "aspect-ratio": ["aspect-"],
  caret: ["caret-"],

  shadow: ["shadow", "shadow-"],
  visibility: ["visible", "invisible"],
  clip: ["clip-"],               // clip-path-…
  "color-scheme": ["color-scheme-"],
  contain: ["contain-"],
  decoration: ["decoration-clone", "decoration-slice"],
  "field-sizing": ["field-sizing-"],
  ring: ["ring"]
};

// 5) Variant prefixes
//    dark-       pseudo-   responsive-
const darkPrefix = "dark-";
const pseudoPrefixes = [
  "hover-", "focus-", "active-", "visited-",
  "disabled-", "checked-", "focus-visible-",
  "focus-within-", "group-hover-"
];
const responsivePrefixes = ["sm-", "md-", "lg-", "xl-", "uw-"];

// ────────── UTILITY FUNCTIONS ────────── //

/**
 * Split docs/index.html at <main>…</main>
 * Returns { partA, partC } so we can inject <main> contents.
 */
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

/**
 * Given a selector like ".hover-p-4" or ".sm-p-4", returns:
 *   { prefix: "hover-" or "sm-", base: "p-4" }.
 * If no variant prefix, returns { prefix: "", base: "p-4" }.
 */
function splitVariant(selector) {
  const sel = selector.replace(/^\./, ""); // drop leading dot
  for (const prefix of [...pseudoPrefixes, ...responsivePrefixes, darkPrefix]) {
    if (sel.startsWith(prefix)) {
      return { prefix, base: sel.slice(prefix.length) };
    }
  }
  return { prefix: "", base: sel };
}

/**
 * Given a base classname (e.g. "p-4"), returns its category key ("padding") or null.
 */
function findCategory(base) {
  for (const [cat, prefixes] of Object.entries(categoryMap)) {
    for (const p of prefixes) {
      // We want exact match OR startsWith. E.g. base="p-4" startsWith "p-"
      if (base === p || base.startsWith(p)) {
        return cat;
      }
    }
  }
  return null;
}

// Alphabetical sort by selector
function sortBySelector(a, b) {
  return a.selector < b.selector ? -1 : a.selector > b.selector ? 1 : 0;
}

/**
 * Build the “declarations only” string from a full rule.
 * E.g. ".p-4 { padding: 1rem; }" → "padding: 1rem;"
 */
function extractDeclarations(cssText) {
  const inside = cssText.replace(/^[^{]*\{\s*/, "").replace(/\s*\}$/, "");
  return inside.trim();
}

/**
 * Builds the two-column table + three separate “Example Previews” for a given category.
 * - title = "Padding" or "Object-Fit" etc.
 * - rows = [ { selector: ".p-4", cssText: ".p-4 { padding: 1rem; }" }, … ]
 * - options.limitRows: if truthy, only show that many rows (for dark/pseudo/responsive)
 */
function buildTableWithExamples(title, rows, options = {}) {
  const limitRows = options.limitRows || null;
  // If limitRows is set, only show up to that many rows
  const displayRows = limitRows ? rows.slice(0, limitRows) : rows;

  // Deduplicate by selector
  const uniqueRowsMap = {};
  displayRows.forEach(r => {
    uniqueRowsMap[r.selector] = r.cssText;
  });
  const uniqueRows = Object.entries(uniqueRowsMap).map(([selector, cssText]) => ({
    selector,
    cssText
  }));

  // If this page is “dark/pseudo/responsive” and ended up truly empty, inject a quick note
  if (limitRows && uniqueRows.length === 0) {
    return `
      <section class="mb-12">
        <p class="font-size-4 text-gray-700 dark-text-gray-300 mb-4">
          No direct CSS rules here. You can prefix <code>dark-</code> (or <code>hover-</code>, or <code>sm-</code>, etc.) 
          to <em>any</em> utility in your markup. For example: 
          <code>dark:bg-black</code>, <code>hover:text-red-500</code>, <code>sm:p-4</code>, etc.
        </p>
      </section>
    `;
  }

  // Build a safe ID from the title (e.g. “padding” → “padding”)
  const categoryId = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/\-+/g, "-");

  // 0) Inline <style> for hidden‐row + fade‐in logic
  let html = `
    <section class="mb-12">
      <style>
        .hidden-row { display: none; }
        .fade-in { animation: fadeIn 0.2s ease-in forwards; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      </style>

      <h1 class="font-size-6 font-weight-bold text-black dark-text-slate-100 mb-3">${title}</h1>
      <div class="overflow-auto rounded-none">
        <table id="table-${categoryId}" class="w-full table-fixed border-collapse font-size-3">
          <thead class="bg-slate-100 dark-bg-slate-800">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-black dark-text-white font-size-3">Class</th>
              <th class="px-4 py-2 text-left font-medium text-black dark-text-white font-size-3">Styles</th>
            </tr>
          </thead>
          <tbody>
  `;

  // 1) Render each unique row. If not a “limited” page, hide rows ≥ 8 by default
  uniqueRows.forEach(({ selector, cssText }, index) => {
    const declarationsOnly = extractDeclarations(cssText);
    const isHiddenInitially = !limitRows && index >= 8;
    const rowClasses = isHiddenInitially ? "toggle-row hidden-row" : "";
    html += `
            <tr class="border-b-2 border-0 border-solid border-slate-100 dark-border-slate-800 ${rowClasses}">
              <td class="px-4 py-2 align-top text-primary">${selector}</td>
              <td class="px-4 py-2 text-pink-600 whitespace-pre-wrap">${declarationsOnly}</td>
            </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
  `;

  // 2) If more than 8 AND this is not a limited page, place a “Show more” button
  if (!limitRows && uniqueRows.length > 8) {
    html += `
      <div class="mt-2 mb-6">
        <button id="show-more-${categoryId}" class="
               show-more-btn
               px-4 py-2 border rounded-md text-black dark-text-white
               bg-slate-100 dark-bg-slate-800 hover:bg-slate-200 dark:hover-bg-slate-700
               font-size-3">
          Show more
        </button>
      </div>
    `;
  }

  // 3) If it’s not a limited page, show three separate “Example Preview” panes
  if (!limitRows && uniqueRows.length > 0) {
    const exampleRows = uniqueRows.slice(0, 3); // pick the first 3
    exampleRows.forEach(({ selector }) => {
      // Strip the leading dot so we can “apply” it as a class
      const cls = selector.replace(/^\./, "");
      html += `
      <div class="mt-6 mb-2 font-weight-medium">Example: <code>${selector}</code></div>
      <div class="preview-pane border-solid border-slate-100 dark-border-slate-800 p-12 flex justify-center items-center rounded-lg mb-4">
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

  // 4) If we added a “Show more” button, insert the collapse/expand script
  if (!limitRows && uniqueRows.length > 8) {
    html += `
      <script>
        (function() {
          const btn = document.getElementById("show-more-${categoryId}");
          const table = document.getElementById("table-${categoryId}");
          let expanded = false;
          btn.addEventListener("click", function() {
            expanded = !expanded;
            table.querySelectorAll(".toggle-row").forEach(tr => {
              if (expanded) {
                tr.classList.remove("hidden-row");
                tr.classList.add("fade-in");
              } else {
                tr.classList.add("hidden-row");
                tr.classList.remove("fade-in");
              }
            });
            btn.textContent = expanded ? "Show less" : "Show more";
          });
        })();
      </script>
    `;
  }

  html += `
    </section>
  `;
  return html;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─────────── MAIN SCRIPT ─────────── //

(async () => {
  // 1) Read utilities.css from local dist folder
  console.log("⏳ Reading dist/utilities.css…");
  let baseCss;
  try {
    baseCss = fs.readFileSync(UTIL_CSS_PATH, "utf-8");
  } catch (err) {
    console.error(`❌ Failed to read ${UTIL_CSS_PATH}: ${err.message}`);
    process.exit(1);
  }
  console.log("✔ utilities.css loaded.");

  // 2) Parse with PostCSS
  const root = postcss.parse(baseCss);

  // 3) Collect all class rules
  const allRules = [];
  root.walkRules((rule) => {
    rule.selectors.forEach((sel) => {
      sel = sel.trim();
      if (!sel.startsWith(".") || sel.includes(",")) return;
      const selector = sel;
      const cssText = rule.toString();
      const { prefix, base } = splitVariant(selector);
      allRules.push({ selector, cssText, prefix, base });
    });
  });

  // 4) Sort alphabetically
  allRules.sort(sortBySelector);

  // 5) Buckets: category → array; plus dark, pseudo, responsive, misc
  const categoryBuckets = {};
  Object.keys(categoryMap).forEach((cat) => {
    categoryBuckets[`${cat}.html`] = [];
  });
  const darkBucket = [];
  const pseudoBucket = [];
  const responsiveBucket = [];
  let miscBucket = [];

  allRules.forEach(({ selector, cssText, prefix, base }) => {
    // 1) Dark variants
    if (prefix === darkPrefix) {
      darkBucket.push({ selector, cssText });
      return;
    }
    // 2) Pseudo variants
    if (pseudoPrefixes.includes(prefix)) {
      pseudoBucket.push({ selector, cssText });
      return;
    }
    // 3) Responsive variants
    if (responsivePrefixes.includes(prefix)) {
      responsiveBucket.push({ selector, cssText });
      return;
    }
    // 4) See if it fits one of our categoryMap buckets
    const category = findCategory(base);
    if (category) {
      categoryBuckets[`${category}.html`].push({ selector, cssText });
    } else {
      // 5) Otherwise, put in misc for now
      miscBucket.push({ selector, cssText });
    }
  });

  // 6) De-dupe each category (so no selector appears twice)
  for (const key of Object.keys(categoryBuckets)) {
    const seen = new Set();
    categoryBuckets[key] = categoryBuckets[key].filter(({ selector }) => {
      if (seen.has(selector)) return false;
      seen.add(selector);
      return true;
    });
  }

  // 7) De-dupe misc
  {
    const seen = new Set();
    miscBucket = miscBucket.filter(({ selector }) => {
      if (seen.has(selector)) return false;
      seen.add(selector);
      return true;
    });
  }

  // 8) Ensure nothing already assigned ends up in misc
  const allAssigned = new Set();
  Object.values(categoryBuckets).forEach(arr => arr.forEach(r => allAssigned.add(r.selector)));
  darkBucket.forEach(r => allAssigned.add(r.selector));
  pseudoBucket.forEach(r => allAssigned.add(r.selector));
  responsiveBucket.forEach(r => allAssigned.add(r.selector));
  miscBucket = miscBucket.filter(r => !allAssigned.has(r.selector));

  // 9) Log any truly uncategorized selectors in misc (so you can add more categories if needed)
  if (miscBucket.length) {
    console.warn("⚠️  Unallocated selectors in misc (consider adding new category):");
    const uniqueMisc = Array.from(new Set(miscBucket.map(r => r.selector)));
    console.warn(uniqueMisc.join(", "));
  }

  // 10) Read & split docs/index.html
  const shell = fs.readFileSync(templatePath, "utf-8");
  let partA, partC;
  try {
    ({ partA, partC } = splitTemplate(shell));
  } catch (err) {
    console.error(`❌ Error splitting template: ${err.message}`);
    process.exit(1);
  }

  // 11) Generate one HTML per category (with examples) – partC includes footer
  Object.entries(categoryBuckets).forEach(([filename, rows]) => {
    const title = capitalize(filename.replace(".html", "").replace(/-/g, " "));
    const mainInner = buildTableWithExamples(title, rows);
    const finalHtml = partA + "\n" + mainInner + "\n" + partC;
    fs.writeFileSync(path.join(docsDir, filename), finalHtml, "utf-8");
    console.log(`✔ Generated docs/${filename} (${rows.length} utilities)`);
  });

  // 12) dark.html (limit to 10 rows, note if empty)
  {
    const mainInner = buildTableWithExamples("Dark Mode Variants", darkBucket, { limitRows: 10 });
    const finalHtml = partA + "\n" + mainInner + "\n" + partC;
    fs.writeFileSync(path.join(docsDir, "dark.html"), finalHtml, "utf-8");
    console.log(`✔ Generated docs/dark.html (${darkBucket.length} utilities)`);
  }

  // 13) pseudo.html (limit to 10 rows)
  {
    const mainInner = buildTableWithExamples("Pseudo-Class Variants", pseudoBucket, { limitRows: 10 });
    const finalHtml = partA + "\n" + mainInner + "\n" + partC;
    fs.writeFileSync(path.join(docsDir, "pseudo.html"), finalHtml, "utf-8");
    console.log(`✔ Generated docs/pseudo.html (${pseudoBucket.length} utilities)`);
  }

  // 14) responsive.html (limit to 10 rows)
  {
    const mainInner = buildTableWithExamples("Responsive Variants", responsiveBucket, { limitRows: 10 });
    const finalHtml = partA + "\n" + mainInner + "\n" + partC;
    fs.writeFileSync(path.join(docsDir, "responsive.html"), finalHtml, "utf-8");
    console.log(`✔ Generated docs/responsive.html (${responsiveBucket.length} utilities)`);
  }

  // 15) misc.html (if anything truly remains)
  if (miscBucket.length) {
    const mainInner = buildTableWithExamples("Miscellaneous Utilities", miscBucket);
    const finalHtml = partA + "\n" + mainInner + "\n" + partC;
    fs.writeFileSync(path.join(docsDir, "misc.html"), finalHtml, "utf-8");
    console.log(`✔ Generated docs/misc.html (${miscBucket.length} utilities)`);
  }

  console.log("\n✅ All utility docs generated (including new categories).");
})();