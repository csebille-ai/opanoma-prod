const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let c = fs.readFileSync(file, 'utf8');

const replacements = [
  // 1. Add favicon, apple-touch-icon, manifest link before <script type="module"
  [
    '<script type="module" src="/src/main.js"></script>',
    `<link rel="icon" href="/img/opalogo.png" type="image/png">
  <link rel="apple-touch-icon" href="/img/opalogo.png">
  <link rel="manifest" href="/manifest.json">
  <script type="module" src="/src/main.js"></script>`
  ],

  // 2. Logo img: add lazy loading + width/height (header)
  [
    '<img src="/img/opalogo.png" alt="Logo l\u2019\u0152il d\u2019Opanoma" class="brand-logo-img" />',
    '<img src="/img/opalogo.png" alt="Logo l\u2019\u0152il d\u2019Opanoma" class="brand-logo-img" width="48" height="48" />'
  ],

  // 3. Logo img: add lazy loading + width/height (mobile menu)
  [
    '<img src="/img/opalogo.png" alt="Logo l\u2019\u0152il d\u2019Opanoma" class="mobile-brand-logo" />',
    '<img src="/img/opalogo.png" alt="Logo l\u2019\u0152il d\u2019Opanoma" class="mobile-brand-logo" width="40" height="40" loading="lazy" />'
  ],

  // 4. Remove non-existent poster from video
  [
    'poster="./hero-poster.jpg"',
    'preload="auto"'
  ],

  // 5. Footer text contrast: 35% -> 55%
  [
    'color:rgba(237,232,227,.35)',
    'color:rgba(237,232,227,.55)'
  ],

  // 6. Skip-to-content link after <body>
  [
    '<body>\n  <script>window.PopupAdapter',
    '<body>\n  <a href="#main-content" class="skip-to-content" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:999999;padding:8px 16px;background:#c9a96e;color:#110e0c;font-weight:600;text-decoration:none;border-radius:4px;" onfocus="this.style.cssText=\'position:fixed;left:16px;top:16px;width:auto;height:auto;overflow:visible;z-index:999999;padding:8px 16px;background:#c9a96e;color:#110e0c;font-weight:600;text-decoration:none;border-radius:4px;\'" onblur="this.style.cssText=\'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;\'">Aller au contenu principal</a>\n  <script>window.PopupAdapter'
  ],

  // 7. Add id="main-content" to <main>
  [
    '<main>',
    '<main id="main-content">'
  ]
];

let count = 0;
for (const [old, replacement] of replacements) {
  if (c.includes(old)) {
    c = c.replace(old, replacement);
    count++;
    console.log(`OK: ${old.substring(0, 50).replace(/\n/g, '\\n')}...`);
  } else {
    console.log(`SKIP (not found): ${old.substring(0, 50).replace(/\n/g, '\\n')}...`);
  }
}

// Write back preserving BOM
const bom = '\uFEFF';
if (!c.startsWith(bom)) c = bom + c;
fs.writeFileSync(file, c, 'utf8');
console.log(`\nDone: ${count}/${replacements.length} replacements applied.`);
