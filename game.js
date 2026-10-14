/** Pure deterministic game rules. No DOM, network, storage, or timers. */
export const VERSION = 2;
export const INGREDIENTS = Object.freeze({
  batter: '面糊', egg: '鸡蛋', crisp: '薄脆', cheese: '芝士', rice: '米饭', nori: '海苔', scallion: '葱花'
});
export const RECIPES = Object.freeze({
  pancake: { name: '招牌煎饼', subtitle: '一口咔嚓，开启早晨', ingredients: ['batter', 'egg', 'crisp'], cookMs: 1800 },
  cheese: { name: '芝士蛋饼', subtitle: '把温柔融在蛋饼里', ingredients: ['batter', 'egg', 'cheese'], cookMs: 1800 },
  rice: { name: '香煎饭团', subtitle: '外面酥香，心里软糯', ingredients: ['rice', 'nori'], cookMs: 1600 }
});
export const CUSTOMERS = Object.freeze({
  lan: { name: '岚阿姨', role: '巷口花店', color: '#c98b9b', intro: '花还没开，我先来吃个早饭。', thanks: '吃得暖暖的，今天的花一定卖得好。' },
  zao: { name: '阿早', role: '早班骑手', color: '#d8b24f', intro: '第一单就在前面，谢谢老板啦！', thanks: '装好了就走，今天的好运由我送出去！' },
  man: { name: '小满', role: '赶早八的学生', color: '#709996', intro: '早八很苦，早饭想吃香一点。', thanks: '我宣布，这是今天第一件好事！' },
  zhou: { name: '老周', role: '街坊修表匠', color: '#8798b0', intro: '慢慢来，日子和表一样要走稳。', thanks: '嗯，是这个味儿。明天这个点再见。' },
  tang: { name: '唐师傅', role: '早班公交司机', color: '#6e8b9e', intro: '下一班车前，来口热乎的。', thanks: '吃饱了，稳稳当当开一天。' },
  lin: { name: '林姐姐', role: '街角面包师', color: '#c98f65', intro: '面包进炉啦，我来换个口味。', thanks: '这份火候，我给满分。' },
  dou: { name: '豆豆爸', role: '遛狗的邻居', color: '#8b9d61', intro: '遛了一圈，闻着香味就来了。', thanks: '豆豆也想明天再来。' },
  min: { name: '敏姐', role: '早市菜摊主', color: '#bb7870', intro: '新鲜菜到了，早饭也要新鲜。', thanks: '今天的好精神，就从这口开始！' },
  qiao: { name: '阿乔', role: '夜班护士', color: '#b196b4', intro: '刚下夜班，想带一份热乎的回家。', thanks: '谢谢你。我的早晨，现在才开始。' }
});
const order = (customer, recipe, scallion, texture = 'soft', packaging = 'plate', hint = '') => ({ customer, recipe, scallion, texture, packaging, hint });
const TUTORIAL_STAGES = [
  { title: '第一缕香气', time: '06:30', weather: '晴 · 18°', note: '新招牌挂起来了。今天，让第一位街坊记住你的味道。', ending: '岚阿姨把一小枝花放在柜台上：“开张快乐，以后就是邻居啦。”', target: 250, orders: [
    order('lan', 'pancake', false, 'soft', 'plate', '来个煎饼吧。我不吃葱，普通火候就好。'),
    order('zao', 'pancake', true, 'soft', 'bag', '我赶时间，煎饼加葱，帮我打包！'),
    order('man', 'cheese', false, 'crisp', 'plate', '芝士蛋饼不要葱，今天想吃脆脆的。')
  ] },
  { title: '街坊的口味', time: '06:50', weather: '晴 · 19°', note: '柜台多了一枝花。熟悉的脚步里，也来了新面孔。', ending: '老周修好了墙上的旧钟。这条街的早晨，终于准点了。', target: 260, orders: [
    order('zhou', 'rice', true, 'crisp', 'plate', '饭团加葱，外面煎脆些，我坐着慢慢吃。'),
    order('qiao', 'cheese', false, 'soft', 'bag', '蛋饼不要葱，普通火候，带回家吃。'),
    order('lan', 'pancake', false, 'crisp', 'plate', '还是不吃葱。今天煎饼想尝尝焦脆的。')
  ] },
  { title: '早高峰不慌', time: '07:10', weather: '微风 · 20°', note: '街角热闹起来。没有倒计时催你，认真听清每一份心愿。', ending: '阿早拍了拍保温箱：“以后这条街的早餐推荐，就写你家了。”', target: 360, orders: [
    order('zao', 'rice', true, 'crisp', 'bag', '赶时间！饭团加葱、煎脆一点，打包。'),
    order('man', 'pancake', false, 'crisp', 'bag', '煎饼不要葱，要脆的。我得带去学校！'),
    order('zhou', 'cheese', true, 'soft', 'plate', '今天换芝士蛋饼，加点葱，普通火候。'),
    order('qiao', 'rice', false, 'soft', 'bag', '饭团不要葱，普通火候，帮我带走。')
  ] },
  { title: '雨天也温暖', time: '07:30', weather: '小雨 · 18°', note: '一场小雨落下来。屋檐下的位置，留给每个需要歇脚的人。', ending: '小满画了一张小卡片：“谢谢你，让下雨天也有热乎的期待。”', target: 360, orders: [
    order('man', 'cheese', false, 'crisp', 'plate', '躲会儿雨。芝士蛋饼不要葱，脆脆的。'),
    order('lan', 'rice', false, 'soft', 'bag', '饭团不放葱，普通火候。我要回去看着花。'),
    order('zao', 'pancake', true, 'crisp', 'bag', '煎饼加葱，煎脆打包，今天也要元气满满！'),
    order('zhou', 'rice', true, 'soft', 'plate', '饭团加葱，普通火候就好，我在这儿等雨停。')
  ] },
  { title: '这条街的早安', time: '08:00', weather: '雨后晴 · 21°', note: '雨停了。五张熟悉的脸，五份不一样的早安。', ending: '街坊们帮你挂上了新木牌：“街角最好吃的，是被人记住的那一口。”', target: 460, orders: [
    order('qiao', 'cheese', false, 'soft', 'bag', '下班啦。老样子，蛋饼不要葱，普通火候，打包。'),
    order('lan', 'pancake', false, 'crisp', 'plate', '煎饼不要葱，煎脆一点。花店今天晚点开。'),
    order('zhou', 'rice', true, 'crisp', 'plate', '香煎饭团，加葱要脆。你记性比我的表还好。'),
    order('zao', 'cheese', true, 'crisp', 'bag', '芝士蛋饼加葱、煎脆，打包去送最后一单。'),
    order('man', 'pancake', false, 'soft', 'bag', '煎饼不要葱，普通火候，打包。今天没有迟到！')
  ] }
];

export const SHIFT_THEMES = ['第一缕香气','街坊早市','炉火余温','同桌早餐','整条街的早高峰'];
function createShift(index) {
  const chapter=Math.floor(index/10),n=index<10?4+(index%2):index<20?4+(index%2):index<40?6:8;
  let plan=Array.from({length:n},(_,i)=>i);
  if(index>=10&&index<20)for(let i=0;i+1<n;i+=2)[plan[i],plan[i+1]]=[plan[i+1],plan[i]];
  if(index>=20&&index<30)plan=[0,2,1,3,5,4];
  if(index>=30&&index<40)plan=[0,1,2,4,3,5];
  if(index>=40)plan=[0,1,3,2,4,5,7,6];
  const customerIds=Object.keys(CUSTOMERS),recipes=Object.keys(RECIPES),orders=Array.from({length:n},(_,i)=>{
    const at=plan.indexOf(i),texture=Math.floor(at/2)%2?'crisp':'soft',recipe=recipes[(i+index)%3],scallion=(i+index)%3===0,packaging=(i+index)%2?'bag':'plate';
    let pair=null;if(index>=30&&i<2)pair=1-i;if(index>=40&&i>=4&&i<=5)pair=9-i;
    const latest=pair===null?at+1:Math.max(at,plan.indexOf(pair))+1;
    const slack=index<10?null:index<20?2:index<40?1:0;
    return {...order(customerIds[(i+index)%customerIds.length],recipe,scallion,texture,packaging,`${RECIPES[recipe].name}，${scallion?'加葱':'不要葱'}，${texture==='crisp'?'焦脆':'普通'}，${packaging==='bag'?'打包':'堂食'}。`),pair,due:slack===null?null:latest+slack};
  });
  const efficient=index>=20;let cost=0,last=null;for(const i of plan){const t=orders[i].texture;cost+=efficient&&last===t?1:2;last=t;}
  const fuel=index<10?null:cost+(index<20?4:index<25?2:index<40?1:0);
  return {title:`${SHIFT_THEMES[chapter]} · ${index%10+1}`,time:`${String(6+Math.floor(index/15)).padStart(2,'0')}:${String((index*7)%60).padStart(2,'0')}`,weather:index%4===3?'细雨':'晴暖',note:index<10?'街坊会一起到店，可点头像切换订单。这几班没有失败压力。':index<20?'每开一锅，排队耐心减少一格。先照顾急客，放错食材可随时重做。':index<30?'同一火候连锅只花1格炉火，换火候花2格。省火还是先做急单，由你选择。':'连号同桌单要一起上：先做一份放保温位，再做另一份。保温最多等2锅，别让早餐凉了。',ending:index<20?'摊前多了熟悉的笑声，忙碌也渐渐有了节奏。':index<40?'一口锅照顾好一桌人，细心比手快更重要。':'高峰散去，街坊把空盘叠好。今天又是热气腾腾的一天。',target:n*90,orders,queueSize:index<10?2:3,fuel,efficient,holding:index>=30,freshness:2,referencePlan:plan,chapter};
}
export const STAGES = Object.freeze([...TUTORIAL_STAGES.map((s,index)=>({...s,queueSize:1,fuel:null,efficient:false,holding:false,freshness:null,referencePlan:s.orders.map((_,i)=>i),chapter:0})),...Array.from({length:45},(_,i)=>createShift(i+5))]);
export function visibleOrders(state) {
  return STAGES[state.stage].orders.map((o,index)=>({...o,index,id:`${state.stage}:${index}`,due:o.due==null?null:Math.max(o.due,(state.arrivals?.[index]??state.turn)+(o.pair!=null?2:1))})).filter(o=>!state.servedIds.includes(o.id)).slice(0,STAGES[state.stage].queueSize);
}
export function patienceLeft(state,order) {return order?.due===null||order?.due===undefined?null:Math.max(0,order.due+state.deadlineBonus-state.turn);}
export function fireCost(state,texture=state.dish.texture) {return STAGES[state.stage].efficient&&state.lastHeat===texture?1:2;}
export function freshLeft(state,dish=state.heldDish) {return !dish||dish.cookedAt===undefined||!STAGES[state.stage].holding?null:Math.max(-1,STAGES[state.stage].freshness-(state.turn-dish.cookedAt));}
export function initialState(stage=0,runId=1) {
 const s=tutorialState(stage);return {...s,runId:Number.isSafeInteger(runId)&&runId>0?runId:1,turn:0,fuel:STAGES[s.stage].fuel,lastHeat:null,deadlineBonus:0,heldDish:null,failure:null,failureId:0,revives:0,toolsUsed:{fuel:0,tea:0},arrivals:Object.fromEntries(Array.from({length:STAGES[s.stage].queueSize},(_,i)=>[i,0]))};
}

export function getOrder(state) {
  const raw = STAGES[state.stage]?.orders[state.orderIndex];
  return raw ? { ...raw, id: `${state.stage}:${state.orderIndex}` } : null;
}
export function emptyDish() { return { ingredients: [], texture: 'soft', packaging: 'plate', status: 'raw', token: 0 }; }
function tutorialState(stage = 0) {
  const safe = Number.isInteger(stage) && stage >= 0 && stage < STAGES.length ? stage : 0;
  return { version: VERSION, stage: safe, orderIndex: 0, dish: emptyDish(), score: 0, combo: 0, mistakes: 0, servedIds: [], feedback: '', feedbackType: 'info', phase: 'playing' };
}
export function requiredIngredients(order) { return [...RECIPES[order.recipe].ingredients, ...(order.scallion ? ['scallion'] : [])]; }
export function evaluateDish(order, dish) {
  if (!order || !RECIPES[order.recipe]) return { ok: false, errors: ['这张订单不存在。'], points: 0 };
  const errors = [];
  if (dish.status !== 'cooked') errors.push('还没煎好，先完成加热。');
  const required = requiredIngredients(order);
  const selected = dish.ingredients;
  const missing = required.filter(x => !selected.includes(x));
  const extra = selected.filter(x => !required.includes(x));
  if (missing.length) errors.push(`还少了：${missing.map(x => INGREDIENTS[x]).join('、')}。`);
  if (extra.length) errors.push(`多放了：${extra.map(x => INGREDIENTS[x] || '未知食材').join('、')}。`);
  if (new Set(selected).size !== selected.length) errors.push('食材重复了，请重新备料。');
  if (dish.texture !== order.texture) errors.push(`火候要选“${order.texture === 'crisp' ? '焦脆' : '普通'}”。`);
  if (dish.packaging !== order.packaging) errors.push(`这份需要${order.packaging === 'bag' ? '打包带走' : '堂食装盘'}。`);
  return { ok: errors.length === 0, errors, points: errors.length ? 0 : 100 };
}
/** Cooked ingredients and heat cannot be undone; packaging can still be corrected. */
export function dishNeedsRestart(order, dish) {
  if (!order || !RECIPES[order.recipe] || dish.status === 'raw') return false;
  const required = requiredIngredients(order);
  return dish.texture !== order.texture || dish.ingredients.length !== required.length || new Set(dish.ingredients).size !== dish.ingredients.length || required.some(id => !dish.ingredients.includes(id)) || dish.ingredients.some(id => !required.includes(id));
}
/** Explicit state machine: a served order cannot award points twice. */
function reduceClassic(state, action) {
  if (!state || !action || typeof action.type !== 'string') return state;
  const dish = state.dish;
  if (action.type === 'RESTART_STAGE') {
    const restarted = initialState(state.stage);
    // Never reuse a token: a timer from before restart must remain stale.
    restarted.dish.token = dish.token + 1;
    return restarted;
  }
  if (action.type === 'NEXT_STAGE') {
    if (state.phase !== 'stageComplete' || state.stage >= STAGES.length - 1) return state;
    return initialState(state.stage + 1);
  }
  if (action.type === 'NEXT_ORDER') {
    if (state.phase !== 'served') return state;
    if (state.orderIndex + 1 >= STAGES[state.stage].orders.length) return { ...state, phase: 'stageComplete', feedback: '' };
    return { ...state, orderIndex: state.orderIndex + 1, phase: 'playing', dish: { ...emptyDish(), token: dish.token + 1 }, feedback: '', feedbackType: 'info' };
  }
  if (action.type === 'CLEAR' && ['playing', 'served'].includes(state.phase)) return { ...state, dish: { ...emptyDish(), token: dish.token + 1 }, feedback: state.phase === 'served' ? '台面收拾好了。点“下一位”继续，不会重复记分。' : '已重新备料，不扣分。当前订单还在，请按配方再做一份。', feedbackType: 'info' };
  if (state.phase !== 'playing') return state;
  if (action.type === 'TOGGLE_INGREDIENT') {
    if (dish.status !== 'raw' || !Object.prototype.hasOwnProperty.call(INGREDIENTS, action.id)) return state;
    return { ...state, feedback: '', dish: { ...dish, ingredients: dish.ingredients.includes(action.id) ? dish.ingredients.filter(x => x !== action.id) : [...dish.ingredients, action.id] } };
  }
  if (action.type === 'SET_TEXTURE') {
    if (dish.status !== 'raw' || !['soft', 'crisp'].includes(action.value)) return state;
    return { ...state, feedback: '', dish: { ...dish, texture: action.value } };
  }
  if (action.type === 'SET_PACKAGING') {
    if (!['plate', 'bag'].includes(action.value)) return state;
    return { ...state, feedback: '', dish: { ...dish, packaging: action.value } };
  }
  if (action.type === 'COOK') {
    if (dish.status !== 'raw' || dish.ingredients.length === 0) return { ...state, feedback: '先点选食材，再开火。', feedbackType: 'error' };
    return { ...state, feedback: '', dish: { ...dish, status: 'cooking', token: dish.token + 1 } };
  }
  if (action.type === 'COOK_DONE') {
    if (dish.status !== 'cooking' || action.token !== dish.token) return state;
    const cooked = { ...dish, status: 'cooked' };
    const current = getOrder(state), restart = dishNeedsRestart(current, cooked);
    const verdict = evaluateDish(current, cooked);
    return { ...state, dish: cooked, feedback: restart ? '配料或火候不符，请点“倒掉重做”（不扣分）。熟食不能退回原料。' : verdict.ok ? '香气刚刚好！现在可以出餐；做错也能点“倒掉重做”。' : '早餐已煎好，调整堂食/打包方式后就能出餐。', feedbackType: restart ? 'error' : 'info' };
  }
  if (action.type === 'SERVE') {
    const current = getOrder(state);
    if (!current || state.servedIds.includes(current.id)) return state;
    const result = evaluateDish(current, dish);
    if (!result.ok) {
      const recovery = dishNeedsRestart(current, dish) ? '请点“倒掉重做”（不扣分），重做当前订单。' : dish.status === 'raw' ? '请先按配方调整食材，再开火煎制。' : dish.status === 'cooking' ? '还在煎制，请稍等；做错可点“倒掉重做”。' : '请调整堂食/打包方式后再出餐。';
      return { ...state, combo: 0, mistakes: state.mistakes + 1, score: Math.max(0, state.score - 5), feedback: recovery + ' ' + result.errors.join(' '), feedbackType: 'error' };
    }
    const bonus = Math.min(state.combo, 4) * 10;
    return { ...state, phase: 'served', score: state.score + result.points + bonus, combo: state.combo + 1, servedIds: [...state.servedIds, current.id], feedback: `心意满分！+${result.points + bonus}`, feedbackType: 'success' };
  }
  return state;
}
export function stageStars(state) {
  if (state.phase !== 'stageComplete') return 0;
  return state.mistakes === 0 ? 3 : state.score >= STAGES[state.stage].target ? 2 : 1;
}

function registerArrivals(state){const arrivals={...state.arrivals};for(const o of visibleOrders(state))if(arrivals[o.index]===undefined)arrivals[o.index]=state.turn;return {...state,arrivals};}
function failed(state,code,message) {return {...state,phase:'failed',failure:{code,message},failureId:state.failureId+1,feedback:message,feedbackType:'error'};}
export function reduce(state,action) {
 if(!state||!action||typeof action.type!=='string')return state;
 const stage=STAGES[state.stage];
 if(action.type==='RESTART_STAGE'){const next=initialState(state.stage,state.runId+1);next.dish.token=state.dish.token+1;return next;}
 if(action.type==='NEXT_STAGE'){if(state.phase!=='stageComplete'||state.stage>=49)return state;const next=initialState(state.stage+1,state.runId+1);next.dish.token=state.dish.token+1;return next;}
 if(action.type==='REVIVE'){
  if(state.phase!=='failed'||state.revives>=1||action.runId!==state.runId||action.failureId!==state.failureId||typeof action.requestId!=='string'||!action.requestId||!['coins','completed-ad'].includes(action.source))return state;
  const dish=state.dish.status==='cooking'?{...emptyDish(),token:state.dish.token+1}:{...state.dish,...(state.dish.status==='cooked'?{cookedAt:state.turn}:{})};
  return {...state,phase:'playing',failure:null,revives:1,fuel:state.fuel===null?null:state.fuel+4,deadlineBonus:state.deadlineBonus+2,dish,heldDish:state.heldDish?{...state.heldDish,cookedAt:state.turn}:null,feedback:'街坊帮忙续摊：炉火 +4，耐心 +2 锅，熟食重新保温。本班仅一次。',feedbackType:'success'};
 }
 if(action.type==='USE_TOOL'){
  if(state.phase!=='playing'||state.stage<10||!['fuel','tea'].includes(action.kind)||state.toolsUsed[action.kind]>=1)return state;
  return {...state,fuel:action.kind==='fuel'&&state.fuel!==null?state.fuel+3:state.fuel,deadlineBonus:state.deadlineBonus+(action.kind==='tea'?2:0),toolsUsed:{...state.toolsUsed,[action.kind]:1},feedback:action.kind==='fuel'?'小炭包：炉火 +3，本班已用。':'街坊茶：所有待客耐心 +2 锅，本班已用。',feedbackType:'success'};
 }
 if(action.type==='NEXT_ORDER'&&state.stage>=5){
  if(state.phase!=='served')return state;
  if(state.servedIds.length===stage.orders.length)return {...state,phase:'stageComplete',feedback:''};
  const next=visibleOrders(state)[0];return {...state,orderIndex:next.index,phase:'playing',dish:{...emptyDish(),token:state.dish.token+1},feedback:'',feedbackType:'info'};
 }
 if(action.type==='SELECT_ORDER'){
  if(state.phase!=='playing'||state.stage<5||state.dish.status==='cooking'||!visibleOrders(state).some(o=>o.index===action.index))return state;
  return {...state,orderIndex:action.index,feedback:'',feedbackType:'info'};
 }
 if(state.phase==='playing'&&action.type==='HOLD'){
  if(!stage.holding||state.dish.status!=='cooked'||state.heldDish)return state;
  return {...state,heldDish:{...state.dish},dish:{...emptyDish(),token:state.dish.token+1},feedback:'已放入保温位。选同桌另一位，做齐后一起出餐。',feedbackType:'info'};
 }
 if(state.phase==='playing'&&action.type==='TAKE_HELD'){
  if(!stage.holding||!state.heldDish||state.dish.status==='cooking'||(state.dish.status==='raw'&&state.dish.ingredients.length))return state;
  return {...state,dish:{...state.heldDish,token:state.dish.token+1},heldDish:state.dish.status==='cooked'?{...state.dish}:null,feedback:'保温餐已取回。可换包装；做错可倒掉重做。',feedbackType:'info'};
 }
 if(state.phase==='playing'&&action.type==='COOK'&&state.dish.status==='raw'&&state.dish.ingredients.length){
  const expired=visibleOrders(state).find(o=>o.due!==null&&o.due!==undefined&&o.due+state.deadlineBonus<state.turn+1);
  if(expired)return failed(state,'patience',`${CUSTOMERS[expired.customer].name}已经等到最后一锅。再开火会错过这份订单，本班暂时收摊。`);
  const cost=fireCost(state);if(state.fuel!==null&&state.fuel<cost)return failed(state,'fuel',`炉火只剩 ${state.fuel} 格，这锅需要 ${cost} 格。之前换火或重做用掉了余量。`);
  const next=reduceClassic(state,action);return {...next,turn:state.turn+1,fuel:state.fuel===null?null:state.fuel-cost,lastHeat:state.dish.texture,dish:{...next.dish,cookMs:RECIPES[getOrder(state).recipe].cookMs,cookedAt:state.turn+1}};
 }
 if(state.phase==='playing'&&action.type==='SERVE'&&state.dish.status==='cooked'){
  const current=getOrder(state);
  if(stage.holding&&freshLeft(state,state.dish)<0)return failed(state,'cold','这份早餐已经超过保温锅次，不能把凉餐交给顾客。下次先做急单，保温位最多等2锅。');
  if(current.pair!==undefined&&current.pair!==null){
   const partner={...stage.orders[current.pair],id:`${state.stage}:${current.pair}`};
   if(state.servedIds.includes(partner.id))return state;
   if(!state.heldDish||!evaluateDish(partner,state.heldDish).ok)return {...state,feedback:'同桌两份要一起上。先把另一份按要求做好放进保温位，再交这一份。',feedbackType:'info'};
   if(freshLeft(state,state.heldDish)<0)return failed(state,'cold','保温位的另一份已经凉了。这桌需要两份都热乎，下次别让熟食等超过2锅。');
   const first=reduceClassic(state,action);if(first.phase!=='served')return first;
   const bonus=100+Math.min(first.combo,4)*10;return registerArrivals({...first,score:first.score+bonus,combo:first.combo+1,servedIds:[...first.servedIds,partner.id],heldDish:null,feedback:`同桌一起吃！两份热餐已交付。`,feedbackType:'success'});
  }
 }
 const next=reduceClassic(state,action);
 if(action.type==='SERVE'&&next.phase==='served'&&next!==state)return registerArrivals(next);
 if(action.type==='CLEAR'&&state.stage>=10&&next!==state&&state.phase==='playing')return {...next,feedback:'已重新备料，不扣分；开过的炉火与排队锅次不会倒退。当前顾客仍在。'};
 return next;
}
export const TOOL_COSTS=Object.freeze({fuel:18,tea:18,revive:30});
export const DEFAULT_PROGRESS={version:VERSION,unlocked:0,stars:Array(50).fill(0),best:Array(50).fill(0),sound:true,coins:0,tools:{fuel:0,tea:0},nextRun:1,lastRewardedRun:0,pendingSpend:null};
export function parseProgress(raw){
 const fallback=()=>({...DEFAULT_PROGRESS,stars:[...DEFAULT_PROGRESS.stars],best:[...DEFAULT_PROGRESS.best],tools:{...DEFAULT_PROGRESS.tools}});
 try{const p=JSON.parse(raw);if(!p||![1,VERSION].includes(p.version))return fallback();
 const clean=(a,max)=>Array.from({length:50},(_,i)=>i<(p.version===1?5:50)&&Number.isInteger(a?.[i])&&a[i]>=0&&a[i]<=max?a[i]:0);
 const number=(v,max,base=0)=>Number.isSafeInteger(v)&&v>=base&&v<=max?v:base;
 const old=p.version===1;
 const receipt=p.pendingSpend;const pendingSpend=!old&&receipt&&Number.isSafeInteger(receipt.runId)&&receipt.runId>number(p.lastRewardedRun,1e12)&&receipt.runId<number(p.nextRun,1e12,1)&&[0,30].includes(receipt.coins)&&[0,1].includes(receipt.tools?.fuel)&&[0,1].includes(receipt.tools?.tea)?{runId:receipt.runId,coins:receipt.coins,tools:{fuel:receipt.tools.fuel,tea:receipt.tools.tea}}:null;
 return {version:VERSION,unlocked:number(p.unlocked,old?4:49),stars:clean(p.stars,3),best:clean(p.best,10000),sound:typeof p.sound==='boolean'?p.sound:true,coins:old?0:number(p.coins,99999),tools:{fuel:old?0:number(p.tools?.fuel,3),tea:old?0:number(p.tools?.tea,3)},nextRun:old?1:number(p.nextRun,1e12,1),lastRewardedRun:old?0:number(p.lastRewardedRun,1e12),pendingSpend};
 }catch{return fallback();}
}
/** Abandoned paid effects are returned once; completed runs clear the receipt instead. */
export function recoverAbandonedRun(progress){
 const p=parseProgress(JSON.stringify(progress)),receipt=p.pendingSpend;if(!receipt)return p;
 let coins=p.coins+receipt.coins;const tools={...p.tools};
 for(const kind of ['fuel','tea']){const total=tools[kind]+receipt.tools[kind];coins+=Math.max(0,total-3)*TOOL_COSTS[kind];tools[kind]=Math.min(3,total);}
 return {...p,coins:Math.min(99999,coins),tools,pendingSpend:null};
}
function withSpendReceipt(progress,state,kind){
 const old=progress.pendingSpend?.runId===state.runId?progress.pendingSpend:{runId:state.runId,coins:0,tools:{fuel:0,tea:0}};
 return {...progress,nextRun:Math.max(progress.nextRun,state.runId+1),pendingSpend:{...old,coins:old.coins+(kind==='revive'?TOOL_COSTS.revive:0),tools:{...old.tools,...(kind==='revive'?{}:{[kind]:old.tools[kind]+1})}}};
}
export function allocateRun(progress,stage){const p=recoverAbandonedRun(progress),run=Math.max(p.nextRun,p.lastRewardedRun+1),state=initialState(stage,run);return {state,progress:{...p,nextRun:run+1}};}
export function recordStage(progress,state){
 if(state.phase!=='stageComplete')return progress;
 const clean=parseProgress(JSON.stringify(progress)),first=clean.stars[state.stage]===0;
 if(clean.pendingSpend?.runId===state.runId)clean.pendingSpend=null;
 clean.unlocked=Math.max(clean.unlocked,Math.min(49,state.stage+1));clean.stars[state.stage]=Math.max(clean.stars[state.stage],stageStars(state));clean.best[state.stage]=Math.max(clean.best[state.stage],state.score);
 if(state.runId>clean.lastRewardedRun){clean.coins=Math.min(99999,clean.coins+(first?12+Math.floor(state.stage/10)*2:2));clean.lastRewardedRun=state.runId;clean.nextRun=Math.max(clean.nextRun,state.runId+1);}
 return clean;
}
export function buyTool(progress,kind){if(!['fuel','tea'].includes(kind))return progress;const p=parseProgress(JSON.stringify(progress));if(p.coins<TOOL_COSTS[kind]||p.tools[kind]>=3)return progress;return {...p,coins:p.coins-TOOL_COSTS[kind],tools:{...p.tools,[kind]:p.tools[kind]+1}};}
export function spendTool(progress,state,kind){if(!['fuel','tea'].includes(kind)||!progress.tools?.[kind])return {progress,state};const next=reduce(state,{type:'USE_TOOL',kind});if(next===state)return {progress,state};return {state:next,progress:withSpendReceipt({...progress,tools:{...progress.tools,[kind]:progress.tools[kind]-1}},state,kind)};}
export function coinRevive(progress,state){if(progress.coins<TOOL_COSTS.revive)return {progress,state};const next=reduce(state,{type:'REVIVE',runId:state.runId,failureId:state.failureId,requestId:`coin-${state.runId}-${state.failureId}`,source:'coins'});return next===state?{progress,state}:{state:next,progress:withSpendReceipt({...progress,coins:progress.coins-TOOL_COSTS.revive},state,'revive')};}
