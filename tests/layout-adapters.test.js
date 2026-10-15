import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBrowserPlatform} from '../adapters/browser.js';
import {createTTPlatform} from '../adapters/tt.js';

function emitter(){const events=new Map();return{addEventListener:(n,fn)=>events.set(n,fn),removeEventListener:n=>events.delete(n),emit:(n,e)=>events.get(n)?.(e)};}

test('browser adapter reads all CSS safe insets and maps client pointer positions without adding an offset twice',()=>{
 const canvas={...emitter(),getBoundingClientRect:()=>({left:17,top:23,width:320,height:568}),setPointerCapture(){}};
 const host={...emitter(),devicePixelRatio:2,document:{...emitter(),hidden:false},getComputedStyle:()=>({getPropertyValue:key=>({'--safe-top':'44px','--safe-bottom':'34px','--safe-left':'12px','--safe-right':'12px'}[key])})};
 const p=createBrowserPlatform(canvas,host);assert.deepEqual(p.getSize(),{width:320,height:568,dpr:2,safeInsets:{top:44,bottom:34,left:12,right:12}});assert.equal(canvas.width,640);
 let pointer;p.onPointer(value=>pointer=value);canvas.emit('pointerdown',{clientX:117,clientY:223,pointerId:9});assert.deepEqual(pointer,{type:'down',x:100,y:200,id:9});p.destroy();
});

test('Douyin adapter reserves native safe area and capsule, then remeasures changed safe area on resume',()=>{
 let show,info={windowWidth:320,windowHeight:568,pixelRatio:2,statusBarHeight:24,safeArea:{top:24,bottom:534,left:0,right:320}},capsule={bottom:80};
 const p=createTTPlatform({createCanvas:()=>({}),getSystemInfoSync:()=>info,getMenuButtonBoundingClientRect:()=>capsule,onShow:fn=>show=fn},{});
 assert.deepEqual(p.getSize().safeInsets,{top:88,bottom:34,left:0,right:0});let changed=0;p.onResize(()=>changed++);
 info={...info,safeArea:{top:24,bottom:550,left:12,right:308}};capsule={bottom:60};show();assert.equal(changed,1);assert.deepEqual(p.getSize().safeInsets,{top:72,bottom:18,left:12,right:12});p.destroy();
});

test('Douyin adapter safely falls back when native capsule lookup is absent or throws',()=>{
 for(const capsule of [undefined,()=>{throw Error('unsupported');}]){
  const p=createTTPlatform({createCanvas:()=>({}),getSystemInfoSync:()=>({windowWidth:320,windowHeight:568}),getMenuButtonBoundingClientRect:capsule},{});
  assert.deepEqual(p.getSize().safeInsets,{top:48,bottom:12,left:0,right:0});p.destroy();
 }
});

test('browser host has only the full-screen Canvas, with no visible external UI or external asset requests',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');const body=html.split('<body>')[1].split('<script')[0];
 assert.match(body,/^<canvas\b[\s\S]*<\/canvas>$/);assert.doesNotMatch(body,/<(?:button|input|select|div|a|p|h[1-6])\b/i);assert.match(html,/viewport-fit=cover/);assert.match(html,/safe-area-inset-top/);assert.match(html,/100dvh/);
 assert.doesNotMatch(await readFile(new URL('../src/main.js',import.meta.url),'utf8'),/\b(?:document|window)\b/);
});

test('native screen geometry wins over smaller window, DPR backing and logical touch agree after resize',()=>{let resize,touch;const canvas={};const p=createTTPlatform({createCanvas:()=>canvas,getSystemInfoSync:()=>({screenWidth:393,screenHeight:852,windowWidth:320,windowHeight:568,pixelRatio:3,safeArea:{top:59,bottom:818,left:0,right:393}}),onWindowResize:fn=>resize=fn,onTouchStart:fn=>touch=fn},{});assert.equal(p.getSize().width,393);assert.equal(canvas.width,1179);assert.equal(canvas.height,2556);let point;p.onPointer(v=>point=v);touch({changedTouches:[{clientX:196.5,clientY:426,identifier:1}]});assert.equal(point.x,196.5);assert.equal(point.y,426);resize({size:{windowWidth:390,windowHeight:844}});assert.equal(canvas.width,1170);assert.equal(p.getSize().height,844);});
