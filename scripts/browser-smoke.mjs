import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { STAGES, RECIPES, requiredIngredients } from '../game.js';
const port = Number(process.env.CDP_PORT || 9333), base = process.env.GAME_URL || 'http://127.0.0.1:4173';
const temp = `/tmp/breakfast-browser-${process.pid}`;
const chrome = spawn(process.env.CHROMIUM || '/usr/bin/chromium', ['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',`--remote-debugging-port=${port}`,`--user-data-dir=${temp}`,base], {stdio:'ignore'});
let ws, id=0;const pending=new Map(), errors=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function command(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});}
async function value(expression){const res=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(res.exceptionDetails)throw Error(JSON.stringify(res.exceptionDetails));return res.result.value;}
async function waitFor(expr,ms=5000){const start=Date.now();while(Date.now()-start<ms){if(await value(expr))return;await sleep(40);}throw Error('Timed out: '+expr);}
async function inspect(){return value('window.breakfastGame.inspect()');}
async function click(buttonId){let snap=await inspect();if(!snap.buttons.some(x=>x.id===buttonId)){const tab=buttonId.startsWith('ingredient-')||buttonId==='recipes'?'tab-prep':buttonId.startsWith('texture-')||buttonId==='cook'?'tab-cook':buttonId.startsWith('package-')||buttonId==='serve'?'tab-serve':null;if(tab&&snap.screen==='play')await click(tab);else if(['chapters','restart','sidebar-open'].includes(buttonId)&&snap.screen==='play')await click('menu');snap=await inspect();}const b=snap.buttons.find(x=>x.id===buttonId);assert.ok(b&&!b.disabled,`button active: ${buttonId}`);const {zoom,ox,oy}=snap.viewport;const x=ox+(Number(b.x)+b.w/2)*zoom,y=oy+(b.y+b.h/2)*zoom;await command('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await command('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});}
async function screenshot(name){const shot=await command('Page.captureScreenshot',{format:'png'});await writeFile(new URL(`../artifacts/${name}.png`,import.meta.url),Buffer.from(shot.data,'base64'));}
try{
 let pages;for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();if(pages.some(p=>p.type==='page'))break;}catch{}await sleep(100);}
 const page=pages?.find(p=>p.type==='page');assert.ok(page,'Chromium page starts');ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry);};
 await command('Runtime.enable');await command('Page.enable');await command('Log.enable');await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await command('Page.navigate',{url:base});await waitFor('!!window.breakfastGame');
 await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});await screenshot('canvas-welcome-mobile');
 await click('start');await click('open-day');assert.equal((await inspect()).screen,'play');
 await click('help');await click('close-help');await click('recipes');await click('close-recipes');await click('chapters');await click('close-chapters');await click('close-menu');
 await click('sound');assert.equal((await inspect()).progress.sound,false);
 // Wrong empty serving explains the problem without consuming the order.
 await click('serve');let snap=await inspect();assert.equal(snap.state.orderIndex,0);assert.equal(snap.state.mistakes,1);assert.equal(snap.state.phase,'playing');
 // Clear an active cook and prove it does not finish an empty pan later.
 await click('ingredient-egg');await click('cook');await click('clear');await sleep(2100);assert.equal((await inspect()).state.dish.status,'raw');
 await screenshot('canvas-play-mobile');
 for(let s=0;s<STAGES.length;s++){
  for(let o=0;o<STAGES[s].orders.length;o++){
   const order=STAGES[s].orders[o];
   for(const ingredient of requiredIngredients(order))await click(`ingredient-${ingredient}`);
   await click(`texture-${order.texture}`);await click(`package-${order.packaging}`);await click('cook');
   await waitFor('window.breakfastGame.inspect().state.dish.status === "cooked"',5000);
   await click('serve');snap=await inspect();assert.equal(snap.state.phase,'served');assert.equal(snap.state.servedIds.length,o+1);
   await click('serve');
  }
  snap=await inspect();assert.equal(snap.screen,'result');assert.equal(snap.state.phase,'stageComplete');assert.equal(snap.progress.unlocked,Math.min(4,s+1));
  if(s<4){await click('next-stage');await click('open-day');}else{await screenshot('canvas-final-result');await click('next-stage');}
 }
 snap=await inspect();assert.equal(snap.screen,'ending');assert.equal(snap.progress.stars.reduce((a,b)=>a+b,0),14);await screenshot('canvas-ending-mobile');
 await click('replay-all');await click('chapter-0');await click('open-day');
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await sleep(100);await screenshot('canvas-desktop');
 await command('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});await sleep(100);await screenshot('canvas-small-mobile');
 snap=await inspect();assert.ok(snap.viewport.ox>=0&&snap.viewport.oy>=0,'layout fits narrow viewport');
 await command('Page.reload');await waitFor('!!window.breakfastGame');snap=await inspect();assert.equal(snap.progress.unlocked,4);assert.equal(snap.progress.sound,false);assert.equal(snap.progress.stars.reduce((a,b)=>a+b,0),14);
 assert.equal(errors.length,0,JSON.stringify(errors));
 const result={passed:true,engine:'Chromium headless',viewports:['390x844','1440x900','320x568'],ordersServed:19,stagesCompleted:5,flows:['welcome','instructions','recipe panel','stage selection/cancel','sound preference','wrong serving recovery','clear during cook','all recipes and variants','stage progression','ending','stage replay','responsive resize','saved progress after reload'],consoleErrors:errors.length,scope:'Browser demo only, no official Douyin developer-tool or real-device validation'};
 await writeFile(new URL('../artifacts/browser-smoke.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();chrome.kill('SIGTERM');await sleep(200);await rm(temp,{recursive:true,force:true}).catch(()=>{});}
