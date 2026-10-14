import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import { buildDouyin } from '../scripts/build-tt.mjs';

test('Douyin candidate compiles, excludes H5 archive, and boots with mocked tt without browser globals', async () => {
  const { output, info } = await buildDouyin();
  const bundle = await readFile(output + 'game.js', 'utf8');
  const files = await readdir(output);
  assert.equal(info.browserAssetsIncluded, false);
  assert.ok(!files.some(x => /\.html$|\.css$|archive|browser/.test(x)));
  assert.ok(!/^import |^export /m.test(bundle));
  assert.equal(JSON.parse(await readFile(output + 'project.config.json', 'utf8')).appid, '');
  let canvasCount=0,frames=0;const handlers={},store=new Map();
  const ctx=new Proxy({measureText:t=>({width:t.length*9})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const tt={createCanvas:()=>{canvasCount++;return {getContext:()=>ctx};},getSystemInfoSync:()=>({windowWidth:390,windowHeight:844,pixelRatio:2}),getStorageSync:key=>store.get(key),setStorageSync:(key,value)=>store.set(key,value),onTouchStart:fn=>handlers.down=fn,onTouchMove:fn=>handlers.move=fn,onTouchEnd:fn=>handlers.up=fn,onTouchCancel:fn=>handlers.cancel=fn,onHide:fn=>handlers.hide=fn,onShow:fn=>handlers.show=fn};
  const sandbox={tt,requestAnimationFrame:()=>++frames,cancelAnimationFrame:()=>{}};
  assert.equal(sandbox.window,undefined);assert.equal(sandbox.document,undefined);assert.equal(sandbox.structuredClone,undefined);
  vm.runInNewContext(bundle,sandbox,{timeout:2000});
  assert.equal(canvasCount,1);assert.equal(frames,1);assert.equal(typeof handlers.down,'function');assert.equal(typeof handlers.show,'function');
  handlers.hide();handlers.show();assert.ok(frames>=2);
});
