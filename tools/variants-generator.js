const fs = require('fs');
const path = require('path');

try {
  const inputPath     = path.resolve(__dirname, '../src/utilities/base.css');
  const outputCSS     = path.resolve(__dirname, '../src/utilities/quanta-css-variants.css');
  const outputJSON    = path.resolve(__dirname, '../src/utilities/quanta-css-styles.json');
  const themeDir      = path.resolve(__dirname, '../dist/theme');
  const lightOutput   = path.join(themeDir, 'light.css');
  const darkOutput    = path.join(themeDir, 'dark.css');

  console.log('Reading from:', inputPath);

  if (!fs.existsSync(inputPath)) throw new Error(`Input file not found: ${inputPath}`);
  const inputCSS = fs.readFileSync(inputPath, 'utf8');
  const lines    = inputCSS.split(/\r?\n/);

  if (!fs.existsSync(themeDir)) fs.mkdirSync(themeDir, { recursive: true });

  const lightVars = [];
  const darkVars  = [];
  const respLight = {};
  const respDark  = {};
  const responsivePrefixes = {
    sm: '@media (min-width: 480px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    uw: '@media (min-width: 1536px)',
  };
  const statePrefixes = { hover: ':hover', focus: ':focus', active: ':active', disabled: ':disabled' };
  const darkAttr = '[data-theme="dark"]';
  const jsonStyles = {};

  Object.keys(responsivePrefixes).forEach(p => {
    respLight[p] = [];
    respDark[p] = [];
  });

  for (let line of lines) {
    const t = line.trim();
    if (!t.startsWith('.') || !t.includes('{') || !t.includes('}')) continue;
    const m = t.match(/^\.([^{\s]+)/);
    if (!m) continue;

    const cls = m[1];
    const body = t.slice(t.indexOf('{')+1, t.lastIndexOf('}')).trim();
    const jsKey = cls.replace(/-/g,'_');
    jsonStyles[jsKey] = {};
    body.split(';').forEach(pair=>{
      let [p,v] = pair.split(':').map(s=>s.trim());
      if (p && v) {
        const key = p.replace(/-([a-z])/g,(_,g)=>g.toUpperCase());
        jsonStyles[jsKey][key]=v;
      }
    });

    lightVars.push(`.${cls} { ${body} }`);
    darkVars.push(`${darkAttr} .${cls} { ${body} }`);
    darkVars.push(`.dark-${cls} { ${body} }`);

    for (const [state, pseudo] of Object.entries(statePrefixes)) {
      const lightState = `.${state}-${cls}${pseudo} { ${body} }`;
      const darkState1 = `${darkAttr} .${state}-${cls}${pseudo} { ${body} }`;
      const darkState2 = `.dark-${state}-${cls}${pseudo} { ${body} }`;

      lightVars.push(lightState);
      darkVars.push(darkState1, darkState2);
    }

    lightVars.push(`.group:hover .group-hover-${cls} { ${body} }`);
    darkVars.push(`${darkAttr} .group:hover .group-hover-${cls} { ${body} }`);
    darkVars.push(`.dark-group-hover-${cls} { ${body} }`);

    for (const [prefix, media] of Object.entries(responsivePrefixes)) {
      const sel = `.${prefix}-${cls}`;
      respLight[prefix].push(`${sel} { ${body} }`);
      respDark[prefix].push(`${darkAttr} ${sel} { ${body} }`);
      respDark[prefix].push(`.${prefix}-dark-${cls} { ${body} }`);

      for (const [state, pseudo] of Object.entries(statePrefixes)) {
        const lightSel = `.${prefix}-${state}-${cls}${pseudo} { ${body} }`;
        const darkSel1 = `${darkAttr} .${prefix}-${state}-${cls}${pseudo} { ${body} }`;
        const darkSel2 = `.${prefix}-dark-${state}-${cls}${pseudo} { ${body} }`;

        respLight[prefix].push(lightSel);
        respDark[prefix].push(darkSel1, darkSel2);
      }
    }
  }

  const lightRespBlocks = Object.entries(responsivePrefixes).map(([p,media]) =>
    `${media} {\n${respLight[p].join('\n')}\n}`
  );
  const darkRespBlocks = Object.entries(responsivePrefixes).map(([p,media]) =>
    `${media} {\n${respDark[p].join('\n')}\n}`
  );

  const finalLight = [...lightVars, ...lightRespBlocks].join('\n');
  const finalDark  = [...darkVars,  ...darkRespBlocks ].join('\n');
  const combined   = finalLight + '\n' + finalDark;

  fs.writeFileSync(outputCSS, combined, 'utf8');
  fs.writeFileSync(outputJSON, JSON.stringify(jsonStyles, null, 2), 'utf8');
  fs.writeFileSync(lightOutput, finalLight, 'utf8');
  fs.writeFileSync(darkOutput, finalDark, 'utf8');

  console.log('✅ Done. All variant files written successfully.');
} catch (err) {
  console.error('❌ Error in variants-generator:', err.message);
  process.exit(1);
}