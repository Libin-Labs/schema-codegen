import { generateTypeScript, type CodegenOptions } from '@lp-labs/schema-codegen';

const options: CodegenOptions = { maxNodes: 10 };
const generated: string = generateTypeScript('Names', { type: 'string' }, options);
void generated;
