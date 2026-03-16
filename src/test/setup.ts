// Setup: intercept require('vscode') and redirect to our mock
import * as path from 'path';
import * as Module from 'module';

const originalResolve = (Module as any)._resolveFilename;

(Module as any)._resolveFilename = function (
  request: string,
  parent: any,
  ...args: any[]
) {
  if (request === 'vscode') {
    return path.join(__dirname, '__mocks__', 'vscode.js');
  }
  return originalResolve.call(this, request, parent, ...args);
};
