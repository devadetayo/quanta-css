const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outDir = 'dist';

// Utility files (adjust paths as needed)
const utilityFiles = [
  'src/tokens/color-tokens.css',
  'src/utilities/variables.css',
  'src/utilities/reset.css',
  'src/utilities/normalize.css',
  'src/utilities/base.css',
  'src/utilities/quanta-css-variants.css',
];

// Component files (adjust paths as needed)
const componentFiles = [
  'src/tokens/color-tokens.css',
  'src/components/reset.css',
  'src/components/variables.css',
  'src/components/base.css',
  'src/components/accordions.css',
  'src/components/alerts.css',
  'src/components/avatars.css',
  'src/components/badges.css',
  'src/components/breadcrumbs.css',
  'src/components/buttons.css',
  'src/components/cards.css',
  'src/components/carousel.css',
  'src/components/chips.css',
  'src/components/columns.css',
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

// Combine all source files for the main build
const allSourceFiles = [...utilityFiles, ...componentFiles];

// Create output directory if it doesn't exist
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

/**
 * Check if a file exists and is readable
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Merge & dedupe CSS files:
 * - Preserves comments and structure
 * - Dedupes complete CSS rules and @-rules
 * - Removes empty rule blocks
 */
function buildAndDedupe(files, outFile, buildType = 'main') {
  const seenRules = new Set();
  const seenImports = new Set();
  const result = [];
  let totalProcessedFiles = 0;

  // Remove duplicates from file list while preserving order
  const uniqueFiles = [...new Set(files)];

  console.log(`\n🔨 Building ${buildType} (${uniqueFiles.length} files) -> ${outFile}`);

  uniqueFiles.forEach(filePath => {
    if (!fileExists(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`   📄 ${filePath}`);
      
      // Split content into logical blocks
      const blocks = parseCSS(content);
      
      blocks.forEach(block => {
        const blockKey = block.content.trim();
        
        if (block.type === 'import') {
          // Handle @import statements - dedupe them
          if (!seenImports.has(blockKey)) {
            seenImports.add(blockKey);
            result.push(blockKey);
          }
        } else if (block.type === 'comment') {
          // Always preserve comments but avoid duplicates
          if (!seenRules.has(blockKey)) {
            seenRules.add(blockKey);
            result.push(blockKey);
          }
        } else if (block.type === 'rule') {
          // Handle CSS rules - dedupe complete rules
          if (blockKey && !isEmptyRule(blockKey) && !seenRules.has(blockKey)) {
            seenRules.add(blockKey);
            result.push(blockKey);
          }
        } else if (block.type === 'atrule') {
          // Handle @media, @keyframes, etc. - dedupe them
          if (blockKey && !seenRules.has(blockKey)) {
            seenRules.add(blockKey);
            result.push(blockKey);
          }
        }
      });

      totalProcessedFiles++;
    } catch (err) {
      console.error(`❌ Error reading ${filePath}:`, err.message);
    }
  });

  // Join results with proper spacing
  const merged = result.join('\n\n');
  
  try {
    fs.writeFileSync(outFile, merged);
    console.log(`✅ ${outFile} created`);
    console.log(`📊 ${totalProcessedFiles} files → ${seenRules.size + seenImports.size} unique rules`);
  } catch (err) {
    console.error(`❌ Error writing ${outFile}:`, err.message);
    throw err;
  }
}

/**
 * Parse CSS content into logical blocks
 */
function parseCSS(content) {
  const blocks = [];
  const lines = content.split(/\r?\n/);
  let currentBlock = '';
  let blockType = null;
  let braceCount = 0;
  let inMultilineComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle multiline comments
    if (trimmed.includes('/*')) {
      inMultilineComment = true;
    }
    if (trimmed.includes('*/')) {
      inMultilineComment = false;
      if (blockType === 'comment' || !blockType) {
        currentBlock += line + '\n';
        blocks.push({ type: 'comment', content: currentBlock.trim() });
        currentBlock = '';
        blockType = null;
        continue;
      }
    }

    // Handle different types of content
    if (inMultilineComment || trimmed.startsWith('//')) {
      if (!blockType) blockType = 'comment';
      currentBlock += line + '\n';
    } else if (trimmed.startsWith('@import')) {
      if (currentBlock.trim()) {
        blocks.push({ type: blockType || 'rule', content: currentBlock.trim() });
      }
      blocks.push({ type: 'import', content: trimmed });
      currentBlock = '';
      blockType = null;
    } else if (trimmed.startsWith('@media') || trimmed.startsWith('@keyframes') || 
               trimmed.startsWith('@supports') || trimmed.startsWith('@font-face')) {
      if (currentBlock.trim()) {
        blocks.push({ type: blockType || 'rule', content: currentBlock.trim() });
      }
      blockType = 'atrule';
      currentBlock = line + '\n';
      braceCount += (trimmed.match(/\{/g) || []).length;
    } else if (trimmed.includes('{')) {
      if (!blockType) blockType = 'rule';
      currentBlock += line + '\n';
      braceCount += (trimmed.match(/\{/g) || []).length;
    } else if (trimmed.includes('}')) {
      currentBlock += line + '\n';
      braceCount -= (trimmed.match(/\}/g) || []).length;
      
      if (braceCount <= 0) {
        blocks.push({ type: blockType || 'rule', content: currentBlock.trim() });
        currentBlock = '';
        blockType = null;
        braceCount = 0;
      }
    } else if (blockType) {
      currentBlock += line + '\n';
    } else if (trimmed) {
      // Standalone property or selector
      currentBlock += line + '\n';
      if (!blockType) blockType = 'rule';
    }
  }

  // Handle any remaining content
  if (currentBlock.trim()) {
    blocks.push({ type: blockType || 'rule', content: currentBlock.trim() });
  }

  return blocks;
}

/**
 * Check if a CSS rule is empty (just selector with empty braces)
 */
function isEmptyRule(rule) {
  const withoutComments = rule.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const match = withoutComments.match(/[^{]+\{([^}]*)\}/);
  return match && match[1].trim() === '';
}

/**
 * Minify CSS content
 */
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '')         // Remove line comments
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .replace(/;\s*}/g, '}')           // Remove last semicolon before }
    .replace(/\s*{\s*/g, '{')         // Remove spaces around {
    .replace(/}\s*/g, '}')            // Remove spaces after }
    .replace(/,\s*/g, ',')            // Remove spaces after commas
    .replace(/:\s*/g, ':')            // Remove spaces after colons
    .replace(/;\s*/g, ';')            // Remove spaces after semicolons
    .replace(/>\s*/g, '>')            // Remove spaces after >
    .replace(/\s*\+\s*/g, '+')        // Remove spaces around +
    .replace(/\s*~\s*/g, '~')         // Remove spaces around ~
    .trim();
}

try {
  console.log('🚀 Starting Quanta CSS build process...');

  // 1) Build utilities.css from utility files
  buildAndDedupe(utilityFiles, `${outDir}/utilities.css`, 'utilities');

  // 2) Build components.css from component files  
  buildAndDedupe(componentFiles, `${outDir}/components.css`, 'components');

  // 3) Build the main quanta.css with everything combined and deduped
  buildAndDedupe(allSourceFiles, `${outDir}/quanta.css`, 'complete framework');

  // 4) Create minified version
  console.log('\n🗜️  Creating minified version...');
  try {
    // Try PostCSS first for better minification
    execSync(`npx postcss ${outDir}/quanta.css -o ${outDir}/quanta.min.css`, { 
      stdio: 'pipe' // Suppress output unless there's an error
    });
    console.log('✅ quanta.min.css created with PostCSS');
  } catch (postcssError) {
    console.log('⚠️  PostCSS not available, using basic minification...');
    
    // Fallback to basic minification
    const css = fs.readFileSync(`${outDir}/quanta.css`, 'utf8');
    const minified = minifyCSS(css);
    
    fs.writeFileSync(`${outDir}/quanta.min.css`, minified);
    console.log('✅ quanta.min.css created with basic minification');
  }

  // 5) Display final stats
  const stats = {
    'quanta.css': fs.statSync(`${outDir}/quanta.css`).size,
    'quanta.min.css': fs.statSync(`${outDir}/quanta.min.css`).size,
    'utilities.css': fs.statSync(`${outDir}/utilities.css`).size,
    'components.css': fs.statSync(`${outDir}/components.css`).size
  };

  console.log('\n📈 Build Summary:');
  console.log(`   quanta.css:     ${(stats['quanta.css'] / 1024).toFixed(1)}KB`);
  console.log(`   quanta.min.css: ${(stats['quanta.min.css'] / 1024).toFixed(1)}KB (${Math.round((1 - stats['quanta.min.css']/stats['quanta.css']) * 100)}% smaller)`);
  console.log(`   utilities.css:  ${(stats['utilities.css'] / 1024).toFixed(1)}KB`);
  console.log(`   components.css: ${(stats['components.css'] / 1024).toFixed(1)}KB`);

  console.log('\n🎉 Quanta CSS build completed successfully!');
  console.log(`📁 Output files created in: ${outDir}/`);

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}