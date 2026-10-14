/** Executes an unchanged inline offline HTML script with mock browser APIs. Not real browser QA. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
function target(){const listeners=new Map();return{addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},removeEventListener(name,fn){listeners.get(name)?.delete(fn);},emit(name,event={}){for(const fn of [...(listeners.get(name)||[])])fn(event);}};}
export function bootOfflineHtml(html,{width=390,height=844,initial=new Map(),safeInsets={},clientOffset={left:0,top:0}}={}){
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];assert.equal(scripts.length,1);
 let now=0,frameId=0;const frames=new Map(),store=new Map(initial),texts=[];
 const ctx=new Proxy({measureText:text=>({width:String(text).length*8}),fillText:(text,x,y)=>texts.push({text:String(text),x,y})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const canvas={...target(),getContext:()=>ctx,getBoundingClientRect:()=>({left:clientOffset.left,top:clientOffset.top,width,height}),setPointerCapture(){}};
 const document={...target(),hidden:false,querySelector:()=>canvas};
 const window={...target(),document,devicePixelRatio:2,getComputedStyle:()=>({getPropertyValue:key=>String(safeInsets[key.replace('--safe-','')]||0)+'px'}),requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),localStorage:{getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,String(v))},Audio:class{constructor(src){assert.ok(src.startsWith('data:audio/wav;base64,'));}play(){return Promise.resolve();}pause(){}}};
 const network=()=>{throw Error('Offline artifact requested network');};
 vm.runInNewContext(scripts[0][1],{window,document,console,fetch:network,XMLHttpRequest:network,WebSocket:network},{timeout:2000});
 function tick(ms=50){now+=ms;const callbacks=[...frames.values()];frames.clear();texts.length=0;callbacks.forEach(fn=>fn(now));}
 function inspect(){return window.breakfastGame.inspect();}
 function point(type,x,y,id=1){canvas.emit('pointer'+type,{clientX:x+clientOffset.left,clientY:y+clientOffset.top,pointerId:id});}
 function click(id,{allowDisabled=false,rx=.5,ry=.5}={}){if(!inspect().buttons.some(b=>b.id===id)){const tab=id.startsWith('ingredient-')||id==='recipes'?'tab-prep':id.startsWith('texture-')||id==='cook'?'tab-cook':id.startsWith('package-')||id==='serve'||id==='hold'||id==='take-held'?'tab-serve':null;if(tab&&inspect().screen==='play')click(tab);else if(['chapters','restart','sidebar-open','tools'].includes(id)&&inspect().screen==='play')click('menu');}const s=inspect(),b=s.buttons.find(x=>x.id===id);assert.ok(b&&(!b.disabled||allowDisabled),`Button missing/disabled: ${id}`);const x=s.viewport.ox+(b.x+b.w*rx)*s.viewport.zoom,y=s.viewport.oy+(b.y+b.h*ry)*s.viewport.zoom;point('down',x,y);point('up',x,y);tick();}
 function cook(){click('cook');for(let i=0;i<44;i++)tick();assert.equal(inspect().state.dish.status,'cooked');}
 function destroy(){window.emit('pagehide',{persisted:false});assert.equal(frames.size,0);}
 tick();return{window,canvas,document,inspect,click,cook,tick,texts,store,destroy};
}
