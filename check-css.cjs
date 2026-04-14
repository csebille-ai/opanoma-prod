const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');

// Extract all class names from HTML
const classRegex = /class=["']([^"']+)["']/g;
const htmlClasses = new Set();
let m;
while (m = classRegex.exec(html)) {
  m[1].split(/\s+/).forEach(c => htmlClasses.add(c));
}

// Check which HTML classes have no CSS rule
const missing = [];
const found = [];
[...htmlClasses].sort().forEach(c => {
  if (css.includes('.' + c)) found.push(c);
  else missing.push(c);
});

console.log('HTML classes WITH CSS (' + found.length + '):', found.join(', '));
console.log('');
console.log('HTML classes MISSING from CSS (' + missing.length + '):');
missing.forEach(c => console.log('  .' + c));
