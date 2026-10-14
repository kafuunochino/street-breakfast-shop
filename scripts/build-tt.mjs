/** Fixed-input Demo assembler, not a general-purpose module bundler or transpiler. */
import { readFile, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
const root = new URL('../', import.meta.url);
export async function buildDouyin(options = {}) {
  const config = JSON.parse(await readFile(new URL('config/douyin.json', root), 'utf8'));
  const appid = options.appid !== undefined ? options.appid : process.env.DOUYIN_APP_ID === undefined ? config.appid : process.env.DOUYIN_APP_ID;
  if (typeof appid !== 'string' || (appid !== '' && !/^tt[a-zA-Z0-9]{8,64}$/.test(appid))) throw new Error('Invalid DOUYIN_APP_ID override');
  const output = new URL('dist/douyin/', root);
  await mkdir(new URL('assets/', output), { recursive: true });
  const inputs = ['game.js', 'src/canvas-art.js', 'src/main.js', 'adapters/tt.js', 'adapters/douyin-sidebar.js', 'adapters/rewarded.js'];
  const chunks = [], declared = new Set();
  for (const path of inputs) {
    let source = await readFile(new URL(path, root), 'utf8');
    const expectedImports = path === 'src/main.js' ? [
      "import { INGREDIENTS, RECIPES, CUSTOMERS, STAGES, initialState, getOrder, requiredIngredients, dishNeedsRestart, reduce, parseProgress, recordStage, stageStars, visibleOrders, patienceLeft, fireCost, freshLeft, allocateRun, buyTool, spendTool, coinRevive, TOOL_COSTS, recoverAbandonedRun } from '../game.js';",
      "import { C, roundRect, circle, ellipse, line, poly, label, wrapped, ingredientArt, foodArt, avatar, streetArt } from './canvas-art.js';"
    ] : [];
    const imports = source.match(/^import[^\n]*$/gm) || [];
    if (JSON.stringify(imports) !== JSON.stringify(expectedImports)) throw new Error(`Unreviewed import graph in ${path}`);
    for (const match of source.matchAll(/^export (?:function|const)\s+(\w+)/gm)) {
      if (declared.has(match[1])) throw new Error(`Duplicate exported symbol: ${match[1]}`);
      declared.add(match[1]);
    }
    source = source.replace(/^import [^\n]*;\r?\n/gm, '').replace(/^export /gm, '');
    if (/\bimport\s*\(|^\s*(?:import|export)\b/m.test(source)) throw new Error(`Unsupported ESM form in ${path}; use a full bundler before extending syntax.`);
    chunks.push(`// SOURCE: ${path}\n${source}`);
  }
  const audio = Object.fromEntries(['tap', 'cook', 'success', 'error', 'complete'].map(name => [name, `assets/${name}.wav`]));
  // Sidebar listener is installed synchronously, before Canvas creation or the game loop.
  const entry = `\nconst sidebar = createDouyinSidebar(tt);\nconst platform = createTTPlatform(tt, { requestAnimationFrame, cancelAnimationFrame }, ${JSON.stringify(audio)});\nplatform.sidebar = sidebar;\nplatform.rewards = createRewardedService();\nstartGame(platform);\n`;
  const bundle = `(function(){\n'use strict';\n${chunks.join('\n')}${entry}})();\n`;
  new Script(bundle, { filename: 'game.js' });
  await writeFile(new URL('game.js', output), bundle);
  await writeFile(new URL('game.json', output), JSON.stringify({ deviceOrientation: 'portrait' }, null, 2) + '\n');
  await writeFile(new URL('project.config.json', output), JSON.stringify({ description: config.description, projectname: config.projectname, appid, setting: { es6: true } }, null, 2) + '\n');
  for (const name of Object.keys(audio)) await copyFile(new URL(audio[name], root), new URL(audio[name], output));
  await rm(new URL('BUILD_INFO.json', output), { force: true }); // Superseded generated metadata, reproducible from source.
  const files = {};
  for (const path of ['game.js', 'game.json', 'project.config.json', ...Object.values(audio)]) files[path] = createHash('sha256').update(await readFile(new URL(path, output))).digest('hex');
  const sourceFiles = {};
  for (const path of [...inputs, 'config/douyin.json', 'scripts/build-tt.mjs']) sourceFiles[path] = createHash('sha256').update(await readFile(new URL(path, root))).digest('hex');
  const info = { appid, projectname: config.projectname, version: config.version, inputs, sourceFiles, entry: 'game.js', browserAssetsIncluded: false, officialToolValidated: false, realPhoneValidated: false, uploaded: false, files };
  await writeFile(new URL('dist/douyin-build-manifest.json', root), JSON.stringify(info, null, 2) + '\n');
  return { output: fileURLToPath(output), info };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildDouyin(), null, 2));
