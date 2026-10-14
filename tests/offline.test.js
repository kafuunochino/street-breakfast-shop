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
 for(let stage=0;stage<STAGES.length;stage++){
  for(const order of STAGES[stage].orders){
   const required=requiredIngredients(order),extra=Object.keys(INGREDIENTS).find(id=>!required.includes(id));
   for(const id of [...required,extra])h.click('ingredient-'+id);h.click('texture-'+order.texture);h.click('package-'+order.packaging);h.cook();
   const before=h.inspect().state.score;assert.match(h.inspect().state.feedback,/倒掉重做/);h.click('clear');assert.equal(h.inspect().state.score,before);assert.equal(h.inspect().state.phase,'playing');
   for(const id of required)h.click('ingredient-'+id);h.click('texture-'+order.texture);h.click('package-'+order.packaging);h.cook();h.click('serve');assert.equal(h.inspect().state.phase,'served');h.click('serve');
  }
  assert.equal(h.inspect().screen,'result');assert.equal(h.inspect().progress.stars[stage],3,'free remakes are not punished');h.click('next-stage');if(stage<4)h.click('open-day');
 }
 assert.equal(h.inspect().screen,'ending');h.destroy();
});

test('offline all-seven-ingredients cooked mistake can be discarded without losing the active customer',async()=>{
 const {html}=await buildOffline();const h=bootOfflineHtml(html,{width:320,height:568});open(h);for(const id of Object.keys(INGREDIENTS))h.click('ingredient-'+id);h.cook();h.click('serve');assert.equal(h.inspect().state.phase,'playing');assert.match(h.inspect().state.feedback,/倒掉重做/);h.click('clear');assert.equal(h.inspect().state.orderIndex,0);assert.equal(h.inspect().state.dish.ingredients.length,0);for(const id of ['batter','egg','crisp'])h.click('ingredient-'+id);h.cook();h.click('serve');assert.equal(h.inspect().state.phase,'served');h.click('serve');assert.equal(h.inspect().state.orderIndex,1);h.destroy();
});
