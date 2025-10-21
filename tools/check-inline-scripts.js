const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'index.html');
const s = fs.readFileSync(file, 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0;
const out = [];
const allLines = s.split(/\r?\n/);
while ((m = re.exec(s)) !== null) {
  i++;
  const script = m[1];
  // compute start line
  const prefix = s.slice(0, m.index);
  const startLine = prefix.split(/\r?\n/).length;
  const endLine = startLine + script.split(/\r?\n/).length - 1;
  out.push({i, script, index: m.index, startLine, endLine});
}
if (!out.length) {
  console.log('No inline scripts found');
  process.exit(0);
}
for (const item of out) {
  try {
    // try to compile
    new Function(item.script);
    console.log(`script ${item.i}: OK`);
  } catch (e) {
    console.error(`script ${item.i}: SYNTAX ERROR -> ${e.message}`);
    console.log(`script ${item.i} spans lines ${item.startLine}-${item.endLine} in index.html`);
    const lines = item.script.split(/\r?\n/);
    console.log('--- full script content with line numbers ---');
    for (let li = 0; li < lines.length; li++) {
      const globalLine = item.startLine + li;
      console.log(globalLine.toString().padStart(5)+' | '+lines[li]);
    }
    process.exit(2);
  }
}
console.log('All inline scripts compile OK');
