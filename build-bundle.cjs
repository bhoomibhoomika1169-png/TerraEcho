const fs = require('fs');
const path = require('path');

const files = [
  'js/data/data-normalizer.js',
  'js/data/data-validator.js',
  'js/data/dataset-adapter.js',
  'js/audio/sound-profiles.js',
  'js/audio/audio-engine.js',
  'js/audio/visualizer.js',
  'js/earth-viewer.js',
  'js/ui/controls.js',
  'js/app.js'
];

let bundleContent = '/* TerraEcho Standalone Bundle - Compatible with both file:/// and http:// */\n';

for (const rel of files) {
  let content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  // Strip import statements
  content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Strip export keywords
  content = content.replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');
  content = content.replace(/^export\s*\{[\s\S]*?\};?\s*$/gm, '');
  bundleContent += '\n/* --- ' + rel + ' --- */\n' + content + '\n';
}

fs.writeFileSync(path.join(__dirname, 'js', 'bundle.js'), bundleContent, 'utf8');
console.log('Bundle created successfully! Size:', bundleContent.length);
