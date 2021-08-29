import { config } from 'dotenv';
import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

config();

const define = {};

for (const k in process.env) {
  define[`process.env.${k}`] = JSON.stringify(process.env[k]);
}

build({
  entryPoints: ['bin/yippie.ts'],
  outfile: 'bin/yippie.js',
  bundle: true,
  minify: true,
  platform: 'node',
  sourcemap: false,
  target: 'node14',
  plugins: [nodeExternalsPlugin()],
  define,
}).catch(() => process.exit(1));
