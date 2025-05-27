#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../dist/components.css');
const utilitiesPath = path.resolve(__dirname, '../dist/litezen-styles.json');
const outputPath = path.resolve(__dirname, '../dist/litezen.css');

const utilityStyles = JSON.parse(fs.readFileSync(utilitiesPath, 'utf8'));
const inputCSS = fs.readFileSync(inputPath, 'utf8');

function resolveApply(classList) {
  return classList.split(/\s+/).map(className => {
    const key = className.replace(/-/g, '_');
    const styles = utilityStyles[key];
    if (!styles) {
      console.warn('⚠️ Unknown class in @apply:', className);
      return '';
    }
    return Object.entries(styles).map(([prop, val]) => 
      `  ${prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${val};`).join('\n');
  }).join('\n');
}

let output = [];
let insideLayer = false;
const lines = inputCSS.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();

  if (line.startsWith('@layer')) {
    insideLayer = true;
    output.push(`/* === LAYER: components === */`);
    continue;
  }

  if (insideLayer && line === '}') {
    insideLayer = false;
    output.push('');
    continue;
  }

  if (line.includes('@apply')) {
    const className = line.match(/^(\S+)\s*{/)[1];
    const applyLine = lines[i + 1].trim();
    const classesToApply = applyLine.replace('@apply', '').replace(';', '').trim();
    const resolved = resolveApply(classesToApply);
    output.push(`${className} {\n${resolved}\n}`);
    i += 2;
    continue;
  }

  if (line.startsWith('@variants')) {
    const variant = line.split(' ')[1];
    while (!lines[i].includes('}')) {
      i++;
      output.push(lines[i].replace(/\.(\S+):/, `.${variant}-$1:${variant}`));
    }
    continue;
  }

  if (!line.startsWith('@')) {
    output.push(line);
  }
}

fs.writeFileSync(outputPath, output.join('\n'), 'utf8');
console.log('✅ litezen.css generated at dist/');
