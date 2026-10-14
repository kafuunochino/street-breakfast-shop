import test from 'node:test';
import assert from 'node:assert/strict';
import { startGame } from '../src/main.js';
import { createDouyinSidebar } from '../adapters/douyin-sidebar.js';
function harness({ failStorage = false, sidebar = undefined } = {}) {
  const context=new Proxy({measureText:text=>({width:text.length*9})},{get:(obj,key)=>key in obj?obj[key]:()=>{},set:(obj,key,value)=>(obj[key]=value,true)});
  const callbacks={},frames=new Map(),store=new Map();let frame=0,clock=0;
  const platform={canvas:{getContext:()=>context},getSize:()=>({width:390,height:780,dpr:1}),onPointer:fn=>{callbacks.pointer=fn;return()=>delete callbacks.pointer;},onResize:fn=>{callbacks.resize=fn;return()=>delete callbacks.resize;},onPause:fn=>{callbacks.pause=fn;return()=>delete callbacks.pause;},onResume:fn=>{callbacks.resume=fn;return()=>delete callbacks.resume;},requestFrame:fn=>{frames.set(++frame,fn);return frame;},cancelFrame:id=>frames.delete(id),storage:{getItem:key=>{if(failStorage)throw Error('denied');return store.get(key)||null;},setItem:(key,value)=>{if(failStorage)throw Error('denied');store.set(key,value);}},audio:{play(){},setMuted(){}}};
  if(sidebar)platform.sidebar=sidebar;
  const game=startGame(platform);
  function point(id,type='down',pointer=1){const b=game.inspect().buttons.find(b=>b.id===id);assert.ok(b,`button ${id} exists`);callbacks.pointer({type,x:Number(b.x)+b.w/2,y:b.y+b.h/2,id:pointer});}
  function click(id){point(id,'down');point(id,'up');}
  function tick(ms){for(let i=0;i<ms/50;i++){clock+=50;const all=[...frames.values()];frames.clear();all.forEach(fn=>fn(clock));}}
  return {game,platform,callbacks,frames,store,click,point,tick};
}
function open(h){h.click('start');h.click('open-day');}

test('Canvas renderer boots welcome and enters play through pointer actions',()=>{const h=harness();assert.equal(h.game.inspect().screen,'welcome');open(h);assert.equal(h.game.inspect().screen,'play');h.game.destroy();});
test('pointer cancellation and release on a different button do not activate',()=>{const h=harness();open(h);h.point('ingredient-egg','down');h.callbacks.pointer({type:'cancel',x:0,y:0,id:1});h.point('ingredient-egg','up');assert.deepEqual(h.game.inspect().state.dish.ingredients,[]);h.point('ingredient-egg','down');h.point('ingredient-rice','up');assert.deepEqual(h.game.inspect().state.dish.ingredients,[]);h.game.destroy();});
test('mismatched pointer ids cannot trigger an action',()=>{const h=harness();open(h);h.point('ingredient-egg','down',1);h.point('ingredient-egg','up',2);assert.deepEqual(h.game.inspect().state.dish.ingredients,[]);h.game.destroy();});
test('pause and resume exclude hidden time from cooking',()=>{const h=harness();open(h);h.click('ingredient-egg');h.click('cook');h.tick(500);h.callbacks.pause();h.tick(10000);assert.equal(h.game.inspect().state.dish.status,'cooking');h.callbacks.resume();h.tick(1000);assert.equal(h.game.inspect().state.dish.status,'cooking');h.tick(700);assert.equal(h.game.inspect().state.dish.status,'cooked');h.game.destroy();});
test('opening instructions pauses cooking without discarding food',()=>{const h=harness();open(h);h.click('ingredient-egg');h.click('cook');h.click('help');h.tick(5000);assert.equal(h.game.inspect().state.dish.status,'cooking');h.click('close-help');h.tick(2000);assert.equal(h.game.inspect().state.dish.status,'cooked');h.game.destroy();});
test('clear during cooking cannot produce a cooked empty pan',()=>{const h=harness();open(h);h.click('ingredient-egg');h.click('cook');h.tick(300);h.click('clear');h.tick(4000);assert.equal(h.game.inspect().state.dish.status,'raw');assert.deepEqual(h.game.inspect().state.dish.ingredients,[]);h.game.destroy();});
test('resize cancels a pending pointer gesture',()=>{const h=harness();open(h);h.point('ingredient-egg','down');h.callbacks.resize();h.point('ingredient-egg','up');assert.deepEqual(h.game.inspect().state.dish.ingredients,[]);h.game.destroy();});
test('storage failures are disclosed and do not block play or sound toggle',()=>{const h=harness({failStorage:true});open(h);assert.equal(h.game.inspect().storageWarning,true);h.click('sound');assert.equal(h.game.inspect().progress.sound,false);h.click('ingredient-egg');assert.deepEqual(h.game.inspect().state.dish.ingredients,['egg']);h.game.destroy();});
test('sound preference is written through platform storage',()=>{const h=harness();open(h);h.click('sound');assert.equal(JSON.parse([...h.store.values()][0]).sound,false);h.game.destroy();});
test('destroy unsubscribes lifecycle input and cancels frame scheduling',()=>{const h=harness();assert.ok(h.frames.size>0);h.game.destroy();assert.equal(h.frames.size,0);assert.equal(Object.keys(h.callbacks).length,0);});
test('inspection cannot mutate actual game state',()=>{const h=harness();const snapshot=h.game.inspect();snapshot.state.score=999;snapshot.progress.unlocked=4;assert.equal(h.game.inspect().state.score,0);assert.equal(h.game.inspect().progress.unlocked,0);h.game.destroy();});

test('pause stops frame scheduling and resume restarts exactly one frame loop',()=>{const h=harness();open(h);h.callbacks.pause();assert.equal(h.frames.size,0);h.callbacks.resize();assert.equal(h.frames.size,0);h.callbacks.resume();assert.equal(h.frames.size,1);h.tick(200);assert.equal(h.frames.size,1);h.game.destroy();});

test('all 19 orders complete through actual Canvas button pointer handlers',async()=>{
  const {STAGES,requiredIngredients}=await import('../game.js');const h=harness();open(h);
  for(let stage=0;stage<STAGES.length;stage++){
    for(const order of STAGES[stage].orders){
      for(const id of requiredIngredients(order))h.click(`ingredient-${id}`);
      h.click(`texture-${order.texture}`);h.click(`package-${order.packaging}`);h.click('cook');h.tick(2100);
      assert.equal(h.game.inspect().state.dish.status,'cooked');h.click('serve');assert.equal(h.game.inspect().state.phase,'served');h.click('serve');
    }
    assert.equal(h.game.inspect().screen,'result');assert.equal(h.game.inspect().progress.stars[stage],3);
    h.click('next-stage');if(stage<4)h.click('open-day');
  }
  assert.equal(h.game.inspect().screen,'ending');assert.equal(h.game.inspect().progress.stars.reduce((a,b)=>a+b,0),15);
  h.click('replay-all');h.click('chapter-0');h.click('open-day');assert.equal(h.game.inspect().state.stage,0);h.game.destroy();
});

test('a second finger cannot steal or cancel the active first-finger gesture',()=>{const h=harness();open(h);h.point('ingredient-egg','down',1);h.point('ingredient-batter','down',2);h.callbacks.pointer({type:'cancel',x:0,y:0,id:2});h.point('ingredient-egg','up',1);h.point('ingredient-batter','up',2);assert.deepEqual(h.game.inspect().state.dish.ingredients,['egg']);h.game.destroy();});

test('Canvas sidebar CTA requires explicit confirmation and does not change rewards or progress',async()=>{
  let request,show,calls=0;const sidebar=createDouyinSidebar({onShow:fn=>show=fn,checkScene:options=>options.success({isExist:true}),navigateToScene:options=>{request=options;calls++;}});
  const h=harness({sidebar});const before=h.game.inspect().progress;
  h.click('sidebar-welcome');assert.equal(h.game.inspect().screen,'sidebar');assert.equal(calls,0);
  h.click('sidebar-navigate');assert.equal(calls,1);assert.equal(h.game.inspect().sidebarState.pending,true);
  assert.equal(h.game.inspect().buttons.find(x=>x.id==='sidebar-navigate').disabled,true);
  request.success({});await Promise.resolve();assert.equal(h.game.inspect().sidebarState.enteredFromSidebar,false);
  show({launch_from:'homepage',location:'sidebar_card'});assert.equal(h.game.inspect().sidebarState.enteredFromSidebar,true);
  show({launch_from:'homepage',location:'ordinary'});assert.equal(h.game.inspect().sidebarState.enteredFromSidebar,false);
  assert.deepEqual(h.game.inspect().progress,before);assert.equal(h.game.inspect().state.score,0);
  h.click('close-sidebar');assert.equal(h.game.inspect().screen,'welcome');h.game.destroy();sidebar.destroy();
});

test('unsupported sidebar hides entry and ordinary game remains playable',()=>{
  const sidebar=createDouyinSidebar({onShow(){},checkScene:options=>options.success({isExist:false}),navigateToScene(){throw Error('must not call');}});
  const h=harness({sidebar});assert.ok(!h.game.inspect().buttons.some(x=>x.id==='sidebar-welcome'));open(h);assert.ok(!h.game.inspect().buttons.some(x=>x.id==='sidebar-open'));h.click('ingredient-egg');assert.deepEqual(h.game.inspect().state.dish.ingredients,['egg']);h.game.destroy();sidebar.destroy();
});

test('sidebar failure restores navigation button and can close back to current play',async()=>{
  let request;const sidebar=createDouyinSidebar({onShow(){},checkScene:options=>options.success({isExist:true}),navigateToScene:options=>request=options});
  const h=harness({sidebar});open(h);h.click('ingredient-egg');h.click('sidebar-open');h.click('sidebar-navigate');request.fail({errMsg:'not supported now'});await Promise.resolve();assert.equal(h.game.inspect().buttons.find(x=>x.id==='sidebar-navigate').disabled,false);h.click('close-sidebar');assert.equal(h.game.inspect().screen,'play');assert.deepEqual(h.game.inspect().state.dish.ingredients,['egg']);h.game.destroy();sidebar.destroy();
});
