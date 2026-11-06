export type Schema =
  | Readonly<{ type: 'string' | 'number' | 'boolean' | 'null' }>
  | Readonly<{ type: 'integer' }>
  | Readonly<{ type: 'enum'; values: readonly (string | number | boolean | null)[] }>
  | Readonly<{ type: 'array'; items: Schema }>
  | Readonly<{
      type: 'object';
      properties: Readonly<Record<string, Schema>>;
      required?: readonly string[];
    }>;

export type CodegenOptions = Readonly<{
  maxDepth?: number;
  maxNodes?: number;
}>;

const integer = (value: number | undefined, fallback: number, label: string): number => {
  const resolved = value ?? fallback;
  if (!Number.isSafeInteger(resolved) || resolved < 1) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
  return resolved;
};

const isIdentifier = (value: string): boolean =>
  /^[$A-Z_a-z][$\w]*$/u.test(value) &&
  !new Set([
    'abstract',
    'any',
    'as',
    'asserts',
    'async',
    'await',
    'boolean',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'constructor',
    'continue',
    'debugger',
    'declare',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'from',
    'function',
    'get',
    'if',
    'implements',
    'import',
    'in',
    'infer',
    'instanceof',
    'interface',
    'keyof',
    'let',
    'module',
    'namespace',
    'never',
    'new',
    'null',
    'number',
    'object',
    'of',
    'package',
    'private',
    'protected',
    'public',
    'readonly',
    'require',
    'return',
    'set',
    'static',
    'string',
    'super',
    'switch',
    'symbol',
    'this',
    'throw',
    'true',
    'try',
    'type',
    'typeof',
    'undefined',
    'unique',
    'unknown',
    'var',
    'void',
    'while',
    'with',
    'yield',
  ]).has(value);

function literal(value: string | number | boolean | null): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError('Enum numbers must be finite');
  }
  if (value !== null && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new TypeError('Enum values must be strings, finite numbers, booleans, or null');
  }
  return String(value);
}

export function generateTypeScript(
  name: string,
  schema: Schema,
  options: CodegenOptions = {},
): string {
  if (!isIdentifier(name)) throw new TypeError('name must be a non-reserved TypeScript identifier');
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const maxDepth = integer(options.maxDepth, 16, 'maxDepth');
  const maxNodes = integer(options.maxNodes, 1000, 'maxNodes');
  if (maxDepth > 64 || maxNodes > 100_000) {
    throw new RangeError('maxDepth cannot exceed 64 and maxNodes cannot exceed 100000');
  }
  let nodes = 0;

  const render = (node: Schema, depth: number): string => {
    if (depth > maxDepth) throw new RangeError('Schema depth limit exceeded');
    if (++nodes > maxNodes) throw new RangeError('Schema node limit exceeded');
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      throw new TypeError('Schema nodes must be objects');
    }
    switch (node.type) {
      case 'string':
      case 'number':
      case 'boolean':
        return node.type;
      case 'integer':
        return 'number';
      case 'null':
        return 'null';
      case 'enum': {
        if (!Array.isArray(node.values) || node.values.length === 0 || node.values.length > 1000) {
          throw new TypeError('Enums must contain between 1 and 1000 values');
        }
        return [...new Set(node.values.map(literal))].join(' | ');
      }
      case 'array':
        return `ReadonlyArray<${render(node.items, depth + 1)}>`;
      case 'object': {
        if (
          !node.properties ||
          typeof node.properties !== 'object' ||
          Array.isArray(node.properties)
        ) {
          throw new TypeError('Object schemas require a properties record');
        }
        const keys = Object.keys(node.properties);
        if (keys.length > 1000) throw new RangeError('Object property limit exceeded');
        if (node.required !== undefined && !Array.isArray(node.required)) {
          throw new TypeError('required must be an array');
        }
        if (node.required?.some((key) => typeof key !== 'string')) {
          throw new TypeError('required entries must be property-name strings');
        }
        const required = new Set(node.required ?? []);
        for (const key of required) {
          if (!Object.hasOwn(node.properties, key)) {
            throw new TypeError(`Required property is not declared: ${key}`);
          }
        }
        const members = keys.map((key) => {
          const renderedKey = /^[$A-Z_a-z][$\w]*$/u.test(key) ? key : JSON.stringify(key);
          return `  ${renderedKey}${required.has(key) ? '' : '?'}: ${render(node.properties[key]!, depth + 1)};`;
        });
        return members.length === 0 ? '{}' : `{\n${members.join('\n')}\n}`;
      }
      default:
        throw new TypeError('Unsupported schema node type');
    }
  };

  return `export type ${name} = ${render(schema, 0)};\n`;
}
