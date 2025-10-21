const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'index.html');
const s = fs.readFileSync(file, 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0;
let target = 5;
while ((m = re.exec(s)) !== null) {
  i++;
  if (i === target) {
    const script = m[1];
    console.log('Script', i, 'length', script.length);
    const chars = { '(':0, ')':0, '{':0, '}':0, '[':0, ']':0 };
    let line = 0;
    const lines = script.split(/\r?\n/);
    let cum = { '(':0, ')':0, '{':0, '}':0, '[':0, ']':0 };
    for (let li=0; li<lines.length; li++) {
      const L = lines[li];
      for (let ci=0; ci<L.length; ci++) {
        const ch = L[ci];
        if (ch === '(') cum['(']++;
        if (ch === ')') cum[')']++;
        if (ch === '{') cum['{']++;
        if (ch === '}') cum['}']++;
        if (ch === '[') cum['[']++;
        if (ch === ']') cum[']']++;
      }
      // print running balances every 5 lines
      if ((li+1) % 5 === 0) {
        console.log('line', li+1, 'cumulative', cum);
      }
      // detect if at any point count of ) or } or ] exceeds their opener (indicates stray closing)
      if (cum[')'] > cum['('] || cum['}'] > cum['{'] || cum[']'] > cum['[']) {
        console.log('imbalance detected at line', li+1, 'cumulative', cum);
        // print context
        const start = Math.max(0, li-8);
        const end = Math.min(lines.length, li+8);
        for (let j=start;j<end;j++) console.log((item.startLine + j).toString().padStart(5)+' | '+lines[j]);
        break;
      }
    }
    console.log('Final balances', chars);
    // Also show last 80 chars to inspect tail
    console.log('Last 200 chars of script:\n', script.slice(-200));
    break;
  }
}
