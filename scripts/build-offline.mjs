/** Breakfast-only self-contained review artifact. Does not modify or build other games. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
export async function buildOffline(){
  const inputs=['game.js','src/canvas-art.js','src/main.js','adapters/browser.js'],chunks=[],sources={};
  for(const path of inputs){
    const source=await readFile(new URL(path,root),'utf8');sources[path]=createHash('sha256').update(source).digest('hex');
    const code=source.replace(/^import [^\n]*;\r?\n/gm,'').replace(/^export /gm,'');
    if(/\bimport\s*\(|^\s*(?:import|export)\b/m.test(code))throw Error(`Unsupported module syntax: ${path}`);
    chunks.push(`// Source: ${path}\n${code}`);
  }
  const embedded={};
  for(const name of ['tap','cook','success','error','complete']){const bytes=await readFile(new URL(`assets/${name}.wav`,root));embedded[name]='data:audio/wav;base64,'+bytes.toString('base64');}
  const entry=`const platform=createBrowserPlatform(document.querySelector('canvas'),window,${JSON.stringify(embedded)});\nconst game=startGame(platform);\nwindow.breakfastGame={inspect:()=>game.inspect()};\nwindow.addEventListener('pagehide',event=>{if(!event.persisted){game.destroy();platform.destroy();}});`;
  const code=`(function(){\n'use strict';\n${chunks.join('\n')}\n${entry}\n})();\n`;
  new vm.Script(code,{filename:'breakfast-demo.html'});
  if(/<\/script/i.test(code))throw Error('Unexpected script closing sequence');
  const original=await readFile(new URL('index.html',root),'utf8');
  if([...original.matchAll(/<script type="module">/g)].length!==1)throw Error('Expected exactly one browser bootstrap');
  const html=original.replace(/<script type="module">[\s\S]*?<\/script>/,`<script>${code}</script>`);
  await mkdir(new URL('dist/',root),{recursive:true});const output=new URL('dist/breakfast-demo.html',root);await writeFile(output,html);
  const info={version:JSON.parse(await readFile(new URL('config/douyin.json',root),'utf8')).version,file:'breakfast-demo.html',sha256:createHash('sha256').update(html).digest('hex'),bytes:Buffer.byteLength(html),sources,actualBrowserQa:false,realDeviceQa:false};
  await writeFile(new URL('dist/offline-build-manifest.json',root),JSON.stringify(info,null,2)+'\n');return {output:fileURLToPath(output),html,info};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {output,info}=await buildOffline();console.log(JSON.stringify({output,info},null,2));}
