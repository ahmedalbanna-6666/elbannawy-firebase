import { readFileSync, writeFileSync } from 'fs';
import potrace from 'potrace';

const input = readFileSync('docs/444.png');
const svg = potrace.trace(input, { background: '#ffffff', color: '#000000' });
writeFileSync('apps/web/public/logo-traced.svg', svg);
console.log('Done - output saved to apps/web/public/logo-traced.svg');
