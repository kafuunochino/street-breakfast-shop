(function () {
  'use strict';

  // SOURCE: game.js
  /** Pure deterministic game rules. No DOM, network, storage, or timers. */
  const VERSION = 2;
  const INGREDIENTS = Object.freeze({
    batter: '面糊',
    egg: '鸡蛋',
    crisp: '薄脆',
    cheese: '芝士',
    rice: '米饭',
    nori: '海苔',
    scallion: '葱花'
  });
  const RECIPES = Object.freeze({
    pancake: {
      name: '招牌煎饼',
      subtitle: '一口咔嚓，开启早晨',
      ingredients: ['batter', 'egg', 'crisp'],
      cookMs: 1800
    },
    cheese: {
      name: '芝士蛋饼',
      subtitle: '把温柔融在蛋饼里',
      ingredients: ['batter', 'egg', 'cheese'],
      cookMs: 1800
    },
    rice: {
      name: '香煎饭团',
      subtitle: '外面酥香，心里软糯',
      ingredients: ['rice', 'nori'],
      cookMs: 1600
    }
  });
  const CUSTOMERS = Object.freeze({
    lan: {
      name: '岚阿姨',
      role: '巷口花店',
      color: '#c98b9b',
      intro: '花还没开，我先来吃个早饭。',
      thanks: '吃得暖暖的，今天的花一定卖得好。'
    },
    zao: {
      name: '阿早',
      role: '早班骑手',
      color: '#d8b24f',
      intro: '第一单就在前面，谢谢老板啦！',
      thanks: '装好了就走，今天的好运由我送出去！'
    },
    man: {
      name: '小满',
      role: '赶早八的学生',
      color: '#709996',
      intro: '早八很苦，早饭想吃香一点。',
      thanks: '我宣布，这是今天第一件好事！'
    },
    zhou: {
      name: '老周',
      role: '街坊修表匠',
      color: '#8798b0',
      intro: '慢慢来，日子和表一样要走稳。',
      thanks: '嗯，是这个味儿。明天这个点再见。'
    },
    tang: {
      name: '唐师傅',
      role: '早班公交司机',
      color: '#6e8b9e',
      intro: '下一班车前，来口热乎的。',
      thanks: '吃饱了，稳稳当当开一天。'
    },
    lin: {
      name: '林姐姐',
      role: '街角面包师',
      color: '#c98f65',
      intro: '面包进炉啦，我来换个口味。',
      thanks: '这份火候，我给满分。'
    },
    dou: {
      name: '豆豆爸',
      role: '遛狗的邻居',
      color: '#8b9d61',
      intro: '遛了一圈，闻着香味就来了。',
      thanks: '豆豆也想明天再来。'
    },
    min: {
      name: '敏姐',
      role: '早市菜摊主',
      color: '#bb7870',
      intro: '新鲜菜到了，早饭也要新鲜。',
      thanks: '今天的好精神，就从这口开始！'
    },
    qiao: {
      name: '阿乔',
      role: '夜班护士',
      color: '#b196b4',
      intro: '刚下夜班，想带一份热乎的回家。',
      thanks: '谢谢你。我的早晨，现在才开始。'
    }
  });
  const order = (customer, recipe, scallion, texture = 'soft', packaging = 'plate', hint = '') => ({
    customer,
    recipe,
    scallion,
    texture,
    packaging,
    hint
  });
  const TUTORIAL_STAGES = [{
    title: '第一缕香气',
    time: '06:30',
    weather: '晴 · 18°',
    note: '新招牌挂起来了。今天，让第一位街坊记住你的味道。',
    ending: '岚阿姨把一小枝花放在柜台上：“开张快乐，以后就是邻居啦。”',
    target: 250,
    orders: [order('lan', 'pancake', false, 'soft', 'plate', '来个煎饼吧。我不吃葱，普通火候就好。'), order('zao', 'pancake', true, 'soft', 'bag', '我赶时间，煎饼加葱，帮我打包！'), order('man', 'cheese', false, 'crisp', 'plate', '芝士蛋饼不要葱，今天想吃脆脆的。')]
  }, {
    title: '街坊的口味',
    time: '06:50',
    weather: '晴 · 19°',
    note: '柜台多了一枝花。熟悉的脚步里，也来了新面孔。',
    ending: '老周修好了墙上的旧钟。这条街的早晨，终于准点了。',
    target: 260,
    orders: [order('zhou', 'rice', true, 'crisp', 'plate', '饭团加葱，外面煎脆些，我坐着慢慢吃。'), order('qiao', 'cheese', false, 'soft', 'bag', '蛋饼不要葱，普通火候，带回家吃。'), order('lan', 'pancake', false, 'crisp', 'plate', '还是不吃葱。今天煎饼想尝尝焦脆的。')]
  }, {
    title: '早高峰不慌',
    time: '07:10',
    weather: '微风 · 20°',
    note: '街角热闹起来。耐心倒计时开始了，教学班留足时间，认真听清每一份心愿。',
    ending: '阿早拍了拍保温箱：“以后这条街的早餐推荐，就写你家了。”',
    target: 360,
    orders: [order('zao', 'rice', true, 'crisp', 'bag', '赶时间！饭团加葱、煎脆一点，打包。'), order('man', 'pancake', false, 'crisp', 'bag', '煎饼不要葱，要脆的。我得带去学校！'), order('zhou', 'cheese', true, 'soft', 'plate', '今天换芝士蛋饼，加点葱，普通火候。'), order('qiao', 'rice', false, 'soft', 'bag', '饭团不要葱，普通火候，帮我带走。')]
  }, {
    title: '雨天也温暖',
    time: '07:30',
    weather: '小雨 · 18°',
    note: '一场小雨落下来。屋檐下的位置，留给每个需要歇脚的人。',
    ending: '小满画了一张小卡片：“谢谢你，让下雨天也有热乎的期待。”',
    target: 360,
    orders: [order('man', 'cheese', false, 'crisp', 'plate', '躲会儿雨。芝士蛋饼不要葱，脆脆的。'), order('lan', 'rice', false, 'soft', 'bag', '饭团不放葱，普通火候。我要回去看着花。'), order('zao', 'pancake', true, 'crisp', 'bag', '煎饼加葱，煎脆打包，今天也要元气满满！'), order('zhou', 'rice', true, 'soft', 'plate', '饭团加葱，普通火候就好，我在这儿等雨停。')]
  }, {
    title: '这条街的早安',
    time: '08:00',
    weather: '雨后晴 · 21°',
    note: '雨停了。五张熟悉的脸，五份不一样的早安。',
    ending: '街坊们帮你挂上了新木牌：“街角最好吃的，是被人记住的那一口。”',
    target: 460,
    orders: [order('qiao', 'cheese', false, 'soft', 'bag', '下班啦。老样子，蛋饼不要葱，普通火候，打包。'), order('lan', 'pancake', false, 'crisp', 'plate', '煎饼不要葱，煎脆一点。花店今天晚点开。'), order('zhou', 'rice', true, 'crisp', 'plate', '香煎饭团，加葱要脆。你记性比我的表还好。'), order('zao', 'cheese', true, 'crisp', 'bag', '芝士蛋饼加葱、煎脆，打包去送最后一单。'), order('man', 'pancake', false, 'soft', 'bag', '煎饼不要葱，普通火候，打包。今天没有迟到！')]
  }];
  const SHIFT_THEMES = ['第一缕香气', '街坊早市', '炉火余温', '同桌早餐', '整条街的早高峰'];
  function createShift(index) {
    const chapter = Math.floor(index / 10),
      n = index < 10 ? 4 + index % 2 : index < 20 ? 4 + index % 2 : index < 40 ? 6 : 8;
    let plan = Array.from({
      length: n
    }, (_, i) => i);
    if (index >= 10 && index < 20) for (let i = 0; i + 1 < n; i += 2) [plan[i], plan[i + 1]] = [plan[i + 1], plan[i]];
    if (index >= 20 && index < 30) plan = [0, 2, 1, 3, 5, 4];
    if (index >= 30 && index < 40) plan = [0, 1, 2, 4, 3, 5];
    if (index >= 40) plan = [0, 1, 3, 2, 4, 5, 7, 6];
    const customerIds = Object.keys(CUSTOMERS),
      recipes = Object.keys(RECIPES),
      orders = Array.from({
        length: n
      }, (_, i) => {
        const at = plan.indexOf(i),
          texture = Math.floor(at / 2) % 2 ? 'crisp' : 'soft',
          recipe = recipes[(i + index) % 3],
          scallion = (i + index) % 3 === 0,
          packaging = (i + index) % 2 ? 'bag' : 'plate';
        let pair = null;
        if (index >= 30 && i < 2) pair = 1 - i;
        if (index >= 40 && i >= 4 && i <= 5) pair = 9 - i;
        const latest = pair === null ? at + 1 : Math.max(at, plan.indexOf(pair)) + 1;
        const slack = index < 10 ? null : index < 20 ? 2 : index < 40 ? 1 : 0;
        return {
          ...order(customerIds[(i + index) % customerIds.length], recipe, scallion, texture, packaging, `${RECIPES[recipe].name}，${scallion ? '加葱' : '不要葱'}，${texture === 'crisp' ? '焦脆' : '普通'}，${packaging === 'bag' ? '打包' : '堂食'}。`),
          pair,
          due: slack === null ? null : latest + slack
        };
      });
    const efficient = index >= 20;
    let cost = 0,
      last = null;
    for (const i of plan) {
      const t = orders[i].texture;
      cost += efficient && last === t ? 1 : 2;
      last = t;
    }
    const fuel = index < 10 ? null : cost + (index < 20 ? 4 : index < 25 ? 2 : index < 40 ? 1 : 0);
    return {
      title: `${SHIFT_THEMES[chapter]} · ${index % 10 + 1}`,
      time: `${String(6 + Math.floor(index / 15)).padStart(2, '0')}:${String(index * 7 % 60).padStart(2, '0')}`,
      weather: index % 4 === 3 ? '细雨' : '晴暖',
      note: index < 10 ? '街坊会一起到店，可点头像切换订单。顾客会实时等候，先看秒数再动手。' : index < 20 ? '秒数耗尽会失去顾客，开锅次数也要安排。先照顾急客，放错食材可随时重做。' : index < 30 ? '同一火候连锅只花1格炉火，换火候花2格。省火还是先做急单，由你选择。' : '连号同桌单要一起上：先做一份放保温位，再做另一份。保温最多等2锅，别让早餐凉了。',
      ending: index < 20 ? '摊前多了熟悉的笑声，忙碌也渐渐有了节奏。' : index < 40 ? '一口锅照顾好一桌人，细心比手快更重要。' : '高峰散去，街坊把空盘叠好。今天又是热气腾腾的一天。',
      target: n * 90,
      orders,
      queueSize: index < 10 ? 2 : 3,
      fuel,
      efficient,
      holding: index >= 30,
      freshness: 2,
      referencePlan: plan,
      chapter
    };
  }
  const STAGES = Object.freeze([...TUTORIAL_STAGES.map((s, index) => ({
    ...s,
    queueSize: 1,
    fuel: null,
    efficient: false,
    holding: false,
    freshness: null,
    referencePlan: s.orders.map((_, i) => i),
    chapter: 0
  })), ...Array.from({
    length: 45
  }, (_, i) => createShift(i + 5))]);
  function visibleOrders(state) {
    return STAGES[state.stage].orders.map((o, index) => {
      var _chainObject, _nullish;
      return {
        ...o,
        index,
        id: `${state.stage}:${index}`,
        due: o.due == null ? null : Math.max(o.due, (_nullish = (_chainObject = state.arrivals, _chainObject === null || _chainObject === void 0 ? void 0 : _chainObject[index]), _nullish === null || _nullish === void 0 ? state.turn : _nullish) + (o.pair != null ? 2 : 1))
      };
    }).filter(o => !state.servedIds.includes(o.id)).slice(0, STAGES[state.stage].queueSize);
  }
  function patienceBudgetMs(stage) {
    return (stage < 5 ? 70 - stage * 5 : stage < 10 ? 48 : Math.max(24, 38 - Math.floor((stage - 10) / 3))) * 1000;
  }
  function patienceSeconds(state, order) {
    var _chainObject2, _nullish2, _nullish3;
    const deadline = (_chainObject2 = state.timeDeadlines, _chainObject2 === null || _chainObject2 === void 0 ? void 0 : _chainObject2[_nullish2 = order.index, _nullish2 === null || _nullish2 === void 0 ? state.orderIndex : _nullish2]);
    return Math.max(0, Math.ceil(((_nullish3 = deadline, _nullish3 === null || _nullish3 === void 0 ? (state.elapsedMs || 0) + patienceBudgetMs(state.stage) : _nullish3) - (state.elapsedMs || 0)) / 1000));
  }
  function registerTimers(state) {
    const timeDeadlines = {
      ...state.timeDeadlines
    };
    visibleOrders(state).forEach((o, rank) => {
      if (timeDeadlines[o.index] === undefined) timeDeadlines[o.index] = (state.elapsedMs || 0) + patienceBudgetMs(state.stage) * (rank + 1 + (o.pair != null ? 1 : 0));
    });
    return {
      ...state,
      timeDeadlines
    };
  }
  function patienceLeft(state, order) {
    var _chainObject3, _chainObject4;
    return (_chainObject3 = order, _chainObject3 === null || _chainObject3 === void 0 ? void 0 : _chainObject3.due) === null || (_chainObject4 = order, _chainObject4 === null || _chainObject4 === void 0 ? void 0 : _chainObject4.due) === undefined ? null : Math.max(0, order.due + state.deadlineBonus - state.turn);
  }
  function fireCost(state, texture = state.dish.texture) {
    return STAGES[state.stage].efficient && state.lastHeat === texture ? 1 : 2;
  }
  function freshLeft(state, dish = state.heldDish) {
    return !dish || dish.cookedAt === undefined || !STAGES[state.stage].holding ? null : Math.max(-1, STAGES[state.stage].freshness - (state.turn - dish.cookedAt));
  }
  function initialState(stage = 0, runId = 1) {
    const s = tutorialState(stage);
    return registerTimers({
      ...s,
      elapsedMs: 0,
      timeDeadlines: {},
      runId: Number.isSafeInteger(runId) && runId > 0 ? runId : 1,
      turn: 0,
      fuel: STAGES[s.stage].fuel,
      lastHeat: null,
      deadlineBonus: 0,
      heldDish: null,
      failure: null,
      failureId: 0,
      revives: 0,
      toolsUsed: {
        fuel: 0,
        tea: 0
      },
      arrivals: Object.fromEntries(Array.from({
        length: STAGES[s.stage].queueSize
      }, (_, i) => [i, 0]))
    });
  }
  function getOrder(state) {
    var _chainObject5, _chainObject6;
    const raw = (_chainObject5 = STAGES[state.stage], _chainObject5 === null || _chainObject5 === void 0 ? void 0 : (_chainObject6 = _chainObject5.orders, _chainObject6[state.orderIndex]));
    return raw ? {
      ...raw,
      id: `${state.stage}:${state.orderIndex}`
    } : null;
  }
  function emptyDish() {
    return {
      ingredients: [],
      texture: 'soft',
      packaging: 'plate',
      status: 'raw',
      token: 0
    };
  }
  function tutorialState(stage = 0) {
    const safe = Number.isInteger(stage) && stage >= 0 && stage < STAGES.length ? stage : 0;
    return {
      version: VERSION,
      stage: safe,
      orderIndex: 0,
      dish: emptyDish(),
      score: 0,
      combo: 0,
      mistakes: 0,
      servedIds: [],
      feedback: '',
      feedbackType: 'info',
      phase: 'playing'
    };
  }
  function requiredIngredients(order) {
    return [...RECIPES[order.recipe].ingredients, ...(order.scallion ? ['scallion'] : [])];
  }
  function evaluateDish(order, dish) {
    if (!order || !RECIPES[order.recipe]) return {
      ok: false,
      errors: ['这张订单不存在。'],
      points: 0
    };
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
    return {
      ok: errors.length === 0,
      errors,
      points: errors.length ? 0 : 100
    };
  }
  /** Cooked ingredients and heat cannot be undone; packaging can still be corrected. */
  function dishNeedsRestart(order, dish) {
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
      if (state.orderIndex + 1 >= STAGES[state.stage].orders.length) return {
        ...state,
        phase: 'stageComplete',
        feedback: ''
      };
      return {
        ...state,
        orderIndex: state.orderIndex + 1,
        phase: 'playing',
        dish: {
          ...emptyDish(),
          token: dish.token + 1
        },
        feedback: '',
        feedbackType: 'info'
      };
    }
    if (action.type === 'CLEAR' && ['playing', 'served'].includes(state.phase)) return {
      ...state,
      dish: {
        ...emptyDish(),
        token: dish.token + 1
      },
      feedback: state.phase === 'served' ? '台面收拾好了。点“下一位”继续，不会重复记分。' : '已重新备料，不扣分。当前订单还在，请按配方再做一份。',
      feedbackType: 'info'
    };
    if (state.phase !== 'playing') return state;
    if (action.type === 'TOGGLE_INGREDIENT') {
      if (dish.status !== 'raw' || !Object.prototype.hasOwnProperty.call(INGREDIENTS, action.id)) return state;
      return {
        ...state,
        feedback: '',
        dish: {
          ...dish,
          ingredients: dish.ingredients.includes(action.id) ? dish.ingredients.filter(x => x !== action.id) : [...dish.ingredients, action.id]
        }
      };
    }
    if (action.type === 'SET_TEXTURE') {
      if (dish.status !== 'raw' || !['soft', 'crisp'].includes(action.value)) return state;
      return {
        ...state,
        feedback: '',
        dish: {
          ...dish,
          texture: action.value
        }
      };
    }
    if (action.type === 'SET_PACKAGING') {
      if (!['plate', 'bag'].includes(action.value)) return state;
      return {
        ...state,
        feedback: '',
        dish: {
          ...dish,
          packaging: action.value
        }
      };
    }
    if (action.type === 'COOK') {
      if (dish.status !== 'raw' || dish.ingredients.length === 0) return {
        ...state,
        feedback: '先点选食材，再开火。',
        feedbackType: 'error'
      };
      return {
        ...state,
        feedback: '',
        dish: {
          ...dish,
          status: 'cooking',
          token: dish.token + 1
        }
      };
    }
    if (action.type === 'COOK_DONE') {
      if (dish.status !== 'cooking' || action.token !== dish.token) return state;
      const cooked = {
        ...dish,
        status: 'cooked'
      };
      const current = getOrder(state),
        restart = dishNeedsRestart(current, cooked);
      const verdict = evaluateDish(current, cooked);
      return {
        ...state,
        dish: cooked,
        feedback: restart ? '配料或火候不符，请点“倒掉重做”（不扣分）。熟食不能退回原料。' : verdict.ok ? '香气刚刚好！现在可以出餐；做错也能点“倒掉重做”。' : '早餐已煎好，调整堂食/打包方式后就能出餐。',
        feedbackType: restart ? 'error' : 'info'
      };
    }
    if (action.type === 'SERVE') {
      const current = getOrder(state);
      if (!current || state.servedIds.includes(current.id)) return state;
      const result = evaluateDish(current, dish);
      if (!result.ok) {
        const recovery = dishNeedsRestart(current, dish) ? '请点“倒掉重做”（不扣分），重做当前订单。' : dish.status === 'raw' ? '请先按配方调整食材，再开火煎制。' : dish.status === 'cooking' ? '还在煎制，请稍等；做错可点“倒掉重做”。' : '请调整堂食/打包方式后再出餐。';
        return {
          ...state,
          combo: 0,
          mistakes: state.mistakes + 1,
          score: Math.max(0, state.score - 5),
          feedback: recovery + ' ' + result.errors.join(' '),
          feedbackType: 'error'
        };
      }
      const bonus = Math.min(state.combo, 4) * 10;
      return {
        ...state,
        phase: 'served',
        score: state.score + result.points + bonus,
        combo: state.combo + 1,
        servedIds: [...state.servedIds, current.id],
        feedback: `心意满分！+${result.points + bonus}`,
        feedbackType: 'success'
      };
    }
    return state;
  }
  function stageStars(state) {
    if (state.phase !== 'stageComplete') return 0;
    return state.mistakes === 0 ? 3 : state.score >= STAGES[state.stage].target ? 2 : 1;
  }
  function registerArrivals(state) {
    const arrivals = {
      ...state.arrivals
    };
    for (const o of visibleOrders(state)) if (arrivals[o.index] === undefined) arrivals[o.index] = state.turn;
    return registerTimers({
      ...state,
      arrivals
    });
  }
  function failed(state, code, message) {
    return {
      ...state,
      phase: 'failed',
      failure: {
        code,
        message
      },
      failureId: state.failureId + 1,
      feedback: message,
      feedbackType: 'error'
    };
  }
  function reduce(state, action) {
    if (!state || !action || typeof action.type !== 'string') return state;
    const stage = STAGES[state.stage];
    if (action.type === 'TICK') {
      if (!['playing', 'served'].includes(state.phase) || !Number.isFinite(action.ms) || action.ms <= 0) return state;
      let next = registerTimers(state);
      next = {
        ...next,
        elapsedMs: next.elapsedMs + Math.floor(action.ms)
      };
      const expired = visibleOrders(next).find(o => next.timeDeadlines[o.index] <= next.elapsedMs);
      return expired ? failed(next, 'timeout', `${CUSTOMERS[expired.customer].name}等候超时了。先照顾红色倒计时的顾客；可免费重开。`) : next;
    }
    if (action.type === 'RESTART_STAGE') {
      const next = initialState(state.stage, state.runId + 1);
      next.dish.token = state.dish.token + 1;
      return next;
    }
    if (action.type === 'NEXT_STAGE') {
      if (state.phase !== 'stageComplete' || state.stage >= 49) return state;
      const next = initialState(state.stage + 1, state.runId + 1);
      next.dish.token = state.dish.token + 1;
      return next;
    }
    if (action.type === 'REVIVE') {
      if (state.phase !== 'failed' || state.revives >= 1 || action.runId !== state.runId || action.failureId !== state.failureId || typeof action.requestId !== 'string' || !action.requestId || !['coins', 'completed-ad'].includes(action.source)) return state;
      const dish = state.dish.status === 'cooking' ? {
        ...emptyDish(),
        token: state.dish.token + 1
      } : {
        ...state.dish,
        ...(state.dish.status === 'cooked' ? {
          cookedAt: state.turn
        } : {})
      };
      return {
        ...state,
        phase: 'playing',
        failure: null,
        revives: 1,
        fuel: state.fuel === null ? null : state.fuel + 4,
        deadlineBonus: state.deadlineBonus + 2,
        timeDeadlines: Object.fromEntries(Object.entries(state.timeDeadlines).map(([id, t]) => [id, Math.max(t, state.elapsedMs) + 25000])),
        dish,
        heldDish: state.heldDish ? {
          ...state.heldDish,
          cookedAt: state.turn
        } : null,
        feedback: '街坊帮忙续摊：炉火 +4，耐心 +25 秒及2锅，熟食重新保温。本班仅一次。',
        feedbackType: 'success'
      };
    }
    if (action.type === 'USE_TOOL') {
      if (state.phase !== 'playing' || state.stage < 10 || !['fuel', 'tea'].includes(action.kind) || state.toolsUsed[action.kind] >= 1) return state;
      return {
        ...state,
        fuel: action.kind === 'fuel' && state.fuel !== null ? state.fuel + 3 : state.fuel,
        deadlineBonus: state.deadlineBonus + (action.kind === 'tea' ? 2 : 0),
        timeDeadlines: action.kind === 'tea' ? Object.fromEntries(Object.entries(state.timeDeadlines).map(([id, t]) => [id, t + 20000])) : state.timeDeadlines,
        toolsUsed: {
          ...state.toolsUsed,
          [action.kind]: 1
        },
        feedback: action.kind === 'fuel' ? '小炭包：炉火 +3，本班已用。' : '街坊茶：所有待客耐心 +20 秒及2锅，本班已用。',
        feedbackType: 'success'
      };
    }
    if (action.type === 'NEXT_ORDER' && state.stage >= 5) {
      if (state.phase !== 'served') return state;
      if (state.servedIds.length === stage.orders.length) return {
        ...state,
        phase: 'stageComplete',
        feedback: ''
      };
      const next = visibleOrders(state)[0];
      return {
        ...state,
        orderIndex: next.index,
        phase: 'playing',
        dish: {
          ...emptyDish(),
          token: state.dish.token + 1
        },
        feedback: '',
        feedbackType: 'info'
      };
    }
    if (action.type === 'SELECT_ORDER') {
      if (state.phase !== 'playing' || state.stage < 5 || state.dish.status === 'cooking' || !visibleOrders(state).some(o => o.index === action.index)) return state;
      return {
        ...state,
        orderIndex: action.index,
        feedback: '',
        feedbackType: 'info'
      };
    }
    if (state.phase === 'playing' && action.type === 'HOLD') {
      if (!stage.holding || state.dish.status !== 'cooked' || state.heldDish) return state;
      return {
        ...state,
        heldDish: {
          ...state.dish
        },
        dish: {
          ...emptyDish(),
          token: state.dish.token + 1
        },
        feedback: '已放入保温位。选同桌另一位，做齐后一起出餐。',
        feedbackType: 'info'
      };
    }
    if (state.phase === 'playing' && action.type === 'TAKE_HELD') {
      if (!stage.holding || !state.heldDish || state.dish.status === 'cooking' || state.dish.status === 'raw' && state.dish.ingredients.length) return state;
      return {
        ...state,
        dish: {
          ...state.heldDish,
          token: state.dish.token + 1
        },
        heldDish: state.dish.status === 'cooked' ? {
          ...state.dish
        } : null,
        feedback: '保温餐已取回。可换包装；做错可倒掉重做。',
        feedbackType: 'info'
      };
    }
    if (state.phase === 'playing' && action.type === 'COOK' && state.dish.status === 'raw' && state.dish.ingredients.length) {
      const expired = visibleOrders(state).find(o => o.due !== null && o.due !== undefined && o.due + state.deadlineBonus < state.turn + 1);
      if (expired) return failed(state, 'patience', `${CUSTOMERS[expired.customer].name}已经等到最后一锅。再开火会错过这份订单，本班暂时收摊。`);
      const cost = fireCost(state);
      if (state.fuel !== null && state.fuel < cost) return failed(state, 'fuel', `炉火只剩 ${state.fuel} 格，这锅需要 ${cost} 格。之前换火或重做用掉了余量。`);
      const next = reduceClassic(state, action);
      return {
        ...next,
        turn: state.turn + 1,
        fuel: state.fuel === null ? null : state.fuel - cost,
        lastHeat: state.dish.texture,
        dish: {
          ...next.dish,
          cookMs: RECIPES[getOrder(state).recipe].cookMs,
          cookedAt: state.turn + 1
        }
      };
    }
    if (state.phase === 'playing' && action.type === 'SERVE' && state.dish.status === 'cooked') {
      const current = getOrder(state);
      if (stage.holding && freshLeft(state, state.dish) < 0) return failed(state, 'cold', '这份早餐已经超过保温锅次，不能把凉餐交给顾客。下次先做急单，保温位最多等2锅。');
      if (current.pair !== undefined && current.pair !== null) {
        const partner = {
          ...stage.orders[current.pair],
          id: `${state.stage}:${current.pair}`
        };
        if (state.servedIds.includes(partner.id)) return state;
        if (!state.heldDish || !evaluateDish(partner, state.heldDish).ok) return {
          ...state,
          feedback: '同桌两份要一起上。先把另一份按要求做好放进保温位，再交这一份。',
          feedbackType: 'info'
        };
        if (freshLeft(state, state.heldDish) < 0) return failed(state, 'cold', '保温位的另一份已经凉了。这桌需要两份都热乎，下次别让熟食等超过2锅。');
        const first = reduceClassic(state, action);
        if (first.phase !== 'served') return first;
        const bonus = 100 + Math.min(first.combo, 4) * 10;
        return registerArrivals({
          ...first,
          score: first.score + bonus,
          combo: first.combo + 1,
          servedIds: [...first.servedIds, partner.id],
          heldDish: null,
          feedback: `同桌一起吃！两份热餐已交付。`,
          feedbackType: 'success'
        });
      }
    }
    let next = reduceClassic(state, action);
    if (action.type === 'NEXT_ORDER' && next !== state) next = registerTimers(next);
    if (action.type === 'SERVE' && next.phase === 'served' && next !== state) return registerArrivals(next);
    if (action.type === 'CLEAR' && state.stage >= 10 && next !== state && state.phase === 'playing') return {
      ...next,
      feedback: '已重新备料，不扣分；开过的炉火与排队锅次不会倒退。当前顾客仍在。'
    };
    return next;
  }
  const TOOL_COSTS = Object.freeze({
    fuel: 18,
    tea: 18,
    revive: 30
  });
  const DEFAULT_PROGRESS = {
    version: VERSION,
    unlocked: 0,
    stars: Array(50).fill(0),
    best: Array(50).fill(0),
    sound: true,
    coins: 0,
    tools: {
      fuel: 0,
      tea: 0
    },
    nextRun: 1,
    lastRewardedRun: 0,
    pendingSpend: null
  };
  function parseProgress(raw) {
    const fallback = () => ({
      ...DEFAULT_PROGRESS,
      stars: [...DEFAULT_PROGRESS.stars],
      best: [...DEFAULT_PROGRESS.best],
      tools: {
        ...DEFAULT_PROGRESS.tools
      }
    });
    try {
      var _chainObject8, _chainObject9, _chainObject0, _chainObject1;
      const p = JSON.parse(raw);
      if (!p || ![1, VERSION].includes(p.version)) return fallback();
      const clean = (a, max) => Array.from({
        length: 50
      }, (_, i) => {
        var _chainObject7;
        return i < (p.version === 1 ? 5 : 50) && Number.isInteger((_chainObject7 = a, _chainObject7 === null || _chainObject7 === void 0 ? void 0 : _chainObject7[i])) && a[i] >= 0 && a[i] <= max ? a[i] : 0;
      });
      const number = (v, max, base = 0) => Number.isSafeInteger(v) && v >= base && v <= max ? v : base;
      const old = p.version === 1;
      const receipt = p.pendingSpend;
      const pendingSpend = !old && receipt && Number.isSafeInteger(receipt.runId) && receipt.runId > number(p.lastRewardedRun, 1e12) && receipt.runId < number(p.nextRun, 1e12, 1) && [0, 30].includes(receipt.coins) && [0, 1].includes((_chainObject8 = receipt.tools, _chainObject8 === null || _chainObject8 === void 0 ? void 0 : _chainObject8.fuel)) && [0, 1].includes((_chainObject9 = receipt.tools, _chainObject9 === null || _chainObject9 === void 0 ? void 0 : _chainObject9.tea)) ? {
        runId: receipt.runId,
        coins: receipt.coins,
        tools: {
          fuel: receipt.tools.fuel,
          tea: receipt.tools.tea
        }
      } : null;
      return {
        version: VERSION,
        unlocked: number(p.unlocked, old ? 4 : 49),
        stars: clean(p.stars, 3),
        best: clean(p.best, 10000),
        sound: typeof p.sound === 'boolean' ? p.sound : true,
        coins: old ? 0 : number(p.coins, 99999),
        tools: {
          fuel: old ? 0 : number((_chainObject0 = p.tools, _chainObject0 === null || _chainObject0 === void 0 ? void 0 : _chainObject0.fuel), 3),
          tea: old ? 0 : number((_chainObject1 = p.tools, _chainObject1 === null || _chainObject1 === void 0 ? void 0 : _chainObject1.tea), 3)
        },
        nextRun: old ? 1 : number(p.nextRun, 1e12, 1),
        lastRewardedRun: old ? 0 : number(p.lastRewardedRun, 1e12),
        pendingSpend
      };
    } catch (_ignoredError) {
      return fallback();
    }
  }
  /** Abandoned paid effects are returned once; completed runs clear the receipt instead. */
  function recoverAbandonedRun(progress) {
    const p = parseProgress(JSON.stringify(progress)),
      receipt = p.pendingSpend;
    if (!receipt) return p;
    let coins = p.coins + receipt.coins;
    const tools = {
      ...p.tools
    };
    for (const kind of ['fuel', 'tea']) {
      const total = tools[kind] + receipt.tools[kind];
      coins += Math.max(0, total - 3) * TOOL_COSTS[kind];
      tools[kind] = Math.min(3, total);
    }
    return {
      ...p,
      coins: Math.min(99999, coins),
      tools,
      pendingSpend: null
    };
  }
  function withSpendReceipt(progress, state, kind) {
    var _chainObject10;
    const old = (_chainObject10 = progress.pendingSpend, _chainObject10 === null || _chainObject10 === void 0 ? void 0 : _chainObject10.runId) === state.runId ? progress.pendingSpend : {
      runId: state.runId,
      coins: 0,
      tools: {
        fuel: 0,
        tea: 0
      }
    };
    return {
      ...progress,
      nextRun: Math.max(progress.nextRun, state.runId + 1),
      pendingSpend: {
        ...old,
        coins: old.coins + (kind === 'revive' ? TOOL_COSTS.revive : 0),
        tools: {
          ...old.tools,
          ...(kind === 'revive' ? {} : {
            [kind]: old.tools[kind] + 1
          })
        }
      }
    };
  }
  function allocateRun(progress, stage) {
    const p = recoverAbandonedRun(progress),
      run = Math.max(p.nextRun, p.lastRewardedRun + 1),
      state = initialState(stage, run);
    return {
      state,
      progress: {
        ...p,
        nextRun: run + 1
      }
    };
  }
  function recordStage(progress, state) {
    var _chainObject11;
    if (state.phase !== 'stageComplete') return progress;
    const clean = parseProgress(JSON.stringify(progress)),
      first = clean.stars[state.stage] === 0;
    if ((_chainObject11 = clean.pendingSpend, _chainObject11 === null || _chainObject11 === void 0 ? void 0 : _chainObject11.runId) === state.runId) clean.pendingSpend = null;
    clean.unlocked = Math.max(clean.unlocked, Math.min(49, state.stage + 1));
    clean.stars[state.stage] = Math.max(clean.stars[state.stage], stageStars(state));
    clean.best[state.stage] = Math.max(clean.best[state.stage], state.score);
    if (state.runId > clean.lastRewardedRun) {
      clean.coins = Math.min(99999, clean.coins + (first ? 12 + Math.floor(state.stage / 10) * 2 : 2));
      clean.lastRewardedRun = state.runId;
      clean.nextRun = Math.max(clean.nextRun, state.runId + 1);
    }
    return clean;
  }
  function buyTool(progress, kind) {
    if (!['fuel', 'tea'].includes(kind)) return progress;
    const p = parseProgress(JSON.stringify(progress));
    if (p.coins < TOOL_COSTS[kind] || p.tools[kind] >= 3) return progress;
    return {
      ...p,
      coins: p.coins - TOOL_COSTS[kind],
      tools: {
        ...p.tools,
        [kind]: p.tools[kind] + 1
      }
    };
  }
  function spendTool(progress, state, kind) {
    var _chainObject12;
    if (!['fuel', 'tea'].includes(kind) || !(_chainObject12 = progress.tools, _chainObject12 === null || _chainObject12 === void 0 ? void 0 : _chainObject12[kind])) return {
      progress,
      state
    };
    const next = reduce(state, {
      type: 'USE_TOOL',
      kind
    });
    if (next === state) return {
      progress,
      state
    };
    return {
      state: next,
      progress: withSpendReceipt({
        ...progress,
        tools: {
          ...progress.tools,
          [kind]: progress.tools[kind] - 1
        }
      }, state, kind)
    };
  }
  function coinRevive(progress, state) {
    if (progress.coins < TOOL_COSTS.revive) return {
      progress,
      state
    };
    const next = reduce(state, {
      type: 'REVIVE',
      runId: state.runId,
      failureId: state.failureId,
      requestId: `coin-${state.runId}-${state.failureId}`,
      source: 'coins'
    });
    return next === state ? {
      progress,
      state
    } : {
      state: next,
      progress: withSpendReceipt({
        ...progress,
        coins: progress.coins - TOOL_COSTS.revive
      }, state, 'revive')
    };
  }

  // SOURCE: src/canvas-art.js
  /** Original procedural Canvas2D artwork. No downloaded assets or DOM. */
  const C = {
    bg: '#f0d8ad',
    paper: '#fff5dc',
    ink: '#513b2b',
    muted: '#8d755d',
    green: '#3d684f',
    pale: '#e8dfbb',
    coral: '#ad5032',
    gold: '#d7ac65',
    line: '#dedac6'
  };
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  function circle(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    circle(ctx, 0, 0, 1, color);
    ctx.restore();
  }
  function line(ctx, x, y, ex, ey, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  function poly(ctx, points, color) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function label(ctx, str, x, y, size = 12, color = C.ink, weight = 'normal', align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `${weight === 'bold' ? 700 : weight === 'normal' ? 400 : weight} ${size}px "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }
  function wrapped(ctx, str, x, y, maxWidth, size = 12, color = C.ink, height = 20, maxLines = 4) {
    ctx.font = `400 ${size}px "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    const lines = [];
    let row = '';
    for (const char of str) {
      if (char === '\n') {
        lines.push(row);
        row = '';
        continue;
      }
      if (ctx.measureText(row + char).width > maxWidth && row) {
        lines.push(row);
        row = char;
      } else row += char;
    }
    if (row) lines.push(row);
    lines.slice(0, maxLines).forEach((s, i) => label(ctx, s, x, y + i * height, size, color));
    return Math.min(lines.length, maxLines) * height;
  }
  function ingredientArt(ctx, id, x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (id === 'batter') {
      ellipse(ctx, 0, 12, 22, 7, '#dbc99f');
      poly(ctx, [[-22, -3], [22, -3], [16, 17], [-16, 17]], '#8ba38c');
      ellipse(ctx, 0, -3, 22, 8, '#f0d799');
      line(ctx, 10, -5, 24, -23, '#987652', 4);
    }
    if (id === 'egg') {
      ellipse(ctx, 0, 4, 23, 16, '#fdf4d8');
      circle(ctx, 1, 3, 11, '#e8ac49');
      circle(ctx, -2, 0, 3, '#f4ca71');
    }
    if (id === 'crisp') {
      poly(ctx, [[-21, -10], [10, -20], [23, 12], [-10, 21]], '#dca947');
      for (let i = 0; i < 3; i++) line(ctx, -12, -6 + i * 8, 9, -12 + i * 8, '#f2d487', 2);
    }
    if (id === 'cheese') {
      poly(ctx, [[-21, -2], [6, -19], [23, -1], [23, 18], [-21, 18]], '#e4af48');
      poly(ctx, [[-21, -2], [6, -19], [23, -1], [-21, 6]], '#f3ce78');
      circle(ctx, -7, 10, 4, '#cb9534');
      circle(ctx, 13, 6, 3, '#cb9534');
    }
    if (id === 'rice') {
      ellipse(ctx, 0, 12, 24, 8, '#d9c69e');
      poly(ctx, [[-22, -1], [22, -1], [16, 17], [-16, 17]], '#c58060');
      ellipse(ctx, 0, -2, 22, 13, '#faf1d6');
      for (let i = 0; i < 5; i++) line(ctx, -12 + i * 6, -3 + i % 2 * 4, -9 + i * 6, -5 + i % 2 * 4, '#e0d6b7', 2);
    }
    if (id === 'nori') {
      poly(ctx, [[-21, -12], [16, -21], [23, 16], [-16, 22]], '#587a5e');
      for (let i = 0; i < 4; i++) line(ctx, -13, -8 + i * 8, 13, -13 + i * 8, '#77916c', 2);
    }
    if (id === 'scallion') {
      for (let i = 0; i < 3; i++) {
        line(ctx, -10 + i * 10, 17, -4 + i * 13, -18 - i * 3, '#799b5a', 6);
        line(ctx, -10 + i * 10, 17, -8 + i * 11, 8, '#e3dfaa', 6);
      }
      circle(ctx, -18, -2, 5, '#8aa664');
      circle(ctx, -18, -2, 2, '#e3dfaa');
    }
    ctx.restore();
  }
  function foodArt(ctx, dish, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const ids = dish.ingredients;
    if (!ids.length) {
      ellipse(ctx, 0, 7, 53, 15, '#22392e24');
      label(ctx, '等一份热乎的', 0, 5, 11, '#bdc2a5', 'normal', 'center');
      ctx.restore();
      return;
    }
    const cooked = dish.status === 'cooked',
      rice = ids.includes('rice');
    ellipse(ctx, 3, 12, 67, 32, '#4e34282b');
    if (rice) {
      poly(ctx, [[-43, 29], [-19, -31], [0, -43], [20, -31], [43, 29]], cooked ? '#bb8240' : '#e1cda2');
      poly(ctx, [[-38, 23], [-15, -28], [0, -35], [15, -28], [37, 23]], cooked ? '#e4bb73' : '#f5e8c9');
      for (let i = 0; i < 20; i++) {
        const xx = i * 17 % 57 - 28,
          yy = i * 23 % 41 - 12;
        if (Math.abs(xx) < 28 - Math.max(0, -yy) * .5) line(ctx, xx, yy, xx + 4, yy + 1, cooked ? '#c18f4a' : '#fff7e2', 2);
      }
    } else {
      ellipse(ctx, 0, 1, 65, 35, cooked ? dish.texture === 'crisp' ? '#a9672f' : '#c58d49' : '#d9bc7c');
      ellipse(ctx, 0, -2, 61, 31, cooked ? '#e2b467' : '#f1dda5');
      ellipse(ctx, -8, -12, 42, 13, '#ffe5a12b');
      if (cooked) for (let i = 0; i < 17; i++) {
        const a = i * 2.4,
          rx = 24 + i % 3 * 12;
        ellipse(ctx, Math.cos(a) * rx, Math.sin(a) * 22, 3 + i % 4, 1.4, '#ac6e3670');
      }
    }
    if (ids.includes('egg')) {
      ellipse(ctx, -8, -3, 31, 18, '#fdf3d3');
      ellipse(ctx, -23, -10, 12, 8, '#fff9e6');
      ellipse(ctx, 10, 1, 13, 10, '#f7eccc');
      ellipse(ctx, -9, -5, 13, 10, '#e5a334');
      ellipse(ctx, -12, -8, 6, 3, '#ffe07c');
      circle(ctx, -15, -9, 2, '#fff0b7');
    }
    if (ids.includes('cheese')) {
      poly(ctx, [[-29, -17], [16, -26], [32, 10], [-13, 25]], '#df9d30');
      poly(ctx, [[-27, -18], [15, -25], [29, 7], [-12, 22]], '#f2c65a');
      circle(ctx, 9, -10, 3, '#dcaa43');
      circle(ctx, -9, 8, 4, '#e1ab42');
      line(ctx, -22, -15, 12, -22, '#ffe18c', 2);
      if (cooked) {
        line(ctx, 4, 15, 5, 28, '#f6d478', 3);
        line(ctx, 12, 12, 18, 22, '#edbf59', 2);
      }
    }
    if (ids.includes('crisp')) {
      poly(ctx, [[14, -24], [40, -12], [25, 19], [-1, 8]], '#b97c2e');
      poly(ctx, [[13, -23], [37, -12], [23, 16], [1, 7]], '#e1ae4c');
      for (let i = 0; i < 4; i++) line(ctx, 10 + i * 5, -13 + i * 2, 24 + i * 2, -7 + i * 3, '#f5cf76', 1);
    }
    if (ids.includes('nori')) {
      roundRect(ctx, -16, -2, 32, 30, 1, '#304f3c');
      for (let i = 0; i < 5; i++) line(ctx, -12, -1 + i * 6, 12, 1 + i * 5, '#66845a', 1);
      for (let i = 0; i < 3; i++) line(ctx, -9 + i * 8, 1, -7 + i * 8, 25, '#456744', 1);
    }
    if (ids.includes('scallion')) for (const [a, b] of [[-30, -3], [6, -18], [31, 6], [-4, 21]]) {
      ellipse(ctx, a, b, 5, 2, '#426b37');
      ellipse(ctx, a - 1, b - 1, 4, 1.4, '#9bb955');
    }
    if (cooked) {
      line(ctx, -39, -15, -25, -22, '#fff1b270', 2);
      circle(ctx, 40, 8, 2, '#ffe6a4');
    }
    ctx.restore();
  }
  function avatar(ctx, id, x, y, color, size = 40, mood = 'calm', time = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 80, size / 80);
    ellipse(ctx, 1, 35, 31, 11, '#3b332828');
    circle(ctx, 0, -1, 37, color);
    ellipse(ctx, 0, 34, 29, 22, id === 'tang' ? '#476a7d' : id === 'lin' ? '#eee3bd' : id === 'min' ? '#6e7b4c' : id === 'zao' ? '#d5ac46' : '#e6c08a');
    const hair = id === 'zhou' ? '#a1a093' : id === 'lan' ? '#686052' : '#4f483c';
    ellipse(ctx, 0, -7, 26, 30, hair);
    if (id === 'lan') {
      circle(ctx, -24, -15, 11, hair);
      circle(ctx, 22, -15, 10, hair);
    }
    if (id === 'man') {
      ellipse(ctx, -26, 7, 7, 17, hair);
      ellipse(ctx, 26, 7, 7, 17, hair);
    }
    ellipse(ctx, -22, 1, 4, 7, '#d8aa86');
    ellipse(ctx, 22, 1, 4, 7, '#d8aa86');
    ellipse(ctx, 0, 1, 22, 27, '#efc59f');
    ellipse(ctx, -5, -6, 15, 17, '#f6d4b1');
    poly(ctx, [[-23, -9], [-19, -24], [-4, -29], [0, -18], [20, -9]], hair);
    if (id === 'tang') {
      poly(ctx, [[-27, -20], [-22, -34], [21, -34], [27, -20]], '#466c80');
      roundRect(ctx, -28, -21, 55, 7, 2, '#2e4a59');
      roundRect(ctx, -5, -32, 10, 8, 1, '#d9b660');
    }
    if (id === 'lin') {
      circle(ctx, -14, -28, 12, '#f8efd7');
      circle(ctx, 0, -34, 15, '#fff7e3');
      circle(ctx, 14, -28, 12, '#f8efd7');
      roundRect(ctx, -22, -29, 44, 13, 3, '#efe0bd');
    }
    if (id === 'zao') {
      ellipse(ctx, 0, -22, 28, 13, '#e0b447');
      line(ctx, -27, -18, 27, -18, '#9b792c', 3);
      line(ctx, -13, -30, -15, -21, '#f4d47f', 3);
    }
    if (id === 'qiao') {
      poly(ctx, [[-25, -23], [-18, -35], [18, -35], [25, -23]], '#fff5db');
      line(ctx, 0, -32, 0, -24, '#c57471', 3);
      line(ctx, -4, -28, 4, -28, '#c57471', 3);
    }
    if (id === 'min') {
      poly(ctx, [[-24, -13], [-26, -29], [0, -38], [26, -28], [23, -13], [3, -28]], '#aa6257');
      for (let i = 0; i < 4; i++) circle(ctx, -15 + i * 10, -28 + i % 2 * 3, 2, '#e7b9a1');
    }
    if (id === 'dou') {
      ellipse(ctx, 0, 17, 15, 11, '#796345');
      ellipse(ctx, 0, 12, 13, 6, '#efc59f');
      line(ctx, -18, 33, 17, 40, '#567a58', 9);
    }
    line(ctx, -12, -7, -5, mood === 'urgent' ? -9 : -7, '#685444', 1.4);
    line(ctx, 5, mood === 'urgent' ? -9 : -7, 12, -7, '#685444', 1.4);
    const blink = Math.floor(time / 2200) % 5 === 4;
    if (blink) {
      line(ctx, -11, 0, -6, 0, '#615044', 1.5);
      line(ctx, 6, 0, 11, 0, '#615044', 1.5);
    } else {
      circle(ctx, -8, 0, 2, '#4f473c');
      circle(ctx, 9, 0, 2, '#4f473c');
    }
    if (id === 'zhou') {
      roundRect(ctx, -18, -5, 14, 10, 3, null, '#676352');
      roundRect(ctx, 4, -5, 14, 10, 3, null, '#676352');
      line(ctx, -4, -1, 4, -1, '#676352');
    }
    ellipse(ctx, -15, 9, 4, 2, '#dd9c812b');
    ellipse(ctx, 15, 9, 4, 2, '#dd9c812b');
    line(ctx, -1, 4, 1, 7, '#ce9878', 1);
    if (mood === 'happy') {
      ctx.beginPath();
      ctx.arc(0, 10, 7, 0, Math.PI);
      ctx.strokeStyle = '#a76d59';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else line(ctx, -4, 13, 4, mood === 'urgent' ? 12 : 13, '#a46e59', 2);
    if (id === 'lan') {
      circle(ctx, 22, -21, 5, '#e9b6a4');
      circle(ctx, 22, -21, 2, '#f7d67f');
    }
    line(ctx, -13, 30, -12, 49, '#f2dfb5', 2);
    line(ctx, 13, 30, 12, 49, '#f2dfb5', 2);
    ctx.restore();
  }
  function streetArt(ctx, x, y, w, h, day = 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    ctx.scale(w / 390, h / 110);
    ctx.fillStyle = day === 3 ? '#d9e1d6' : '#e2e9d6';
    ctx.fillRect(0, 0, 390, 110);
    circle(ctx, 335, 22, 22, '#faebba');
    poly(ctx, [[0, 60], [0, 37], [62, 37], [62, 15], [98, 15], [98, 110], [0, 110]], '#c7d3bd');
    poly(ctx, [[292, 110], [292, 35], [350, 35], [350, 56], [390, 56], [390, 110]], '#c2cdb9');
    roundRect(ctx, 110, 24, 174, 86, 0, '#dfc7a1');
    roundRect(ctx, 130, 31, 132, 26, 3, '#8c6f50');
    label(ctx, '街 角 早 餐 铺', 196, 44, 13, '#f9e7bd', 'bold', 'center');
    poly(ctx, [[102, 60], [292, 60], [303, 82], [91, 82]], '#efd7a7');
    for (let i = 0; i < 7; i++) poly(ctx, [[103 + i * 27, 60], [116 + i * 27, 60], [112 + i * 30, 82], [96 + i * 30, 82]], '#cb7054');
    roundRect(ctx, 128, 85, 78, 25, 0, '#63806a');
    roundRect(ctx, 225, 85, 39, 25, 0, '#a28d65');
    line(ctx, 168, 86, 168, 110, '#c9ba87', 2);
    line(ctx, 0, 108, 390, 108, '#b6b99b', 2);
    poly(ctx, [[69, 110], [92, 110], [96, 90], [65, 90]], '#ae7754');
    circle(ctx, 79, 83, 17, '#7b9867');
    circle(ctx, 69, 77, 13, '#8eaa76');
    roundRect(ctx, 316, 91, 21, 19, 2, '#b18a61');
    line(ctx, 326, 91, 328, 67, '#7f965f', 3);
    circle(ctx, 328, 66, 8, day > 0 ? '#c4989a' : '#90a572');
    if (day === 3) for (let i = 0; i < 18; i++) line(ctx, i * 24, 5 + i % 3 * 17, i * 24 - 8, 30 + i % 3 * 17, '#b7c9b8', 1);
    ctx.restore();
  }

  // SOURCE: src/main.js

  const SAVE_KEY = 'street-breakfast-shop:progress:v1';
  const W = 360;
  const STATIONS = [['prep', '备料台'], ['cook', '铁锅台'], ['serve', '出餐台']];
  /** Full-screen game world. No gameplay DOM; width-based layout preserves physical touch targets. */
  function startGame(platform) {
    var _chainObject13, _chainFunction;
    const ctx = platform.canvas.getContext('2d');
    let progress = parseProgress(null),
      storageWarning = false;
    try {
      const loaded = parseProgress(platform.storage.getItem(SAVE_KEY));
      progress = recoverAbandonedRun(loaded);
      if (loaded.pendingSpend) platform.storage.setItem(SAVE_KEY, JSON.stringify(progress));
    } catch (_ignoredError2) {
      storageWarning = true;
    }
    let state = initialState(progress.unlocked),
      screen = 'welcome',
      station = 'prep',
      trail = [],
      chapterPage = Math.floor(progress.unlocked / 6),
      earnedCoins = 0,
      artTime = 0;
    let rewardPending = null,
      rewardMessage = '';
    const rewardClaims = new Set();
    let size = platform.getSize(),
      zoom = 1,
      ox = 0,
      oy = 0,
      H = 780,
      layout = {},
      buttons = [],
      frameId,
      alive = true,
      paused = false,
      lastFrame = 0,
      cookElapsed = 0,
      activeToken = -1,
      pointerDown = null;
    let sidebarState = (_chainObject13 = platform.sidebar, _chainObject13 === null || _chainObject13 === void 0 ? void 0 : (_chainFunction = _chainObject13.getState, _chainFunction.call(_chainObject13))) || {
        available: false,
        checked: true,
        enteredFromSidebar: false,
        pending: false,
        error: null
      },
      sidebarMessage = '';
    const unsubscribers = [];
    platform.audio.setMuted(!progress.sound);
    const save = (next = progress) => {
      try {
        platform.storage.setItem(SAVE_KEY, JSON.stringify(next));
        return true;
      } catch (_ignoredError3) {
        storageWarning = true;
        return false;
      }
    };
    function dispatch(action) {
      const old = state;
      state = reduce(state, action);
      if (action.type === 'HOLD' && state !== old) station = 'prep';
      if (state.phase === 'failed' && old.phase !== 'failed') {
        screen = 'failure';
        trail = [];
        activeToken = -1;
        platform.audio.play('error');
      }
      if (action.type === 'COOK' && state.dish.status === 'cooking' && old.dish.status !== 'cooking') {
        cookElapsed = 0;
        activeToken = state.dish.token;
        platform.audio.play('cook');
      }
      if (['CLEAR', 'RESTART_STAGE', 'NEXT_STAGE', 'NEXT_ORDER'].includes(action.type)) {
        cookElapsed = 0;
        activeToken = -1;
        if (state.phase === 'playing') station = 'prep';
      }
      if (action.type === 'SERVE') platform.audio.play(state.phase === 'served' ? 'success' : 'error');
      if (state.phase === 'stageComplete' && old.phase !== 'stageComplete') {
        const before = progress.coins;
        progress = recordStage(progress, state);
        earnedCoins = progress.coins - before;
        save();
        screen = 'result';
        trail = [];
        platform.audio.play('complete');
      }
    }
    function open(name) {
      trail.push(screen);
      screen = name;
      pointerDown = null;
    }
    function close() {
      screen = trail.pop() || 'play';
      pointerDown = null;
    }
    function beginStage(index) {
      var _chainObject14, _chainFunction2;
      _chainObject14 = platform.rewards, _chainObject14 === null || _chainObject14 === void 0 ? void 0 : (_chainFunction2 = _chainObject14.cancel, _chainFunction2.call(_chainObject14));
      rewardPending = null;
      const next = allocateRun(progress, index);
      progress = next.progress;
      next.state.dish.token = state.dish.token + 1;
      state = next.state;
      save();
      station = 'prep';
      screen = 'day';
      trail = [];
      cookElapsed = 0;
      activeToken = -1;
      pointerDown = null;
      rewardMessage = '';
    }
    function useTool(kind) {
      const next = spendTool(progress, state, kind);
      if (next.state !== state && save(next.progress)) {
        progress = next.progress;
        state = next.state;
        close();
      }
    }
    function reviveWithCoins() {
      const next = coinRevive(progress, state);
      if (next.state !== state && save(next.progress)) {
        progress = next.progress;
        state = next.state;
        screen = 'play';
        trail = [];
        station = 'prep';
      }
    }
    function requestRevive() {
      var _chainObject15, _chainFunction3, _chainObject16;
      if (rewardPending || state.phase !== 'failed' || state.revives >= 1 || !(_chainObject15 = platform.rewards, _chainObject15 === null || _chainObject15 === void 0 ? void 0 : (_chainFunction3 = _chainObject15.getState, _chainObject16 = _chainFunction3.call(_chainObject15), _chainObject16.available))) return;
      const token = {
        runId: state.runId,
        failureId: state.failureId
      };
      rewardPending = token;
      rewardMessage = '';
      screen = 'reward';
      platform.rewards.request({
        placement: 'revive',
        context: token
      }).then(result => {
        if (!alive || rewardPending !== token || state.runId !== token.runId || state.failureId !== token.failureId || state.phase !== 'failed') return;
        rewardPending = null;
        if (result.status === 'completed' && !rewardClaims.has(result.requestId)) {
          rewardClaims.add(result.requestId);
          const next = reduce(state, {
            type: 'REVIVE',
            ...token,
            requestId: result.requestId,
            source: 'completed-ad'
          });
          if (next !== state) {
            state = next;
            screen = 'play';
            trail = [];
            station = 'prep';
          }
        } else {
          rewardMessage = result.status === 'cancelled' ? '已提前关闭，没有发放奖励。' : result.status === 'unavailable' ? '没有可用广告，没有发放奖励。' : '模拟异常，没有发放奖励。';
          screen = 'failure';
        }
        redraw();
      }).catch(() => {
        if (alive && rewardPending === token) {
          rewardPending = null;
          rewardMessage = '请求失败，没有发放奖励。';
          screen = 'failure';
          redraw();
        }
      });
    }
    function sound() {
      progress.sound = !progress.sound;
      platform.audio.setMuted(!progress.sound);
      save();
    }
    function button(id, text, x, y, w, h, fn, opts = {}) {
      var _nullish4, _nullish5;
      const {
        fill = C.paper,
        color = C.ink,
        stroke = C.line,
        disabled = false,
        selected = false,
        size: fontSize = 14
      } = opts;
      ctx.save();
      if (disabled && opts.dimDisabled !== false) ctx.globalAlpha = .46;
      roundRect(ctx, x, y + 3, w, h, (_nullish4 = opts.radius, _nullish4 === null || _nullish4 === void 0 ? 7 : _nullish4), '#70432433');
      roundRect(ctx, x, y, w, h, (_nullish5 = opts.radius, _nullish5 === null || _nullish5 === void 0 ? 7 : _nullish5), selected ? '#355f4d' : fill, selected ? '#264a3b' : stroke);
      if (text) label(ctx, text, x + w / 2, y + h / 2, fontSize, selected ? '#fff4d5' : color, opts.bold ? '700' : '400', 'center');
      ctx.restore();
      buttons.push({
        id,
        x,
        y,
        w,
        h,
        fn,
        disabled,
        label: text
      });
    }
    function wood(x, y, w, h, dark = false) {
      roundRect(ctx, x, y, w, h, 4, dark ? '#765039' : '#c79963');
      for (let i = 0; i < Math.ceil(h / 33); i++) {
        line(ctx, x + 3, y + i * 33 + 1, x + w - 3, y + i * 33 + 1, dark ? '#5f3b2a' : '#b78651', 1);
        line(ctx, x + 9 + i % 3 * 17, y + i * 33 + 9, x + w - 26, y + i * 33 + 9, dark ? '#946549' : '#d9b07c', 1);
      }
    }
    function ticket(x, y, w, h) {
      roundRect(ctx, x + 2, y + 4, w, h, 2, '#70462720');
      roundRect(ctx, x, y, w, h - 8, 2, '#fff6de');
      for (let i = 0; i < w / 12; i++) poly(ctx, [[x + i * 12, y + h - 8], [x + i * 12 + 6, y + h], [x + i * 12 + 12, y + h - 8]], '#fff6de');
      line(ctx, x + 11, y + 28, x + w - 11, y + 28, '#dbc39a', 1);
    }
    function world() {
      ctx.fillStyle = '#d9be8d';
      ctx.fillRect(0, 0, W, H);
      wood(0, 130, W, H - 130);
      poly(ctx, [[0, 60], [115, 60], [300, H], [150, H]], '#fce2ac25');
    }
    function header() {
      wood(0, 0, W, 56, true);
      roundRect(ctx, 12, 6, 160, 43, 3, '#f4d9a7');
      label(ctx, '街角早餐铺', 92, 21, 19, '#664329', '700', 'center');
      label(ctx, storageWarning ? '本次无法保存 · 可继续试玩' : `第${state.stage + 1}/50班   金币 ${progress.coins}`, 92, 40, storageWarning ? 9 : 10, '#8b5d34', '400', 'center');
      button('menu', '', 182, 0, 56, 56, () => open('menu'), {
        fill: '#97633f',
        stroke: '#ae7b50'
      });
      for (let i = 0; i < 3; i++) line(ctx, 199, 19 + i * 10, 221, 19 + i * 10, '#fff1cd', 2.5);
      button('sound', '', 242, 0, 56, 56, sound, {
        fill: '#97633f',
        stroke: '#ae7b50'
      });
      poly(ctx, [[255, 25], [262, 25], [271, 18], [271, 43], [262, 36], [255, 36]], '#fff1cd');
      if (progress.sound) {
        line(ctx, 278, 23, 282, 30, '#fff1cd', 2);
        line(ctx, 282, 30, 278, 38, '#fff1cd', 2);
      } else line(ctx, 253, 44, 286, 16, '#f3c9a0', 2.5);
      button('help', '?', 302, 0, 56, 56, () => open('help'), {
        fill: '#97633f',
        stroke: '#ae7b50',
        color: '#fff1cd',
        size: 23,
        bold: true
      });
    }
    function orderTicket() {
      const order = getOrder(state),
        customer = CUSTOMERS[order.customer],
        stage = STAGES[state.stage];
      streetArt(ctx, 0, 56, W, layout.queueH, state.stage % 5);
      const waiting = visibleOrders(state);
      const shown = state.stage < 5 ? [{
        ...order,
        index: state.orderIndex
      }] : state.phase === 'served' ? [{
        ...order,
        index: state.orderIndex
      }, ...waiting.slice(0, 2)] : waiting.length ? waiting : [{
        ...order,
        index: state.orderIndex
      }];
      shown.slice(0, 3).forEach((o, i) => {
        const x = 12 + i * 114,
          y = 58,
          left = patienceLeft(state, o),
          seconds = patienceSeconds(state, o),
          urgent = seconds <= 10,
          chosen = o.index === state.orderIndex;
        button(`order-${o.index}`, '', x, y, 108, layout.queueH - 4, () => dispatch({
          type: 'SELECT_ORDER',
          index: o.index
        }), {
          fill: chosen ? '#f9e4ad' : '#e8d1a5',
          stroke: urgent ? C.coral : chosen ? '#975335' : '#ab8862',
          disabled: state.phase !== 'playing' || state.dish.status === 'cooking' || state.stage < 5,
          radius: 5,
          dimDisabled: false
        });
        const c = CUSTOMERS[o.customer],
          bounce = chosen && state.phase === 'served' ? Math.sin(artTime / 90) * 2 : 0;
        avatar(ctx, o.customer, x + 23, y + 23 + bounce, c.color, 36, state.phase === 'served' && chosen ? 'happy' : urgent ? 'urgent' : 'calm', artTime);
        label(ctx, c.name, x + 47, y + 15, 12, C.ink, '700');
        label(ctx, `余 ${seconds} 秒`, x + 47, y + 35, 12, urgent ? C.coral : C.green, '700');
        if (left !== null) label(ctx, `开火余 ${left} 锅`, x + 54, y + 51, 9, left <= 1 ? C.coral : '#795b3b', '700', 'center');
        if (layout.queueH > 70) {
          label(ctx, RECIPES[o.recipe].name, x + 54, y + 65, 11, '#755336', '400', 'center');
          {
            roundRect(ctx, x + 9, y + 75, 90, 4, 2, '#cdb486');
            roundRect(ctx, x + 9, y + 75, 90 * Math.min(1, seconds * 1000 / patienceBudgetMs(state.stage)), 4, 2, urgent ? C.coral : '#6d8f58');
          }
        }
      });
      if (state.stage < 5) {
        for (let k = 1; k < 3; k++) {
          const o = stage.orders[state.orderIndex + k];
          if (!o) continue;
          const x = 12 + k * 114,
            c = CUSTOMERS[o.customer];
          avatar(ctx, o.customer, x + 26, 81, c.color, 32);
          label(ctx, '下一位', x + 51, 73, 11, '#795b3b');
          label(ctx, c.name, x + 51, 91, 12, '#795b3b', '700');
        }
      }
      const y = layout.ticketY;
      ticket(12, y, 336, layout.ticketH);
      roundRect(ctx, 165, y - 5, 30, 10, 2, '#b0794a');
      label(ctx, `${RECIPES[order.recipe].name}${order.pair !== undefined && order.pair !== null ? ' · 同桌' + (Math.min(state.orderIndex, order.pair) + 1) : ''}`, 25, y + 14, 14, C.coral, '700');
      label(ctx, state.fuel === null ? `已交 ${state.servedIds.length}/${stage.orders.length}` : `炉火${state.fuel} · 本锅${fireCost(state)}`, 335, y + 14, 11, state.fuel !== null && state.fuel <= 3 ? C.coral : '#795b3b', '700', 'right');
      const message = state.phase === 'served' ? customer.thanks : state.feedback || `“${order.hint}”${order.pair != null ? ' 同桌两份一起上。' : ''}`;
      wrapped(ctx, message, 25, y + 35, 310, 11, state.feedbackType === 'error' && state.phase !== 'served' ? C.coral : C.ink, 16, 2);
      const tags = [order.scallion ? '加葱花' : '不要葱', order.texture === 'crisp' ? '焦脆火候' : '普通火候', order.packaging === 'bag' ? '打包带走' : '堂食装盘'];
      tags.forEach((text, i) => {
        roundRect(ctx, 24 + i * 105, y + layout.ticketH - 23, 99, 17, 2, i === 0 && !order.scallion ? '#efd0b8' : '#e8dfbd');
        label(ctx, text, 73.5 + i * 105, y + layout.ticketH - 14.5, 10, i === 0 && !order.scallion ? C.coral : '#626344', '700', 'center');
      });
    }
    function tabs() {
      STATIONS.forEach(([id, name], i) => button(`tab-${id}`, name, 12 + i * 114, layout.tabsY, 108, 56, () => {
        station = id;
      }, {
        fill: '#e8c796',
        stroke: '#a97949',
        selected: station === id,
        size: 14,
        bold: true
      }));
    }
    function prepView() {
      const order = getOrder(state),
        recipe = RECIPES[order.recipe],
        top = layout.workY;
      label(ctx, recipe.ingredients.map(id => INGREDIENTS[id]).join(' + '), 18, top + 10, 13, '#63452d', '700');
      const rowH = Math.min(82, Math.max(60, (layout.workH - 28) / 2)),
        gap = 6;
      Object.keys(INGREDIENTS).forEach((id, i) => {
        const x = 12 + i % 4 * 86,
          y = top + 24 + Math.floor(i / 4) * (rowH + gap),
          selected = state.dish.ingredients.includes(id);
        button(`ingredient-${id}`, '', x, y, 80, rowH, () => dispatch({
          type: 'TOGGLE_INGREDIENT',
          id
        }), {
          fill: selected ? '#e5dbab' : '#e9e7d7',
          stroke: selected ? '#7e8d54' : '#a8aa92',
          disabled: state.dish.status !== 'raw' || state.phase !== 'playing',
          radius: 3
        });
        ingredientArt(ctx, id, x + 40, y + rowH * .38, .78);
        label(ctx, INGREDIENTS[id], x + 40, y + rowH - 13, 13, '#594e35', '700', 'center');
        if (selected) {
          line(ctx, x + 62, y + 10, x + 67, y + 15, C.green, 2.5);
          line(ctx, x + 67, y + 15, x + 74, y + 6, C.green, 2.5);
        }
      });
      button('recipes', '配方本', 270, top + 24 + rowH + gap, 80, rowH, () => open('recipes'), {
        fill: '#a9583b',
        color: '#fff0cf',
        stroke: '#83432e',
        size: 16,
        bold: true,
        radius: 3
      });
      if (layout.workH >= 265) {
        roundRect(ctx, 18, top + 205, 238, 52, 8, '#d7b27a', '#b18451');
        ellipse(ctx, 89, top + 231, 55, 17, '#f4e8c5');
        foodArt(ctx, state.dish, 89, top + 229, .45);
        label(ctx, `已选 ${state.dish.ingredients.length} 种食材`, 170, top + 223, 12, '#745034', '700', 'center');
        label(ctx, state.dish.status === 'raw' ? '点食材可撤回' : '熟食可倒掉重做', 170, top + 242, 10, '#87603e', '400', 'center');
        roundRect(ctx, 279, top + 210, 29, 45, 5, '#8d6846');
        roundRect(ctx, 283, top + 201, 21, 13, 2, '#5f4c38');
        label(ctx, '酱', 293, top + 235, 14, '#e9c895', '700', 'center');
        line(ctx, 326, top + 252, 337, top + 199, '#604d36', 4);
      }
      if (layout.workH >= 310) wrapped(ctx, '熟食不能退回食材。红色重做键一直都在。', 20, top + 284, 320, 13, '#755638', 22, 2);
    }
    function cookView() {
      const y = layout.workY,
        h = layout.workH,
        panY = y + Math.min(92, h * .42);
      const order = getOrder(state);
      ellipse(ctx, 116, panY + 10, 93, Math.min(58, h * .29), '#86603f');
      ellipse(ctx, 116, panY, 87, Math.min(53, h * .27), '#2e4035');
      roundRect(ctx, 190, panY - 9, 39, 18, 3, '#674730');
      line(ctx, 198, panY - 5, 222, panY - 5, '#9b744c', 2);
      circle(ctx, 198, panY, 2, '#d0a86f');
      circle(ctx, 221, panY, 2, '#d0a86f');
      foodArt(ctx, state.dish, 116, panY, .93);
      button('texture-soft', '普通火候', 240, y + 5, 108, 56, () => dispatch({
        type: 'SET_TEXTURE',
        value: 'soft'
      }), {
        fill: '#e9c794',
        selected: state.dish.texture === 'soft',
        disabled: state.dish.status !== 'raw' || state.phase !== 'playing',
        size: 13
      });
      button('texture-crisp', '焦脆火候', 240, y + 69, 108, 56, () => dispatch({
        type: 'SET_TEXTURE',
        value: 'crisp'
      }), {
        fill: '#e9c794',
        selected: state.dish.texture === 'crisp',
        disabled: state.dish.status !== 'raw' || state.phase !== 'playing',
        size: 13
      });
      const cooked = state.dish.status === 'cooked',
        cooking = state.dish.status === 'cooking';
      label(ctx, cooking ? '滋啦滋啦，香气正好' : cooked ? dishNeedsRestart(order, state.dish) ? '配料不符，可免费重做' : '煎好了，去出餐台装好' : '选好火候，再开火', 116, Math.min(y + h - 12, panY + 72), 12, cooked && dishNeedsRestart(order, state.dish) ? C.coral : '#694c32', '700', 'center');
      if (cooking) {
        for (let i = 0; i < 5; i++) {
          const sy = panY - 28 - (cookElapsed / 45 + i * 9) % 38,
            sx = 72 + i * 19;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.bezierCurveTo(sx - 9, sy - 8, sx + 9, sy - 12, sx + 2, sy - 23);
          ctx.strokeStyle = '#fff6dfbb';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        for (let i = 0; i < 5; i++) ellipse(ctx, 82 + i * 18, panY + 39, 4, 5 + Math.sin(artTime / 90 + i) * 2, '#df9a42');
        roundRect(ctx, 29, panY + 53, 174, 5, 2, '#b18f58');
        roundRect(ctx, 29, panY + 53, 174 * Math.min(1, cookElapsed / RECIPES[order.recipe].cookMs), 5, 2, '#edba58');
      }
      if (h >= 260) {
        roundRect(ctx, 19, y + 170, 322, h - 184, 5, '#efd1a0');
        wrapped(ctx, '顾客在等，注意红色倒计时。切换台面也会继续煎，打开摊位菜单则会暂停。', 32, y + 192, 294, 13, '#805d38', 23, 3);
      }
    }
    function serveView() {
      const y = layout.workY,
        holding = STAGES[state.stage].holding,
        h = holding ? 70 : Math.min(190, layout.workH - 22),
        disabled = state.phase !== 'playing';
      label(ctx, holding ? `保温位：${state.heldDish ? freshLeft(state) < 0 ? '已凉，请取回重做' : `还有 ${freshLeft(state)} 锅鲜度` : '空'}，同桌两份一起交。` : '用盘子，还是带一只纸袋？', 18, y + 9, 12, '#63452d', '700');
      for (const [i, id] of ['plate', 'bag'].entries()) {
        const x = 12 + i * 174,
          boxH = holding ? 56 : Math.max(100, h - 27);
        button(`package-${id}`, '', x, y + 27, 162, boxH, () => dispatch({
          type: 'SET_PACKAGING',
          value: id
        }), {
          fill: state.dish.packaging === id ? '#e2d4a2' : '#ddb985',
          stroke: state.dish.packaging === id ? '#50694c' : '#ba8f5f',
          disabled,
          radius: 3
        });
        if (holding) {
          label(ctx, id === 'plate' ? '堂食装盘' : '打包带走', x + 81, y + 55, 16, C.ink, '700', 'center');
        } else {
          if (id === 'plate') {
            ellipse(ctx, x + 81, y + 72, 61, 30, '#f5edcf');
            ellipse(ctx, x + 81, y + 72, 47, 21, '#d9dfc2');
            foodArt(ctx, state.dish, x + 81, y + 68, .54);
          } else {
            roundRect(ctx, x + 48, y + 44, 66, 66, 3, '#b77c43');
            poly(ctx, [[x + 48, y + 44], [x + 59, y + 35], [x + 112, y + 35], [x + 114, y + 44]], '#cd995b');
            label(ctx, '早', x + 81, y + 78, 26, '#f2d5a2', '700', 'center');
          }
          label(ctx, id === 'plate' ? '堂食装盘' : '打包带走', x + 81, y + boxH + 11, 14, C.ink, '700', 'center');
        }
      }
      if (holding) {
        button('hold', '放入保温位', 12, y + 91, 162, 56, () => dispatch({
          type: 'HOLD'
        }), {
          disabled: disabled || state.dish.status !== 'cooked' || !!state.heldDish,
          fill: '#dca76a',
          size: 15
        });
        button('take-held', state.dish.status === 'cooked' ? '交换两份餐' : '取回保温餐', 186, y + 91, 162, 56, () => dispatch({
          type: 'TAKE_HELD'
        }), {
          disabled: disabled || !state.heldDish || state.dish.status === 'cooking' || state.dish.status === 'raw' && state.dish.ingredients.length > 0,
          fill: '#dca76a',
          size: 15
        });
        if (layout.workH > 240) {
          roundRect(ctx, 24, y + 166, 312, 75, 8, '#b99161');
          ellipse(ctx, 180, y + 207, 79, 25, '#f3e2b6');
          if (state.heldDish) foodArt(ctx, state.heldDish, 180, y + 203, .7);
        }
      } else if (layout.workH >= 280) wrapped(ctx, '出餐前看票据。配料、火候不对就倒掉重做，包装不对直接换。', 20, y + 215, 320, 13, '#755638', 23, 3);
    }
    function footer() {
      const y = H - 68,
        served = state.phase === 'served';
      wood(0, y - 8, W, 82, true);
      button('clear', served ? '收拾台面' : state.dish.status === 'raw' ? '清空食材' : '倒掉重做', 12, y, 110, 62, () => dispatch({
        type: 'CLEAR'
      }), {
        fill: C.coral,
        color: '#fff1d2',
        stroke: '#7d3b27',
        size: 16,
        bold: true
      });
      label(ctx, state.stage < 10 ? '不扣分' : '炉火不返还', 67, y + 51, 10, '#f1c5aa', '400', 'center');
      if (served) button('serve', state.servedIds.length === STAGES[state.stage].orders.length ? '收摊结算' : '请下一位', 132, y, 216, 62, () => dispatch({
        type: 'NEXT_ORDER'
      }), {
        fill: C.green,
        color: C.paper,
        stroke: '#294938',
        size: 18,
        bold: true
      });else if (station === 'prep') button('go-cook', '拿到铁锅台', 132, y, 216, 62, () => {
        station = 'cook';
      }, {
        fill: '#f2ce83',
        color: '#694322',
        stroke: '#bc8c45',
        size: 18,
        bold: true
      });else if (station === 'cook' && state.dish.status === 'cooked') button('go-serve', '拿到出餐台', 132, y, 216, 62, () => {
        station = 'serve';
      }, {
        fill: '#f2ce83',
        color: '#694322',
        stroke: '#bc8c45',
        size: 18,
        bold: true
      });else if (station === 'cook') button('cook', state.dish.status === 'cooking' ? '正在煎制' : state.fuel === null ? '开火煎制' : `开火煎制 · ${fireCost(state)}炉火`, 132, y, 216, 62, () => dispatch({
        type: 'COOK'
      }), {
        fill: '#f2ce83',
        color: '#694322',
        stroke: '#bc8c45',
        disabled: state.dish.status !== 'raw',
        size: 18,
        bold: true
      });else button('serve', '递给客人', 132, y, 216, 62, () => dispatch({
        type: 'SERVE'
      }), {
        fill: C.green,
        color: C.paper,
        stroke: '#294938',
        size: 18,
        bold: true
      });
    }
    function playView() {
      world();
      header();
      orderTicket();
      tabs();
      if (station === 'prep') prepView();else if (station === 'cook') cookView();else serveView();
      footer();
    }
    function paper(title, subtitle = '街角早餐铺') {
      world();
      ctx.fillStyle = '#442d2499';
      ctx.fillRect(0, 0, W, H);
      ticket(12, 15, 336, H - 30);
      roundRect(ctx, 154, 8, 52, 18, 2, '#a77743');
      label(ctx, subtitle, 30, 49, 12, '#98734e');
      label(ctx, title, 30, 82, 23, C.ink, '700');
      buttons = [];
    }
    function backButton(id = 'close', text = '回到早餐铺') {
      button(id, text, 24, H - 78, 312, 56, close, {
        fill: C.green,
        color: C.paper,
        stroke: '#35523d',
        size: 15,
        bold: true
      });
    }
    function modalView() {
      const stage = STAGES[state.stage];
      if (screen === 'play') return;
      if (screen === 'welcome') {
        world();
        streetArt(ctx, 0, 150, W, Math.max(120, Math.min(270, H - 380)), state.stage % 5);
        buttons = [];
        header();
        label(ctx, '一口热乎的', 180, 94, 28, '#744b2c', '700', 'center');
        label(ctx, '一条街的早安', 180, 130, 28, '#744b2c', '700', 'center');
        wrapped(ctx, '50个清晨，一口热锅。听清口味，也照顾排队等候的街坊。', 27, H - 204, 306, 15, '#5e442c', 25, 3);
        if (sidebarState.available) button('sidebar-welcome', '从侧边栏再来', 24, H - 154, 312, 56, () => {
          sidebarMessage = '';
          open('sidebar');
        }, {
          fill: '#e7cda1',
          color: C.green,
          size: 14
        });
        button('start', progress.unlocked ? '继续开门营业' : '开门营业', 24, H - 84, 312, 64, () => beginStage(progress.unlocked), {
          fill: C.coral,
          color: C.paper,
          stroke: '#8d442d',
          size: 21,
          bold: true
        });
      } else if (screen === 'day') {
        world();
        streetArt(ctx, 0, 0, W, Math.min(260, H * .43), state.stage % 5);
        buttons = [];
        label(ctx, `第 ${state.stage + 1} / 50 班 · ${state.stage < 5 ? '入门' : state.stage < 10 ? '正常体验' : '调度挑战'}`, 24, Math.min(295, H * .48), 14, '#7d5733');
        wrapped(ctx, stage.title, 24, Math.min(334, H * .55), 312, 27, C.ink, 34, 2);
        wrapped(ctx, stage.note, 24, Math.min(380, H * .63), 312, 13, '#6e4e31', 21, 4);
        button('open-day', `系好围裙，做 ${stage.orders.length} 份早餐`, 24, H - 84, 312, 64, () => {
          screen = 'play';
          station = 'prep';
        }, {
          fill: C.green,
          color: C.paper,
          stroke: '#35523d',
          size: 17,
          bold: true
        });
      } else if (screen === 'menu') {
        wood(0, 0, W, H, true);
        roundRect(ctx, 12, 12, 336, H - 24, 8, '#274b3c', '#c3975d');
        buttons = [];
        label(ctx, '摊位小黑板 · 已暂停', 29, 49, 25, '#f6e6bd', '700');
        button('close-menu', '返回', 280, 22, 56, 56, close, {
          fill: '#3f6650',
          color: C.paper,
          stroke: '#75916c',
          size: 13
        });
        const items = [['help', '老板教学', () => open('help')], ['recipes', '翻开配方本', () => open('recipes')], ['chapters', '50班手账', () => {
          chapterPage = Math.floor(state.stage / 6);
          open('chapters');
        }], ['tools', '街坊工具箱', () => open('tools')], ['sound', progress.sound ? '声音：开' : '声音：关', sound], ['restart', '重开这一班', () => open('restart')]];
        items.forEach(([id, text, fn], i) => button(id, text, 24 + i % 2 * 162, 110 + Math.floor(i / 2) * 80, 150, 70, fn, {
          fill: '#3f6650',
          color: C.paper,
          stroke: '#6b8969',
          size: 16
        }));
        if (sidebarState.available) button('sidebar-open', '从侧边栏再来', 24, 358, 312, 56, () => {
          sidebarMessage = '';
          open('sidebar');
        }, {
          fill: '#3f6650',
          color: C.paper,
          stroke: '#6b8969'
        });
      } else if (screen === 'help') {
        paper('三个台面，一份心意', '老板手写的开摊贴士');
        const tips = [['先看队伍', '点顾客切单；看实时秒数，红色急客优先；到零本班失败。'], ['铁锅台', '选火候、开火。换台面不打断加热。'], ['出餐台', '选盘子或纸袋，确认口味后递给客人。'], ['高峰有章法', '菜单/配方本及切后台暂停计时；31班起同桌一起上。']];
        tips.forEach(([a, b], i) => {
          label(ctx, a, 29, 126 + i * 70, 16, C.coral, '700');
          wrapped(ctx, b, 29, 151 + i * 70, 300, 13, C.ink, 20, 2);
        });
        backButton('close-help', '系好围裙，知道啦');
      } else if (screen === 'recipes') {
        paper('摊主的配方本', '葱花按票据另加');
        Object.values(RECIPES).forEach((r, i) => {
          const y = 119 + i * 105;
          line(ctx, 26, y + 78, 334, y + 78, '#d9b98a');
          foodArt(ctx, {
            ingredients: r.ingredients,
            status: 'cooked',
            texture: 'soft'
          }, 77, y + 31, .59);
          label(ctx, r.name, 137, y + 11, 17, C.ink, '700');
          wrapped(ctx, r.ingredients.map(id => INGREDIENTS[id]).join(' + '), 137, y + 38, 190, 13, '#8b6541', 21, 2);
        });
        backButton('close-recipes', '合上配方本');
      } else if (screen === 'chapters') {
        paper('五十个清晨的手账', `第 ${chapterPage + 1} / 9 页 · 换班会重新开始`);
        STAGES.slice(chapterPage * 6, chapterPage * 6 + 6).forEach((st, k) => {
          const i = chapterPage * 6 + k,
            x = 24 + k % 2 * 162,
            y = 118 + Math.floor(k / 2) * 70;
          button(`chapter-${i}`, '', x, y, 150, 62, () => beginStage(i), {
            fill: i === state.stage ? '#eed9ad' : '#f5e4bf',
            stroke: '#ccb084',
            disabled: i > progress.unlocked,
            radius: 3
          });
          label(ctx, `第 ${i + 1} 班`, x + 12, y + 15, 13, C.coral, '700');
          label(ctx, st.title, x + 12, y + 35, 11, C.ink, '700');
          label(ctx, i > progress.unlocked ? '先完成前一班' : `心意星 ${progress.stars[i]}/3`, x + 12, y + 51, 10, '#8c765a');
        });
        button('page-prev', '上一页', 24, 338, 150, 56, () => chapterPage = Math.max(0, chapterPage - 1), {
          disabled: chapterPage === 0,
          fill: '#e8cf9f'
        });
        button('page-next', '下一页', 186, 338, 150, 56, () => chapterPage = Math.min(8, chapterPage + 1), {
          disabled: chapterPage === 8,
          fill: '#e8cf9f'
        });
        backButton('close-chapters', '收好手账，回到刚才');
      } else if (screen === 'tools') {
        paper('街坊工具箱', `金币 ${progress.coins} · 只在游戏内使用，没有现金购买`);
        for (const [i, kind] of ['fuel', 'tea'].entries()) {
          const y = 124 + i * 112;
          label(ctx, kind === 'fuel' ? '小炭包：炉火 +3' : '街坊茶：耐心 +20秒及2锅', 28, y, 16, C.ink, '700');
          label(ctx, `库存 ${progress.tools[kind]}/3 · 每班最多用1个 · 11班起可用`, 28, y + 24, 10, '#8c765a');
          button(`buy-${kind}`, `18金币买1个`, 24, y + 43, 150, 56, () => {
            const next = buyTool(progress, kind);
            if (next !== progress && save(next)) progress = next;
          }, {
            disabled: progress.coins < 18 || progress.tools[kind] >= 3,
            fill: '#e4bb6f'
          });
          button(`use-${kind}`, '这班使用', 186, y + 43, 150, 56, () => useTool(kind), {
            disabled: state.phase !== 'playing' || state.stage < 10 || !progress.tools[kind] || state.toolsUsed[kind] >= 1,
            fill: C.green,
            color: C.paper
          });
        }
        wrapped(ctx, '未通关就刷新或重开，会退回本班所用工具和续摊金币；通关后正常消耗。', 28, 366, 302, 12, '#8c765a', 18, 2);
        backButton('close-tools');
      } else if (screen === 'failure') {
        var _chainObject17, _chainObject18, _chainObject19, _chainObject20, _chainFunction4, _chainObject21, _chainObject22;
        paper('这班先歇一歇', `第 ${state.stage + 1} 班 · ${(_chainObject17 = state.failure, _chainObject17 === null || _chainObject17 === void 0 ? void 0 : _chainObject17.code) === 'fuel' ? '炉火耗尽' : (_chainObject18 = state.failure, _chainObject18 === null || _chainObject18 === void 0 ? void 0 : _chainObject18.code) === 'cold' ? '早餐放凉了' : '排队安排失误'}`);
        wrapped(ctx, (_chainObject19 = state.failure, _chainObject19 === null || _chainObject19 === void 0 ? void 0 : _chainObject19.message) || '这一班没有完成。', 26, 126, 306, 15, C.ink, 24, 3);
        wrapped(ctx, rewardMessage || `可续摊一次：炉火+4、耐心+25秒及2锅、现有熟食重新保温。已用 ${state.revives}/1。`, 26, 211, 306, 12, C.coral, 20, 3);
        const reward = (_chainObject20 = platform.rewards, _chainObject20 === null || _chainObject20 === void 0 ? void 0 : (_chainFunction4 = _chainObject20.getState, _chainFunction4.call(_chainObject20)));
        button('revive-ad', (_chainObject21 = reward, _chainObject21 === null || _chainObject21 === void 0 ? void 0 : _chainObject21.mode) === 'mock' ? '模拟广告续摊' : '广告续摊预留（未接入）', 24, H - 214, 312, 56, requestRevive, {
          disabled: state.revives >= 1 || !(_chainObject22 = reward, _chainObject22 === null || _chainObject22 === void 0 ? void 0 : _chainObject22.available),
          fill: '#e7cda1',
          color: C.ink,
          size: 15
        });
        button('revive-coins', `30金币续摊 · 现有 ${progress.coins}`, 24, H - 146, 312, 56, reviveWithCoins, {
          disabled: state.revives >= 1 || progress.coins < 30,
          fill: '#e2b664',
          size: 15
        });
        button('retry-free', '免费重开这一班', 24, H - 78, 312, 56, () => beginStage(state.stage), {
          fill: C.green,
          color: C.paper,
          size: 17,
          bold: true
        });
      } else if (screen === 'reward') {
        var _chainObject23, _chainFunction5, _chainObject24;
        const mock = (_chainObject23 = platform.rewards, _chainObject23 === null || _chainObject23 === void 0 ? void 0 : (_chainFunction5 = _chainObject23.getState, _chainObject24 = _chainFunction5.call(_chainObject23), _chainObject24.mode)) === 'mock';
        paper(mock ? '模拟广告 · 非真实广告' : '正在请求激励视频', mock ? '测试入口，无真实广告' : '仅完整观看后的关闭回调可以续摊');
        wrapped(ctx, '只有选择“模拟完整看完”才续摊。关闭、失败或切换新一班都不会领取奖励。', 26, 130, 306, 14, C.ink, 23, 3);
        if (mock) [['completed', '模拟完整看完'], ['cancelled', '模拟提前关闭'], ['unavailable', '模拟无填充'], ['error', '模拟异常']].forEach(([status, title], i) => button(`mock-${status}`, title, 24 + i % 2 * 162, 216 + Math.floor(i / 2) * 70, 150, 60, () => {
          var _chainObject25, _chainFunction6;
          return _chainObject25 = platform.rewards, _chainObject25 === null || _chainObject25 === void 0 ? void 0 : (_chainFunction6 = _chainObject25.resolveMock, _chainFunction6 === null || _chainFunction6 === void 0 ? void 0 : _chainFunction6.call(_chainObject25, status));
        }, {
          fill: status === 'completed' ? C.green : '#e7cda1',
          color: status === 'completed' ? C.paper : C.ink,
          size: 13
        }));
        button('reward-retry', '跳过模拟，免费重开', 24, H - 146, 312, 56, () => beginStage(state.stage), {
          fill: '#e7cda1'
        });
        button('reward-cancel', '不看，回到刚才', 24, H - 78, 312, 56, () => {
          var _chainObject26, _chainFunction7;
          _chainObject26 = platform.rewards, _chainObject26 === null || _chainObject26 === void 0 ? void 0 : (_chainFunction7 = _chainObject26.cancel, _chainFunction7.call(_chainObject26));
          screen = 'failure';
        }, {
          fill: C.green,
          color: C.paper
        });
      } else if (screen === 'restart') {
        paper('重新开张今天？', '不会清除已解锁关卡或最佳成绩');
        wrapped(ctx, '今天的订单和得分会重置。本班已用工具及续摊金币会退回，通关消耗不退。放错食材只需回台面点“倒掉重做”。', 26, 142, 306, 16, C.ink, 28, 6);
        button('confirm-restart', '确定重新开张', 24, H - 146, 312, 56, () => beginStage(state.stage), {
          fill: C.coral,
          color: C.paper,
          size: 16,
          bold: true
        });
        backButton('cancel-restart', '不重开，回到刚才');
      } else if (screen === 'sidebar') {
        paper('下次早安，从这里开始', '抖音侧边栏 · 可选入口');
        wrapped(ctx, '通过抖音侧边栏可以再找到早餐铺。这里不发放奖励，也不会改变分数或进度。', 26, 139, 306, 15, C.ink, 26, 4);
        wrapped(ctx, sidebarState.enteredFromSidebar ? '本次确实从侧边栏回到早餐铺，欢迎回来。' : sidebarMessage || (sidebarState.pending ? '正在请求打开侧边栏。' : sidebarState.available ? '点下面的按钮前往。' : '当前环境暂不支持，仍可正常游玩。'), 26, 266, 306, 14, C.green, 25, 4);
        button('sidebar-navigate', sidebarState.pending ? '正在打开' : '前往抖音侧边栏', 24, H - 146, 312, 56, () => {
          sidebarMessage = '';
          platform.sidebar.navigate().then(ok => {
            if (!alive) return;
            sidebarMessage = ok ? '已请求打开；返回后继续游玩。' : '本次未完成跳转，仍可正常游玩。';
            redraw();
          });
        }, {
          fill: C.green,
          color: C.paper,
          disabled: !sidebarState.available || sidebarState.pending,
          size: 16
        });
        backButton('close-sidebar');
      } else if (screen === 'result') {
        paper('今日收摊小票', `第 ${state.stage + 1} 天 · ${stage.title}`);
        label(ctx, '心意收成', 180, 122, 13, '#926b45', '400', 'center');
        label(ctx, String(state.score), 180, 172, 54, C.coral, '700', 'center');
        label(ctx, `心意星 ${stageStars(state)} / 3   ·   金币 +${earnedCoins}`, 180, 218, 15, C.green, '700', 'center');
        line(ctx, 27, 245, 333, 245, '#ccb084');
        wrapped(ctx, stage.ending, 28, H < 560 ? 262 : 273, 304, H < 560 ? 14 : 15, C.ink, H < 560 ? 23 : 26, 3);
        button('next-stage', state.stage === 49 ? '收好50班的街坊回忆' : '明天继续开张', 24, H - 146, 312, 56, () => {
          if (state.stage === 49) screen = 'ending';else beginStage(state.stage + 1);
        }, {
          fill: C.coral,
          color: C.paper,
          size: 17,
          bold: true
        });
        button('replay-stage', '今天再做一次', 24, H - 78, 312, 56, () => beginStage(state.stage), {
          fill: '#e8cf9f',
          color: C.ink,
          size: 15
        });
      } else if (screen === 'ending') {
        world();
        streetArt(ctx, 0, 0, W, Math.min(275, H * .44), 4);
        buttons = [];
        label(ctx, '早安，老朋友。', 24, H * .51, 29, C.ink, '700');
        wrapped(ctx, '50个清晨，热气一直在。', 24, H * .59, 312, 17, C.ink, 28, 3);
        label(ctx, `手账里收好了 ${progress.stars.reduce((a, b) => a + b, 0)} 颗心意星`, 24, H - 140, 14, C.coral, '700');
        button('replay-all', '挑一个清晨，再见老朋友', 24, H - 84, 312, 64, () => {
          chapterPage = 0;
          open('chapters');
        }, {
          fill: C.green,
          color: C.paper,
          size: 17,
          bold: true
        });
      }
    }
    function metrics() {
      size = platform.getSize();
      const i = size.safeInsets || {},
        left = Math.max(0, i.left || 0),
        right = Math.max(0, i.right || 0),
        top = Math.max(0, i.top || 0),
        bottom = Math.max(0, i.bottom || 0);
      zoom = Math.min((size.width - left - right) / W, (size.height - top - bottom) / 500);
      ox = left + (size.width - left - right - W * zoom) / 2;
      oy = top;
      H = (size.height - top - bottom) / zoom;
      const compact = H < 600,
        queueH = compact ? 60 : 90,
        ticketY = 56 + queueH + 4,
        ticketH = compact ? 80 : 102,
        tabsY = ticketY + ticketH + 6,
        workY = tabsY + 62;
      layout = {
        queueH,
        ticketY,
        ticketH,
        tabsY,
        workY,
        workH: H - 80 - workY,
        safeInsets: {
          left,
          right,
          top,
          bottom
        }
      };
    }
    function draw(now = 0) {
      if (!alive) return;
      artTime = now;
      metrics();
      const dpr = size.dpr || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#d9bd87';
      ctx.fillRect(0, 0, size.width, size.height);
      streetArt(ctx, 0, 0, size.width, size.height, state.stage % 5);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(zoom, zoom);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      buttons = [];
      if (screen === 'play') playView();else modalView();
      ctx.restore();
      if (!paused) {
        const dt = lastFrame ? Math.max(0, now - lastFrame) : 0;
        if (screen === 'play') dispatch({
          type: 'TICK',
          ms: dt
        });
        if (state.dish.status === 'cooking' && screen === 'play') {
          cookElapsed += dt;
          if (cookElapsed >= (state.dish.cookMs || RECIPES[getOrder(state).recipe].cookMs)) dispatch({
            type: 'COOK_DONE',
            token: activeToken
          });
        }
      }
      lastFrame = now;
      if (!paused) frameId = platform.requestFrame(draw);
    }
    function redraw() {
      if (frameId !== undefined) platform.cancelFrame(frameId);
      draw(lastFrame);
    }
    unsubscribers.push(platform.onPointer(event => {
      var _chainObject27, _chainObject28, _chainObject29;
      if (paused || !alive) return;
      const x = (event.x - ox) / zoom,
        y = (event.y - oy) / zoom;
      const hit = [...buttons].reverse().find(b => !b.disabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      if (event.type === 'down' && !pointerDown) pointerDown = hit ? {
        id: hit.id,
        pointer: event.id,
        x,
        y
      } : null;
      if (event.type === 'move' && (_chainObject27 = pointerDown, _chainObject27 === null || _chainObject27 === void 0 ? void 0 : _chainObject27.pointer) === event.id && Math.hypot(x - pointerDown.x, y - pointerDown.y) * zoom > 12) pointerDown.moved = true;
      if (event.type === 'cancel' && (_chainObject28 = pointerDown, _chainObject28 === null || _chainObject28 === void 0 ? void 0 : _chainObject28.pointer) === event.id) pointerDown = null;
      if (event.type === 'up' && (_chainObject29 = pointerDown, _chainObject29 === null || _chainObject29 === void 0 ? void 0 : _chainObject29.pointer) === event.id) {
        const start = pointerDown;
        pointerDown = null;
        if (hit && !start.moved && start.id === hit.id && Math.hypot(x - start.x, y - start.y) * zoom <= 12) {
          platform.audio.play('tap');
          hit.fn();
          redraw();
        }
      }
    }));
    unsubscribers.push(platform.onResize(() => {
      pointerDown = null;
      redraw();
    }));
    unsubscribers.push(platform.onPause(() => {
      paused = true;
      pointerDown = null;
      lastFrame = 0;
      platform.cancelFrame(frameId);
    }));
    unsubscribers.push(platform.onResume(() => {
      paused = false;
      lastFrame = 0;
      redraw();
    }));
    if (platform.sidebar) unsubscribers.push(platform.sidebar.subscribe(next => {
      sidebarState = next;
      redraw();
    }));
    draw();
    return {
      destroy() {
        var _chainObject30, _chainFunction8;
        alive = false;
        _chainObject30 = platform.rewards, _chainObject30 === null || _chainObject30 === void 0 ? void 0 : (_chainFunction8 = _chainObject30.cancel, _chainFunction8.call(_chainObject30));
        platform.cancelFrame(frameId);
        unsubscribers.forEach(fn => fn());
      },
      inspect() {
        var _chainObject31, _chainFunction9;
        return JSON.parse(JSON.stringify({
          state,
          screen,
          station,
          progress,
          storageWarning,
          sidebarState,
          sidebarMessage,
          rewardPending: !!rewardPending,
          rewardMessage,
          rewardState: (_chainObject31 = platform.rewards, _chainObject31 === null || _chainObject31 === void 0 ? void 0 : (_chainFunction9 = _chainObject31.getState, _chainFunction9.call(_chainObject31))),
          buttons: buttons.map(({
            id,
            x,
            y,
            w,
            h,
            disabled,
            label
          }) => ({
            id,
            x,
            y,
            w,
            h,
            disabled,
            label
          })),
          viewport: {
            zoom,
            ox,
            oy,
            width: W,
            height: H
          },
          layout
        }));
      }
    };
  }

  // SOURCE: adapters/tt.js
  // No browser globals. tt and the frame scheduler are explicitly injected.
  function createTTPlatform(api, scheduler, audioPaths = {}) {
    const canvas = api.createCanvas(); // Exactly one on-screen canvas.
    const listeners = {
      pointer: new Set(),
      resize: new Set(),
      pause: new Set(),
      resume: new Set()
    };
    const removers = [];
    const sounds = new Map();
    const emit = (name, value) => listeners[name].forEach(fn => fn(value));
    const subscribe = name => fn => {
      listeners[name].add(fn);
      return () => listeners[name].delete(fn);
    };
    const bind = (on, off, fn) => {
      if (typeof api[on] === 'function') {
        api[on](fn);
        removers.push(() => {
          if (typeof api[off] === 'function') api[off](fn);
        });
      }
    };
    let size;
    function resize(event) {
      const info = api.getSystemInfoSync();
      const resized = event && event.size || {};
      const width = resized.windowWidth || info.screenWidth || info.windowWidth,
        height = resized.windowHeight || info.screenHeight || info.windowHeight;
      const safe = info.safeArea || {};
      let top = Math.max(0, Number(safe.top) || 0, (Number(info.statusBarHeight) || 0) + 48);
      const menuGetter = api.getMenuButtonLayout || api.getMenuButtonBoundingClientRect;
      if (typeof menuGetter === 'function') {
        try {
          const menu = menuGetter.call(api);
          const bottom = menu && (menu.bottom || menu.top + menu.height);
          if (Number.isFinite(bottom)) top = Math.max(top, bottom + 8);
        } catch (_ignoredError4) {}
      }
      const safeInsets = {
        top,
        bottom: Number.isFinite(safe.bottom) ? Math.max(0, height - safe.bottom) : 12,
        left: Math.max(0, Number(safe.left) || 0),
        right: Number.isFinite(safe.right) ? Math.max(0, width - safe.right) : 0
      };
      const next = {
        width,
        height,
        dpr: Math.min(info.pixelRatio || 1, 3),
        safeInsets
      };
      if (!(next.width > 0 && next.height > 0)) throw new Error('Platform viewport dimensions are missing');
      if (size && next.width === size.width && next.height === size.height && next.dpr === size.dpr && JSON.stringify(next.safeInsets) === JSON.stringify(size.safeInsets)) return;
      size = next;
      canvas.width = Math.round(size.width * size.dpr);
      canvas.height = Math.round(size.height * size.dpr);
      emit('resize', {
        ...size
      });
    }
    resize();
    bind('onWindowResize', 'offWindowResize', resize);
    for (const [suffix, type] of [['Start', 'down'], ['Move', 'move'], ['End', 'up'], ['Cancel', 'cancel']]) {
      bind('onTouch' + suffix, 'offTouch' + suffix, event => {
        var _chainObject32;
        const touches = (_chainObject32 = event.changedTouches, _chainObject32 === null || _chainObject32 === void 0 ? void 0 : _chainObject32.length) ? event.changedTouches : event.touches || [];
        touches.forEach(touch => {
          var _nullish6, _nullish7;
          return emit('pointer', {
            type,
            x: (_nullish6 = touch.clientX, _nullish6 === null || _nullish6 === void 0 ? touch.x : _nullish6),
            y: (_nullish7 = touch.clientY, _nullish7 === null || _nullish7 === void 0 ? touch.y : _nullish7),
            id: touch.identifier
          });
        });
      });
    }
    let muted = false;
    const stopAudio = () => sounds.forEach(sound => sound.pause());
    bind('onHide', 'offHide', () => {
      stopAudio();
      emit('pause');
    });
    bind('onShow', 'offShow', () => {
      resize();
      emit('resume');
    });
    // The spike is portrait-only. Verify host resize behavior before landscape/tablet support.
    return {
      canvas,
      getSize: () => ({
        ...size
      }),
      onPointer: subscribe('pointer'),
      onResize: subscribe('resize'),
      onPause: subscribe('pause'),
      onResume: subscribe('resume'),
      requestFrame: fn => scheduler.requestAnimationFrame(fn),
      cancelFrame: id => scheduler.cancelAnimationFrame(id),
      storage: {
        getItem(key) {
          const value = api.getStorageSync(key);
          return value === undefined || value === null || value === '' ? null : String(value);
        },
        setItem(key, value) {
          api.setStorageSync(key, String(value));
        }
      },
      audio: {
        play(name) {
          if (muted || !audioPaths[name] || typeof api.createInnerAudioContext !== 'function') return;
          try {
            let sound = sounds.get(name);
            if (!sound) {
              var _callReceiver, _chainFunction0;
              sound = api.createInnerAudioContext();
              sound.src = audioPaths[name];
              _callReceiver = sound, _chainFunction0 = _callReceiver.onError, _chainFunction0 === null || _chainFunction0 === void 0 ? void 0 : _chainFunction0.call(_callReceiver, () => {});
              sounds.set(name, sound);
            }
            sound.seek(0);
            sound.play();
          } catch (_ignoredError5) {/* Audio failure must not block play. */}
        },
        setMuted(value) {
          muted = Boolean(value);
          if (muted) stopAudio();
        }
      },
      destroy() {
        removers.forEach(fn => fn());
        sounds.forEach(sound => sound.destroy());
        Object.values(listeners).forEach(set => set.clear());
      }
    };
  }

  // SOURCE: adapters/douyin-sidebar.js
  /** Actual optional Douyin sidebar capability. No reward or navigation is implied by a successful API callback. */
  function createDouyinSidebar(tt) {
    let state = {
      available: false,
      checked: false,
      enteredFromSidebar: false,
      pending: false,
      error: null
    };
    let destroyed = false,
      finishPending = null;
    const listeners = new Set();
    const update = patch => {
      if (destroyed) return;
      state = {
        ...state,
        ...patch
      };
      listeners.forEach(fn => fn({
        ...state
      }));
    };
    const onShow = options => {
      const entered = !!options && options.launch_from === 'homepage' && options.location === 'sidebar_card';
      // Every foreground event replaces the prior entry state, including ordinary resumes.
      update({
        enteredFromSidebar: entered
      });
      if (finishPending) finishPending(entered, entered ? null : 'Navigation did not return through sidebar');
    };
    // Subscribe synchronously before canvas or game creation, as required by the platform guide.
    if (typeof tt.onShow === 'function') tt.onShow(onShow);
    if (typeof tt.checkScene === 'function' && typeof tt.navigateToScene === 'function') {
      try {
        tt.checkScene({
          scene: 'sidebar',
          success: result => update({
            checked: true,
            available: !!result && result.isExist === true,
            error: null
          }),
          fail: result => update({
            checked: true,
            available: false,
            error: result && result.errMsg || 'Sidebar capability check failed'
          })
        });
      } catch (_error) {
        update({
          checked: true,
          available: false,
          error: 'Sidebar capability check failed'
        });
      }
    } else update({
      checked: true,
      available: false
    });
    return {
      getState: () => ({
        ...state
      }),
      subscribe(fn) {
        if (destroyed) return () => {};
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      navigate() {
        if (destroyed || !state.available || state.pending) return Promise.resolve(false);
        update({
          pending: true,
          error: null
        });
        return new Promise(resolve => {
          let settled = false;
          const finish = (ok, error = null) => {
            if (settled) return;
            settled = true;
            if (finishPending === finish) finishPending = null;
            update({
              pending: false,
              error
            });
            resolve(ok);
          };
          finishPending = finish;
          try {
            tt.navigateToScene({
              scene: 'sidebar',
              success: result => finish(!(result && result.code === 1), result && result.code === 1 ? 'Navigation cancelled' : null),
              fail: result => finish(false, result && result.errMsg || 'Sidebar navigation failed')
            });
          } catch (_error) {
            finish(false, 'Sidebar navigation failed');
          }
        });
      },
      destroy() {
        if (destroyed) return;
        if (finishPending) finishPending(false, 'Sidebar adapter destroyed');
        destroyed = true;
        if (typeof tt.offShow === 'function') tt.offShow(onShow);
        listeners.clear();
      }
    };
  }

  // SOURCE: adapters/rewarded.js
  // Platform-neutral reward gate. Live is deliberately disabled unless explicitly
  // enabled with a real unit and verified no-share fallback configuration.
  function createRewardedService({
    mode = 'disabled',
    api = null,
    adUnitId = '',
    shareFallbackDisabled = false,
    timers = {}
  } = {}) {
    const setTimer = timers.setTimeout || (typeof globalThis === 'object' && typeof globalThis.setTimeout === 'function' ? globalThis.setTimeout.bind(globalThis) : () => null),
      clearTimer = timers.clearTimeout || (typeof globalThis === 'object' && typeof globalThis.clearTimeout === 'function' ? globalThis.clearTimeout.bind(globalThis) : () => {});
    let active = null,
      serial = 0,
      destroyed = false,
      retiring = false,
      retireFailed = false;
    const liveReady = mode === 'live' && api && typeof api.createRewardedVideoAd === 'function' && typeof adUnitId === 'string' && adUnitId.trim().length > 0 && !/placeholder|YOUR_|test|mock|xxxx/i.test(adUnitId) && shareFallbackDisabled === true;
    const actualMode = mode === 'mock' ? 'mock' : liveReady ? 'live' : 'disabled';
    function finish(session, status) {
      if (!session || session.done || active !== session) return;
      session.done = true;
      active = null;
      clearTimer(session.timer);
      if (session.ad) {
        try {
          var _callReceiver2, _chainFunction1;
          _callReceiver2 = session.ad, _chainFunction1 = _callReceiver2.offClose, _chainFunction1 === null || _chainFunction1 === void 0 ? void 0 : _chainFunction1.call(_callReceiver2, session.close);
        } catch (_ignoredError6) {}
        try {
          var _callReceiver3, _chainFunction10;
          _callReceiver3 = session.ad, _chainFunction10 = _callReceiver3.offError, _chainFunction10 === null || _chainFunction10 === void 0 ? void 0 : _chainFunction10.call(_callReceiver3, session.error);
        } catch (_ignoredError7) {}
        retiring = true;
        try {
          var _callReceiver4, _chainFunction11;
          Promise.resolve((_callReceiver4 = session.ad, _chainFunction11 = _callReceiver4.destroy, _chainFunction11 === null || _chainFunction11 === void 0 ? void 0 : _chainFunction11.call(_callReceiver4))).catch(() => {
            retireFailed = true;
          }).finally(() => {
            retiring = false;
          });
        } catch (_ignoredError8) {
          retiring = false;
          retireFailed = true;
        }
      }
      session.resolve({
        status,
        requestId: session.id
      });
    }
    return {
      getState: () => ({
        mode: actualMode,
        available: !destroyed && actualMode !== 'disabled' && !retiring && !retireFailed,
        busy: !!active,
        retiring,
        retireFailed
      }),
      request({
        placement = 'revive',
        context = null
      } = {}) {
        const id = `road-reward-${++serial}`;
        if (destroyed || active || retiring || retireFailed || actualMode === 'disabled') return Promise.resolve({
          status: 'unavailable',
          requestId: id
        });
        return new Promise(resolve => {
          const session = {
            id,
            placement,
            context,
            resolve,
            done: false,
            ad: null,
            timer: null
          };
          active = session;
          session.timer = setTimer(() => finish(session, 'error'), 90000);
          if (actualMode === 'mock') return;
          try {
            session.ad = api.createRewardedVideoAd({
              adUnitId,
              multiton: false
            });
            if (!session.ad || typeof session.ad.onClose !== 'function' || typeof session.ad.onError !== 'function' || typeof session.ad.show !== 'function' || typeof session.ad.destroy !== 'function') {
              finish(session, 'unavailable');
              return;
            }
            session.close = res => {
              var _chainObject33;
              const complete = (_chainObject33 = res, _chainObject33 === null || _chainObject33 === void 0 ? void 0 : _chainObject33.isEnded) === true && (res.count === undefined || Number.isFinite(res.count) && res.count >= 1);
              finish(session, complete ? 'completed' : 'cancelled');
            };
            session.error = err => {
              var _chainObject34, _chainObject35, _nullish8;
              return finish(session, Number((_nullish8 = (_chainObject34 = err, _chainObject34 === null || _chainObject34 === void 0 ? void 0 : _chainObject34.errCode), _nullish8 === null || _nullish8 === void 0 ? (_chainObject35 = err, _chainObject35 === null || _chainObject35 === void 0 ? void 0 : _chainObject35.errNo) : _nullish8)) === 1004 ? 'unavailable' : 'error');
            };
            session.ad.onClose(session.close);
            session.ad.onError(session.error);
            Promise.resolve(session.ad.show()).catch(session.error);
          } catch (_ignoredError9) {
            finish(session, 'error');
          }
        });
      },
      resolveMock(status) {
        if (actualMode === 'mock' && ['completed', 'cancelled', 'unavailable', 'error'].includes(status)) finish(active, status);
      },
      cancel() {
        finish(active, 'cancelled');
      },
      destroy() {
        destroyed = true;
        finish(active, 'cancelled');
      }
    };
  }
  const sidebar = createDouyinSidebar(tt);
  const platform = createTTPlatform(tt, {
    requestAnimationFrame,
    cancelAnimationFrame
  }, {
    "tap": "assets/tap.wav",
    "cook": "assets/cook.wav",
    "success": "assets/success.wav",
    "error": "assets/error.wav",
    "complete": "assets/complete.wav"
  });
  platform.sidebar = sidebar;
  platform.rewards = createRewardedService();
  startGame(platform);
})();
