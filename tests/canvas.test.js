import test from 'node:test';
import assert from 'node:assert/strict';
import { startGame } from '../src/main.js';
import { createDouyinSidebar } from '../adapters/douyin-sidebar.js';
function harness({ failStorage = false, sidebar = undefined, width = 390, height = 780, safeInsets = undefined } = {}) {
  const context=new Proxy({measureText:text=>({width:text.length*9})},{get:(obj,key)=>key in obj?obj[key]:()=>{},set:(obj,key,value)=>(obj[key]=value,true)});
  const callbacks={},frames=new Map(),store=new Map();let frame=0,clock=0;
  const platform={canvas:{getContext:()=>context},getSize:()=>({width,height,dpr:1,safeInsets}),onPointer:fn=>{callbacks.pointer=fn;return()=>delete callbacks.pointer;},onResize:fn=>{callbacks.resize=fn;return()=>delete callbacks.resize;},onPause:fn=>{callbacks.pause=fn;return()=>delete callbacks.pause;},onResume:fn=>{callbacks.resume=fn;return()=>delete callbacks.resume;},requestFrame:fn=>{frames.set(++frame,fn);return frame;},cancelFrame:id=>frames.delete(id),storage:{getItem:key=>{if(failStorage)throw Error('denied');return store.get(key)||null;},setItem:(key,value)=>{if(failStorage)throw Error('denied');store.set(key,value);}},audio:{play(){},setMuted(){}}};
  if(sidebar)platform.sidebar=sidebar;
  const game=startGame(platform);
  function point(id,type='down',pointer=1){const b=game.inspect().buttons.find(b=>b.id===id);assert.ok(b,`button ${id} exists`);const {zoom,ox,oy}=game.inspect().viewport;callbacks.pointer({type,x:ox+(Number(b.x)+b.w/2)*zoom,y:oy+(b.y+b.h/2)*zoom,id:pointer});}
  function click(id){
    if(!game.inspect().buttons.some(b=>b.id===id)){
      const tab=id.startsWith('ingredient-')||id==='recipes'?'tab-prep':id.startsWith('texture-')||id==='cook'?'tab-cook':id.startsWith('package-')||id==='serve'?'tab-serve':null;
      if(tab&&game.inspect().screen==='play')click(tab);else if(['chapters','restart','sidebar-open'].includes(id)&&game.inspect().screen==='play')click('menu');
    }
    point(id,'down');point(id,'up');
  }
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
  const h=harness({sidebar});open(h);h.click('ingredient-egg');h.click('sidebar-open');h.click('sidebar-navigate');request.fail({errMsg:'not supported now'});await Promise.resolve();assert.equal(h.game.inspect().buttons.find(x=>x.id==='sidebar-navigate').disabled,false);h.click('close-sidebar');assert.equal(h.game.inspect().screen,'menu');h.click('close-menu');assert.equal(h.game.inspect().screen,'play');assert.deepEqual(h.game.inspect().state.dish.ingredients,['egg']);h.game.destroy();sidebar.destroy();
});

test('user extra ingredient cooked path has a reachable large reset, recovers and advances at mobile and desktop sizes',()=>{
  for(const [width,height] of [[320,568],[360,740],[390,844],[1100,760],[1440,900]]){
    const h=harness({width,height});open(h);
    for(const id of ['batter','egg','crisp','cheese'])h.click(`ingredient-${id}`);h.click('cook');h.tick(2100);
    let snapshot=h.game.inspect();assert.equal(snapshot.state.dish.status,'cooked');assert.match(snapshot.state.feedback,/倒掉重做/);
    const reset=snapshot.buttons.find(x=>x.id==='clear'),{zoom,ox,oy}=snapshot.viewport;assert.equal(reset.disabled,false);assert.ok(reset.w*zoom>=44&&reset.h*zoom>=44);assert.ok(ox+reset.x*zoom>=0&&oy+reset.y*zoom>=0&&ox+(reset.x+reset.w)*zoom<=width&&oy+(reset.y+reset.h)*zoom<=height);
    for(const other of snapshot.buttons.filter(b=>b.id!=='clear'))assert.ok(reset.x+reset.w<=other.x||other.x+other.w<=reset.x||reset.y+reset.h<=other.y||other.y+other.h<=reset.y,`reset overlaps ${other.id}`);
    h.click('serve');assert.equal(h.game.inspect().state.phase,'playing');const score=h.game.inspect().state.score;h.click('clear');assert.equal(h.game.inspect().state.score,score);assert.deepEqual(h.game.inspect().state.dish.ingredients,[]);
    for(const id of ['batter','egg','crisp'])h.click(`ingredient-${id}`);h.click('cook');h.tick(2100);h.click('serve');assert.equal(h.game.inspect().state.phase,'served');const earned=h.game.inspect().state.score;h.click('clear');assert.equal(h.game.inspect().state.score,earned);assert.equal(h.game.inspect().state.phase,'served');h.click('serve');assert.equal(h.game.inspect().state.orderIndex,1);h.game.destroy();
  }
});

function assertTouchLayout(h,width,height,safeInsets={}) {
  const {buttons,viewport:{zoom,ox,oy}}=h.game.inspect();
  for(const b of buttons){
    assert.ok(b.w*zoom>=44-1e-6&&b.h*zoom>=44-1e-6,`${b.id}: ${b.w*zoom} × ${b.h*zoom}`);
    assert.ok(ox+b.x*zoom>=(safeInsets.left||0)-1e-6&&oy+b.y*zoom>=(safeInsets.top||0)-1e-6,`${b.id} outside top/left safe area`);
    assert.ok(ox+(b.x+b.w)*zoom<=width-(safeInsets.right||0)+1e-6&&oy+(b.y+b.h)*zoom<=height-(safeInsets.bottom||0)+1e-6,`${b.id} outside bottom/right safe area`);
  }
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
    const a=buttons[i],b=buttons[j];
    assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`${a.id} overlaps ${b.id}`);
  }
}

test('all Canvas screens have safe, non-overlapping touch targets at least 44 physical pixels',()=>{
  const cases=[[320,568,{}],[320,568,{top:72,bottom:34}],[320,568,{top:92,bottom:34}],[320,568,{top:72,bottom:34,left:12,right:12}],[360,740,{top:72,bottom:34}],[390,844,{top:80,bottom:34}],[1100,760,{}],[1440,900,{}]];
  for(const [width,height,safeInsets] of cases){
    const sidebar=createDouyinSidebar({onShow(){},checkScene:o=>o.success({isExist:true}),navigateToScene(){}});
    const h=harness({width,height,safeInsets,sidebar}),check=()=>assertTouchLayout(h,width,height,safeInsets);
    check();h.click('sidebar-welcome');check();h.click('close-sidebar');h.click('start');check();h.click('open-day');check();
    for(const tab of ['cook','serve','prep']){h.click(`tab-${tab}`);check();assert.ok(h.game.inspect().buttons.some(b=>b.id==='clear'&&!b.disabled));}
    h.click('help');check();h.click('close-help');h.click('recipes');check();h.click('close-recipes');h.click('menu');check();
    for(const [id,closeId] of [['chapters','close-chapters'],['restart','cancel-restart'],['help','close-help'],['recipes','close-recipes'],['sidebar-open','close-sidebar']]){h.click(id);check();h.click(closeId);assert.equal(h.game.inspect().screen,'menu');check();}
    h.click('close-menu');h.game.destroy();sidebar.destroy();
  }
});

test('cooking continues across stations, pauses in nested menus, and resumes without lost progress',()=>{
  const h=harness();open(h);for(const id of ['batter','egg','crisp'])h.click(`ingredient-${id}`);
  h.click('tab-cook');h.click('cook');h.tick(400);h.click('tab-prep');h.tick(400);h.click('tab-serve');h.tick(400);
  h.click('menu');h.click('recipes');h.tick(5000);assert.equal(h.game.inspect().state.dish.status,'cooking');h.click('close-recipes');h.tick(5000);assert.equal(h.game.inspect().state.dish.status,'cooking');h.click('close-menu');h.tick(900);
  assert.equal(h.game.inspect().state.dish.status,'cooked');h.click('serve');assert.equal(h.game.inspect().state.phase,'served');
  h.click('tab-cook');assert.ok(h.game.inspect().buttons.some(b=>b.id==='serve'&&!b.disabled));h.click('serve');assert.equal(h.game.inspect().state.orderIndex,1);assert.equal(h.game.inspect().station,'prep');h.game.destroy();
});

test('every station exposes a safe free restart in raw, cooking, cooked and served states',()=>{
  for(const station of ['prep','cook','serve'])for(const phase of ['raw','cooking','cooked','served']){
    const h=harness({width:320,height:568,safeInsets:{top:72,bottom:34}});open(h);
    for(const id of ['batter','egg','crisp'])h.click(`ingredient-${id}`);
    if(phase!=='raw'){h.click('cook');if(phase!=='cooking')h.tick(2100);if(phase==='served')h.click('serve');}
    h.click(`tab-${station}`);const old=h.game.inspect().state;h.click('clear');h.tick(4000);const next=h.game.inspect().state;
    assert.equal(next.score,old.score);assert.equal(next.orderIndex,old.orderIndex);assert.deepEqual(next.servedIds,old.servedIds);assert.equal(next.phase,old.phase);assert.equal(next.dish.status,'raw');assert.deepEqual(next.dish.ingredients,[]);
    if(phase==='served'){h.click('serve');assert.equal(h.game.inspect().state.orderIndex,1);}h.game.destroy();
  }
});

test('menu restart requires an explicit choice and preserves saved progress and sound',()=>{
  const h=harness();open(h);h.click('ingredient-egg');h.click('menu');h.click('sound');h.click('restart');h.click('cancel-restart');h.click('close-menu');assert.deepEqual(h.game.inspect().state.dish.ingredients,['egg']);
  h.click('menu');h.click('restart');h.click('confirm-restart');assert.equal(h.game.inspect().screen,'day');assert.deepEqual(h.game.inspect().state.dish.ingredients,[]);assert.equal(h.game.inspect().progress.sound,false);h.click('open-day');assert.equal(h.game.inspect().station,'prep');h.game.destroy();
});

test('safe narrow screen completes all 19 deliberately incorrect cooked dishes and recovers with visible controls',async()=>{
  const {STAGES,INGREDIENTS,requiredIngredients}=await import('../game.js');const width=320,height=568,safeInsets={top:72,bottom:34};const h=harness({width,height,safeInsets});open(h);
  for(let stage=0;stage<STAGES.length;stage++){
    for(const order of STAGES[stage].orders){
      const ingredients=requiredIngredients(order),extra=Object.keys(INGREDIENTS).find(id=>!ingredients.includes(id));
      for(const id of [...ingredients,extra])h.click(`ingredient-${id}`);h.click(`texture-${order.texture}`);h.click('cook');h.tick(2100);h.click('tab-serve');h.click(`package-${order.packaging}`);h.click('serve');assert.equal(h.game.inspect().state.phase,'playing');assert.match(h.game.inspect().state.feedback,/重做/);assertTouchLayout(h,width,height,safeInsets);h.click('clear');
      for(const id of ingredients)h.click(`ingredient-${id}`);h.click(`texture-${order.texture}`);h.click('cook');h.tick(2100);h.click('tab-serve');h.click(`package-${order.packaging}`);h.click('serve');assert.equal(h.game.inspect().state.phase,'served');h.click('serve');
    }
    assert.equal(h.game.inspect().screen,'result');assertTouchLayout(h,width,height,safeInsets);h.click('next-stage');if(stage<4){assertTouchLayout(h,width,height,safeInsets);h.click('open-day');}
  }
  assert.equal(h.game.inspect().screen,'ending');assertTouchLayout(h,width,height,safeInsets);h.game.destroy();
});
