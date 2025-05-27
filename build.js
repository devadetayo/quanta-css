const fs = require('fs');
const { execSync } = require('child_process');

const outDir = 'dist';

// Utility files (add all utility files here)
const utilityFiles = [
  'src/tokens/color-tokens.css',
  'src/utilities/variables.css',
  'src/utilities/base.css',
  'src/utilities/reset.css',
  'src/utilities/normalize.css',
  'src/utilities/quanta-css-variants.css',
];

// Component files (add all component files here)
const componentFiles = [
  'src/tokens/color-tokens.css',
  'src/components/variables.css',
  'src/components/reset.css',
  'src/components/variables.css',
  'src/components/base.css',
  'src/components/accordions.css',
  'src/components/alerts.css',
  'src/components/avatars.css',
  'src/components/badges.css',
  'src/components/base.css',
  'src/components/breadcrumbs.css',
  'src/components/buttons.css',
  'src/components/cards.css',
  'src/components/carousel.css',
  'src/components/cards.css',
  'src/components/chips.css',
  'src/components/datepicker.css',
  'src/components/dropdown.css',
  'src/components/file-uploads.css',
  'src/components/footer.css',
  'src/components/forms.css',
  'src/components/gallery.css',
  'src/components/hero.css',
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
  'src/components/reset.css',
  'src/components/searchfilter.css',
  'src/components/sidebar.css',
  'src/components/skeleton.css',
  'src/components/spinners.css',
  'src/components/stats.css',
  'src/components/stepper.css',
  'src/components/sticky-elements.css',
  'src/components/tables.css',
  'src/components/tabs.css',
  'src/components/timeline.css',
  'src/components/tooltips.css'
];

// Full bundle (combined utilities + components)
const quantaFiles = [...utilityFiles, ...componentFiles];

// Ensure dist folder exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Utility build (compiles utility files into dist/utilities.css)
fs.writeFileSync(
  `${outDir}/utilities.css`,
  utilityFiles.map(f => fs.readFileSync(f)).join('\n')
);

// Component build (compiles component files into dist/components.css)
fs.writeFileSync(
  `${outDir}/components.css`,
  componentFiles.map(f => fs.readFileSync(f)).join('\n')
);

// Full build (compiles both utilities and components into dist/quanta.css)
fs.writeFileSync(
  `${outDir}/quanta.css`,
  quantaFiles.map(f => fs.readFileSync(f)).join('\n')
);

// Minify using PostCSS for full bundle
execSync(`npx postcss ${outDir}/quanta.css -o ${outDir}/quanta.min.css`);

console.log('✅ Build complete: utilities.css, components.css, quanta.css, quanta.min.css');