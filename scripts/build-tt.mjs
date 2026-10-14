/** Fixed-input Demo assembler, not a general-purpose module bundler. */
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
const root = new URL('../', import.meta.url);
export async function buildDouyin() {
  const output = new URL('dist/douyin/', root);
  await mkdir(new URL('assets/', output), { recursive: true });
  const inputs = ['game.js', 'src/canvas-art.js', 'src/main.js', 'adapters/tt.js'];
  const chunks = [];
  for (const path of inputs) {
    let source = await readFile(new URL(path, root), 'utf8');
    source = source.replace(/^import [^\n]*;\r?\n/gm, '').replace(/^export /gm, '');
    if (/^(?:import|export)\b/m.test(source)) throw new Error(`Unsupported ESM form in ${path}; use a full bundler before extending syntax.`);
    chunks.push(`// SOURCE: ${path}\n${source}`);
  }
  const audio = Object.fromEntries(['tap', 'cook', 'success', 'error', 'complete'].map(name => [name, `assets/${name}.wav`]));
  const entry = `\nconst platform = createTTPlatform(tt, { requestAnimationFrame, cancelAnimationFrame }, ${JSON.stringify(audio)});\nstartGame(platform);\n`;
  const bundle = `(function(){\n'use strict';\n${chunks.join('\n')}${entry}})();\n`;
  new Script(bundle, { filename: 'game.js' });
  await writeFile(new URL('game.js', output), bundle);
  await writeFile(new URL('game.json', output), JSON.stringify({ deviceOrientation: 'portrait' }, null, 2) + '\n');
  await writeFile(new URL('project.config.json', output), JSON.stringify({ description: '街角早餐铺 Canvas Demo candidate. Not uploaded or official-tool validated.', projectname: 'street-breakfast-shop', appid: '', setting: { es6: true } }, null, 2) + '\n');
  for (const name of Object.keys(audio)) await copyFile(new URL(audio[name], root), new URL(audio[name], output));
  const info = { inputs, entry: 'game.js', applicationId: null, browserAssetsIncluded: false, officialToolValidated: false, uploaded: false };
  await writeFile(new URL('BUILD_INFO.json', output), JSON.stringify(info, null, 2) + '\n');
  return { output: fileURLToPath(output), info };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildDouyin(), null, 2));
