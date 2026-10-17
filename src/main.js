import { INGREDIENTS, RECIPES, CUSTOMERS, STAGES, initialState, getOrder, requiredIngredients, dishNeedsRestart, reduce, parseProgress, recordStage, stageStars, visibleOrders, patienceLeft, patienceSeconds, patienceBudgetMs, fireCost, freshLeft, allocateRun, buyTool, spendTool, coinRevive, TOOL_COSTS, recoverAbandonedRun } from '../game.js';
import { C, roundRect, circle, ellipse, line, poly, label, wrapped, ingredientArt, foodArt, avatar, streetArt } from './canvas-art.js';

const SAVE_KEY = 'street-breakfast-shop:progress:v1';
const W = 360;
const STATIONS = [['prep','备料台'],['cook','铁锅台'],['serve','出餐台']];
/** Full-screen game world. No gameplay DOM; width-based layout preserves physical touch targets. */
export function startGame(platform) {
  const ctx=platform.canvas.getContext('2d');
  let progress=parseProgress(null),storageWarning=false;
  try{const loaded=parseProgress(platform.storage.getItem(SAVE_KEY));progress=recoverAbandonedRun(loaded);if(loaded.pendingSpend)platform.storage.setItem(SAVE_KEY,JSON.stringify(progress));}catch{storageWarning=true;}
  let state=initialState(progress.unlocked),screen='welcome',station='prep',trail=[],chapterPage=Math.floor(progress.unlocked/6),earnedCoins=0,artTime=0;
  let rewardPending=null,rewardMessage='';const rewardClaims=new Set();
  let size=platform.getSize(),zoom=1,ox=0,oy=0,H=780,layout={},buttons=[],frameId,alive=true,paused=false,lastFrame=0,cookElapsed=0,activeToken=-1,pointerDown=null;
  let sidebarState=platform.sidebar?.getState()||{available:false,checked:true,enteredFromSidebar:false,pending:false,error:null},sidebarMessage='';
  const unsubscribers=[];
  platform.audio.setMuted(!progress.sound);
  const save=(next=progress)=>{try{platform.storage.setItem(SAVE_KEY,JSON.stringify(next));return true;}catch{storageWarning=true;return false;}};
  function dispatch(action){
    const old=state;state=reduce(state,action);
    if(action.type==='HOLD'&&state!==old)station='prep';
    if(state.phase==='failed'&&old.phase!=='failed'){screen='failure';trail=[];activeToken=-1;platform.audio.play('error');}
    if(action.type==='COOK'&&state.dish.status==='cooking'&&old.dish.status!=='cooking'){cookElapsed=0;activeToken=state.dish.token;platform.audio.play('cook');}
    if(['CLEAR','RESTART_STAGE','NEXT_STAGE','NEXT_ORDER'].includes(action.type)){cookElapsed=0;activeToken=-1;if(state.phase==='playing')station='prep';}
    if(action.type==='SERVE')platform.audio.play(state.phase==='served'?'success':'error');
    if(state.phase==='stageComplete'&&old.phase!=='stageComplete'){const before=progress.coins;progress=recordStage(progress,state);earnedCoins=progress.coins-before;save();screen='result';trail=[];platform.audio.play('complete');}
  }
  function open(name){trail.push(screen);screen=name;pointerDown=null;}
  function close(){screen=trail.pop()||'play';pointerDown=null;}
  function beginStage(index){platform.rewards?.cancel();rewardPending=null;const next=allocateRun(progress,index);progress=next.progress;next.state.dish.token=state.dish.token+1;state=next.state;save();station='prep';screen='day';trail=[];cookElapsed=0;activeToken=-1;pointerDown=null;rewardMessage='';}
  function useTool(kind){const next=spendTool(progress,state,kind);if(next.state!==state&&save(next.progress)){progress=next.progress;state=next.state;close();}}
  function reviveWithCoins(){const next=coinRevive(progress,state);if(next.state!==state&&save(next.progress)){progress=next.progress;state=next.state;screen='play';trail=[];station='prep';}}
  function requestRevive(){
    if(rewardPending||state.phase!=='failed'||state.revives>=1||!platform.rewards?.getState().available)return;
    const token={runId:state.runId,failureId:state.failureId};rewardPending=token;rewardMessage='';screen='reward';
    platform.rewards.request({placement:'revive',context:token}).then(result=>{
      if(!alive||rewardPending!==token||state.runId!==token.runId||state.failureId!==token.failureId||state.phase!=='failed')return;
      rewardPending=null;if(result.status==='completed'&&!rewardClaims.has(result.requestId)){rewardClaims.add(result.requestId);const next=reduce(state,{type:'REVIVE',...token,requestId:result.requestId,source:'completed-ad'});if(next!==state){state=next;screen='play';trail=[];station='prep';}}
      else{rewardMessage=result.status==='cancelled'?'已提前关闭，没有发放奖励。':result.status==='unavailable'?'没有可用广告，没有发放奖励。':'模拟异常，没有发放奖励。';screen='failure';}redraw();
    }).catch(()=>{if(alive&&rewardPending===token){rewardPending=null;rewardMessage='请求失败，没有发放奖励。';screen='failure';redraw();}});
  }
  function sound(){progress.sound=!progress.sound;platform.audio.setMuted(!progress.sound);save();}
  function button(id,text,x,y,w,h,fn,opts={}){
    const{fill=C.paper,color=C.ink,stroke=C.line,disabled=false,selected=false,size:fontSize=14}=opts;
    ctx.save();if(disabled&&opts.dimDisabled!==false)ctx.globalAlpha=.46;
    roundRect(ctx,x,y+3,w,h,opts.radius??7,'#70432433');
    roundRect(ctx,x,y,w,h,opts.radius??7,selected?'#355f4d':fill,selected?'#264a3b':stroke);
    if(text)label(ctx,text,x+w/2,y+h/2,fontSize,selected?'#fff4d5':color,opts.bold?'700':'400','center');if(pointerDown&&pointerDown.id===id&&!pointerDown.moved&&!disabled)roundRect(ctx,x+2,y+2,w-4,h-4,opts.radius??7,'#ffffff30');ctx.restore();
    buttons.push({id,x,y,w,h,fn,disabled,label:text});
  }
  function wood(x,y,w,h,dark=false){roundRect(ctx,x,y,w,h,4,dark?'#765039':'#c79963');for(let i=0;i<Math.ceil(h/33);i++){line(ctx,x+3,y+i*33+1,x+w-3,y+i*33+1,dark?'#5f3b2a':'#b78651',1);line(ctx,x+9+(i%3)*17,y+i*33+9,x+w-26,y+i*33+9,dark?'#946549':'#d9b07c',1);}}
  function ticket(x,y,w,h){roundRect(ctx,x+2,y+4,w,h,2,'#70462720');roundRect(ctx,x,y,w,h-8,2,'#fff6de');for(let i=0;i<w/12;i++)poly(ctx,[[x+i*12,y+h-8],[x+i*12+6,y+h],[x+i*12+12,y+h-8]],'#fff6de');line(ctx,x+11,y+28,x+w-11,y+28,'#dbc39a',1);}
  function world(){ctx.fillStyle='#d9be8d';ctx.fillRect(0,0,W,H);wood(0,130,W,H-130);poly(ctx,[[0,60],[115,60],[300,H],[150,H]],'#fce2ac25');}
  function header(){
    wood(0,0,W,56,true);roundRect(ctx,12,6,160,43,3,'#f4d9a7');label(ctx,'街角早餐铺',92,21,19,'#664329','700','center');label(ctx,storageWarning?'本次无法保存 · 可继续试玩':`第${state.stage+1}/50班   金币 ${progress.coins}`,92,40,storageWarning?9:10,'#8b5d34','400','center');
    button('menu','',182,0,56,56,()=>open('menu'),{fill:'#97633f',stroke:'#ae7b50'});for(let i=0;i<3;i++)line(ctx,199,19+i*10,221,19+i*10,'#fff1cd',2.5);
    button('sound','',242,0,56,56,sound,{fill:'#97633f',stroke:'#ae7b50'});poly(ctx,[[255,25],[262,25],[271,18],[271,43],[262,36],[255,36]],'#fff1cd');if(progress.sound){line(ctx,278,23,282,30,'#fff1cd',2);line(ctx,282,30,278,38,'#fff1cd',2);}else line(ctx,253,44,286,16,'#f3c9a0',2.5);
    button('help','?',302,0,56,56,()=>open('help'),{fill:'#97633f',stroke:'#ae7b50',color:'#fff1cd',size:23,bold:true});
  }
  function orderTicket(){
    const order=getOrder(state),customer=CUSTOMERS[order.customer],stage=STAGES[state.stage];
    streetArt(ctx,0,56,W,layout.queueH,state.stage%5);
    const waiting=visibleOrders(state);const shown=state.stage<5?[{...order,index:state.orderIndex}]:state.phase==='served'?[{...order,index:state.orderIndex},...waiting.slice(0,2)]:waiting.length?waiting:[{...order,index:state.orderIndex}];
    shown.slice(0,3).forEach((o,i)=>{
      const x=12+i*114,y=58,left=patienceLeft(state,o),seconds=patienceSeconds(state,o),urgent=seconds<=10,chosen=o.index===state.orderIndex;
      button(`order-${o.index}`,'',x,y,108,layout.queueH-4,()=>dispatch({type:'SELECT_ORDER',index:o.index}),{fill:chosen?'#f9e4ad':'#e8d1a5',stroke:urgent?C.coral:chosen?'#975335':'#ab8862',disabled:state.phase!=='playing'||state.dish.status==='cooking'||state.stage<5,radius:5,dimDisabled:false});
      const c=CUSTOMERS[o.customer],bounce=chosen&&state.phase==='served'?Math.sin(artTime/90)*2:0;
      avatar(ctx,o.customer,x+23,y+23+bounce,c.color,36,state.phase==='served'&&chosen?'happy':urgent?'urgent':'calm',artTime);label(ctx,c.name,x+47,y+15,12,C.ink,'700');label(ctx,`余 ${seconds} 秒`,x+47,y+35,12,urgent?C.coral:C.green,'700');
      if(left!==null)label(ctx,`开火余 ${left} 锅`,x+54,y+51,9,left<=1?C.coral:'#795b3b','700','center');
      if(layout.queueH>70){label(ctx,RECIPES[o.recipe].name,x+54,y+65,11,'#755336','400','center');{roundRect(ctx,x+9,y+75,90,4,2,'#cdb486');roundRect(ctx,x+9,y+75,90*Math.min(1,seconds*1000/patienceBudgetMs(state.stage)),4,2,urgent?C.coral:'#6d8f58');}}
    });
    if(state.stage<5){for(let k=1;k<3;k++){const o=stage.orders[state.orderIndex+k];if(!o)continue;const x=12+k*114,c=CUSTOMERS[o.customer];avatar(ctx,o.customer,x+26,81,c.color,32);label(ctx,'下一位',x+51,73,11,'#795b3b');label(ctx,c.name,x+51,91,12,'#795b3b','700');}}
    const y=layout.ticketY;ticket(12,y,336,layout.ticketH);roundRect(ctx,165,y-5,30,10,2,'#b0794a');
    label(ctx,`${RECIPES[order.recipe].name}${order.pair!==undefined&&order.pair!==null?' · 同桌'+(Math.min(state.orderIndex,order.pair)+1):''}`,25,y+14,14,C.coral,'700');
    label(ctx,state.fuel===null?`已交 ${state.servedIds.length}/${stage.orders.length}`:`炉火${state.fuel} · 本锅${fireCost(state)}`,335,y+14,11,state.fuel!==null&&state.fuel<=3?C.coral:'#795b3b','700','right');
    const message=state.phase==='served'?customer.thanks:state.feedback||`“${order.hint}”${order.pair!=null?' 同桌两份一起上。':''}`;
    wrapped(ctx,message,25,y+35,310,11,state.feedbackType==='error'&&state.phase!=='served'?C.coral:C.ink,16,2);
    const tags=[order.scallion?'加葱花':'不要葱',order.texture==='crisp'?'焦脆火候':'普通火候',order.packaging==='bag'?'打包带走':'堂食装盘'];
    tags.forEach((text,i)=>{roundRect(ctx,24+i*105,y+layout.ticketH-23,99,17,2,i===0&&!order.scallion?'#efd0b8':'#e8dfbd');label(ctx,text,73.5+i*105,y+layout.ticketH-14.5,10,i===0&&!order.scallion?C.coral:'#626344','700','center');});
  }
  function tabs(){STATIONS.forEach(([id,name],i)=>button(`tab-${id}`,name,12+i*114,layout.tabsY,108,56,()=>{station=id;},{fill:'#e8c796',stroke:'#a97949',selected:station===id,size:14,bold:true}));}
  function prepView(){
    const order=getOrder(state),recipe=RECIPES[order.recipe],top=layout.workY;
    label(ctx,recipe.ingredients.map(id=>INGREDIENTS[id]).join(' + '),18,top+10,13,'#63452d','700');
    const rowH=Math.min(82,Math.max(60,(layout.workH-28)/2)),gap=6;
    Object.keys(INGREDIENTS).forEach((id,i)=>{
      const x=12+(i%4)*86,y=top+24+Math.floor(i/4)*(rowH+gap),selected=state.dish.ingredients.includes(id);
      button(`ingredient-${id}`,'',x,y,80,rowH,()=>dispatch({type:'TOGGLE_INGREDIENT',id}),{fill:selected?'#e5dbab':'#e9e7d7',stroke:selected?'#7e8d54':'#a8aa92',disabled:state.dish.status!=='raw'||state.phase!=='playing',radius:3});
      ingredientArt(ctx,id,x+40,y+rowH*.38,.78);label(ctx,INGREDIENTS[id],x+40,y+rowH-13,13,'#594e35','700','center');if(selected){line(ctx,x+62,y+10,x+67,y+15,C.green,2.5);line(ctx,x+67,y+15,x+74,y+6,C.green,2.5);}
    });
    button('recipes','配方本',270,top+24+rowH+gap,80,rowH,()=>open('recipes'),{fill:'#a9583b',color:'#fff0cf',stroke:'#83432e',size:16,bold:true,radius:3});
    if(layout.workH>=265){roundRect(ctx,18,top+205,238,52,8,'#d7b27a','#b18451');ellipse(ctx,89,top+231,55,17,'#f4e8c5');foodArt(ctx,state.dish,89,top+229,.45);label(ctx,`已选 ${state.dish.ingredients.length} 种食材`,170,top+223,12,'#745034','700','center');label(ctx,state.dish.status==='raw'?'点食材可撤回':'熟食可倒掉重做',170,top+242,10,'#87603e','400','center');roundRect(ctx,279,top+210,29,45,5,'#8d6846');roundRect(ctx,283,top+201,21,13,2,'#5f4c38');label(ctx,'酱',293,top+235,14,'#e9c895','700','center');line(ctx,326,top+252,337,top+199,'#604d36',4);}if(layout.workH>=310)wrapped(ctx,'熟食不能退回食材。红色重做键一直都在。',20,top+284,320,13,'#755638',22,2);
  }
  function cookView(){
    const y=layout.workY,h=layout.workH,panY=y+Math.min(92,h*.42);const order=getOrder(state);
    ellipse(ctx,116,panY+10,93,Math.min(58,h*.29),'#86603f');ellipse(ctx,116,panY,87,Math.min(53,h*.27),'#2e4035');
    roundRect(ctx,190,panY-9,39,18,3,'#674730');line(ctx,198,panY-5,222,panY-5,'#9b744c',2);circle(ctx,198,panY,2,'#d0a86f');circle(ctx,221,panY,2,'#d0a86f');foodArt(ctx,state.dish,116,panY,.93);
    button('texture-soft','普通火候',240,y+5,108,56,()=>dispatch({type:'SET_TEXTURE',value:'soft'}),{fill:'#e9c794',selected:state.dish.texture==='soft',disabled:state.dish.status!=='raw'||state.phase!=='playing',size:13});
    button('texture-crisp','焦脆火候',240,y+69,108,56,()=>dispatch({type:'SET_TEXTURE',value:'crisp'}),{fill:'#e9c794',selected:state.dish.texture==='crisp',disabled:state.dish.status!=='raw'||state.phase!=='playing',size:13});
    const cooked=state.dish.status==='cooked',cooking=state.dish.status==='cooking';
    label(ctx,cooking?'滋啦滋啦，香气正好':cooked?(dishNeedsRestart(order,state.dish)?'配料不符，可免费重做':'煎好了，去出餐台装好'):'选好火候，再开火',116,Math.min(y+h-12,panY+72),12,cooked&&dishNeedsRestart(order,state.dish)?C.coral:'#694c32','700','center');
    if(cooking){for(let i=0;i<5;i++){const sy=panY-28-((cookElapsed/45+i*9)%38),sx=72+i*19;ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx-9,sy-8,sx+9,sy-12,sx+2,sy-23);ctx.strokeStyle='#fff6dfbb';ctx.lineWidth=2;ctx.stroke();}for(let i=0;i<5;i++)ellipse(ctx,82+i*18,panY+39,4,5+Math.sin(artTime/90+i)*2,'#df9a42');roundRect(ctx,29,panY+53,174,5,2,'#b18f58');roundRect(ctx,29,panY+53,174*Math.min(1,cookElapsed/RECIPES[order.recipe].cookMs),5,2,'#edba58');}
    if(h>=260){roundRect(ctx,19,y+170,322,h-184,5,'#efd1a0');wrapped(ctx,'顾客在等，注意红色倒计时。切换台面也会继续煎，打开摊位菜单则会暂停。',32,y+192,294,13,'#805d38',23,3);}
  }
  function serveView(){
    const y=layout.workY,holding=STAGES[state.stage].holding,h=holding?70:Math.min(190,layout.workH-22),disabled=state.phase!=='playing';
    label(ctx,holding?`保温位：${state.heldDish?(freshLeft(state)<0?'已凉，请取回重做':`还有 ${freshLeft(state)} 锅鲜度`):'空'}，同桌两份一起交。`:'用盘子，还是带一只纸袋？',18,y+9,12,'#63452d','700');
    for(const [i,id] of ['plate','bag'].entries()){
      const x=12+i*174,boxH=holding?56:Math.max(100,h-27);button(`package-${id}`,'',x,y+27,162,boxH,()=>dispatch({type:'SET_PACKAGING',value:id}),{fill:state.dish.packaging===id?'#e2d4a2':'#ddb985',stroke:state.dish.packaging===id?'#50694c':'#ba8f5f',disabled,radius:3});
      if(holding){label(ctx,id==='plate'?'堂食装盘':'打包带走',x+81,y+55,16,C.ink,'700','center');}
      else{if(id==='plate'){ellipse(ctx,x+81,y+72,61,30,'#f5edcf');ellipse(ctx,x+81,y+72,47,21,'#d9dfc2');foodArt(ctx,state.dish,x+81,y+68,.54);}else{roundRect(ctx,x+48,y+44,66,66,3,'#b77c43');poly(ctx,[[x+48,y+44],[x+59,y+35],[x+112,y+35],[x+114,y+44]],'#cd995b');label(ctx,'早',x+81,y+78,26,'#f2d5a2','700','center');}label(ctx,id==='plate'?'堂食装盘':'打包带走',x+81,y+boxH+11,14,C.ink,'700','center');}
    }
    if(holding){button('hold','放入保温位',12,y+91,162,56,()=>dispatch({type:'HOLD'}),{disabled:disabled||state.dish.status!=='cooked'||!!state.heldDish,fill:'#dca76a',size:15});button('take-held',state.dish.status==='cooked'?'交换两份餐':'取回保温餐',186,y+91,162,56,()=>dispatch({type:'TAKE_HELD'}),{disabled:disabled||!state.heldDish||state.dish.status==='cooking'||(state.dish.status==='raw'&&state.dish.ingredients.length>0),fill:'#dca76a',size:15});if(layout.workH>240){roundRect(ctx,24,y+166,312,75,8,'#b99161');ellipse(ctx,180,y+207,79,25,'#f3e2b6');if(state.heldDish)foodArt(ctx,state.heldDish,180,y+203,.7);}}
    else if(layout.workH>=280)wrapped(ctx,'出餐前看票据。配料、火候不对就倒掉重做，包装不对直接换。',20,y+215,320,13,'#755638',23,3);
  }
  function footer(){
    const y=H-68,served=state.phase==='served';wood(0,y-8,W,82,true);
    button('clear',served?'收拾台面':state.dish.status==='raw'?'清空食材':'倒掉重做',12,y,110,62,()=>dispatch({type:'CLEAR'}),{fill:C.coral,color:'#fff1d2',stroke:'#7d3b27',size:16,bold:true});
    label(ctx,state.stage<10?'不扣分':'炉火不返还',67,y+51,10,'#f1c5aa','400','center');
    if(served)button('serve',state.servedIds.length===STAGES[state.stage].orders.length?'收摊结算':'请下一位',132,y,216,62,()=>dispatch({type:'NEXT_ORDER'}),{fill:C.green,color:C.paper,stroke:'#294938',size:18,bold:true});
    else if(station==='prep')button('go-cook','拿到铁锅台',132,y,216,62,()=>{station='cook';},{fill:'#f2ce83',color:'#694322',stroke:'#bc8c45',size:18,bold:true});
    else if(station==='cook'&&state.dish.status==='cooked')button('go-serve','拿到出餐台',132,y,216,62,()=>{station='serve';},{fill:'#f2ce83',color:'#694322',stroke:'#bc8c45',size:18,bold:true});
    else if(station==='cook')button('cook',state.dish.status==='cooking'?'正在煎制':state.fuel===null?'开火煎制':`开火煎制 · ${fireCost(state)}炉火`,132,y,216,62,()=>dispatch({type:'COOK'}),{fill:'#f2ce83',color:'#694322',stroke:'#bc8c45',disabled:state.dish.status!=='raw',size:18,bold:true});
    else button('serve','递给客人',132,y,216,62,()=>dispatch({type:'SERVE'}),{fill:C.green,color:C.paper,stroke:'#294938',size:18,bold:true});
  }
  function playView(){world();header();orderTicket();tabs();if(station==='prep')prepView();else if(station==='cook')cookView();else serveView();footer();}
  function paper(title,subtitle='街角早餐铺'){
    world();ctx.fillStyle='#442d2499';ctx.fillRect(0,0,W,H);ticket(12,15,336,H-30);roundRect(ctx,154,8,52,18,2,'#a77743');label(ctx,subtitle,30,49,12,'#98734e');label(ctx,title,30,82,23,C.ink,'700');buttons=[];
  }
  function backButton(id='close',text='回到早餐铺'){button(id,text,24,H-78,312,56,close,{fill:C.green,color:C.paper,stroke:'#35523d',size:15,bold:true});}
  function modalView(){
    const stage=STAGES[state.stage];if(screen==='play')return;
    if(screen==='welcome'){
      world();streetArt(ctx,0,150,W,Math.max(120,Math.min(270,H-380)),state.stage%5);buttons=[];header();label(ctx,'一口热乎的',180,94,28,'#744b2c','700','center');label(ctx,'一条街的早安',180,130,28,'#744b2c','700','center');
      wrapped(ctx,'50个清晨，一口热锅。听清口味，也照顾排队等候的街坊。',27,H-204,306,15,'#5e442c',25,3);
      if(sidebarState.available)button('sidebar-welcome','从侧边栏再来',24,H-154,312,56,()=>{sidebarMessage='';open('sidebar');},{fill:'#e7cda1',color:C.green,size:14});
      button('start',progress.unlocked?'继续开门营业':'开门营业',24,H-84,312,64,()=>beginStage(progress.unlocked),{fill:C.coral,color:C.paper,stroke:'#8d442d',size:21,bold:true});
    }else if(screen==='day'){
      world();streetArt(ctx,0,0,W,Math.min(260,H*.43),state.stage%5);buttons=[];label(ctx,`第 ${state.stage+1} / 50 班 · ${state.stage<5?'入门':state.stage<10?'正常体验':'调度挑战'}`,24,Math.min(295,H*.48),14,'#7d5733');wrapped(ctx,stage.title,24,Math.min(334,H*.55),312,27,C.ink,34,2);wrapped(ctx,stage.note,24,Math.min(380,H*.63),312,13,'#6e4e31',21,4);
      button('open-day',`系好围裙，做 ${stage.orders.length} 份早餐`,24,H-84,312,64,()=>{screen='play';station='prep';},{fill:C.green,color:C.paper,stroke:'#35523d',size:17,bold:true});
    }else if(screen==='menu'){
      wood(0,0,W,H,true);roundRect(ctx,12,12,336,H-24,8,'#274b3c','#c3975d');buttons=[];label(ctx,'摊位小黑板 · 已暂停',29,49,25,'#f6e6bd','700');button('close-menu','返回',280,22,56,56,close,{fill:'#3f6650',color:C.paper,stroke:'#75916c',size:13});
      const items=[['help','老板教学',()=>open('help')],['recipes','翻开配方本',()=>open('recipes')],['chapters','50班手账',()=>{chapterPage=Math.floor(state.stage/6);open('chapters');}],['tools','街坊工具箱',()=>open('tools')],['sound',progress.sound?'声音：开':'声音：关',sound],['restart','重开这一班',()=>open('restart')]];
      items.forEach(([id,text,fn],i)=>button(id,text,24+(i%2)*162,110+Math.floor(i/2)*80,150,70,fn,{fill:'#3f6650',color:C.paper,stroke:'#6b8969',size:16}));
      if(sidebarState.available)button('sidebar-open','从侧边栏再来',24,358,312,56,()=>{sidebarMessage='';open('sidebar');},{fill:'#3f6650',color:C.paper,stroke:'#6b8969'});
    }else if(screen==='help'){
      paper('三个台面，一份心意','老板手写的开摊贴士');
      const tips=[['先看队伍','点顾客切单；看实时秒数，红色急客优先；到零本班失败。'],['铁锅台','选火候、开火。换台面不打断加热。'],['出餐台','选盘子或纸袋，确认口味后递给客人。'],['高峰有章法','菜单/配方本及切后台暂停计时；31班起同桌一起上。']];tips.forEach(([a,b],i)=>{label(ctx,a,29,126+i*70,16,C.coral,'700');wrapped(ctx,b,29,151+i*70,300,13,C.ink,20,2);});backButton('close-help','系好围裙，知道啦');
    }else if(screen==='recipes'){
      paper('摊主的配方本','葱花按票据另加');Object.values(RECIPES).forEach((r,i)=>{const y=119+i*105;line(ctx,26,y+78,334,y+78,'#d9b98a');foodArt(ctx,{ingredients:r.ingredients,status:'cooked',texture:'soft'},77,y+31,.59);label(ctx,r.name,137,y+11,17,C.ink,'700');wrapped(ctx,r.ingredients.map(id=>INGREDIENTS[id]).join(' + '),137,y+38,190,13,'#8b6541',21,2);});backButton('close-recipes','合上配方本');
    }else if(screen==='chapters'){
      paper('五十个清晨的手账',`第 ${chapterPage+1} / 9 页 · 换班会重新开始`);
      STAGES.slice(chapterPage*6,chapterPage*6+6).forEach((st,k)=>{const i=chapterPage*6+k,x=24+(k%2)*162,y=118+Math.floor(k/2)*70;button(`chapter-${i}`,'',x,y,150,62,()=>beginStage(i),{fill:i===state.stage?'#eed9ad':'#f5e4bf',stroke:'#ccb084',disabled:i>progress.unlocked,radius:3});label(ctx,`第 ${i+1} 班`,x+12,y+15,13,C.coral,'700');label(ctx,st.title,x+12,y+35,11,C.ink,'700');label(ctx,i>progress.unlocked?'先完成前一班':`心意星 ${progress.stars[i]}/3`,x+12,y+51,10,'#8c765a');});
      button('page-prev','上一页',24,338,150,56,()=>chapterPage=Math.max(0,chapterPage-1),{disabled:chapterPage===0,fill:'#e8cf9f'});button('page-next','下一页',186,338,150,56,()=>chapterPage=Math.min(8,chapterPage+1),{disabled:chapterPage===8,fill:'#e8cf9f'});backButton('close-chapters','收好手账，回到刚才');
    }else if(screen==='tools'){
      paper('街坊工具箱',`金币 ${progress.coins} · 只在游戏内使用，没有现金购买`);
      for(const [i,kind] of ['fuel','tea'].entries()){const y=124+i*112;label(ctx,kind==='fuel'?'小炭包：炉火 +3':'街坊茶：耐心 +20秒及2锅',28,y,16,C.ink,'700');label(ctx,`库存 ${progress.tools[kind]}/3 · 每班最多用1个 · 11班起可用`,28,y+24,10,'#8c765a');button(`buy-${kind}`,`18金币买1个`,24,y+43,150,56,()=>{const next=buyTool(progress,kind);if(next!==progress&&save(next))progress=next;},{disabled:progress.coins<18||progress.tools[kind]>=3,fill:'#e4bb6f'});button(`use-${kind}`,'这班使用',186,y+43,150,56,()=>useTool(kind),{disabled:state.phase!=='playing'||state.stage<10||!progress.tools[kind]||state.toolsUsed[kind]>=1,fill:C.green,color:C.paper});}
      wrapped(ctx,'未通关就刷新或重开，会退回本班所用工具和续摊金币；通关后正常消耗。',28,366,302,12,'#8c765a',18,2);backButton('close-tools');
    }else if(screen==='failure'){
      paper('这班先歇一歇',`第 ${state.stage+1} 班 · ${state.failure?.code==='fuel'?'炉火耗尽':state.failure?.code==='cold'?'早餐放凉了':'排队安排失误'}`);
      wrapped(ctx,state.failure?.message||'这一班没有完成。',26,126,306,15,C.ink,24,3);
      wrapped(ctx,rewardMessage||`可续摊一次：炉火+4、耐心+25秒及2锅、现有熟食重新保温。已用 ${state.revives}/1。`,26,211,306,12,C.coral,20,3);
      const reward=platform.rewards?.getState();button('revive-ad',reward?.mode==='mock'?'模拟广告续摊':'广告续摊预留（未接入）',24,H-214,312,56,requestRevive,{disabled:state.revives>=1||!reward?.available,fill:'#e7cda1',color:C.ink,size:15});
      button('revive-coins',`30金币续摊 · 现有 ${progress.coins}`,24,H-146,312,56,reviveWithCoins,{disabled:state.revives>=1||progress.coins<30,fill:'#e2b664',size:15});button('retry-free','免费重开这一班',24,H-78,312,56,()=>beginStage(state.stage),{fill:C.green,color:C.paper,size:17,bold:true});
    }else if(screen==='reward'){
      const mock=platform.rewards?.getState().mode==='mock';paper(mock?'模拟广告 · 非真实广告':'正在请求激励视频',mock?'测试入口，无真实广告':'仅完整观看后的关闭回调可以续摊');
      wrapped(ctx,'只有选择“模拟完整看完”才续摊。关闭、失败或切换新一班都不会领取奖励。',26,130,306,14,C.ink,23,3);
      if(mock)[['completed','模拟完整看完'],['cancelled','模拟提前关闭'],['unavailable','模拟无填充'],['error','模拟异常']].forEach(([status,title],i)=>button(`mock-${status}`,title,24+(i%2)*162,216+Math.floor(i/2)*70,150,60,()=>platform.rewards?.resolveMock?.(status),{fill:status==='completed'?C.green:'#e7cda1',color:status==='completed'?C.paper:C.ink,size:13}));
      button('reward-retry','跳过模拟，免费重开',24,H-146,312,56,()=>beginStage(state.stage),{fill:'#e7cda1'});button('reward-cancel','不看，回到刚才',24,H-78,312,56,()=>{platform.rewards?.cancel();screen='failure';},{fill:C.green,color:C.paper});
    }else if(screen==='restart'){
      paper('重新开张今天？','不会清除已解锁关卡或最佳成绩');wrapped(ctx,'今天的订单和得分会重置。本班已用工具及续摊金币会退回，通关消耗不退。放错食材只需回台面点“倒掉重做”。',26,142,306,16,C.ink,28,6);button('confirm-restart','确定重新开张',24,H-146,312,56,()=>beginStage(state.stage),{fill:C.coral,color:C.paper,size:16,bold:true});backButton('cancel-restart','不重开，回到刚才');
    }else if(screen==='sidebar'){
      paper('下次早安，从这里开始','抖音侧边栏 · 可选入口');wrapped(ctx,'通过抖音侧边栏可以再找到早餐铺。这里不发放奖励，也不会改变分数或进度。',26,139,306,15,C.ink,26,4);
      wrapped(ctx,sidebarState.enteredFromSidebar?'本次确实从侧边栏回到早餐铺，欢迎回来。':sidebarMessage||(sidebarState.pending?'正在请求打开侧边栏。':sidebarState.available?'点下面的按钮前往。':'当前环境暂不支持，仍可正常游玩。'),26,266,306,14,C.green,25,4);
      button('sidebar-navigate',sidebarState.pending?'正在打开':'前往抖音侧边栏',24,H-146,312,56,()=>{sidebarMessage='';platform.sidebar.navigate().then(ok=>{if(!alive)return;sidebarMessage=ok?'已请求打开；返回后继续游玩。':'本次未完成跳转，仍可正常游玩。';redraw();});},{fill:C.green,color:C.paper,disabled:!sidebarState.available||sidebarState.pending,size:16});backButton('close-sidebar');
    }else if(screen==='result'){
      paper('今日收摊小票',`第 ${state.stage+1} 天 · ${stage.title}`);label(ctx,'心意收成',180,122,13,'#926b45','400','center');label(ctx,String(state.score),180,172,54,C.coral,'700','center');label(ctx,`心意星 ${stageStars(state)} / 3   ·   金币 +${earnedCoins}`,180,218,15,C.green,'700','center');line(ctx,27,245,333,245,'#ccb084');wrapped(ctx,stage.ending,28,H<560?262:273,304,H<560?14:15,C.ink,H<560?23:26,3);
      button('next-stage',state.stage===49?'收好50班的街坊回忆':'明天继续开张',24,H-146,312,56,()=>{if(state.stage===49)screen='ending';else beginStage(state.stage+1);},{fill:C.coral,color:C.paper,size:17,bold:true});button('replay-stage','今天再做一次',24,H-78,312,56,()=>beginStage(state.stage),{fill:'#e8cf9f',color:C.ink,size:15});
    }else if(screen==='ending'){
      world();streetArt(ctx,0,0,W,Math.min(275,H*.44),4);buttons=[];label(ctx,'早安，老朋友。',24,H*.51,29,C.ink,'700');wrapped(ctx,'50个清晨，热气一直在。',24,H*.59,312,17,C.ink,28,3);label(ctx,`手账里收好了 ${progress.stars.reduce((a,b)=>a+b,0)} 颗心意星`,24,H-140,14,C.coral,'700');button('replay-all','挑一个清晨，再见老朋友',24,H-84,312,64,()=>{chapterPage=0;open('chapters');},{fill:C.green,color:C.paper,size:17,bold:true});
    }
  }
  function metrics(){
    size=platform.getSize();const i=size.safeInsets||{},left=Math.max(0,i.left||0),right=Math.max(0,i.right||0),top=Math.max(0,i.top||0),bottom=Math.max(0,i.bottom||0);
    zoom=Math.min((size.width-left-right)/W,(size.height-top-bottom)/500);ox=left+(size.width-left-right-W*zoom)/2;oy=top;H=(size.height-top-bottom)/zoom;
    const compact=H<600,queueH=compact?60:90,ticketY=56+queueH+4,ticketH=compact?80:102,tabsY=ticketY+ticketH+6,workY=tabsY+62;
    layout={queueH,ticketY,ticketH,tabsY,workY,workH:H-80-workY,safeInsets:{left,right,top,bottom}};
  }
  function draw(now=0){
    if(!alive)return;artTime=now;metrics();const dpr=size.dpr||1;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#d9bd87';ctx.fillRect(0,0,size.width,size.height);streetArt(ctx,0,0,size.width,size.height,state.stage%5);ctx.save();ctx.translate(ox,oy);ctx.scale(zoom,zoom);ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();buttons=[];if(screen==='play')playView();else modalView();ctx.restore();
    if(!paused){const dt=lastFrame?Math.max(0,now-lastFrame):0;if(screen==='play')dispatch({type:'TICK',ms:dt});if(state.dish.status==='cooking'&&screen==='play'){cookElapsed+=dt;if(cookElapsed>=(state.dish.cookMs||RECIPES[getOrder(state).recipe].cookMs))dispatch({type:'COOK_DONE',token:activeToken});}}
    lastFrame=now;if(!paused)frameId=platform.requestFrame(draw);
  }
  function redraw(){if(frameId!==undefined)platform.cancelFrame(frameId);draw(lastFrame);}
  unsubscribers.push(platform.onPointer(event=>{
    if(paused||!alive)return;const x=(event.x-ox)/zoom,y=(event.y-oy)/zoom;const hit=[...buttons].reverse().find(b=>!b.disabled&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if(event.type==='down'&&!pointerDown)pointerDown=hit?{id:hit.id,pointer:event.id,x,y}:null;
    if(event.type==='move'&&pointerDown?.pointer===event.id&&Math.hypot(x-pointerDown.x,y-pointerDown.y)*zoom>12)pointerDown.moved=true;
    if(event.type==='cancel'&&pointerDown?.pointer===event.id)pointerDown=null;
    if(event.type==='up'&&pointerDown?.pointer===event.id){const start=pointerDown;pointerDown=null;if(hit&&!start.moved&&start.id===hit.id&&Math.hypot(x-start.x,y-start.y)*zoom<=12){platform.audio.play('tap');hit.fn();redraw();}}
  }));
  unsubscribers.push(platform.onResize(()=>{pointerDown=null;redraw();}));
  unsubscribers.push(platform.onPause(()=>{paused=true;pointerDown=null;lastFrame=0;platform.cancelFrame(frameId);}));
  unsubscribers.push(platform.onResume(()=>{paused=false;lastFrame=0;redraw();}));
  if(platform.sidebar)unsubscribers.push(platform.sidebar.subscribe(next=>{sidebarState=next;redraw();}));
  draw();return{destroy(){alive=false;platform.rewards?.cancel();platform.cancelFrame(frameId);unsubscribers.forEach(fn=>fn());},inspect(){return JSON.parse(JSON.stringify({state,screen,station,progress,storageWarning,sidebarState,sidebarMessage,rewardPending:!!rewardPending,rewardMessage,rewardState:platform.rewards?.getState(),buttons:buttons.map(({id,x,y,w,h,disabled,label})=>({id,x,y,w,h,disabled,label})),viewport:{zoom,ox,oy,width:W,height:H},layout}));}};
}
