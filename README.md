# @lp-labs/schema-codegen

Generate TypeScript type declarations from a small, explicit schema description. This package does
not parse JSON Schema, OpenAPI, or arbitrary schema languages. It has no runtime or peer dependencies.

## Install

```bash
npm install @lp-labs/schema-codegen
```

The package provides ESM, CommonJS, and TypeScript declarations.

## Quickstart

```js
import { generateTypeScript } from '@lp-labs/schema-codegen';

const source = generateTypeScript('User', {
  type: 'object',
  properties: {
    name: { type: 'string' },
    'display-name': { type: 'string' },
    roles: { type: 'array', items: { type: 'enum', values: ['reader', 'writer'] } },
  },
  required: ['name'],
});
if (!source.includes('"display-name"?: string'))
  throw new Error('Expected escaped property declaration');
console.log(source);
```

## Public API and types

- `generateTypeScript(name, schema, options?)` returns one `export type` declaration and a trailing
  newline. `name` must be a non-reserved TypeScript identifier. Object keys are emitted as safe
  identifiers or JSON-escaped quoted property names.
- `Schema` accepts `string`, `number`, `integer` (represented as `number`), `boolean`, and `null`
  primitive nodes; `enum` nodes with nonempty string/finite-number/boolean/null values; `array`
  nodes with an `items` schema; and `object` nodes with a `properties` record and optional
  `required` property-name list. Object properties are optional unless listed in `required`. Arrays
  become `ReadonlyArray<T>`. Empty objects become `{}`.
- `CodegenOptions` has `maxDepth` (default 16) and `maxNodes` (default 1000), both positive safe
  integers, with hard ceilings of 64 depth and 100000 nodes. A schema has at most 1000 properties
  per object and enum values per enum.

All runtime exports are `generateTypeScript`. `Schema` and `CodegenOptions` are type-only exports.

## Customization, limits, and errors

Adapt your schema to `Schema` before calling this generator, or write your own post-processing
around the returned source. Unsupported keywords, references, unions beyond literal enums,
constraints, recursive references, validation, and runtime code generation are intentionally out of
scope. `integer` cannot represent JavaScript integer-range validation; it is only a TypeScript
`number` type. `readonly` applies to array structure, not object fields.

Invalid names, malformed or unsupported nodes, unknown required properties, and invalid enum data
throw `TypeError`. Invalid limits, excessive depth/nodes, or oversized per-node collections throw
`RangeError`. The input is trusted as ordinary data and should be validated before generation.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
