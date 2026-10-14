/** Pure deterministic game rules. No DOM, network, storage, or timers. */
export const VERSION = 1;
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
  qiao: { name: '阿乔', role: '夜班护士', color: '#b196b4', intro: '刚下夜班，想带一份热乎的回家。', thanks: '谢谢你。我的早晨，现在才开始。' }
});
const order = (customer, recipe, scallion, texture = 'soft', packaging = 'plate', hint = '') => ({ customer, recipe, scallion, texture, packaging, hint });
export const STAGES = Object.freeze([
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
]);
export function getOrder(state) {
  const raw = STAGES[state.stage]?.orders[state.orderIndex];
  return raw ? { ...raw, id: `${state.stage}:${state.orderIndex}` } : null;
}
export function emptyDish() { return { ingredients: [], texture: 'soft', packaging: 'plate', status: 'raw', token: 0 }; }
export function initialState(stage = 0) {
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
/** Explicit state machine: a served order cannot award points twice. */
export function reduce(state, action) {
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
  if (action.type === 'CLEAR') return { ...state, dish: { ...emptyDish(), token: dish.token + 1 }, feedback: '料理台收拾好了，再试一次。', feedbackType: 'info' };
  if (action.type === 'COOK') {
    if (dish.status !== 'raw' || dish.ingredients.length === 0) return { ...state, feedback: '先点选食材，再开火。', feedbackType: 'error' };
    return { ...state, feedback: '', dish: { ...dish, status: 'cooking', token: dish.token + 1 } };
  }
  if (action.type === 'COOK_DONE') {
    if (dish.status !== 'cooking' || action.token !== dish.token) return state;
    return { ...state, dish: { ...dish, status: 'cooked' }, feedback: '香气刚刚好！选好装盘方式，就能出餐。', feedbackType: 'info' };
  }
  if (action.type === 'SERVE') {
    const current = getOrder(state);
    if (!current || state.servedIds.includes(current.id)) return state;
    const result = evaluateDish(current, dish);
    if (!result.ok) return { ...state, combo: 0, mistakes: state.mistakes + 1, score: Math.max(0, state.score - 5), feedback: result.errors.join(' '), feedbackType: 'error' };
    const bonus = Math.min(state.combo, 4) * 10;
    return { ...state, phase: 'served', score: state.score + result.points + bonus, combo: state.combo + 1, servedIds: [...state.servedIds, current.id], feedback: `心意满分！+${result.points + bonus}`, feedbackType: 'success' };
  }
  return state;
}
export function stageStars(state) {
  if (state.phase !== 'stageComplete') return 0;
  return state.mistakes === 0 ? 3 : state.score >= STAGES[state.stage].target ? 2 : 1;
}
export const DEFAULT_PROGRESS = { version: VERSION, unlocked: 0, stars: [0, 0, 0, 0, 0], best: [0, 0, 0, 0, 0], sound: true };
export function parseProgress(raw) {
  try {
    const p = JSON.parse(raw);
    if (!p || p.version !== VERSION) return { ...DEFAULT_PROGRESS, stars: [...DEFAULT_PROGRESS.stars], best: [...DEFAULT_PROGRESS.best] };
    const cleanArray = (a, max) => Array.from({ length: 5 }, (_, i) => Number.isInteger(a?.[i]) && a[i] >= 0 && a[i] <= max ? a[i] : 0);
    return { version: VERSION, unlocked: Number.isInteger(p.unlocked) && p.unlocked >= 0 && p.unlocked < 5 ? p.unlocked : 0, stars: cleanArray(p.stars, 3), best: cleanArray(p.best, 10000), sound: typeof p.sound === 'boolean' ? p.sound : true };
  } catch { return { ...DEFAULT_PROGRESS, stars: [...DEFAULT_PROGRESS.stars], best: [...DEFAULT_PROGRESS.best] }; }
}
export function recordStage(progress, state) {
  if (state.phase !== 'stageComplete') return progress;
  const clean = parseProgress(JSON.stringify(progress));
  clean.unlocked = Math.max(clean.unlocked, Math.min(4, state.stage + 1));
  clean.stars[state.stage] = Math.max(clean.stars[state.stage], stageStars(state));
  clean.best[state.stage] = Math.max(clean.best[state.stage], state.score);
  return clean;
}
