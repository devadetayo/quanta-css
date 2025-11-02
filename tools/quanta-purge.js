/**
 * Quanta CSS - PurgeCSS Configuration
 * Customize this file to match your project structure
 */

module.exports = {
  // Files to scan for used CSS classes
  content: [
    './src/**/*.html',
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.tsx',
    './src/**/*.vue',
    './src/**/*.svelte',
    './public/**/*.html',
    './index.html',
    // Add your template files here
  ],
  
  // Input CSS file (the complete framework)
  input: './dist/quanta.min.css',
  
  // Output file (purged CSS)
  output: './dist/quanta.purged.css',
  
  // Classes to always keep (even if not found in content)
  safelist: [
    // Base utility classes
    'group',
    'dark',
    
    // Variant prefixes (keep all responsive/state variants)
    /^hover-/,
    /^focus-/,
    /^focus-visible-/,
    /^focus-within-/,
    /^active-/,
    /^disabled-/,
    /^dark-/,
    /^group-hover-/,
    
    // Responsive prefixes
    /^sm-/,
    /^md-/,
    /^lg-/,
    /^xl-/,
    /^uw-/,
    
    // Combined prefixes (dark-sm-, sm-hover-, etc.)
    /^dark-sm-/,
    /^dark-md-/,
    /^dark-lg-/,
    /^dark-xl-/,
    /^dark-uw-/,
    /^sm-hover-/,
    /^md-hover-/,
    /^lg-hover-/,
    /^xl-hover-/,
    /^uw-hover-/,
    
    // Add specific classes you want to keep
    // 'text-red-500',
    // 'bg-blue-600',
  ],
  
  // Classes to always remove (even if found in content)
  blocklist: [
    // Add classes you never want to include
  ],
  
  // Keep special CSS rules
  keyframes: true,    // Keep @keyframes animations
  fontFace: true,     // Keep @font-face declarations
  variables: true,    // Keep CSS variables (:root, etc.)
};