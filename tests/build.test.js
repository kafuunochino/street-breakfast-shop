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
  assert.equal(JSON.parse(await readFile(output + 'project.config.json', 'utf8')).appid, 'ttebf69d4b758f209102');
  let canvasCount=0,frames=0;const handlers={},store=new Map();
  const ctx=new Proxy({measureText:t=>({width:t.length*9})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const tt={createCanvas:()=>{canvasCount++;return {getContext:()=>ctx};},getSystemInfoSync:()=>({windowWidth:390,windowHeight:844,pixelRatio:2}),getStorageSync:key=>store.get(key),setStorageSync:(key,value)=>store.set(key,value),onTouchStart:fn=>handlers.down=fn,onTouchMove:fn=>handlers.move=fn,onTouchEnd:fn=>handlers.up=fn,onTouchCancel:fn=>handlers.cancel=fn,onHide:fn=>handlers.hide=fn,onShow:fn=>handlers.show=fn};
  const sandbox={tt,requestAnimationFrame:()=>++frames,cancelAnimationFrame:()=>{}};
  assert.equal(sandbox.window,undefined);assert.equal(sandbox.document,undefined);assert.equal(sandbox.structuredClone,undefined);
  vm.runInNewContext(bundle,sandbox,{timeout:2000});
  assert.equal(canvasCount,1);assert.equal(frames,1);assert.equal(typeof handlers.down,'function');assert.equal(typeof handlers.show,'function');
  handlers.hide();handlers.show();assert.ok(frames>=2);
});

test('AppID override accepts empty mock mode, rejects invalid values, and restores canonical candidate', async () => {
  try {
    let result=await buildDouyin({appid:''});assert.equal(result.info.appid,'');
    assert.equal(JSON.parse(await readFile(result.output+'project.config.json','utf8')).appid,'');
    await assert.rejects(()=>buildDouyin({appid:'not-an-app-id'}),/Invalid/);
    const previous=process.env.DOUYIN_APP_ID;
    try {process.env.DOUYIN_APP_ID='';result=await buildDouyin();assert.equal(result.info.appid,'');}
    finally {if(previous===undefined)delete process.env.DOUYIN_APP_ID;else process.env.DOUYIN_APP_ID=previous;}
  } finally {const final=await buildDouyin({appid:'ttebf69d4b758f209102'});assert.equal(final.info.appid,'ttebf69d4b758f209102');}
});

test('exact assembled candidate Canvas CTA reaches real guarded tt.navigateToScene API path',async()=>{
  const {output}=await buildDouyin({appid:'ttebf69d4b758f209102'});const bundle=await readFile(output+'game.js','utf8');
  const labels=[],stack=[],shows=[],touch={},creationOrder=[],store=new Map();let matrix=[1,0,0,1,0,0],navRequest,navigationCalls=0,frame=0;
  const target={
    measureText:text=>({width:text.length*9}),
    setTransform:(a,b,c,d,e,f)=>matrix=[a,b,c,d,e,f],
    translate:(x,y)=>{matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y;},
    scale:(x,y)=>{matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y;},
    save:()=>stack.push([...matrix]),restore:()=>{matrix=stack.pop();},
    fillRect:()=>{labels.length=0;},
    fillText:(text,x,y)=>labels.push({text,x:matrix[0]*x+matrix[2]*y+matrix[4],y:matrix[1]*x+matrix[3]*y+matrix[5]})
  };
  const context=new Proxy(target,{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const api={
    onShow:fn=>{creationOrder.push('onShow');shows.push(fn);},offShow:()=>{},
    checkScene:options=>{creationOrder.push('checkScene');options.success({isExist:true});},
    navigateToScene:options=>{navigationCalls++;navRequest=options;},
    createCanvas:()=>{creationOrder.push('canvas');return {getContext:()=>context};},
    getSystemInfoSync:()=>({windowWidth:390,windowHeight:844,pixelRatio:1}),
    onTouchStart:fn=>touch.down=fn,onTouchEnd:fn=>touch.up=fn,onTouchMove:()=>{},onTouchCancel:()=>{},onHide:()=>{},
    getStorageSync:key=>store.get(key),setStorageSync:(key,value)=>store.set(key,value)
  };
  vm.runInNewContext(bundle,{tt:api,requestAnimationFrame:()=>++frame,cancelAnimationFrame:()=>{}},{timeout:2000});
  assert.ok(creationOrder.indexOf('onShow')<creationOrder.indexOf('canvas'));
  function click(text){const point=[...labels].reverse().find(label=>label.text===text);assert.ok(point,`visible Canvas CTA: ${text}`);const event={changedTouches:[{clientX:point.x,clientY:point.y,identifier:1}]};touch.down(event);touch.up(event);}
  click('从侧边栏再来 ›');assert.equal(navigationCalls,0);click('前往抖音侧边栏');assert.equal(navigationCalls,1);assert.equal(navRequest.scene,'sidebar');
  assert.ok(labels.some(label=>label.text==='正在打开…'));
  navRequest.success({});await Promise.resolve();assert.ok(!labels.some(label=>String(label.text).includes('本次确实')));
  shows.forEach(fn=>fn({launch_from:'homepage',location:'sidebar_card'}));assert.ok(labels.some(label=>String(label.text).includes('本次确实从侧边栏')));
  shows.forEach(fn=>fn({launch_from:'homepage',location:'ordinary'}));assert.ok(!labels.some(label=>String(label.text).includes('本次确实从侧边栏')));
  assert.equal(store.size,0,'sidebar does not issue progress or rewards');
  click('回到早餐铺');assert.ok(labels.some(label=>label.text==='开门营业'));
});
