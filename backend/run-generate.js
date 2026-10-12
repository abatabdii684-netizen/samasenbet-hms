// Run this with: node run-generate.js
// from inside C:\Users\hp\Desktop\samasenbet HMS\backend

const path   = require('path');
const { execFileSync } = require('child_process');

const prismaPath = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');

try {
  const result = execFileSync(
    process.execPath,          // node.exe
    [prismaPath, 'generate'],  // args
    {
      cwd: __dirname,
      encoding: 'utf8',
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  console.log('SUCCESS:\n', result);
} catch (err) {
  console.error('STDOUT:\n', err.stdout || '');
  console.error('STDERR:\n', err.stderr || '');
  process.exit(1);
}
