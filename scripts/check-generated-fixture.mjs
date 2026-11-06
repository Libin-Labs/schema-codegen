import assert from 'node:assert/strict';
import path from 'node:path';
import ts from 'typescript';
import { generateTypeScript } from '../dist/esm/index.js';

const generated = generateTypeScript('GeneratedUser', {
  type: 'object',
  properties: {
    name: { type: 'string' },
    'display-name': { type: 'string' },
    roles: { type: 'array', items: { type: 'enum', values: ['admin', 'reader'] } },
  },
  required: ['name'],
});
const files = new Map([
  [path.resolve('generated.ts'), generated],
  [
    path.resolve('consumer.ts'),
    "import type { GeneratedUser } from './generated.js';\nconst user: GeneratedUser = { name: 'Ada', 'display-name': 'A', roles: ['admin'] };\nvoid user;\n",
  ],
]);
const options = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  types: [],
};
const host = ts.createCompilerHost(options);
const getSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
  files.has(path.resolve(fileName))
    ? ts.createSourceFile(fileName, files.get(path.resolve(fileName)), languageVersion)
    : getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
const fileExists = host.fileExists.bind(host);
host.fileExists = (fileName) => files.has(path.resolve(fileName)) || fileExists(fileName);
const program = ts.createProgram([...files.keys()], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.deepEqual(
  diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
  [],
);
console.log('Generated declaration fixture compiled without TypeScript diagnostics.');
