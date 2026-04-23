const fs = require('fs');
const f = 'index.html';
let html = fs.readFileSync(f, 'utf8');

if (html.includes('G-PZRQCL0GJG')) {
  console.log('GA tag already present');
  process.exit(0);
}

const gaTag = '\n  <!-- Google tag (gtag.js) -->' +
  '\n  <script async src="https://www.googletagmanager.com/gtag/js?id=G-PZRQCL0GJG"><\/script>' +
  '\n  <script>' +
  '\n    window.dataLayer = window.dataLayer || [];' +
  '\n    function gtag(){dataLayer.push(arguments);}' +
  "\n    gtag('js', new Date());" +
  "\n    gtag('config', 'G-PZRQCL0GJG');" +
  '\n  <\/script>';

html = html.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />' + gaTag);
fs.writeFileSync(f, html, 'utf8');
console.log('GA tag inserted successfully');
