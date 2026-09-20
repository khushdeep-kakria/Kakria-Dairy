const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== '.next' && f !== 'node_modules') walk(full);
    } else if (/\.(tsx|jsx|css)$/.test(f)) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('dark:')) {
        content = content.replace(/\sdark:[a-zA-Z0-9_\-\/\[\]#:]+/g, '');
        fs.writeFileSync(full, content, 'utf8');
        console.log('Removed dark: classes from', full);
      }
    }
  }
}

walk('./app');
walk('./components');
console.log('Finished removing dark classes');
