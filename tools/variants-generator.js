const fs = require('fs');
const path = require('path');

try {
  const inputPath = path.resolve(__dirname, '../src/utilities/base.css');
  const outputDir = path.resolve(__dirname, '../dist');
  const outputCSS = path.join(outputDir, 'quanta.css');
  const outputJSON = path.resolve(__dirname, '../src/utilities/quanta-css-styles.json');

  if (!fs.existsSync(inputPath)) throw new Error(`Base CSS not found: ${inputPath}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const lines = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/);

  const breakpoints = [
    { key: 'sm', query: '@media (min-width: 480px)' },
    { key: 'md', query: '@media (min-width: 768px)' },
    { key: 'lg', query: '@media (min-width: 1024px)' },
    { key: 'xl', query: '@media (min-width: 1280px)' },
    { key: 'uw', query: '@media (min-width: 1536px)' },
  ];

  const states = { hover: ':hover', focus: ':focus', active: ':active', disabled: ':disabled' };
  const darkAttr = 'html[data-theme="dark"]';

  const baseRules = [];
  const respRules = [];
  const jsonStyles = {};
  const respLight = {};
  const respDark = {};

  breakpoints.forEach(({ key }) => {
    respLight[key] = [];
    respDark[key] = [];
  });

  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('.') || !t.includes('{')) continue;

    const match = t.match(/^\.([^\s{]+)/);
    if (!match) continue;

    const cls = match[1];
    const body = t.slice(t.indexOf('{') + 1, t.lastIndexOf('}')).trim();

    // Map to JSON
    const jsKey = cls.replace(/-/g, '_');
    jsonStyles[jsKey] = {};
    body.split(';').forEach(pair => {
      const [prop, val] = pair.split(':').map(s => s.trim());
      if (prop && val) {
        const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        jsonStyles[jsKey][camelProp] = val;
      }
    });

    // Base light & dark rules
    baseRules.push(`.${cls} { ${body} }`);
    baseRules.push(`${darkAttr} .dark-${cls} { ${body} }`);

    // States
    for (const [state, pseudo] of Object.entries(states)) {
      baseRules.push(`.${state}-${cls}${pseudo} { ${body} }`);
      baseRules.push(`${darkAttr} .dark-${state}-${cls}${pseudo} { ${body} }`);
    }

    // Group hover
    baseRules.push(`.group-hover-${cls} { ${body} }`);
    baseRules.push(`${darkAttr} .dark-group-hover-${cls} { ${body} }`);

    // Responsive rules
    for (const { key, query } of breakpoints) {
      respLight[key].push(`.${key}-${cls} { ${body} }`);
      respDark[key].push(`${darkAttr} .dark-${key}-${cls} { ${body} }`);

      for (const [state, pseudo] of Object.entries(states)) {
        respLight[key].push(`.${key}-${state}-${cls}${pseudo} { ${body} }`);
        respDark[key].push(`${darkAttr} .dark-${key}-${state}-${cls}${pseudo} { ${body} }`);
      }

      respLight[key].push(`.${key}-group-hover-${cls} { ${body} }`);
      respDark[key].push(`${darkAttr} .dark-${key}-group-hover-${cls} { ${body} }`);
    }
  }

  // Format responsive blocks in mobile-first order
  for (const { key, query } of breakpoints) {
    respRules.push(`${query} {\n${respLight[key].join('\n')}\n}`);
    respRules.push(`${query} {\n${respDark[key].join('\n')}\n}`);
  }

  // Final output
  const finalCSS = [...baseRules, ...respRules].join('\n');
  fs.writeFileSync(outputCSS, finalCSS, 'utf8');
  fs.writeFileSync(outputJSON, JSON.stringify(jsonStyles, null, 2), 'utf8');

  console.log('✅ Quanta CSS compiled with mobile-first dark/light structure.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}