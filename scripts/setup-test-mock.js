// Creates a mock 'vscode' module in out/node_modules so test files can resolve it
const fs = require('fs');
const path = require('path');

const mockDir = path.join(__dirname, '..', 'out', 'node_modules', 'vscode');
fs.mkdirSync(mockDir, { recursive: true });

fs.copyFileSync(
  path.join(__dirname, '..', 'out', 'test', '__mocks__', 'vscode.js'),
  path.join(mockDir, 'index.js'),
);

fs.writeFileSync(
  path.join(mockDir, 'package.json'),
  JSON.stringify({ name: 'vscode', main: 'index.js', type: 'commonjs' }),
);

console.log('✓ vscode mock installed at out/node_modules/vscode');
