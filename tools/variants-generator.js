const fs = require('fs');
const path = require('path');

try {
  // Compute and log paths
  const inputPath     = path.resolve(__dirname, '../src/utilities/base.css');
  const outputCSS     = path.resolve(__dirname, '../src/utilities/quanta-css-variants.css');
  const outputJSON    = path.resolve(__dirname, '../src/utilities/quanta-css-styles.json');
  const themeDir      = path.resolve(__dirname, '../dist/theme');
  const lightOutput   = path.join(themeDir, 'light.css');
  const darkOutput    = path.join(themeDir, 'dark.css');

  console.log('Reading from:', inputPath);
  console.log('Will write combined:', outputCSS);
  console.log('Will write JSON:',   outputJSON);
  console.log('Will write light:',  lightOutput);
  console.log('Will write dark:',   darkOutput);

  // Read input
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const inputCSS = fs.readFileSync(inputPath, 'utf8');
  const lines    = inputCSS.split(/\r?\n/);

  // Ensure themeDir exists
  if (!fs.existsSync(themeDir)) {
    console.log('Creating theme directory at', themeDir);
    fs.mkdirSync(themeDir, { recursive: true });
  }

  // Setup storage
  const lightVars = [];
  const darkVars  = [];
  const respLight = {}, respDark = {};
  const responsivePrefixes = {
    sm: '@media (min-width: 480px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    uw: '@media (min-width: 1536px)',
  };
  Object.keys(responsivePrefixes).forEach(k => { respLight[k]=[]; respDark[k]=[]; });
  const statePrefixes = { hover:':hover', focus:':focus', active:':active', disabled:':disabled' };
  const darkAttr = '[data-theme="dark"]';
  const groupHover = '.group:hover';
  const jsonStyles = {};

  // Process lines
  for (let line of lines) {
    const t = line.trim();
    if (!t.startsWith('.') || !t.includes('{') || !t.includes('}')) continue;
    const m = t.match(/^\.([^{\s]+)/);
    if (!m) continue;
    const cls = m[1];
    const body = t.slice(t.indexOf('{')+1, t.lastIndexOf('}')).trim();
    // JSON
    const jsKey = cls.replace(/-/g,'_');
    jsonStyles[jsKey] = {};
    body.split(';').forEach(pair=>{
      let [p,v] = pair.split(':').map(s=>s.trim());
      if (p && v) {
        const key = p.replace(/-([a-z])/g,(_,g)=>g.toUpperCase());
        jsonStyles[jsKey][key]=v;
      }
    });

    // Base
    lightVars.push(`.${cls} { ${body} }`);
    darkVars.push(`${darkAttr} .${cls} { ${body} }`);

    // States
    Object.entries(statePrefixes).forEach(([state,pseudo])=>{
      lightVars.push(`.${state}-${cls}${pseudo} { ${body} }`);
      darkVars.push(`${darkAttr} .${state}-${cls}${pseudo} { ${body} }`);
    });

    // Group-hover
    lightVars.push(`${groupHover} .group-hover-${cls} { ${body} }`);
    darkVars.push(`${darkAttr} ${groupHover} .group-hover-${cls} { ${body} }`);

    // Responsive
    Object.entries(responsivePrefixes).forEach(([prefix,media])=>{
      const sel = `.${prefix}-${cls}`;
      respLight[prefix].push(`${sel} { ${body} }`);
      respDark[prefix].push(`${darkAttr} ${sel} { ${body} }`);
    });
  }

  // Build responsive blocks
  const lightRespBlocks = Object.entries(responsivePrefixes).map(([p,media])=>
    `${media} {\n${respLight[p].join('\n')}\n}`
  );
  const darkRespBlocks = Object.entries(responsivePrefixes).map(([p,media])=>
    `${media} {\n${respDark[p].join('\n')}\n}`
  );

  // Final strings
  const finalLight = [...lightVars, ...lightRespBlocks].join('\n');
  const finalDark  = [...darkVars,  ...darkRespBlocks ].join('\n');
  const combined   = finalLight + '\n' + finalDark;

  // Log counts
  console.log('Rules:', {
    base: lightVars.length,
    dark: darkVars.length,
    resp: lightRespBlocks.length
  });

  // Write files
  fs.writeFileSync(outputCSS, combined, 'utf8');
  fs.writeFileSync(outputJSON, JSON.stringify(jsonStyles, null,2), 'utf8');
  fs.writeFileSync(lightOutput, finalLight, 'utf8');
  fs.writeFileSync(darkOutput, finalDark, 'utf8');

  console.log('✅ Files written successfully.');
}
catch(err) {
  console.error('❌ Error in variants-generator:', err.message);
  process.exit(1);
}