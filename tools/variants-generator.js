// Generates light.css, dark.css, variants file, and JSON styles map without bloating quanta-css-dark-variants.css
const fs = require('fs');
const path = require('path');

try {
  const inputPath       = path.resolve(__dirname, '../src/utilities/base.css');
  const themeDir        = path.resolve(__dirname, '../dist/theme');
  const lightOutputPath = path.join(themeDir, 'light.css');
  const darkOutputPath  = path.join(themeDir, 'dark.css');
  const variantsPath    = path.resolve(__dirname, '../src/utilities/quanta-css-dark-variants.css');
  const jsonPath        = path.resolve(__dirname, '../src/utilities/quanta-css-styles.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Base CSS not found: ${inputPath}`);
  }

  const lines = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/);
  if (!fs.existsSync(themeDir)) fs.mkdirSync(themeDir, { recursive: true });

  const breakpoints = {
    sm: '@media (min-width: 480px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    uw: '@media (min-width: 1536px)',
  };

  const states = { hover: ':hover', focus: ':focus', active: ':active', disabled: ':disabled' };
  const darkAttr = '[data-theme="dark"]';

  const lightRules   = [];
  const darkRules    = [];
  const variantRules = [];
  const respLight    = {};
  const respDark     = {};
  const respVariants = {};
  const jsonStyles   = {};

  Object.keys(breakpoints).forEach(key => {
    respLight[key] = [];
    respDark[key] = [];
    respVariants[key] = [];
  });

  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('.') || !t.includes('{')) continue;

    const match = t.match(/^\.([^\s{]+)/);
    if (!match) continue;

    const cls = match[1];
    const body = t.slice(t.indexOf('{') + 1, t.lastIndexOf('}')).trim();

    // JSON mapping
    const jsKey = cls.replace(/-/g, '_');
    jsonStyles[jsKey] = {};
    body.split(';').forEach(pair => {
      const [prop, val] = pair.split(':').map(s => s.trim());
      if (prop && val) {
        const key = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        jsonStyles[jsKey][key] = val;
      }
    });

    // Light: base + states + group-hover
    lightRules.push(`.${cls} { ${body} }`);
    for (const [name, pseudo] of Object.entries(states)) {
      lightRules.push(`.${name}-${cls}${pseudo} { ${body} }`);
    }
    lightRules.push(`.group-hover-${cls} { ${body} }`);

    // Dark: base + states + group-hover
    darkRules.push(`${darkAttr} .dark-${cls} { ${body} }`);
    for (const [name, pseudo] of Object.entries(states)) {
      darkRules.push(`${darkAttr} .dark-${name}-${cls}${pseudo} { ${body} }`);
    }
    darkRules.push(`${darkAttr} .dark-group-hover-${cls} { ${body} }`);

    // Responsive Light
    for (const [prefix, mq] of Object.entries(breakpoints)) {
      respLight[prefix].push(`.${prefix}-${cls} { ${body} }`);
      for (const [name, pseudo] of Object.entries(states)) {
        respLight[prefix].push(`.${prefix}-${name}-${cls}${pseudo} { ${body} }`);
      }
      respLight[prefix].push(`.${prefix}-group-hover-${cls} { ${body} }`);
    }

    // Responsive Dark
    for (const [prefix, mq] of Object.entries(breakpoints)) {
      respDark[prefix].push(`${darkAttr} .dark-${prefix}-${cls} { ${body} }`);
      for (const [name, pseudo] of Object.entries(states)) {
        respDark[prefix].push(`${darkAttr} .dark-${prefix}-${name}-${cls}${pseudo} { ${body} }`);
      }
      respDark[prefix].push(`${darkAttr} .dark-${prefix}-group-hover-${cls} { ${body} }`);
    }

    // Dark variants file (ONLY dark variants, no base or responsive)
    for (const [name, pseudo] of Object.entries(states)) {
      variantRules.push(`${darkAttr} .dark-${name}-${cls}${pseudo} { ${body} }`);
    }
    variantRules.push(`${darkAttr} .dark-group-hover-${cls} { ${body} }`);
  }

  // Responsive blocks
  const lightRespBlocks = Object.entries(breakpoints).map(([k, mq]) =>
    `${mq} {\n${respLight[k].join('\n')}\n}`
  );
  const darkRespBlocks = Object.entries(breakpoints).map(([k, mq]) =>
    `${mq} {\n${respDark[k].join('\n')}\n}`
  );

  // Write outputs
  fs.writeFileSync(lightOutputPath, [...lightRules, ...lightRespBlocks].join('\n'), 'utf8');
  fs.writeFileSync(darkOutputPath, [...darkRules, ...darkRespBlocks].join('\n'), 'utf8');
  fs.writeFileSync(variantsPath, variantRules.join('\n'), 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonStyles, null, 2), 'utf8');

  console.log('✅ Generated light.css, dark.css, variants, and JSON without bloating variants.');

} catch (error) {
  console.error('❌ Generator error:', error.message);
  process.exit(1);
}
