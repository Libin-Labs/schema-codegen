import assert from 'node:assert/strict';
import test from 'node:test';
import { generateTypeScript } from '../dist/esm/index.js';

test('emits escaped optional and required declarations with supported nested schema shapes', () => {
  const source = generateTypeScript('Account', {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      'unsafe-key";\nexport type Injected = never;\n//': { type: 'string' },
      tags: { type: 'array', items: { type: 'enum', values: ['a', 'b', 'a'] } },
      nullable: { type: 'enum', values: [null, true] },
    },
    required: ['id'],
  });
  assert.match(source, /^export type Account = \{/);
  assert.match(source, /id: number;/);
  assert.ok(
    source.includes(
      `  ${JSON.stringify('unsafe-key";\nexport type Injected = never;\n//')}?: string;`,
    ),
  );
  assert.match(source, /ReadonlyArray<"a" \| "b">/);
  assert.match(source, /null \| true/);
  assert.equal(source.endsWith('\n'), true);
});

test('generated declaration preserves usable property and union shapes', () => {
  const generated = generateTypeScript('GeneratedUser', {
    type: 'object',
    properties: {
      name: { type: 'string' },
      'display-name': { type: 'string' },
      roles: { type: 'array', items: { type: 'enum', values: ['admin', 'reader'] } },
    },
    required: ['name'],
  });
  assert.match(generated, /name: string;/);
  assert.match(generated, /"display-name"\?: string;/);
  assert.match(generated, /ReadonlyArray<"admin" \| "reader">/);
});

test('rejects unsafe names, unsupported/malformed nodes, and invalid limits', () => {
  assert.throws(() => generateTypeScript('Bad-Name', { type: 'string' }), TypeError);
  assert.throws(() => generateTypeScript('Thing', { type: 'enum', values: [] }), TypeError);
  assert.throws(
    () => generateTypeScript('Thing', { type: 'enum', values: [undefined] }),
    TypeError,
  );
  assert.throws(
    () => generateTypeScript('Thing', { type: 'object', properties: {}, required: ['missing'] }),
    TypeError,
  );
  assert.throws(() => generateTypeScript('Thing', { type: 'string' }, { maxDepth: 0 }), RangeError);
});
