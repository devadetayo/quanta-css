#!/usr/bin/env node
/**
 * Quanta CSS v2.1 - Fixed Build System (COMPONENTS-FIRST + TOKEN COPY)
 * - Discovers token files (colors/tokens) and copies them into src/utilities/
 * - Tokens are imported into utilities/index.css and included in every bundle foundation
 * - Components placed before utilities in full bundle (utilities win on tie)
 *
 * Usage: node build-quanta-v2.1-fixed.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const repo = path.resolve(__dirname, '..');
const src = path.join(repo, 'src');
const sourceUtilities = path.join(src, 'utilities/base.css');
const sourceComponents = path.join(src, 'components');
const sourceReset = path.join(src, 'reset.css');
const sourceNormalize = path.join(src, 'normalize.css');
const sourceVariables = path.join(src, 'variables.css');

const dist = path.join(repo, 'dist');
const utilitiesDir = path.join(src, 'utilities');
const utilitiesVariantsDir = path.join(utilitiesDir, 'variants');

// Toggle build ordering: if true, components come first, then utilities (utilities override components on tie)
const COMPONENTS_FIRST = true;

// Create directories
[dist, utilitiesDir, utilitiesVariantsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const breakpoints = [
  { key: 'sm', query: '@media (min-width: 480px)' },
  { key: 'md', query: '@media (min-width: 768px)' },
  { key: 'lg', query: '@media (min-width: 1024px)' },
  { key: 'xl', query: '@media (min-width: 1280px)' },
  { key: 'uw', query: '@media (min-width: 1536px)' }
];

const states = {
  hover: ':hover',
  focus: ':focus',
  active: ':active',
  disabled: ':disabled',
  'focus-visible': ':focus-visible',
  'focus-within': ':focus-within'
};

const darkAttr = '.dark, [data-theme="dark"]';

// Utility module definitions (kept same)
const utilityModules = {
  'core': {
    patterns: [/\/\* =+ VARIABLES|@import|:root|scrollbar/i],
    skipVariants: true
  },
  'typography-fonts': {
    patterns: [/\.font-(sans|serif|mono|size|style|weight|stretch|variant|smoothing)/]
  },
  'typography-text': {
    patterns: [/\.text-(xs|sm|base|lg|xl|2xl|3xl|left|center|right|justify|uppercase|lowercase|capitalize|ellipsis|clip)/]
  },
  'typography-advanced': {
    patterns: [/\.(line-height|tracking|decoration|underline-offset|indent|break-|overflow-|hyphens|whitespace|line-clamp|list-style)/]
  },
  'spacing-padding': {
    patterns: [/\.p[trblxy]?-(?!rimary)/]
  },
  'spacing-margin': {
    patterns: [/\.m[trblxy]?-(?!ix|in|ax)/]
  },
  'spacing-gap': {
    patterns: [/\.(space-[xy]|gap|row-gap|column-gap)-/]
  },
  'layout-display': {
    patterns: [/\.d-|visibility:\s*(visible|hidden|collapse)/]
  },
  'layout-position': {
    patterns: [/\.(static|relative|absolute|fixed|sticky|inset|top|right|bottom|left)-/]
  },
  'layout-flexbox': {
    patterns: [/\.flex-|\.order-|\.justify-|\.items-|\.content-|\.self-/]
  },
  'layout-grid': {
    patterns: [/\.grid-(cols|rows|flow)|\.place-/]
  },
  'layout-overflow': {
    patterns: [/\.overflow-|\.overscroll-/]
  },
  'layout-misc': {
    patterns: [/\.(clear|float|aspect|isolation|contain|box-)/]
  },
  'sizing-width': {
    patterns: [/\.(w|min-w|max-w)-(?!ill|hite)/]
  },
  'sizing-height': {
    patterns: [/\.(h|min-h|max-h)-(?!ue|idden)/]
  },
  'sizing-combined': {
    patterns: [/\.size-/]
  },
  'colors-text': {
    patterns: [/\.text-(red|orange|yellow|green|lime|teal|cyan|sky|blue|indigo|violet|purple|pink|rose|grey|zinc|neutral|slate|black|white)/]
  },
  'colors-background': {
    patterns: [/\.bg-(red|orange|yellow|green|lime|teal|cyan|sky|blue|indigo|violet|purple|pink|rose|grey|zinc|neutral|slate|black|white)/]
  },
  'colors-border': {
    patterns: [/\.border-(red|orange|yellow|green|lime|teal|cyan|sky|blue|indigo|violet|purple|pink|rose|grey|zinc|neutral|slate|black|white)/]
  },
  'colors-semantic': {
    patterns: [/\.(bg|text|border)-(primary|secondary|success|warning|danger|info|neutral|accent|ghost|link)/]
  },
  'transparency': {
    patterns: [/\.(bg|text|border)-tp-|--.*-opacity|\.has-(bg|text|border)/]
  },
  'borders-width': {
    patterns: [/\.border-\d+|\.border-[trblxy]-\d/]
  },
  'borders-radius': {
    patterns: [/\.rounded/]
  },
  'borders-style': {
    patterns: [/\.border-(solid|dashed|dotted|double|none)/]
  },
  'effects-shadow': {
    patterns: [/\.shadow-|\.drop-shadow-/]
  },
  'effects-opacity': {
    patterns: [/^\.opacity-\d/]
  },
  'effects-z-index': {
    patterns: [/\.z-/]
  },
  'effects-filters': {
    patterns: [/\.(blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|filter|backdrop)-/]
  },
  'blending': {
    patterns: [/\.(mix|bg)-blend-/]
  },
  'gradients': {
    patterns: [/\.bg-gradient|\.gradient-(from|to)-/]
  },
  'rings-outlines': {
    patterns: [/\.(ring|outline)-/]
  },
  'transforms': {
    patterns: [/\.(translate|scale|rotate|skew|origin|perspective|backface|transform)-/]
  },
  'transitions': {
    patterns: [/\.(transition|duration|ease|delay)-/]
  },
  'animations': {
    patterns: [/@keyframes|\.animate-/]
  },
  'backgrounds': {
    patterns: [/\.bg-(attachment|clip|origin|position|repeat|size|image)-/]
  },
  'svg': {
    patterns: [/\.(fill|stroke)-/]
  },
  'interactivity': {
    patterns: [/\.(cursor|pointer-events|select|resize|appearance|caret|accent|color-scheme|scroll|snap|touch|will-change|field-sizing)-/]
  },
  'objects': {
    patterns: [/\.object-/]
  },
  'accessibility': {
    patterns: [/\.sr-only|\.not-sr-only/],
    skipVariants: true
  },
  'misc': {
    patterns: [/\.clip-|\.break-(after|before|inside)-|margin-(block|inline)-|padding-(block|inline)-/]
  }
};

// ============================================================================
// UTILITIES / HELPERS
// ============================================================================

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    .replace(/;}/g, '}')
    .replace(/(:|\s)0+(\d)/g, '$1$2')
    .replace(/#([a-fA-F0-9])\1([a-fA-F0-9])\2([a-fA-F0-9])\3/g, '#$1$2$3')
    .trim();
}

// Robust CSS block extractor: captures selector { body } blocks, handles multi-line
function extractRules(content, patterns) {
  const rules = [];
  const re = /([^{]+)\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const selector = m[1].trim();
    const body = m[2].trim();
    // If any pattern matches selector or body, include the full normalized block
    if (patterns.some(p => p.test(selector) || p.test(body))) {
      rules.push(`${selector} { ${body} }`);
    }
  }
  return rules;
}

// Extract class names from selectors and pair them with the rule body
function extractClasses(rules) {
  const classes = [];

  for (const rule of rules) {
    const splitIndex = rule.indexOf('{');
    if (splitIndex === -1) continue;
    const selectorPart = rule.slice(0, splitIndex).trim();
    const bodyMatch = rule.match(/\{([\s\S]*?)\}\s*$/);
    const body = bodyMatch ? bodyMatch[1].trim() : '';

    // split multiple selectors by comma
    const selectors = selectorPart.split(',').map(s => s.trim());
    const seen = new Set();

    for (const sel of selectors) {
      // Find class tokens inside the selector. Allow common characters: letters, numbers, hyphen, underscore, colon, slash, backslash
      const re = /\.([A-Za-z0-9\-\_:\\/]+)/g;
      let mm;
      while ((mm = re.exec(sel)) !== null) {
        let name = mm[1];
        // Normalize trailing/leading punctuation
        name = name.replace(/(^[:\\\/]+|[:\\\/]+$)/g, '');
        if (!seen.has(name)) {
          seen.add(name);
          classes.push({ name, styles: body });
        }
      }
    }
  }

  return classes;
}

// Make a safe variant-friendly class name (replace unsafe chars with '-')
// Keeps letters, digits, hyphen, underscore.
function escapeForClass(cls) {
  return cls.replace(/[^a-zA-Z0-9\-_]/g, '-');
}

// ============================================================================
// TOKEN DISCOVERY & COPYING
// ============================================================================

function discoverTokenFiles() {
  // Candidate paths and directories where tokens/colors may live
  const candidates = [
    path.join(src, 'tokens.css'),
    path.join(src, 'colors.css'),
    path.join(src, 'design-tokens.css'),
    path.join(src, 'tokens', 'tokens.css'),
    path.join(src, 'tokens', 'colors.css'),
    path.join(src, 'tokens', 'variables.css'),
    path.join(src, 'tokens')
  ];

  const found = [];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      if (stat.isFile() && p.endsWith('.css')) {
        found.push(p);
      } else if (stat.isDirectory()) {
        // add all .css files in directory (non-recursive)
        const files = fs.readdirSync(p).filter(f => f.endsWith('.css')).map(f => path.join(p, f));
        found.push(...files);
      }
    }
  }

  // Deduplicate while preserving order
  return Array.from(new Set(found));
}

function copyTokenFilesToUtilities(tokenFiles) {
  const copied = [];
  for (const srcPath of tokenFiles) {
    const baseName = path.basename(srcPath);
    const destPath = path.join(utilitiesDir, baseName);
    try {
      fs.copyFileSync(srcPath, destPath);
      copied.push(destPath);
      console.log(`    ✓ ${baseName} copied to utilities/`);
    } catch (err) {
      console.warn(`    ! failed to copy ${srcPath}: ${err.message}`);
    }
  }
  return copied;
}

// ============================================================================
// VARIANT GENERATORS (same as before)
// ============================================================================

function generateLightVariants(moduleName, classes) {
  const baseRules = [];
  const respRules = {};

  breakpoints.forEach(({ key }) => {
    respRules[key] = [];
  });

  for (const { name: cls, styles } of classes) {
    const safe = escapeForClass(cls);

    // State variants
    for (const [state, pseudo] of Object.entries(states)) {
      baseRules.push(`.${state}-${safe}${pseudo} { ${styles} }`);
    }

    // Group hover
    baseRules.push(`.group:hover .group-hover-${safe} { ${styles} }`);

    // Responsive variants
    for (const { key } of breakpoints) {
      respRules[key].push(`.${key}-${safe} { ${styles} }`);

      for (const [state, pseudo] of Object.entries(states)) {
        respRules[key].push(`.${key}-${state}-${safe}${pseudo} { ${styles} }`);
      }

      respRules[key].push(`.group:hover .${key}-group-hover-${safe} { ${styles} }`);
    }
  }

  const output = [
    `/* Quanta CSS v2.1 - ${moduleName} Light Variants */`,
    '',
    '/* State Variants */',
    ...baseRules,
    ''
  ];

  for (const { key, query } of breakpoints) {
    if (respRules[key].length > 0) {
      output.push(`/* ${key.toUpperCase()} Breakpoint */`);
      output.push(`${query} {`);
      output.push(...respRules[key].map(r => '  ' + r));
      output.push('}');
      output.push('');
    }
  }

  return output.join('\n');
}

function generateDarkVariants(moduleName, classes) {
  const baseRules = [];
  const respRules = {};

  breakpoints.forEach(({ key }) => {
    respRules[key] = [];
  });

  for (const { name: cls, styles } of classes) {
    const safe = escapeForClass(cls);

    // Dark base
    baseRules.push(`${darkAttr} .dark-${safe} { ${styles} }`);

    // Dark state variants
    for (const [state, pseudo] of Object.entries(states)) {
      baseRules.push(`${darkAttr} .dark-${state}-${safe}${pseudo} { ${styles} }`);
    }

    // Dark group hover
    baseRules.push(`${darkAttr} .group:hover .dark-group-hover-${safe} { ${styles} }`);

    // Dark responsive variants
    for (const { key } of breakpoints) {
      respRules[key].push(`${darkAttr} .dark-${key}-${safe} { ${styles} }`);

      for (const [state, pseudo] of Object.entries(states)) {
        respRules[key].push(`${darkAttr} .dark-${key}-${state}-${safe}${pseudo} { ${styles} }`);
      }

      respRules[key].push(`${darkAttr} .group:hover .dark-${key}-group-hover-${safe} { ${styles} }`);
    }
  }

  const output = [
    `/* Quanta CSS v2.1 - ${moduleName} Dark Variants */`,
    '',
    '/* Dark Mode Variants */',
    ...baseRules,
    ''
  ];

  for (const { key, query } of breakpoints) {
    if (respRules[key].length > 0) {
      output.push(`/* ${key.toUpperCase()} Breakpoint (Dark) */`);
      output.push(`${query} {`);
      output.push(...respRules[key].map(r => '  ' + r));
      output.push('}');
      output.push('');
    }
  }

  return output.join('\n');
}

// ============================================================================
// PROCESS UTILITIES
// ============================================================================

function processUtilities(content) {
  console.log('📦 Processing Utilities...\n');

  const header = (content.match(/^\/\*[\s\S]*?\*\//) || [''])[0] + '\n\n';
  const moduleFiles = {};
  const lightVariantFiles = {};
  const darkVariantFiles = {};

  // Copy foundation files to utilities directory
  console.log('  📄 Copying foundation files...');
  if (fs.existsSync(sourceReset)) {
    fs.copyFileSync(sourceReset, path.join(utilitiesDir, 'reset.css'));
    console.log('    ✓ reset.css');
  }
  if (fs.existsSync(sourceNormalize)) {
    fs.copyFileSync(sourceNormalize, path.join(utilitiesDir, 'normalize.css'));
    console.log('    ✓ normalize.css');
  }
  if (fs.existsSync(sourceVariables)) {
    fs.copyFileSync(sourceVariables, path.join(utilitiesDir, 'variables.css'));
    console.log('    ✓ variables.css');
  }

  // Discover & copy token files (colors/tokens)
  const discoveredTokens = discoverTokenFiles();
  let copiedTokenFiles = [];
  if (discoveredTokens.length > 0) {
    console.log('  🎨 Found token files:');
    discoveredTokens.forEach(p => console.log(`    - ${path.relative(repo, p)}`));
    copiedTokenFiles = copyTokenFilesToUtilities(discoveredTokens);
  } else {
    console.log('  ⚪ No token files discovered (looked in src/tokens, src/tokens.css, src/colors.css, etc.)');
  }
  console.log('');

  // Create helper file
  const helperPath = path.join(utilitiesDir, '_helpers.css');
  fs.writeFileSync(helperPath, '/* Helper classes */\n.group { position: relative; }\n', 'utf8');

  // Split into modules
  for (const [name, config] of Object.entries(utilityModules)) {
    const rules = extractRules(content, config.patterns);

    if (rules.length > 0) {
      const output = header + rules.join('\n\n');
      const filePath = path.join(utilitiesDir, `${name}.css`);
      fs.writeFileSync(filePath, output, 'utf8');

      const classes = extractClasses(rules);
      moduleFiles[name] = {
        path: filePath,
        rules: rules.length,
        classes,
        skipVariants: config.skipVariants || false
      };

      console.log(`  ✓ ${(name + '.css').padEnd(30)} ${rules.length.toString().padStart(4)} rules`);

      // Generate variants
      if (!config.skipVariants && classes.length > 0) {
        // Light variants
        const lightCSS = generateLightVariants(name, classes);
        const lightPath = path.join(utilitiesVariantsDir, `${name}.css`);
        fs.writeFileSync(lightPath, lightCSS, 'utf8');

        lightVariantFiles[name] = { path: lightPath };

        // Dark variants
        const darkCSS = generateDarkVariants(name, classes);
        const darkPath = path.join(utilitiesVariantsDir, `${name}.dark.css`);
        fs.writeFileSync(darkPath, darkCSS, 'utf8');

        darkVariantFiles[name] = { path: darkPath };
      }
    }
  }

  // Create utilities index.css (WITH light variants) and include tokens imports
  const utilityImports = [
    '/**',
    ' * Quanta CSS v2.1 - Utilities Index (Light Mode)',
    ' * Import all utility modules and light variants',
    ' */',
    '',
    '@import \'./reset.css\';',
    '@import \'./normalize.css\';',
    '@import \'./variables.css\';',
    ''
  ];

  // If tokens were copied, import them right after variables
  if (copiedTokenFiles.length > 0) {
    copiedTokenFiles.forEach(fp => {
      const base = path.basename(fp);
      utilityImports.push(`@import './${base}';`);
    });
    utilityImports.push('');
  }

  utilityImports.push('@import \'./_helpers.css\';', '');

  // Add base modules
  Object.keys(moduleFiles).sort().forEach(f => {
    utilityImports.push(`@import './${f}.css';`);
  });

  utilityImports.push('');
  utilityImports.push('/* Light Mode Variants */');

  // Add light variants
  Object.keys(lightVariantFiles).sort().forEach(f => {
    utilityImports.push(`@import './variants/${f}.css';`);
  });

  fs.writeFileSync(path.join(utilitiesDir, 'index.css'), utilityImports.join('\n'), 'utf8');

  // Create utilities dark index.css (dark variants only)
  const darkImports = [
    '/**',
    ' * Quanta CSS v2.1 - Utilities Dark Mode Index',
    ' * Import all dark mode variants',
    ' * Use together with index.css for full dark mode support',
    ' */',
    '',
    '/* Dark Mode Variants */'
  ];

  Object.keys(darkVariantFiles).sort().forEach(f => {
    darkImports.push(`@import './variants/${f}.dark.css';`);
  });

  fs.writeFileSync(path.join(utilitiesDir, 'index.dark.css'), darkImports.join('\n'), 'utf8');

  console.log(`\n✅ Created ${Object.keys(moduleFiles).length} utility modules`);
  console.log(`✅ Generated ${Object.keys(lightVariantFiles).length} light variant files`);
  console.log(`✅ Generated ${Object.keys(darkVariantFiles).length} dark variant files`);
  console.log(`✅ Created index.css (light mode with variants)`);
  console.log(`✅ Created index.dark.css (dark variants only)\n`);

  // Return also the copiedTokenFiles so createBundles can include them in foundation
  return { moduleFiles, lightVariantFiles, darkVariantFiles, tokenFiles: copiedTokenFiles };
}

// ============================================================================
// PROCESS COMPONENTS
// ============================================================================

function processComponents() {
  console.log('🧩 Processing Components...\n');

  if (!fs.existsSync(sourceComponents)) {
    console.log('  ⊘ No components directory found\n');
    return '';
  }

  const files = fs.readdirSync(sourceComponents).filter(file => file.endsWith('.css'));

  if (files.length === 0) {
    console.log('  ⊘ No component files found\n');
    return '';
  }

  let componentsCSS = `/**
 * Quanta CSS v2.1 - Components Bundle
 * All component styles bundled together
 */

`;

  for (const file of files) {
    const sourcePath = path.join(sourceComponents, file);
    const content = fs.readFileSync(sourcePath, 'utf8');

    componentsCSS += `/* ${file} */\n${content}\n\n`;

    console.log(`  ✓ ${file}`);
  }

  console.log(`\n✅ Bundled ${files.length} component files\n`);

  return componentsCSS;
}

// ============================================================================
// CREATE BUNDLES
// ============================================================================

function createBundles(utilities, componentsCSS) {
  console.log('📦 Creating Distribution Bundles...\n');

  const sizes = {};

  // Read foundation files (and include token files if available)
  const reset = fs.existsSync(sourceReset) ? fs.readFileSync(sourceReset, 'utf8') : '';
  const normalize = fs.existsSync(sourceNormalize) ? fs.readFileSync(sourceNormalize, 'utf8') : '';
  const variables = fs.existsSync(sourceVariables) ? fs.readFileSync(sourceVariables, 'utf8') : '';

  // Read token files copied into utilities (if any)
  let tokensContent = '';
  const tokenFiles = utilities.tokenFiles || [];
  for (const fp of tokenFiles) {
    try {
      tokensContent += '\n\n' + fs.readFileSync(fp, 'utf8');
    } catch (err) {
      console.warn(`  ! failed to read token file ${fp}: ${err.message}`);
    }
  }

  const foundation = `${reset}\n\n${normalize}\n\n${variables}\n\n${tokensContent}\n\n`;

  // 1. utilities.css - Foundation + all utility modules + light variants (standalone ready)
  let utilitiesCSS = `/**
 * Quanta CSS v2.1 - Utilities (Light Mode)
 * Complete utilities with light variants
 * Standalone ready - includes reset, normalize, variables, tokens
 */

${foundation}`;

  Object.values(utilities.moduleFiles).forEach(({ path: filePath }) => {
    utilitiesCSS += fs.readFileSync(filePath, 'utf8') + '\n\n';
  });

  Object.values(utilities.lightVariantFiles).forEach(({ path: filePath }) => {
    utilitiesCSS += fs.readFileSync(filePath, 'utf8') + '\n\n';
  });

  const utilitiesPath = path.join(dist, 'utilities.css');
  const utilitiesMinPath = path.join(dist, 'utilities.min.css');

  fs.writeFileSync(utilitiesPath, utilitiesCSS, 'utf8');
  fs.writeFileSync(utilitiesMinPath, minifyCSS(utilitiesCSS), 'utf8');
  sizes.utilities = fs.statSync(utilitiesMinPath).size;

  console.log(`  ✓ utilities.min.css         ${(sizes.utilities / 1024).toFixed(1)} KB (standalone)`);

  // 2. utilities.dark.css - Only dark variants
  let utilitiesDarkCSS = `/**
 * Quanta CSS v2.1 - Utilities Dark Mode Variants
 * Dark mode variants for all utilities
 *
 * Can be used:
 * - Standalone (if you already loaded utilities.css)
 * - Or combined with utilities.css for full support
 *
 * Activate with: class="dark" or data-theme="dark"
 */

`;

  Object.values(utilities.darkVariantFiles).forEach(({ path: filePath }) => {
    utilitiesDarkCSS += fs.readFileSync(filePath, 'utf8') + '\n\n';
  });

  const utilitiesDarkPath = path.join(dist, 'utilities.dark.css');
  const utilitiesDarkMinPath = path.join(dist, 'utilities.dark.min.css');

  fs.writeFileSync(utilitiesDarkPath, utilitiesDarkCSS, 'utf8');
  fs.writeFileSync(utilitiesDarkMinPath, minifyCSS(utilitiesDarkCSS), 'utf8');
  sizes.utilitiesDark = fs.statSync(utilitiesDarkMinPath).size;

  console.log(`  ✓ utilities.dark.min.css    ${(sizes.utilitiesDark / 1024).toFixed(1)} KB (works standalone/combined)`);

  // 3. components.css - Standalone ready with foundation
  const componentsStandalone = `/**
 * Quanta CSS v2.1 - Components
 * All component styles
 * Standalone ready - includes foundation
 */

${foundation}

${componentsCSS}`;

  const componentsPath = path.join(dist, 'components.css');
  const componentsMinPath = path.join(dist, 'components.min.css');

  fs.writeFileSync(componentsPath, componentsStandalone, 'utf8');
  fs.writeFileSync(componentsMinPath, minifyCSS(componentsStandalone), 'utf8');
  sizes.components = fs.statSync(componentsMinPath).size;

  console.log(`  ✓ components.min.css        ${(sizes.components / 1024).toFixed(1)} KB (standalone)`);

  // 4. quanta.css - full bundle: either components then utilities, or utilities then components depending on flag
  let quantaCSS;
  if (COMPONENTS_FIRST) {
    quantaCSS = `/**
 * Quanta CSS v2.1 - Complete Framework (Light Mode) - COMPONENTS FIRST
 * https://github.com/yourusername/quanta-css
 *
 * Includes:
 * - Foundation (reset, normalize, variables, tokens)
 * - All components
 * - All utilities with light mode variants (utilities win on tie)
 *
 * Standalone ready - everything you need for light mode
 * For dark mode, also load: quanta.dark.min.css
 */

${componentsCSS}

/* ========================================
   UTILITIES (base + variants)
   ======================================== */

${utilitiesCSS}
`;
  } else {
    // fallback to previous order (utilities then components)
    quantaCSS = `/**
 * Quanta CSS v2.1 - Complete Framework (Light Mode) - UTILITIES FIRST
 * https://github.com/yourusername/quanta-css
 *
 * Includes:
 * - Foundation (reset, normalize, variables, tokens)
 * - All utilities with light mode variants
 * - All components
 *
 * Standalone ready - everything you need for light mode
 * For dark mode, also load: quanta.dark.min.css
 */

${utilitiesCSS}

/* ========================================
   COMPONENTS
   ======================================== */

${componentsCSS}
`;
  }

  const quantaPath = path.join(dist, 'quanta.css');
  const quantaMinPath = path.join(dist, 'quanta.min.css');
  const quantaGzPath = quantaMinPath + '.gz';

  fs.writeFileSync(quantaPath, quantaCSS, 'utf8');

  const minified = minifyCSS(quantaCSS);
  fs.writeFileSync(quantaMinPath, minified, 'utf8');

  const gzipped = zlib.gzipSync(Buffer.from(minified), { level: 9 });
  fs.writeFileSync(quantaGzPath, gzipped);

  sizes.quanta = fs.statSync(quantaMinPath).size;
  sizes.quantaGz = gzipped.length;

  console.log(`  ✓ quanta.min.css            ${(sizes.quanta / 1024).toFixed(1)} KB (standalone)`);
  console.log(`  ✓ quanta.min.css.gz         ${(sizes.quantaGz / 1024).toFixed(1)} KB ⚡`);

  // 5. quanta.dark.css - Dark variants (works standalone OR with quanta.css)
  const quantaDarkCSS = `/**
 * Quanta CSS v2.1 - Dark Mode Variants
 * https://github.com/yourusername/quanta-css
 *
 * Dark mode variants for utilities
 *
 * Can be used:
 * - Standalone (if you already loaded quanta.css or utilities.css)
 * - Or quanta.css will work fine without it (light mode only)
 *
 * Activate dark mode by adding to any parent element:
 * - class="dark"
 * - OR data-theme="dark"
 *
 * Examples:
 *   <html class="dark">
 *   <html data-theme="dark">
 *   <div class="dark">
 *   <section data-theme="dark">
 */

${utilitiesDarkCSS}
`;

  const quantaDarkPath = path.join(dist, 'quanta.dark.css');
  const quantaDarkMinPath = path.join(dist, 'quanta.dark.min.css');
  const quantaDarkGzPath = quantaDarkMinPath + '.gz';

  fs.writeFileSync(quantaDarkPath, quantaDarkCSS, 'utf8');

  const darkMinified = minifyCSS(quantaDarkCSS);
  fs.writeFileSync(quantaDarkMinPath, darkMinified, 'utf8');

  const darkGzipped = zlib.gzipSync(Buffer.from(darkMinified), { level: 9 });
  fs.writeFileSync(quantaDarkGzPath, darkGzipped);

  sizes.quantaDark = fs.statSync(quantaDarkMinPath).size;
  sizes.quantaDarkGz = darkGzipped.length;

  console.log(`  ✓ quanta.dark.min.css       ${(sizes.quantaDark / 1024).toFixed(1)} KB (works standalone/combined)`);
  console.log(`  ✓ quanta.dark.min.css.gz    ${(sizes.quantaDarkGz / 1024).toFixed(1)} KB ⚡\n`);

  return sizes;
}

// ============================================================================
// CREATE README
// ============================================================================

function createReadme() {
  const templatePath = path.join(__dirname, 'readme-template.md');
  if (fs.existsSync(templatePath)) {
    const readmeContent = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(path.join(dist, 'README.md'), readmeContent, 'utf8');
    console.log('✅ Created comprehensive README.md\n');
  } else {
    fs.writeFileSync(path.join(dist, 'README.md'), '# Quanta CSS - Distribution\n\nGenerated by build script.\n', 'utf8');
    console.log('✅ Created fallback README.md\n');
  }
}

// ============================================================================
// MAIN
// ============================================================================

(async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║     QUANTA CSS v2.1 - FIXED Build System      ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Check source file
    if (!fs.existsSync(sourceUtilities)) {
      console.error(`❌ Source file not found: ${sourceUtilities}`);
      process.exit(1);
    }

    const content = fs.readFileSync(sourceUtilities, 'utf8');

    // Step 1: Process utilities (now returns tokenFiles too)
    const utilities = processUtilities(content);

    // Step 2: Process components
    const componentsCSS = processComponents();

    // Step 3: Create distribution bundles (utilities may include tokenFiles)
    const sizes = createBundles(utilities, componentsCSS);

    // Step 4: Create README
    createReadme();

    // Summary
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║              BUILD SUMMARY                     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log(`📦 Utility Modules:    ${Object.keys(utilities.moduleFiles).length}`);
    console.log(`🎨 Light Variants:     ${Object.keys(utilities.lightVariantFiles).length}`);
    console.log(`🌙 Dark Variants:      ${Object.keys(utilities.darkVariantFiles).length}`);
    console.log(`🏷️ Token files copied: ${ (utilities.tokenFiles || []).length }`);

    console.log('\n📊 Bundle Sizes:');
    console.log(`  utilities.min.css:        ${(sizes.utilities / 1024).toFixed(1)} KB (standalone)`);
    console.log(`  utilities.dark.min.css:   ${(sizes.utilitiesDark / 1024).toFixed(1)} KB (standalone/combined)`);
    console.log(`  components.min.css:       ${(sizes.components / 1024).toFixed(1)} KB (standalone)`);
    console.log(`  quanta.min.css:           ${(sizes.quanta / 1024).toFixed(1)} KB (standalone)`);
    console.log(`  quanta.min.css.gz:        ${(sizes.quantaGz / 1024).toFixed(1)} KB ⚡`);
    console.log(`  quanta.dark.min.css:      ${(sizes.quantaDark / 1024).toFixed(1)} KB (standalone/combined)`);
    console.log(`  quanta.dark.min.css.gz:   ${(sizes.quantaDarkGz / 1024).toFixed(1)} KB ⚡`);

    console.log('\n📦 Directory Structure:');
    console.log('  src/utilities/');
    console.log('  ├── reset.css');
    console.log('  ├── normalize.css');
    console.log('  ├── variables.css');
    console.log('  ├── [tokens].css (copied token files, if any)');
    console.log('  ├── index.css ✨ (imports base + light variants + tokens)');
    console.log('  ├── index.dark.css ✨ (imports dark variants)');
    console.log('  ├── _helpers.css');
    console.log('  ├── [module].css (base utilities)');
    console.log('  └── variants/');
    console.log('      ├── [module].css (light variants)');
    console.log('      └── [module].dark.css (dark variants)');
    console.log('');
    console.log('  dist/');
    console.log('  ├── quanta.css (complete framework - light)');
    console.log('  ├── quanta.min.css ✅ STANDALONE');
    console.log('  ├── quanta.dark.css (dark variants)');
    console.log('  ├── quanta.dark.min.css ✅ WORKS STANDALONE OR COMBINED');
    console.log('  ├── utilities.css (utilities - light)');
    console.log('  ├── utilities.min.css ✅ STANDALONE');
    console.log('  ├── utilities.dark.css (dark utilities)');
    console.log('  ├── utilities.dark.min.css ✅ WORKS STANDALONE OR COMBINED');
    console.log('  ├── components.css');
    console.log('  ├── components.min.css ✅ STANDALONE');
    console.log('  └── README.md');

    console.log('\n💡 Key Fixes:');
    console.log('  ✅ token files discovered & copied into src/utilities/');
    console.log('  ✅ tokens included in foundation used for all bundles');
    console.log('  ✅ components placed before utilities when COMPONENTS_FIRST=true');

    console.log('\n🚀 Usage Examples:');
    console.log('  Light only:');
    console.log('    <link rel="stylesheet" href="dist/quanta.min.css">');
    console.log('');
    console.log('  Light + Dark (recommended):');
    console.log('    <link rel="stylesheet" href="dist/quanta.min.css">');
    console.log('    <link rel="stylesheet" href="dist/quanta.dark.min.css">');
    console.log('');
    console.log('  Activate dark mode:');
    console.log('    <html class="dark"> or <html data-theme="dark">');

    console.log('\n✨ Build complete! Tokens should now be bundled correctly.\n');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();