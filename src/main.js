import { INGREDIENTS, RECIPES, CUSTOMERS, STAGES, initialState, getOrder, requiredIngredients, dishNeedsRestart, reduce, parseProgress, recordStage, stageStars } from '../game.js';
import { C, roundRect, circle, ellipse, line, poly, label, wrapped, ingredientArt, foodArt, avatar, streetArt } from './canvas-art.js';

const SAVE_KEY = 'street-breakfast-shop:progress:v1';
const W = 360;
const STATIONS = [['prep','备料台'],['cook','铁锅台'],['serve','出餐台']];
/** Full-screen game world. No gameplay DOM; width-based layout preserves physical touch targets. */
export function startGame(platform) {
  const ctx=platform.canvas.getContext('2d');
  let progress=parseProgress(null),storageWarning=false;
  try{progress=parseProgress(platform.storage.getItem(SAVE_KEY));}catch{storageWarning=true;}
  let state=initialState(progress.unlocked),screen='welcome',station='prep',trail=[];
  let size=platform.getSize(),zoom=1,ox=0,oy=0,H=780,layout={},buttons=[],frameId,alive=true,paused=false,lastFrame=0,cookElapsed=0,activeToken=-1,pointerDown=null;
  let sidebarState=platform.sidebar?.getState()||{available:false,checked:true,enteredFromSidebar:false,pending:false,error:null},sidebarMessage='';
  const unsubscribers=[];
  platform.audio.setMuted(!progress.sound);
  const save=()=>{try{platform.storage.setItem(SAVE_KEY,JSON.stringify(progress));}catch{storageWarning=true;}};
  function dispatch(action){
    const old=state;state=reduce(state,action);
    if(action.type==='COOK'&&state.dish.status==='cooking'&&old.dish.status!=='cooking'){cookElapsed=0;activeToken=state.dish.token;platform.audio.play('cook');}
    if(['CLEAR','RESTART_STAGE','NEXT_STAGE','NEXT_ORDER'].includes(action.type)){cookElapsed=0;activeToken=-1;if(state.phase==='playing')station='prep';}
    if(action.type==='SERVE')platform.audio.play(state.phase==='served'?'success':'error');
    if(state.phase==='stageComplete'&&old.phase!=='stageComplete'){progress=recordStage(progress,state);save();screen='result';trail=[];platform.audio.play('complete');}
  }
  function open(name){trail.push(screen);screen=name;pointerDown=null;}
  function close(){screen=trail.pop()||'play';pointerDown=null;}
  function beginStage(index){state=index===state.stage?reduce(state,{type:'RESTART_STAGE'}):initialState(index);station='prep';screen='day';trail=[];cookElapsed=0;activeToken=-1;pointerDown=null;}
  function sound(){progress.sound=!progress.sound;platform.audio.setMuted(!progress.sound);save();}
  function button(id,text,x,y,w,h,fn,opts={}){
    const{fill=C.paper,color=C.ink,stroke=C.line,disabled=false,selected=false,size:fontSize=14}=opts;
    ctx.save();if(disabled)ctx.globalAlpha=.46;
    roundRect(ctx,x,y+3,w,h,opts.radius??7,'#70432433');
    roundRect(ctx,x,y,w,h,opts.radius??7,selected?'#355f4d':fill,selected?'#264a3b':stroke);
    if(text)label(ctx,text,x+w/2,y+h/2,fontSize,selected?'#fff4d5':color,opts.bold?'700':'400','center');ctx.restore();
    buttons.push({id,x,y,w,h,fn,disabled,label:text});
  }
  function wood(x,y,w,h,dark=false){roundRect(ctx,x,y,w,h,4,dark?'#765039':'#c79963');for(let i=0;i<Math.ceil(h/33);i++){line(ctx,x+3,y+i*33+1,x+w-3,y+i*33+1,dark?'#5f3b2a':'#b78651',1);line(ctx,x+9+(i%3)*17,y+i*33+9,x+w-26,y+i*33+9,dark?'#946549':'#d9b07c',1);}}
  function ticket(x,y,w,h){roundRect(ctx,x+2,y+4,w,h,2,'#70462720');roundRect(ctx,x,y,w,h-8,2,'#fff6de');for(let i=0;i<w/12;i++)poly(ctx,[[x+i*12,y+h-8],[x+i*12+6,y+h],[x+i*12+12,y+h-8]],'#fff6de');line(ctx,x+11,y+28,x+w-11,y+28,'#dbc39a',1);}
  function world(){ctx.fillStyle='#d9be8d';ctx.fillRect(0,0,W,H);wood(0,130,W,H-130);poly(ctx,[[0,60],[115,60],[300,H],[150,H]],'#fce2ac25');}
  function header(){
    wood(0,0,W,62,true);roundRect(ctx,12,11,160,40,3,'#f4d9a7');label(ctx,'街角早餐铺',92,25,19,'#664329','700','center');label(ctx,storageWarning?'本次无法保存 · 可继续试玩':`第${state.stage+1}天  心意${state.score}  连评${state.combo}`,92,44,storageWarning?9:10,'#8b5d34','400','center');
    button('menu','',182,3,56,56,()=>open('menu'),{fill:'#97633f',stroke:'#ae7b50'});for(let i=0;i<3;i++)line(ctx,199,19+i*10,221,19+i*10,'#fff1cd',2.5);
    button('sound','',242,3,56,56,sound,{fill:'#97633f',stroke:'#ae7b50'});poly(ctx,[[255,25],[262,25],[271,18],[271,43],[262,36],[255,36]],'#fff1cd');if(progress.sound){line(ctx,278,23,282,30,'#fff1cd',2);line(ctx,282,30,278,38,'#fff1cd',2);}else line(ctx,253,44,286,16,'#f3c9a0',2.5);
    button('help','?',302,3,56,56,()=>open('help'),{fill:'#97633f',stroke:'#ae7b50',color:'#fff1cd',size:23,bold:true});
  }
  function orderTicket(){
    const order=getOrder(state),customer=CUSTOMERS[order.customer],stage=STAGES[state.stage];
    streetArt(ctx,0,62,W,layout.sceneH,state.stage);
    avatar(ctx,order.customer,37,62+layout.sceneH*.48,customer.color,54);
    roundRect(ctx,235,66,112,Math.max(42,layout.sceneH-12),3,'#42634f');label(ctx,`第${state.stage+1}天 · ${stage.time}`,291,81,11,'#f5e8bd','400','center');if(layout.sceneH>52)label(ctx,`心意 ${state.score}  /  ${state.orderIndex+1}单`,291,102,11,'#e1d6af','400','center');
    const y=layout.ticketY;ticket(12,y,336,112);roundRect(ctx,165,y-6,30,13,2,'#b0794a');
    label(ctx,`${customer.name} · ${customer.role}`,25,y+16,11,'#8b7054');label(ctx,RECIPES[order.recipe].name,335,y+16,15,C.coral,'700','right');
    const message=state.phase==='served'?customer.thanks:state.feedback||`“${order.hint}”`;
    wrapped(ctx,message,25,y+43,310,12,state.feedbackType==='error'&&state.phase!=='served'?C.coral:C.ink,18,2);
    const tags=[order.scallion?'加葱花':'不要葱',order.texture==='crisp'?'焦脆火候':'普通火候',order.packaging==='bag'?'打包带走':'堂食装盘'];
    tags.forEach((text,i)=>{roundRect(ctx,24+i*105,y+81,99,20,2,i===0&&!order.scallion?'#efd0b8':'#e8dfbd');label(ctx,text,73.5+i*105,y+91,11,i===0&&!order.scallion?C.coral:'#626344','700','center');});
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
    if(layout.workH>=280)wrapped(ctx,state.dish.status==='raw'?'点一下加入，再点可撤回。锅台在上方第二块木牌。':'熟食不退回食材盒。做错了，随时点下方红色“倒掉重做”。',20,top+rowH*2+gap+48,320,13,'#755638',22,3);
  }
  function cookView(){
    const y=layout.workY,h=layout.workH,panY=y+Math.min(92,h*.42);const order=getOrder(state);
    ellipse(ctx,116,panY+10,93,Math.min(58,h*.29),'#86603f');ellipse(ctx,116,panY,87,Math.min(53,h*.27),'#2e4035');
    roundRect(ctx,190,panY-9,39,18,3,'#674730');foodArt(ctx,state.dish,116,panY,.93);
    button('texture-soft','普通火候',240,y+5,108,56,()=>dispatch({type:'SET_TEXTURE',value:'soft'}),{fill:'#e9c794',selected:state.dish.texture==='soft',disabled:state.dish.status!=='raw'||state.phase!=='playing',size:13});
    button('texture-crisp','焦脆火候',240,y+69,108,56,()=>dispatch({type:'SET_TEXTURE',value:'crisp'}),{fill:'#e9c794',selected:state.dish.texture==='crisp',disabled:state.dish.status!=='raw'||state.phase!=='playing',size:13});
    const cooked=state.dish.status==='cooked',cooking=state.dish.status==='cooking';
    label(ctx,cooking?'滋啦滋啦，香气正好':cooked?(dishNeedsRestart(order,state.dish)?'配料不符，可免费重做':'煎好了，去出餐台装好'):'选好火候，再开火',116,Math.min(y+h-12,panY+72),12,cooked&&dishNeedsRestart(order,state.dish)?C.coral:'#694c32','700','center');
    if(cooking){for(let i=0;i<3;i++){const sy=panY-40-((cookElapsed/70+i*8)%18);line(ctx,92+i*20,sy,97+i*20,sy-13,'#f6e9c8',2);}roundRect(ctx,29,panY+53,174,5,2,'#b18f58');roundRect(ctx,29,panY+53,174*Math.min(1,cookElapsed/RECIPES[order.recipe].cookMs),5,2,'#edba58');}
    if(h>=260){roundRect(ctx,19,y+170,322,h-184,5,'#efd1a0');wrapped(ctx,'这口锅不催你。切换台面也会继续煎，打开摊位菜单则会暂停。',32,y+192,294,13,'#805d38',23,3);}
  }
  function serveView(){
    const y=layout.workY,h=Math.min(190,layout.workH-22),disabled=state.phase!=='playing';
    label(ctx,'用盘子，还是带一只纸袋？',18,y+9,13,'#63452d','700');
    for(const [i,id] of ['plate','bag'].entries()){
      const x=12+i*174;button(`package-${id}`,'',x,y+27,162,Math.max(100,h-27),()=>dispatch({type:'SET_PACKAGING',value:id}),{fill:state.dish.packaging===id?'#e2d4a2':'#ddb985',stroke:state.dish.packaging===id?'#50694c':'#ba8f5f',disabled,radius:3});
      if(id==='plate'){ellipse(ctx,x+81,y+72,61,30,'#f5edcf');ellipse(ctx,x+81,y+72,47,21,'#d9dfc2');foodArt(ctx,state.dish,x+81,y+68,.54);}
      else{roundRect(ctx,x+48,y+44,66,66,3,'#b77c43');poly(ctx,[[x+48,y+44],[x+59,y+35],[x+112,y+35],[x+114,y+44]],'#cd995b');line(ctx,x+66,y+53,x+66,y+40,'#684b30',2);line(ctx,x+96,y+53,x+96,y+40,'#684b30',2);label(ctx,'早',x+81,y+78,26,'#f2d5a2','700','center');}
      label(ctx,id==='plate'?'堂食装盘':'打包带走',x+81,y+Math.max(100,h-27)+11,14,C.ink,'700','center');
    }
    if(layout.workH>=280)wrapped(ctx,'出餐前看一眼订单。配料、火候不对就免费重做，包装不对直接换。',20,y+215,320,13,'#755638',23,3);
  }
  function footer(){
    const y=H-74,served=state.phase==='served';wood(0,y-8,W,82,true);
    button('clear',served?'收拾台面':state.dish.status==='raw'?'清空食材':'倒掉重做',12,y,110,62,()=>dispatch({type:'CLEAR'}),{fill:C.coral,color:'#fff1d2',stroke:'#7d3b27',size:16,bold:true});
    label(ctx,'不扣分',67,y+51,10,'#f1c5aa','400','center');
    if(served)button('serve',state.orderIndex+1===STAGES[state.stage].orders.length?'收摊结算':'请下一位',132,y,216,62,()=>dispatch({type:'NEXT_ORDER'}),{fill:C.green,color:C.paper,stroke:'#294938',size:18,bold:true});
    else if(station==='prep')button('go-cook','拿到铁锅台',132,y,216,62,()=>{station='cook';},{fill:'#f2ce83',color:'#694322',stroke:'#bc8c45',size:18,bold:true});
    else if(station==='cook'&&state.dish.status==='cooked')button('go-serve','拿到出餐台',132,y,216,62,()=>{station='serve';},{fill:'#f2ce83',color:'#694322',stroke:'#bc8c45',size:18,bold:true});
    else if(station==='cook')button('cook',state.dish.status==='cooking'?'正在煎制':'开火煎制',132,y,216,62,()=>dispatch({type:'COOK'}),{fill:'#f2ce83',color:'#694322',stroke:'#bc8c45',disabled:state.dish.status!=='raw',size:18,bold:true});
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
      world();streetArt(ctx,0,150,W,Math.max(120,Math.min(270,H-380)),state.stage);buttons=[];header();label(ctx,'一口热乎的',180,94,28,'#744b2c','700','center');label(ctx,'一条街的早安',180,130,28,'#744b2c','700','center');
      wrapped(ctx,'听清街坊的口味，在三个台面间做一份刚刚好的早餐。',27,H-204,306,15,'#5e442c',25,3);
      if(sidebarState.available)button('sidebar-welcome','从侧边栏再来',24,H-154,312,56,()=>{sidebarMessage='';open('sidebar');},{fill:'#e7cda1',color:C.green,size:14});
      button('start',progress.unlocked?'继续开门营业':'开门营业',24,H-84,312,64,()=>{screen='day';trail=[];},{fill:C.coral,color:C.paper,stroke:'#8d442d',size:21,bold:true});
    }else if(screen==='day'){
      world();streetArt(ctx,0,0,W,Math.min(260,H*.43),state.stage);buttons=[];label(ctx,`第 ${state.stage+1} 个清晨`,24,Math.min(295,H*.48),14,'#7d5733');wrapped(ctx,stage.title,24,Math.min(334,H*.55),312,27,C.ink,34,2);wrapped(ctx,stage.note,24,Math.min(390,H*.65),312,15,'#6e4e31',24,3);
      button('open-day',`系好围裙，做 ${stage.orders.length} 份早餐`,24,H-84,312,64,()=>{screen='play';station='prep';},{fill:C.green,color:C.paper,stroke:'#35523d',size:17,bold:true});
    }else if(screen==='menu'){
      wood(0,0,W,H,true);roundRect(ctx,12,12,336,H-24,8,'#274b3c','#c3975d');buttons=[];label(ctx,'摊位小黑板',29,49,25,'#f6e6bd','700');button('close-menu','返回',280,22,56,56,close,{fill:'#3f6650',color:C.paper,stroke:'#75916c',size:13});
      const items=[['help','老板教学',()=>open('help')],['recipes','翻开配方本',()=>open('recipes')],['chapters','挑一个清晨',()=>open('chapters')],['sound',progress.sound?'声音：开':'声音：关',sound],['restart','重开今天',()=>open('restart')]];
      if(sidebarState.available)items.push(['sidebar-open','从侧边栏再来',()=>{sidebarMessage='';open('sidebar');}]);
      items.forEach(([id,text,fn],i)=>button(id,text,25,97+i*64,310,56,fn,{fill:'#3f6650',color:C.paper,stroke:'#6b8969',size:17}));
    }else if(screen==='help'){
      paper('三个台面，一份心意','老板手写的开摊贴士');
      const tips=[['备料台','照票据与配方点食材，再点可以撤回。'],['铁锅台','选火候、开火。换台面不打断加热。'],['出餐台','选盘子或纸袋，确认口味后递给客人。'],['做错也不慌','底部红色按钮随时免费重做，不换顾客。']];tips.forEach(([a,b],i)=>{label(ctx,a,29,126+i*70,16,C.coral,'700');wrapped(ctx,b,29,151+i*70,300,13,C.ink,20,2);});backButton('close-help','系好围裙，知道啦');
    }else if(screen==='recipes'){
      paper('摊主的配方本','葱花按票据另加');Object.values(RECIPES).forEach((r,i)=>{const y=119+i*105;line(ctx,26,y+78,334,y+78,'#d9b98a');foodArt(ctx,{ingredients:r.ingredients,status:'cooked',texture:'soft'},77,y+31,.59);label(ctx,r.name,137,y+11,17,C.ink,'700');wrapped(ctx,r.ingredients.map(id=>INGREDIENTS[id]).join(' + '),137,y+38,190,13,'#8b6541',21,2);});backButton('close-recipes','合上配方本');
    }else if(screen==='chapters'){
      paper('五个清晨的手账','换关卡会重新开始当天');STAGES.forEach((s,i)=>{const y=106+i*62;button(`chapter-${i}`,'',24,y,312,56,()=>beginStage(i),{fill:i===state.stage?'#eed9ad':'#f5e4bf',stroke:'#ccb084',disabled:i>progress.unlocked,radius:3});label(ctx,`第${i+1}天`,39,y+20,13,C.coral,'700');label(ctx,s.title,103,y+20,16,C.ink,'700');label(ctx,i>progress.unlocked?'下一次早安，等前一天完成':`心意星 ${progress.stars[i]} / 3    最佳 ${progress.best[i]}`,103,y+43,11,'#8c765a');});backButton('close-chapters','收好手账，回到刚才');
    }else if(screen==='restart'){
      paper('重新开张今天？','不会清除已解锁关卡或最佳成绩');wrapped(ctx,'今天尚未结束的订单和当前得分会重置。只是放错食材的话，回到台面点“倒掉重做”即可，不需要重开。',26,142,306,16,C.ink,28,6);button('confirm-restart','确定重新开张',24,H-146,312,56,()=>beginStage(state.stage),{fill:C.coral,color:C.paper,size:16,bold:true});backButton('cancel-restart','不重开，回到刚才');
    }else if(screen==='sidebar'){
      paper('下次早安，从这里开始','抖音侧边栏 · 可选入口');wrapped(ctx,'通过抖音侧边栏可以再找到早餐铺。这里不发放奖励，也不会改变分数或进度。',26,139,306,15,C.ink,26,4);
      wrapped(ctx,sidebarState.enteredFromSidebar?'本次确实从侧边栏回到早餐铺，欢迎回来。':sidebarMessage||(sidebarState.pending?'正在请求打开侧边栏。':sidebarState.available?'点下面的按钮前往。':'当前环境暂不支持，仍可正常游玩。'),26,266,306,14,C.green,25,4);
      button('sidebar-navigate',sidebarState.pending?'正在打开':'前往抖音侧边栏',24,H-146,312,56,()=>{sidebarMessage='';platform.sidebar.navigate().then(ok=>{if(!alive)return;sidebarMessage=ok?'已请求打开；返回后继续游玩。':'本次未完成跳转，仍可正常游玩。';redraw();});},{fill:C.green,color:C.paper,disabled:!sidebarState.available||sidebarState.pending,size:16});backButton('close-sidebar');
    }else if(screen==='result'){
      paper('今日收摊小票',`第 ${state.stage+1} 天 · ${stage.title}`);label(ctx,'心意收成',180,122,13,'#926b45','400','center');label(ctx,String(state.score),180,172,54,C.coral,'700','center');label(ctx,`心意星 ${stageStars(state)} / 3   ·   完成 ${stage.orders.length} 份`,180,218,15,C.green,'700','center');line(ctx,27,245,333,245,'#ccb084');wrapped(ctx,stage.ending,28,H<560?262:273,304,H<560?14:15,C.ink,H<560?23:26,3);
      button('next-stage',state.stage===4?'把五个清晨收进手账':'明天继续开张',24,H-146,312,56,()=>{if(state.stage===4)screen='ending';else{dispatch({type:'NEXT_STAGE'});screen='day';}},{fill:C.coral,color:C.paper,size:17,bold:true});button('replay-stage','今天再做一次',24,H-78,312,56,()=>beginStage(state.stage),{fill:'#e8cf9f',color:C.ink,size:15});
    }else if(screen==='ending'){
      world();streetArt(ctx,0,0,W,Math.min(275,H*.44),4);buttons=[];label(ctx,'早安，老朋友。',24,H*.51,29,C.ink,'700');wrapped(ctx,'五个清晨，留下一条街的温暖。',24,H*.59,312,17,C.ink,28,3);label(ctx,`手账里收好了 ${progress.stars.reduce((a,b)=>a+b,0)} 颗心意星`,24,H-140,14,C.coral,'700');button('replay-all','挑一个清晨，再见老朋友',24,H-84,312,64,()=>open('chapters'),{fill:C.green,color:C.paper,size:17,bold:true});
    }
  }
  function metrics(){
    size=platform.getSize();const i=size.safeInsets||{},left=Math.max(0,i.left||0),right=Math.max(0,i.right||0),top=Math.max(0,i.top||0),bottom=Math.max(0,i.bottom||0);
    zoom=Math.min((size.width-left-right)/W,1.25);ox=left+(size.width-left-right-W*zoom)/2;oy=top;H=(size.height-top-bottom)/zoom;
    const sceneH=Math.max(12,Math.min(92,(H-500)*.34+32,H-476)),ticketY=62+sceneH-10,tabsY=ticketY+122,workY=tabsY+66;
    layout={sceneH,ticketY,tabsY,workY,workH:H-86-workY,safeInsets:{left,right,top,bottom}};
  }
  function draw(now=0){
    if(!alive)return;metrics();const dpr=size.dpr||1;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#d9bd87';ctx.fillRect(0,0,size.width,size.height);ctx.save();ctx.translate(ox,oy);ctx.scale(zoom,zoom);ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();buttons=[];if(screen==='play')playView();else modalView();ctx.restore();
    if(!paused){const dt=lastFrame?Math.min(100,Math.max(0,now-lastFrame)):0;if(state.dish.status==='cooking'&&screen==='play'){cookElapsed+=dt;if(cookElapsed>=RECIPES[getOrder(state).recipe].cookMs)dispatch({type:'COOK_DONE',token:activeToken});}}
    lastFrame=now;if(!paused)frameId=platform.requestFrame(draw);
  }
  function redraw(){if(frameId!==undefined)platform.cancelFrame(frameId);draw(lastFrame);}
  unsubscribers.push(platform.onPointer(event=>{
    if(paused||!alive)return;const x=(event.x-ox)/zoom,y=(event.y-oy)/zoom;const hit=[...buttons].reverse().find(b=>!b.disabled&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if(event.type==='down'&&!pointerDown)pointerDown=hit?{id:hit.id,pointer:event.id,x,y}:null;
    if(event.type==='cancel'&&pointerDown?.pointer===event.id)pointerDown=null;
    if(event.type==='up'&&pointerDown?.pointer===event.id){const start=pointerDown;pointerDown=null;if(hit&&start.id===hit.id&&Math.hypot(x-start.x,y-start.y)<25){platform.audio.play('tap');hit.fn();redraw();}}
  }));
  unsubscribers.push(platform.onResize(()=>{pointerDown=null;redraw();}));
  unsubscribers.push(platform.onPause(()=>{paused=true;pointerDown=null;lastFrame=0;platform.cancelFrame(frameId);}));
  unsubscribers.push(platform.onResume(()=>{paused=false;lastFrame=0;redraw();}));
  if(platform.sidebar)unsubscribers.push(platform.sidebar.subscribe(next=>{sidebarState=next;redraw();}));
  draw();return{destroy(){alive=false;platform.cancelFrame(frameId);unsubscribers.forEach(fn=>fn());},inspect(){return JSON.parse(JSON.stringify({state,screen,station,progress,storageWarning,sidebarState,sidebarMessage,buttons:buttons.map(({id,x,y,w,h,disabled,label})=>({id,x,y,w,h,disabled,label})),viewport:{zoom,ox,oy,width:W,height:H},layout}));}};
}
