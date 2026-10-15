import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {buildDouyin} from '../scripts/build-tt.mjs';
import {STAGES,CUSTOMERS,INGREDIENTS,requiredIngredients} from '../game.js';

/** Executes the exact native game.js, no injected inspector or altered entry; host is simulated. */
function nativeHost(bundle, {width=320,height=568,dpr=1,top=92,bottom=34}={}){
 const labels=[],stack=[],touch={},lifecycle={},frames=new Map(),store=new Map();let matrix=[1,0,0,1,0,0],id=0,now=0;
 const target={measureText:t=>({width:String(t).length*8}),setTransform:(...m)=>{matrix=m;},translate:(x,y)=>{matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y;},scale:(x,y)=>{matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y;},save:()=>stack.push([...matrix]),restore:()=>{matrix=stack.pop();},fillRect:()=>{labels.length=0;},fillText:(text,x,y)=>labels.push({text:String(text),x:matrix[0]*x+matrix[2]*y+matrix[4],y:matrix[1]*x+matrix[3]*y+matrix[5]})};
 const ctx=new Proxy(target,{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const tt={createCanvas:()=>({getContext:()=>ctx}),getSystemInfoSync:()=>({screenWidth:width,screenHeight:height,windowWidth:300,windowHeight:500,pixelRatio:dpr,statusBarHeight:44,safeArea:{top,bottom:height-bottom,left:0,right:width}}),onShow:f=>lifecycle.show=f,onHide:f=>lifecycle.hide=f,onTouchStart:f=>touch.down=f,onTouchEnd:f=>touch.up=f,onTouchMove:f=>touch.move=f,onTouchCancel:f=>touch.cancel=f,getStorageSync:k=>store.get(k),setStorageSync:(k,v)=>store.set(k,v)};
 vm.runInNewContext(bundle,{tt,requestAnimationFrame:f=>(frames.set(++id,f),id),cancelAnimationFrame:i=>frames.delete(i)},{timeout:2000});
 function click(name){const l=[...labels].reverse().find(l=>name instanceof RegExp?name.test(l.text):l.text===name);assert.ok(l,`native Canvas label ${name}; got ${labels.map(x=>x.text).join(' | ')}`);const e={changedTouches:[{clientX:l.x/dpr,clientY:l.y/dpr,identifier:1}]};touch.down(e);touch.up(e);tick(200);}
 function tick(ms){for(let n=0;n<ms/50;n++){now+=50;const fs=[...frames.values()];frames.clear();fs.forEach(f=>f(now));}}
 return {click,tick,labels,hide:()=>lifecycle.hide(),show:()=>lifecycle.show(),progress:()=>JSON.parse(store.get('street-breakfast-shop:progress:v1'))};
}

for(const viewport of [{width:320,height:568,dpr:1,top:92,bottom:34},{width:393,height:852,dpr:3,top:107,bottom:34}])test(`exact native candidate 50 real-time shifts with logical touches DPR ${viewport.dpr}`,async()=>{
 const {output}=await buildDouyin();const bundle=await readFile(output+'game.js','utf8'),h=nativeHost(bundle,viewport);h.click('开门营业');h.click(/^系好围裙/);
 let meals=0;
 for(let stage=0;stage<50;stage++){
  let held=false,served=0;
  for(const i of STAGES[stage].referencePlan){const o=STAGES[stage].orders[i];if(stage>=5)h.click(CUSTOMERS[o.customer].name);
   const prepare=()=>{h.click('备料台');for(const id of requiredIngredients(o))h.click(INGREDIENTS[id]);h.click('铁锅台');h.click(o.texture==='crisp'?'焦脆火候':'普通火候');};prepare();
   if(stage===0&&i===0){h.click('备料台');h.click('芝士');h.click('铁锅台');h.click(/^开火煎制/);h.tick(2200);h.click('出餐台');h.click('递给客人');assert.ok(h.labels.some(l=>l.text.includes('倒掉重做')));h.click('倒掉重做');prepare();}
   h.click(/^开火煎制/);h.tick(2200);h.click('出餐台');h.click(o.packaging==='bag'?'打包带走':'堂食装盘');
   if(o.pair!=null&&!held){h.click('放入保温位');held=true;}else{h.click('递给客人');const n=o.pair!=null?2:1;served+=n;meals+=n;held=false;h.click(served===STAGES[stage].orders.length?'收摊结算':'请下一位');}
  }
  assert.equal(h.progress().stars[stage],stage===0?2:3);h.click(stage===49?'收好50班的街坊回忆':'明天继续开张');if(stage<49)h.click(/^系好围裙/);
 }
 assert.equal(meals,STAGES.reduce((count,stage)=>count+stage.orders.length,0));assert.equal(h.progress().coins,800);assert.equal(h.progress().stars.reduce((a,b)=>a+b,0),149);assert.ok(h.labels.some(l=>l.text==='早安，老朋友。'));
});

 test('exact native bundle shows countdown, pauses behind menu and onHide, expires and restarts freely',async()=>{const {output}=await buildDouyin(),h=nativeHost(await readFile(output+'game.js','utf8'),{width:393,height:852,dpr:3,top:92,bottom:34});h.click('开门营业');h.click(/^系好围裙/);h.tick(5000);const seconds=()=>h.labels.find(x=>/^余 \d+ 秒$/.test(x.text))?.text;const before=seconds();assert.ok(before);h.hide();h.tick(120000);h.show();h.tick(50);assert.equal(seconds(),before);h.tick(70000);assert.ok(h.labels.some(x=>x.text.includes('等候超时')));h.click('免费重开这一班');h.click(/^系好围裙/);assert.ok(h.labels.some(x=>/余 70 秒/.test(x.text)));});
