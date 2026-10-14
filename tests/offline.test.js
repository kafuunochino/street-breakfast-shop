import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOffline } from '../scripts/build-offline.mjs';
import { bootOfflineHtml } from './helpers/offline-harness.js';
import { STAGES, INGREDIENTS, requiredIngredients } from '../game.js';

function open(h){h.click('start');h.click('open-day');}

test('fixed offline HTML reproduces user extra-cooked path and recovers through visible reachable reset at five sizes',async()=>{
 const {html}=await buildOffline();assert.ok(!/<script[^>]+src=|type="module"|https?:\/\//.test(html));
 for(const [width,height] of [[320,568],[360,740],[390,844],[1100,760],[1440,900]]){
  const h=bootOfflineHtml(html,{width,height});open(h);for(const id of ['batter','egg','crisp','cheese'])h.click('ingredient-'+id);h.cook();
  h.click('ingredient-cheese',{allowDisabled:true});assert.ok(h.inspect().state.dish.ingredients.includes('cheese'),'cooked food is not silently returned to raw supplies');
  assert.ok(h.texts.some(x=>x.text==='倒掉重做'));assert.ok(!h.texts.some(x=>x.text==='再点一次可以撤回'));
  h.click('serve');assert.equal(h.inspect().state.phase,'playing');assert.match(h.inspect().state.feedback,/倒掉重做/);
  const b=h.inspect().buttons.find(x=>x.id==='clear'),v=h.inspect().viewport;assert.ok(b.w*v.zoom>=44&&b.h*v.zoom>=44);assert.equal(b.disabled,false);
  const score=h.inspect().state.score;h.click('clear',{rx:.08,ry:.08});assert.equal(h.inspect().state.score,score);assert.equal(h.inspect().state.orderIndex,0);assert.equal(h.inspect().state.dish.ingredients.length,0);
  for(const id of ['batter','egg','crisp'])h.click('ingredient-'+id);h.cook();h.click('serve');assert.equal(h.inspect().state.phase,'served');const earned=h.inspect().state.score;h.click('clear',{rx:.92,ry:.92});assert.equal(h.inspect().state.score,earned);h.click('serve');assert.equal(h.inspect().state.orderIndex,1);h.destroy();
 }
});

test('fixed offline artifact handles an extra-ingredient mistake before all 19 orders and still completes all five chapters',async()=>{
 const {html}=await buildOffline();const h=bootOfflineHtml(html,{width:320,height:568,safeInsets:{top:92,bottom:34},clientOffset:{left:17,top:23}});open(h);
 for(let stage=0;stage<5;stage++){
  for(const order of STAGES[stage].orders){
   const required=requiredIngredients(order),extra=Object.keys(INGREDIENTS).find(id=>!required.includes(id));
   for(const id of [...required,extra])h.click('ingredient-'+id);h.click('texture-'+order.texture);h.click('package-'+order.packaging);h.cook();
   const before=h.inspect().state.score;assert.match(h.inspect().state.feedback,/倒掉重做/);h.click('clear');assert.equal(h.inspect().state.score,before);assert.equal(h.inspect().state.phase,'playing');
   for(const id of required)h.click('ingredient-'+id);h.click('texture-'+order.texture);h.click('package-'+order.packaging);h.cook();h.click('serve');assert.equal(h.inspect().state.phase,'served');h.click('serve');
  }
  assert.equal(h.inspect().screen,'result');assert.equal(h.inspect().progress.stars[stage],3,'free remakes are not punished');h.click('next-stage');if(stage<4)h.click('open-day');
 }
 assert.equal(h.inspect().screen,'day');h.destroy();
});

test('offline all-seven-ingredients cooked mistake can be discarded without losing the active customer',async()=>{
 const {html}=await buildOffline();const h=bootOfflineHtml(html,{width:320,height:568});open(h);for(const id of Object.keys(INGREDIENTS))h.click('ingredient-'+id);h.cook();h.click('serve');assert.equal(h.inspect().state.phase,'playing');assert.match(h.inspect().state.feedback,/倒掉重做/);h.click('clear');assert.equal(h.inspect().state.orderIndex,0);assert.equal(h.inspect().state.dish.ingredients.length,0);for(const id of ['batter','egg','crisp'])h.click('ingredient-'+id);h.cook();h.click('serve');assert.equal(h.inspect().state.phase,'served');h.click('serve');assert.equal(h.inspect().state.orderIndex,1);h.destroy();
});

function prepareOffline(h,order,index){if(h.inspect().state.stage>=5)h.click('order-'+index);for(const id of requiredIngredients(order))h.click('ingredient-'+id);h.click('texture-'+order.texture);h.click('package-'+order.packaging);h.cook();}
test('exact final single HTML completes all50 reference shifts via browser-adapter pointer events without ads or tools',async()=>{
 const {html}=await buildOffline();const h=bootOfflineHtml(html,{width:320,height:568,safeInsets:{top:92,bottom:34},clientOffset:{left:17,top:23}});open(h);
 for(let stage=0;stage<50;stage++){
  for(const i of STAGES[stage].referencePlan){const order=STAGES[stage].orders[i];prepareOffline(h,order,i);if(order.pair!=null&&!h.inspect().state.heldDish)h.click('hold');else{h.click('serve');assert.equal(h.inspect().state.phase,'served',`shift ${stage+1} order ${i}`);h.click('serve');}}
  assert.equal(h.inspect().screen,'result');assert.equal(h.inspect().progress.stars[stage],3);h.click('next-stage');if(stage<49)h.click('open-day');
 }
 assert.equal(h.inspect().screen,'ending');assert.equal(h.inspect().progress.unlocked,49);assert.equal(h.inspect().progress.coins,800);assert.equal(h.inspect().progress.stars.reduce((a,b)=>a+b,0),150);h.destroy();
});

for(const status of ['completed','cancelled','unavailable','error'])test(`exact offline HTML mock ${status} respects revive and economy`,async()=>{
 const {parseProgress}=await import('../game.js'),{html}=await buildOffline(),initial=new Map([['street-breakfast-shop:progress:v1',JSON.stringify({...parseProgress(null),unlocked:40,coins:60})]]),h=bootOfflineHtml(html,{width:320,height:568,safeInsets:{top:92,bottom:34},initial});open(h);
 prepareOffline(h,STAGES[40].orders[0],0);h.click('hold');prepareOffline(h,STAGES[40].orders[2],2);h.click('serve');h.click('serve');h.click('order-1');h.click('ingredient-egg');h.click('cook');assert.equal(h.inspect().screen,'failure');
 h.click('revive-ad');assert.ok(h.texts.some(t=>t.text.includes('非真实广告')));h.click('mock-'+status);await Promise.resolve();h.tick();assert.equal(h.inspect().state.revives,status==='completed'?1:0);assert.equal(h.inspect().progress.coins,60);assert.equal(h.inspect().screen,status==='completed'?'play':'failure');h.destroy();
});

test('exact HTML purchased-and-used tool survives refresh as a once-only returned item',async()=>{
 const {parseProgress}=await import('../game.js'),{html}=await buildOffline(),initial=new Map([['street-breakfast-shop:progress:v1',JSON.stringify({...parseProgress(null),unlocked:10,coins:60})]]);let h=bootOfflineHtml(html,{initial});open(h);h.click('tools');h.click('buy-fuel');h.click('use-fuel');assert.equal(h.inspect().state.fuel,15);assert.equal(h.inspect().progress.coins,42);assert.equal(h.inspect().progress.tools.fuel,0);let store=new Map(h.store);h.destroy();h=bootOfflineHtml(html,{initial:store});assert.equal(h.inspect().progress.coins,42);assert.equal(h.inspect().progress.tools.fuel,1);assert.equal(h.inspect().progress.pendingSpend,null);store=new Map(h.store);h.destroy();h=bootOfflineHtml(html,{initial:store});assert.equal(h.inspect().progress.tools.fuel,1);assert.equal(h.inspect().progress.coins,42);h.destroy();
});

test('exact browser adapter cancels drag-out-and-back, lost capture and blur without purchases or revival',async()=>{
 const {parseProgress}=await import('../game.js'),{html}=await buildOffline(),initial=new Map([['street-breakfast-shop:progress:v1',JSON.stringify({...parseProgress(null),unlocked:40,coins:60})]]),h=bootOfflineHtml(html,{width:320,height:568,safeInsets:{top:92,bottom:34},clientOffset:{left:17,top:23},initial});
 function press(id,kind){const {buttons,viewport:v}=h.inspect(),b=buttons.find(b=>b.id===id),clientX=17+v.ox+(b.x+b.w/2)*v.zoom,clientY=23+v.oy+(b.y+b.h/2)*v.zoom,e={clientX,clientY,pointerId:7};h.canvas.emit('pointerdown',e);if(kind==='drag'){h.canvas.emit('pointermove',{...e,clientX:clientX+120});h.canvas.emit('pointermove',e);}else if(kind==='lost')h.canvas.emit('lostpointercapture',{pointerId:7});else h.window.emit('blur');h.canvas.emit('pointerup',e);h.tick();}
 for(const kind of ['drag','lost','blur']){press('start',kind);assert.equal(h.inspect().screen,'welcome');}open(h);h.click('tools');for(const kind of ['drag','lost','blur']){press('buy-fuel',kind);assert.equal(h.inspect().progress.coins,60);assert.equal(h.inspect().progress.tools.fuel,0);}h.click('buy-fuel');assert.equal(h.inspect().progress.coins,42);h.click('close-tools');h.click('close-menu');
 prepareOffline(h,STAGES[40].orders[0],0);h.click('hold');prepareOffline(h,STAGES[40].orders[2],2);h.click('serve');h.click('serve');h.click('order-1');h.click('ingredient-egg');h.click('cook');assert.equal(h.inspect().screen,'failure');for(const kind of ['drag','lost','blur']){press('revive-coins',kind);assert.equal(h.inspect().progress.coins,42);assert.equal(h.inspect().state.revives,0);}h.click('revive-coins');assert.equal(h.inspect().progress.coins,12);assert.equal(h.inspect().state.revives,1);h.destroy();
});

test('exact HTML winning settles consumed tool before reload, without refunding or paying victory twice',async()=>{
 const {parseProgress}=await import('../game.js'),{html}=await buildOffline(),initial=new Map([['street-breakfast-shop:progress:v1',JSON.stringify({...parseProgress(null),unlocked:10,coins:60})]]);let h=bootOfflineHtml(html,{initial});open(h);h.click('tools');h.click('buy-fuel');h.click('use-fuel');h.click('close-menu');for(const i of STAGES[10].referencePlan){prepareOffline(h,STAGES[10].orders[i],i);h.click('serve');h.click('serve');}assert.equal(h.inspect().screen,'result');assert.equal(h.inspect().progress.coins,56);assert.equal(h.inspect().progress.tools.fuel,0);assert.equal(h.inspect().progress.pendingSpend,null);const store=new Map(h.store);h.destroy();h=bootOfflineHtml(html,{initial:store});assert.equal(h.inspect().progress.coins,56);assert.equal(h.inspect().progress.tools.fuel,0);assert.equal(h.inspect().progress.stars[10],3);assert.equal(h.inspect().progress.pendingSpend,null);h.destroy();
});
