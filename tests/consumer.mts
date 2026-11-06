import { generateTypeScript, type Schema } from '@lp-labs/schema-codegen';

const schema: Schema = { type: 'array', items: { type: 'string' } };
const generated: string = generateTypeScript('Names', schema);
void generated;
