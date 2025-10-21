const fs = require('fs');
const vm = require('vm');
const path = require('path');
const file = path.resolve(__dirname, '..', 'index.html');
const s = fs.readFileSync(file, 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m,i=0; let target=5; let found=false;
while((m=re.exec(s))!==null){ i++; if(i===target){ found=true; const script=m[1]; try{ new vm.Script(script, {filename:'inline-script-5.js'}); console.log('compiled OK'); } catch(e){ console.error(e.stack); } break; }}
if(!found) console.error('script not found');
