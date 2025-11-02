const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outDir = 'dist';
const usePostCSS = process.argv.includes('--postcss');

const utilityFiles = [
  'src/tokens/color-tokens.css',
  'src/utilities/variables.css',
  'src/utilities/reset.css',
  'src/utilities/base.css',
  'src/utilities/quanta-css-variants.css',
];

const componentFiles = [
  'src/tokens/color-tokens.css', // This should NOT be filtered out
  'src/components/reset.css',
  'src/components/variables.css',
  'src/components/base.css',
  'src/components/accordions.css',
  'src/components/alerts.css',
  'src/components/avatars.css',
  'src/components/badges.css',
  'src/components/blockquote.css',
  'src/components/breadcrumbs.css',
  'src/components/buttons.css',
  'src/components/cards.css',
  'src/components/carousel.css',
  'src/components/chips.css',
  'src/components/columns.css',
  'src/components/code-block.css',
  'src/components/containers.css',
  'src/components/datepicker.css',
  'src/components/divider.css',
  'src/components/drawer.css',
  'src/components/dropdown.css',
  'src/components/file-uploads.css',
  'src/components/footer.css',
  'src/components/forms.css',
  'src/components/form-elements.css',
  'src/components/gallery.css',
  'src/components/grids.css',
  'src/components/hero.css',
  'src/components/input-group.css',
  'src/components/lazy-load.css',
  'src/components/list.css',
  'src/components/megamenu.css',
  'src/components/modals.css',
  'src/components/navbar.css',
  'src/components/notifications.css',
  'src/components/paginations.css',
  'src/components/popovers.css',
  'src/components/pricing.css',
  'src/components/progress-bars.css',
  'src/components/range-slider.css',
  'src/components/rating.css',
  'src/components/searchfilter.css',
  'src/components/sidebar.css',
  'src/components/skeleton.css',
  'src/components/spinners.css',
  'src/components/stats.css',
  'src/components/stepper.css',
  'src/components/sticky.css',
  'src/components/tables.css',
  'src/components/textarea.css',
  'src/components/tabs.css',
  'src/components/theme-switcher.css',
  'src/components/timeline.css',
  'src/components/tooltips.css',
  'src/components/visibility.css'
];

// FIXED: Only exclude duplicates that are already in utilities
// Don't exclude color-tokens.css since it's needed for components too
const excludedComponentFiles = ['reset.css', 'variables.css', 'base.css'];
const filteredComponentFiles = componentFiles.filter(file =>
  !excludedComponentFiles.some(exclude => file.includes(`/components/${exclude}`))
);

// FIXED: Components first, then utilities (for proper CSS cascade)
const allSourceFiles = [...filteredComponentFiles, ...utilityFiles];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function isEmptyRule(rule) {
  const cleaned = rule.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const match = cleaned.match(/[^{]+\{([^}]*)\}/);
  return match && match[1].trim() === '';
}

function parseCSS(content) {
  const blocks = [];
  const lines = content.split(/\r?\n/);
  let current = '', type = null, brace = 0, inComment = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('/*')) inComment = true;
    if (trimmed.includes('*/')) inComment = false;
    if (inComment || trimmed.startsWith('//')) {
      type ??= 'comment';
      current += line + '\n';
      continue;
    }
    if (trimmed.startsWith('@import')) {
      if (current.trim()) blocks.push({ type: type || 'rule', content: current.trim() });
      blocks.push({ type: 'import', content: trimmed });
      current = '', type = null;
    } else if (/^@media|^@keyframes|^@supports|^@font-face/.test(trimmed)) {
      if (current.trim()) blocks.push({ type: type || 'rule', content: current.trim() });
      type = 'atrule';
      current = line + '\n';
      brace += (trimmed.match(/\{/g) || []).length;
    } else if (trimmed.includes('{')) {
      type ??= 'rule';
      current += line + '\n';
      brace += (trimmed.match(/\{/g) || []).length;
    } else if (trimmed.includes('}')) {
      current += line + '\n';
      brace -= (trimmed.match(/\}/g) || []).length;
      if (brace <= 0) {
        blocks.push({ type: type || 'rule', content: current.trim() });
        current = '', type = null, brace = 0;
      }
    } else if (type) {
      current += line + '\n';
    } else if (trimmed) {
      current += line + '\n';
      type ??= 'rule';
    }
  }

  if (current.trim()) blocks.push({ type: type || 'rule', content: current.trim() });
  return blocks;
}

function buildAndDedupe(files, outFile, label = 'build') {
  const seenRules = new Set(), seenImports = new Set();
  const result = [];
  const uniqueFiles = [...new Set(files)];
  let total = 0;
  let duplicateCount = 0;

  console.log(`\n🚧 ${label} (${uniqueFiles.length} files) -> ${outFile}`);

  for (const filePath of uniqueFiles) {
    if (!fileExists(filePath)) {
      console.warn(`⚠️  Missing: ${filePath}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`   📄 ${filePath} (${(content.length / 1024).toFixed(1)}KB)`);
      
      for (const block of parseCSS(content)) {
        const key = block.content.trim();
        if (!key) continue;
        
        if (block.type === 'import') {
          if (!seenImports.has(key)) {
            seenImports.add(key);
            result.push(key);
          } else {
            duplicateCount++;
          }
        } else if (block.type === 'comment') {
          if (!seenRules.has(key)) {
            seenRules.add(key);
            result.push(key);
          } else {
            duplicateCount++;
          }
        } else if (!isEmptyRule(key) && !seenRules.has(key)) {
          seenRules.add(key);
          result.push(key);
        } else if (!isEmptyRule(key)) {
          duplicateCount++;
        }
      }
      total++;
    } catch (err) {
      console.error(`❌ Error reading ${filePath}: ${err.message}`);
    }
  }

  try {
    const finalContent = result.join('\n\n');
    fs.writeFileSync(outFile, finalContent);
    console.log(`✅ Wrote ${outFile}`);
    console.log(`   📊 ${seenRules.size + seenImports.size} unique rules from ${total} files`);
    console.log(`   🔄 ${duplicateCount} duplicates removed`);
    console.log(`   💾 Final size: ${(finalContent.length / 1024).toFixed(1)}KB`);
  } catch (err) {
    console.error(`❌ Write failed: ${err.message}`);
  }
}

// IMPROVED: Much better minification
function minifyCSS(css) {
  return css
    // Remove all comments (including multiline)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove single-line comments
    .replace(/\/\/.*$/gm, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around braces and colons
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s*>\s*/g, '>')
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s*~\s*/g, '~')
    // Remove trailing semicolons before }
    .replace(/;}/g, '}')
    // Remove unnecessary zeros
    .replace(/(:|\s)0+(\d)/g, '$1$2')
    .replace(/(:|\s)0px/g, '$10')
    .replace(/(:|\s)0em/g, '$10')
    .replace(/(:|\s)0rem/g, '$10')
    .replace(/(:|\s)0%/g, '$10')
    // Shorten hex colors
    .replace(/#([a-fA-F0-9])\1([a-fA-F0-9])\2([a-fA-F0-9])\3/g, '#$1$2$3')
    // Remove unnecessary quotes
    .replace(/['"]([a-zA-Z-]+)['"]/g, '$1')
    // Remove final newlines and spaces
    .replace(/\n/g, '')
    .trim();
}

// IMPROVED: Better PostCSS fallback
function tryPostCSSMinify(inputFile, outputFile) {
  try {
    // Try with postcss-cli and cssnano
    execSync(`npx postcss ${inputFile} -u cssnano -o ${outputFile}`, { stdio: 'pipe' });
    return true;
  } catch (err1) {
    try {
      // Fallback to basic postcss
      execSync(`npx postcss ${inputFile} -o ${outputFile}`, { stdio: 'pipe' });
      return true;
    } catch (err2) {
      return false;
    }
  }
}

try {
  console.log('🚀 Quanta CSS Build Start');

  // Build separate files
  buildAndDedupe(filteredComponentFiles, `${outDir}/components.css`, 'Components');
  buildAndDedupe(utilityFiles, `${outDir}/utilities.css`, 'Utilities');
  buildAndDedupe(allSourceFiles, `${outDir}/quanta.css`, 'Full Framework (Components → Utilities)');

  console.log('\n🧹 Minifying...');

  const originalSize = fs.statSync(`${outDir}/quanta.css`).size;

  if (usePostCSS) {
    if (tryPostCSSMinify(`${outDir}/quanta.css`, `${outDir}/quanta.min.css`)) {
      console.log('✅ Minified with PostCSS');
    } else {
      console.log('⚠️  PostCSS failed, falling back to manual minify');
      const css = fs.readFileSync(`${outDir}/quanta.css`, 'utf8');
      const mini = minifyCSS(css);
      fs.writeFileSync(`${outDir}/quanta.min.css`, mini);
      console.log('✅ Minified (enhanced manual)');
    }
  } else {
    const css = fs.readFileSync(`${outDir}/quanta.css`, 'utf8');
    const mini = minifyCSS(css);
    fs.writeFileSync(`${outDir}/quanta.min.css`, mini);
    console.log('✅ Minified (enhanced manual)');
  }

  // Create utilities.min.css and components.min.css too
  ['utilities', 'components'].forEach(type => {
    const css = fs.readFileSync(`${outDir}/${type}.css`, 'utf8');
    const mini = minifyCSS(css);
    fs.writeFileSync(`${outDir}/${type}.min.css`, mini);
  });

  const stats = {
    'quanta.css': fs.statSync(`${outDir}/quanta.css`).size,
    'quanta.min.css': fs.statSync(`${outDir}/quanta.min.css`).size,
    'utilities.css': fs.statSync(`${outDir}/utilities.css`).size,
    'utilities.min.css': fs.statSync(`${outDir}/utilities.min.css`).size,
    'components.css': fs.statSync(`${outDir}/components.css`).size,
    'components.min.css': fs.statSync(`${outDir}/components.min.css`).size
  };

  console.log('\n📊 Build Size Summary:');
  console.log(`   quanta.css:        ${(stats['quanta.css'] / 1024).toFixed(1)} KB`);
  console.log(`   quanta.min.css:    ${(stats['quanta.min.css'] / 1024).toFixed(1)} KB (${Math.round((1 - stats['quanta.min.css'] / stats['quanta.css']) * 100)}% smaller)`);
  console.log(`   utilities.css:     ${(stats['utilities.css'] / 1024).toFixed(1)} KB`);
  console.log(`   utilities.min.css: ${(stats['utilities.min.css'] / 1024).toFixed(1)} KB`);
  console.log(`   components.css:    ${(stats['components.css'] / 1024).toFixed(1)} KB`);
  console.log(`   components.min.css: ${(stats['components.min.css'] / 1024).toFixed(1)} KB`);

  // Verify components are included
  const quantaContent = fs.readFileSync(`${outDir}/quanta.css`, 'utf8');
  const componentKeywords = ['btn', 'card', 'modal', 'navbar', 'alert'];
  const foundComponents = componentKeywords.filter(keyword => 
    quantaContent.toLowerCase().includes(keyword)
  );
  
  console.log(`\n🔍 Component Verification:`);
  console.log(`   Found components: ${foundComponents.join(', ')}`);
  if (foundComponents.length === 0) {
    console.warn('⚠️  Warning: No common component classes found in final build!');
  }

  console.log('\n✅ Quanta CSS build complete!');
} catch (err) {
  console.error('\n❌ Build crashed:', err.message);
  console.error(err.stack);
  process.exit(1);
}