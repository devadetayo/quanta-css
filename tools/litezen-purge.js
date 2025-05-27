const fs = require('fs');
const path = require('path');

// === CONFIG ===
const scanDirs = ['src']; // folders to scan for used classes
const inputCSSPath = path.resolve(__dirname, '../dist/litezen.css');
const outputCSSPath = path.resolve(__dirname, '../dist/litezen.min.css');

// === STEP 1: Extract class names used in HTML, JS, Vue, etc ===
const classRegex = /class(Name)?=["'`]([^"'`]+)["'`]/g;
const foundClasses = new Set();

function scanFilesRecursively(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      scanFilesRecursively(filePath);
    } else if (/\.(html|js|jsx|ts|tsx|vue|php)/.test(file)) {
      const content = fs.readFileSync(filePath, 'utf8');
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        match[2].split(/\s+/).forEach(cls => foundClasses.add(cls.trim()));
      }
    }
  });
}

scanDirs.forEach(dir => scanFilesRecursively(path.resolve(__dirname, '..', dir)));

console.log(`✅ Found ${foundClasses.size} used classes.`);

// === STEP 2: Purge unused CSS ===
const inputCSS = fs.readFileSync(inputCSSPath, 'utf8');
const lines = inputCSS.split(/\r?\n/);
let keep = false;
let buffer = '';
const outputLines = [];

lines.forEach(line => {
  if (line.trim().startsWith('.') && line.includes('{')) {
    const cls = line.trim().split(' ')[0].slice(1);
    keep = foundClasses.has(cls);
    buffer = keep ? line + '\n' : '';
  } else if (keep) {
    buffer += line + '\n';
    if (line.includes('}')) {
      outputLines.push(buffer.trim());
      buffer = '';
      keep = false;
    }
  }
});

fs.writeFileSync(outputCSSPath, outputLines.join('\n'), 'utf8');
console.log('✅ litezen.min.css generated with used classes only.');
