import { INGREDIENTS, RECIPES, CUSTOMERS, STAGES, initialState, getOrder, requiredIngredients, reduce, parseProgress, recordStage, stageStars } from '../game.js';
import { C, roundRect, circle, ellipse, line, label, wrapped, ingredientArt, foodArt, avatar, streetArt } from './canvas-art.js';

const SAVE_KEY = 'street-breakfast-shop:progress:v1';
const W = 390, H = 780;
/** Canvas-only entrypoint. The platform owns host lifecycle, input, storage and audio. */
export function startGame(platform) {
  const ctx = platform.canvas.getContext('2d');
  let progress = parseProgress(null), storageWarning = false;
  try { progress = parseProgress(platform.storage.getItem(SAVE_KEY)); } catch { storageWarning = true; }
  let state = initialState(progress.unlocked), screen = 'welcome', previousScreen = 'play';
  let buttons = [], frameId, alive = true, paused = false, lastFrame = 0, cookElapsed = 0, activeToken = -1;
  let size = platform.getSize(), zoom = 1, ox = 0, oy = 0;
  const unsubscribers = [];
  let sidebarState = platform.sidebar?.getState() || { available: false, checked: true, enteredFromSidebar: false, pending: false, error: null };
  let sidebarMessage = "";
  platform.audio.setMuted(!progress.sound);
  function save() { try { platform.storage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { storageWarning = true; } }
  function dispatch(action) {
    const previous = state; state = reduce(state, action);
    if (action.type === 'COOK' && state.dish.status === 'cooking' && previous.dish.status !== 'cooking') { cookElapsed = 0; activeToken = state.dish.token; platform.audio.play('cook'); }
    if (action.type === 'CLEAR' || action.type === 'RESTART_STAGE' || action.type === 'NEXT_STAGE') { cookElapsed = 0; activeToken = -1; }
    if (action.type === 'SERVE') platform.audio.play(state.phase === 'served' ? 'success' : 'error');
    if (state.phase === 'stageComplete' && previous.phase !== 'stageComplete') { progress = recordStage(progress, state); save(); screen = 'result'; platform.audio.play('complete'); }
  }
  function open(name) { previousScreen = screen === 'play' ? 'play' : screen; screen = name; }
  function close() { screen = previousScreen; }
  function beginStage(index) { state = initialState(index); screen = 'day'; cookElapsed = 0; activeToken = -1; }
  function button(id, text, x, y, w, h, fn, opts = {}) {
    const { fill = C.paper, color = C.ink, stroke = C.line, disabled = false, selected = false, size: fontSize = 12 } = opts;
    ctx.save(); if(disabled)ctx.globalAlpha=.45;
    roundRect(ctx,x,y,w,h,opts.radius ?? 8,selected?C.pale:fill,selected?'#9bae86':stroke);
    if(text)label(ctx,text,x+w/2,y+h/2,fontSize,color,opts.bold?'bold':'normal','center');ctx.restore();
    buttons.push({id,x,y,w,h,fn,disabled});
  }
  function top() {
    roundRect(ctx,15,14,31,34,4,null,C.coral);label(ctx,'早',30.5,31,22,C.coral,'bold','center');
    label(ctx,'街角早餐铺',56,25,18,C.ink,'bold');label(ctx,'每一份早安，都刚刚好',57,43,9,C.muted);
    button('sound',progress.sound?'♪':'静',282,14,41,36,()=>{progress.sound=!progress.sound;platform.audio.setMuted(!progress.sound);save();},{size:16});
    button('help','?',333,14,41,36,()=>open('help'),{size:16});
  }
  function playView() {
    const order=getOrder(state), customer=CUSTOMERS[order.customer], recipe=RECIPES[order.recipe], stage=STAGES[state.stage];
    top();streetArt(ctx,0,58,390,93,state.stage);
    roundRect(ctx,14,67,110,21,9,'#fff9e6de');label(ctx,`${stage.time} · ${stage.weather}`,69,78,9,'#7d826c','normal','center');
    if(sidebarState.available)button('sidebar-open','侧边栏再来 ›',243,107,133,34,()=>{sidebarMessage='';open('sidebar');},{fill:C.paper,color:C.green,size:11});
    roundRect(ctx,14,160,362,120,12,C.paper,C.line);
    avatar(ctx,order.customer,40,188,customer.color,42);label(ctx,customer.name,70,181,14,C.ink,'bold');label(ctx,customer.role,70,199,9,C.muted);
    label(ctx,recipe.name,360,186,14,C.coral,'bold','right');
    wrapped(ctx,`“${state.phase==='served'?customer.thanks:order.hint}”`,27,222,336,12,C.ink,19,2);
    const chips=[order.scallion?'加葱花':'不要葱',order.texture==='crisp'?'焦脆火候':'普通火候',order.packaging==='bag'?'打包带走':'堂食装盘'];
    chips.forEach((t,i)=>{roundRect(ctx,27+i*110,254,102,20,4,i===0&&!order.scallion?'#f4e4d4':C.pale);label(ctx,t,78+i*110,264,10,i===0&&!order.scallion?C.coral:C.green,'normal','center');});
    button('chapters',`第 ${state.stage+1} 天  ▾`,14,291,112,38,()=>open('chapters'),{fill:C.pale,size:12});
    label(ctx,'今日心意',151,298,9,C.muted);label(ctx,String(state.score).padStart(3,'0'),151,316,22,C.coral);
    label(ctx,'连续好评',250,298,9,C.muted);label(ctx,`${state.combo} 份`,250,316,20,C.green);
    label(ctx,`${state.orderIndex+1}/${stage.orders.length}`,371,304,11,C.muted,'normal','right');
    const done=state.servedIds.length/stage.orders.length;roundRect(ctx,14,336,362,3,2,C.line);if(done)roundRect(ctx,14,336,362*done,3,2,'#a4b78d');
    label(ctx,'01  点选食材',14,353,12,C.ink,'bold');label(ctx,'再点一次可以撤回',375,353,9,C.muted,'normal','right');
    Object.keys(INGREDIENTS).forEach((id,i)=>{
      const x=14+(i%4)*92,y=367+Math.floor(i/4)*69,w=i===6?178:86;
      button(`ingredient-${id}`,'',x,y,w,62,()=>dispatch({type:'TOGGLE_INGREDIENT',id}),{fill:'#f3efdf',selected:state.dish.ingredients.includes(id),disabled:state.dish.status!=='raw'||state.phase!=='playing'});
      ingredientArt(ctx,id,x+w/2,y+23,.67);label(ctx,INGREDIENTS[id],x+w/2,y+49,10,C.ink,'normal','center');
      if(state.dish.ingredients.includes(id)){circle(ctx,x+w-11,y+10,7,C.green);label(ctx,'✓',x+w-11,y+10,9,C.paper,'bold','center');}
    });
    roundRect(ctx,14,506,362,27,5,'#f2ecd9');label(ctx,'配方',24,520,9,C.coral);label(ctx,recipe.ingredients.map(id=>INGREDIENTS[id]).join(' + '),57,520,10,'#8f825e');
    button('recipes','全部 ›',312,503,64,33,()=>open('recipes'),{fill:'transparent',stroke:null,size:10,color:C.green});
    label(ctx,'02  用心煎好',14,551,12,C.ink,'bold');
    button('clear','↺ 清空',286,539,90,33,()=>dispatch({type:'CLEAR'}),{fill:'transparent',stroke:null,size:10,color:C.muted,disabled:state.phase!=='playing'});
    ellipse(ctx,123,622,105,48,'#b9af91');ellipse(ctx,123,617,100,44,'#4e5945');
    foodArt(ctx,state.dish,123,616,.88);
    label(ctx,state.dish.status==='cooking'?'滋啦滋啦，香气快好了…':state.dish.status==='cooked'?'煎好啦！可以装盘出餐':'',123,649,9,'#d3d8b7','normal','center');
    if(state.dish.status==='cooking')for(let i=0;i<3;i++){const yy=583-((cookElapsed/50+i*9)%20);line(ctx,100+i*20,yy,103+i*20,yy-12,'#ece4b7',2);}
    button('texture-soft','普通',246,577,61,34,()=>dispatch({type:'SET_TEXTURE',value:'soft'}),{selected:state.dish.texture==='soft',size:11,disabled:state.dish.status!=='raw'||state.phase!=='playing'});
    button('texture-crisp','焦脆',313,577,63,34,()=>dispatch({type:'SET_TEXTURE',value:'crisp'}),{selected:state.dish.texture==='crisp',size:11,disabled:state.dish.status!=='raw'||state.phase!=='playing'});
    button('cook',state.dish.status==='cooking'?'煎制中…':state.dish.status==='cooked'?'已煎好 ✓':'开火煎制',246,618,130,43,()=>dispatch({type:'COOK'}),{fill:'#e4ca90',color:'#6d5c3e',stroke:'#d6bd85',disabled:state.dish.status!=='raw'||state.phase!=='playing',size:12});
    roundRect(ctx,246,666,130,3,2,C.line);if(cookElapsed>0)roundRect(ctx,246,666,130*Math.min(1,cookElapsed/recipe.cookMs),3,2,C.gold);
    label(ctx,'03  装好出餐',14,684,12,C.ink,'bold');
    button('package-plate','堂食装盘',14,698,94,44,()=>dispatch({type:'SET_PACKAGING',value:'plate'}),{selected:state.dish.packaging==='plate',size:11,disabled:state.phase!=='playing'});
    button('package-bag','打包带走',114,698,94,44,()=>dispatch({type:'SET_PACKAGING',value:'bag'}),{selected:state.dish.packaging==='bag',size:11,disabled:state.phase!=='playing'});
    button('serve',state.phase==='served'?(state.orderIndex+1===stage.orders.length?'收摊结算 →':'下一位 →'):'递上早餐 ↗',222,690,154,52,()=>dispatch({type:state.phase==='served'?'NEXT_ORDER':'SERVE'}),{fill:state.phase==='served'?C.green:C.coral,color:C.paper,stroke:null,size:14,bold:true});
    wrapped(ctx,state.feedback||(storageWarning?'此环境无法保存进度，仍可继续游玩。':'不赶时间，只记心意。做错了可以重新来。'),14,756,362,10,state.feedbackType==='error'?C.coral:state.feedbackType==='success'?C.green:C.muted,14,2);
  }
  function modalBase(title, eyebrow='街角早餐铺', height=430) {
    ctx.fillStyle='#354330b9';ctx.fillRect(0,0,W,H);buttons=[];const y=(H-height)/2;
    roundRect(ctx,24,y,342,height,18,C.paper,'#d8d5bd');label(ctx,eyebrow,48,y+30,10,C.muted);wrapped(ctx,title,48,y+64,294,24,C.ink,32,2);return y;
  }
  function modalView() {
    if(screen==='play')return;
    const stage=STAGES[state.stage];
    if(screen==='welcome'){
      const y=modalBase('把早安，做得刚刚好。','STORIES OVER BREAKFAST',426);
      streetArt(ctx,39,y+92,312,90,state.stage);
      wrapped(ctx,'一间小铺，五位街坊。听清口味，煎一份热乎的早餐，让每个人记住你的心意。',48,y+204,294,13,'#7b836c',23,3);
      label(ctx,'选食材  →  煎一煎  →  装好出餐',195,y+285,12,C.green,'bold','center');
      button('start',progress.unlocked>0?'继续开门营业':'开门营业',48,y+316,294,49,()=>{screen='day';platform.audio.play('tap');},{fill:C.coral,color:C.paper,stroke:null,size:15});
      if(sidebarState.available)button('sidebar-welcome','从侧边栏再来 ›',48,y+374,294,34,()=>{sidebarMessage='';open('sidebar');},{fill:'transparent',stroke:null,color:C.green,size:11});
      else label(ctx,'原创试玩 · 5 个清晨 · 无广告 / 无支付',195,y+389,10,C.muted,'normal','center');
    } else if(screen==='sidebar') {
      const y=modalBase('下次早安，从这里开始','抖音侧边栏 · 可选入口',410);
      wrapped(ctx,'你可以通过抖音侧边栏再找到早餐铺。这里不发放奖励，也不会改变分数或关卡进度。',48,y+119,294,13,C.green,23,3);
      const status=sidebarState.enteredFromSidebar?'本次确实从侧边栏回到早餐铺，欢迎回来。':sidebarMessage||(sidebarState.pending?'正在请求打开侧边栏…':sidebarState.available?'点下面的按钮，前往抖音侧边栏。':'当前环境暂不支持侧边栏，仍可正常游玩。');
      wrapped(ctx,status,48,y+210,294,12,C.muted,21,3);
      button('sidebar-navigate',sidebarState.pending?'正在打开…':'前往抖音侧边栏',48,y+285,294,47,()=>{
        sidebarMessage='';
        platform.sidebar.navigate().then(ok=>{if(!alive)return;sidebarMessage=ok?'已请求打开侧边栏；返回后可以继续游玩。':'本次没有完成侧边栏跳转，你仍可正常游玩。';drawImmediate();});
      },{fill:C.green,color:C.paper,stroke:null,size:13,disabled:!sidebarState.available||sidebarState.pending});
      button('close-sidebar','回到早餐铺',48,y+344,294,40,close,{fill:'transparent',stroke:null,color:C.muted,size:12});
    } else if(screen==='day') {
      const y=modalBase(stage.title,`第 ${state.stage+1} 个清晨 · ${stage.time}`,342);
      wrapped(ctx,stage.note,48,y+114,294,14,'#7b836c',25,3);label(ctx,`今天要做 ${stage.orders.length} 份早餐`,48,y+203,12,C.green);
      button('open-day','系好围裙，开工',48,y+251,294,48,()=>{screen='play';},{fill:C.green,color:C.paper,stroke:null,size:14});
    } else if(screen==='help') {
      const y=modalBase('慢慢做，也能做得好。','玩法小贴士',465);
      const tips=[['01','看订单','对白下方标明葱花、火候和包装要求。'],['02','按配方选食材','加葱另点葱花；多点一次可撤回。'],['03','选火候后开火','煎好再选堂食或打包，然后递上早餐。'],['04','失误可以重来','错单扣 5 分、不跳单。清空后再做。']];
      tips.forEach(([n,t,d],i)=>{label(ctx,n,49,y+117+i*65,14,C.coral);label(ctx,t,82,y+111+i*65,13,C.ink,'bold');wrapped(ctx,d,82,y+132+i*65,235,11,C.muted,17,2);});
      button('close-help','知道啦',48,y+390,294,48,close,{fill:C.green,color:C.paper,stroke:null});
    } else if(screen==='recipes') {
      const y=modalBase('三份早餐，记住就好。','配方小抄',430);
      Object.entries(RECIPES).forEach(([id,r],i)=>{roundRect(ctx,45,y+104+i*77,300,69,8,'#f0efdf');foodArt(ctx,{ingredients:r.ingredients,status:'cooked',texture:'soft'},86,y+139+i*77,.47);label(ctx,r.name,131,y+126+i*77,13,C.ink,'bold');label(ctx,r.ingredients.map(k=>INGREDIENTS[k]).join(' + '),131,y+149+i*77,11,C.muted);});
      label(ctx,'葱花按订单另加，火候与包装也要看清。',195,y+353,10,C.coral,'normal','center');
      button('close-recipes','回到料理台',48,y+374,294,40,close,{fill:C.green,color:C.paper,stroke:null});
    } else if(screen==='chapters') {
      const y=modalBase('这条街的五个清晨','选择关卡 · 当前天将重新开始',482);
      STAGES.forEach((s,i)=>{button(`chapter-${i}`,'',45,y+108+i*59,300,51,()=>beginStage(i),{fill:i===state.stage?C.pale:'#f4f0e2',disabled:i>progress.unlocked});label(ctx,`0${i+1}`,61,y+133+i*59,19,C.coral);label(ctx,s.title,102,y+126+i*59,12,C.ink,'bold');label(ctx,i>progress.unlocked?'完成前一天后解锁':`${'★'.repeat(progress.stars[i])}${'☆'.repeat(3-progress.stars[i])} · 最佳 ${progress.best[i]}`,102,y+143+i*59,10,C.muted);});
      button('close-chapters','回到刚才',48,y+419,294,43,close,{fill:C.green,color:C.paper,stroke:null});
    } else if(screen==='result') {
      const stars=stageStars(state),last=state.stage===STAGES.length-1;
      const y=modalBase(last?'早安，老朋友。':'今天，也暖到了人。',`第 ${state.stage+1} 天 · 收摊啦`,472);
      label(ctx,'★'.repeat(stars)+'☆'.repeat(3-stars),195,y+111,30,C.gold,'normal','center');label(ctx,String(state.score),195,y+157,48,C.coral,'normal','center');
      label(ctx,`完成 ${stage.orders.length} 份早餐 · ${state.mistakes===0?'零错单，好手艺！':`${state.mistakes} 次调整后，顺利收摊。`}`,195,y+201,11,C.muted,'normal','center');
      wrapped(ctx,stage.ending,48,y+239,294,13,C.green,23,4);
      button('next-stage',last?'五个清晨，圆满收摊':'明天继续开张 →',48,y+356,294,46,()=>{if(last)screen='ending';else{dispatch({type:'NEXT_STAGE'});screen='day';}},{fill:C.coral,color:C.paper,stroke:null,size:13});
      button('replay-stage','再做一次，争取更好',48,y+411,294,37,()=>beginStage(state.stage),{fill:'transparent',stroke:null,size:11,color:C.muted});
    } else if(screen==='ending') {
      const y=modalBase('被记住的，是那一口。','全部五关完成',406);
      streetArt(ctx,39,y+97,312,100,4);
      wrapped(ctx,'你和街坊们一起，走过了五个清晨。谢谢你把每一份早安做得刚刚好。',48,y+226,294,14,C.green,25,3);
      label(ctx,`街角手账：${progress.stars.reduce((a,b)=>a+b,0)} / 15 颗心意星`,195,y+307,12,C.coral,'normal','center');
      button('replay-all','选一个清晨，再见老朋友',48,y+341,294,44,()=>{previousScreen='ending';screen='chapters';},{fill:C.green,color:C.paper,stroke:null});
    }
  }
  function draw(now=0) {
    if(!alive)return;size=platform.getSize();const dpr=size.dpr||1;
    zoom=Math.min(size.width/W,size.height/H,1.4);ox=(size.width-W*zoom)/2;oy=(size.height-H*zoom)/2;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=C.bg;ctx.fillRect(0,0,size.width,size.height);ctx.save();ctx.translate(ox,oy);ctx.scale(zoom,zoom);ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);buttons=[];playView();modalView();ctx.restore();
    if(!paused){const delta=lastFrame?Math.min(100,Math.max(0,now-lastFrame)):0;if(state.dish.status==='cooking'&&screen==='play'){cookElapsed+=delta;const order=getOrder(state);if(cookElapsed>=RECIPES[order.recipe].cookMs)dispatch({type:'COOK_DONE',token:activeToken});}}
    lastFrame=now;if(!paused)frameId=platform.requestFrame(draw);
  }
  // Actions happen only on a matching pointer-up. Moves/cancels cannot produce ghost clicks.
  let pointerDown=null;
  unsubscribers.push(platform.onPointer(event=>{
    if(paused||!alive)return;const x=(event.x-ox)/zoom,y=(event.y-oy)/zoom;
    const hit=[...buttons].reverse().find(b=>!b.disabled&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if(event.type==='down'&&!pointerDown)pointerDown=hit?{id:hit.id,pointer:event.id,x,y}:null;
    if(event.type==='cancel'&&pointerDown?.pointer===event.id)pointerDown=null;
    if(event.type==='up'&&pointerDown?.pointer===event.id){const start=pointerDown;pointerDown=null;if(hit&&start&&start.id===hit.id&&Math.hypot(x-start.x,y-start.y)<25){platform.audio.play('tap');hit.fn();drawImmediate();}}
  }));
  function drawImmediate(){ if(frameId!==undefined)platform.cancelFrame(frameId);draw(lastFrame); }
  unsubscribers.push(platform.onResize(()=>{size=platform.getSize();pointerDown=null;drawImmediate();}));
  unsubscribers.push(platform.onPause(()=>{paused=true;pointerDown=null;lastFrame=0;platform.cancelFrame(frameId);}));
  unsubscribers.push(platform.onResume(()=>{paused=false;lastFrame=0;drawImmediate();}));
  if(platform.sidebar)unsubscribers.push(platform.sidebar.subscribe(next=>{sidebarState=next;drawImmediate();}));
  draw();
  return {
    destroy(){alive=false;platform.cancelFrame(frameId);unsubscribers.forEach(fn=>fn());},
    // Read-only diagnostics, useful for deterministic integration tests. No action injection.
    inspect(){return JSON.parse(JSON.stringify({state,screen,progress,storageWarning,sidebarState,sidebarMessage,buttons:buttons.map(({id,x,y,w,h,disabled})=>({id,x,y,w,h,disabled})),viewport:{zoom,ox,oy}}));}
  };
}
