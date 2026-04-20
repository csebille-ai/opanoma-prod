const fs = require('fs');
let c = fs.readFileSync('c:/Site Manon/opanoma-fresh/index.html', 'utf8');

const patches = [
  // 1. Logo header: add width/height
  [
    `<img src="/img/opalogo.png" alt="Logo l'\u0152il d'Opanoma" class="brand-logo-img" />`,
    `<img src="/img/opalogo.png" alt="Logo l'\u0152il d'Opanoma" class="brand-logo-img" width="48" height="48" />`
  ],
  // 2. Logo mobile: add width/height + lazy
  [
    `<img src="/img/opalogo.png" alt="Logo l'\u0152il d'Opanoma" class="mobile-brand-logo" />`,
    `<img src="/img/opalogo.png" alt="Logo l'\u0152il d'Opanoma" class="mobile-brand-logo" width="40" height="40" loading="lazy" />`
  ],
  // 3. Skip-to-content (CRLF)
  [
    `<body>\r\n  <script>window.PopupAdapter`,
    `<body>\r\n  <a href="#main-content" class="skip-to-content" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:999999;padding:8px 16px;background:#c9a96e;color:#110e0c;font-weight:600;text-decoration:none;border-radius:4px;" onfocus="this.style.cssText='position:fixed;left:16px;top:16px;width:auto;height:auto;overflow:visible;z-index:999999;padding:8px 16px;background:#c9a96e;color:#110e0c;font-weight:600;text-decoration:none;border-radius:4px;'" onblur="this.style.cssText='position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;'">Aller au contenu principal</a>\r\n  <script>window.PopupAdapter`
  ]
];

let count = 0;
for (const [old, rep] of patches) {
  if (c.includes(old)) {
    c = c.replace(old, rep);
    count++;
    console.log('OK:', old.substring(0, 60).replace(/[\r\n]/g, '\\n'));
  } else {
    console.log('SKIP:', old.substring(0, 60).replace(/[\r\n]/g, '\\n'));
  }
}

const bom = '\uFEFF';
if (!c.startsWith(bom)) c = bom + c;
fs.writeFileSync('c:/Site Manon/opanoma-fresh/index.html', c, 'utf8');
console.log(`Done: ${count}/${patches.length}`);
