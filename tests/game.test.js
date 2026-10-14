import test from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTS, RECIPES, STAGES, CUSTOMERS, initialState, emptyDish, getOrder, requiredIngredients, evaluateDish, reduce, stageStars, DEFAULT_PROGRESS, parseProgress, recordStage } from '../game.js';

function prepare(state, override = {}) {
  const order = getOrder(state);
  for (const id of requiredIngredients(order)) state = reduce(state, { type: 'TOGGLE_INGREDIENT', id });
  state = reduce(state, { type: 'SET_TEXTURE', value: order.texture });
  state = reduce(state, { type: 'SET_PACKAGING', value: order.packaging });
  state = reduce(state, { type: 'COOK' });
  return reduce(state, { type: 'COOK_DONE', token: state.dish.token, ...override });
}
function completeStage(stage) {
  let state = initialState(stage);
  for (let n = 0; n < STAGES[stage].orders.length; n++) {
    state = prepare(state);
    state = reduce(state, { type: 'SERVE' });
    assert.equal(state.phase, 'served');
    state = reduce(state, { type: 'NEXT_ORDER' });
  }
  return state;
}

test('three recipes have distinct, valid, duplicate-free ingredients', () => {
  assert.equal(Object.keys(RECIPES).length, 3);
  assert.equal(new Set(Object.values(RECIPES).map(x => x.ingredients.join(','))).size, 3);
  for (const recipe of Object.values(RECIPES)) {
    assert.equal(new Set(recipe.ingredients).size, recipe.ingredients.length);
    assert.ok(recipe.ingredients.every(x => INGREDIENTS[x]));
    assert.ok(recipe.cookMs > 0);
  }
});

test('all five stages and 19 explicit orders reference valid recipes and people', () => {
  assert.equal(STAGES.length, 5);
  assert.equal(STAGES.flatMap(x => x.orders).length, 19);
  for (const stage of STAGES) for (const order of stage.orders) {
    assert.ok(RECIPES[order.recipe]); assert.ok(CUSTOMERS[order.customer]);
    assert.ok(['soft', 'crisp'].includes(order.texture));
    assert.ok(['plate', 'bag'].includes(order.packaging));
    assert.equal(typeof order.scallion, 'boolean');
    assert.ok(order.hint.length > 5);
  }
});

test('invalid initial stage numbers safely fall back to first stage', () => {
  for (const stage of [-1, 5, 2.4, null, '3', NaN, Infinity]) assert.equal(initialState(stage).stage, 0);
  assert.equal(initialState(4).stage, 4);
});

test('each recipe accepts all 8 scallion / texture / packaging variants', () => {
  for (const recipe of Object.keys(RECIPES)) for (const scallion of [false, true]) for (const texture of ['soft', 'crisp']) for (const packaging of ['plate', 'bag']) {
    const order = { recipe, scallion, texture, packaging };
    const result = evaluateDish(order, { ingredients: requiredIngredients(order), texture, packaging, status: 'cooked' });
    assert.equal(result.ok, true); assert.equal(result.points, 100);
  }
});

test('missing and extra ingredients receive explicit explanations', () => {
  const order = getOrder(initialState());
  let result = evaluateDish(order, { ...emptyDish(), status: 'cooked', ingredients: ['batter', 'scallion'] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(x => x.includes('鸡蛋') && x.includes('薄脆')));
  assert.ok(result.errors.some(x => x.includes('多放了：葱花')));
});

test('duplicate ingredient entries cannot pass exact recipe validation', () => {
  const order = getOrder(initialState());
  const result = evaluateDish(order, { ...emptyDish(), status: 'cooked', ingredients: [...requiredIngredients(order), 'egg'] });
  assert.equal(result.ok, false); assert.ok(result.errors.some(x => x.includes('重复')));
});

test('uncooked, wrong texture and wrong packaging are all diagnosed', () => {
  const order = getOrder(initialState());
  const result = evaluateDish(order, { ...emptyDish(), texture: 'crisp', packaging: 'bag', ingredients: requiredIngredients(order) });
  assert.equal(result.errors.length, 3); assert.equal(result.points, 0);
  assert.ok(result.errors.some(x => x.includes('加热')));
  assert.ok(result.errors.some(x => x.includes('普通')));
  assert.ok(result.errors.some(x => x.includes('堂食')));
});

test('unknown order fails safely', () => {
  assert.equal(evaluateDish(null, emptyDish()).ok, false);
  assert.equal(evaluateDish({ recipe: 'missing' }, emptyDish()).ok, false);
});

test('ingredient toggle adds then removes without mutating input', () => {
  const original = initialState();
  const selected = reduce(original, { type: 'TOGGLE_INGREDIENT', id: 'egg' });
  assert.deepEqual(original.dish.ingredients, []);
  assert.deepEqual(selected.dish.ingredients, ['egg']);
  assert.deepEqual(reduce(selected, { type: 'TOGGLE_INGREDIENT', id: 'egg' }).dish.ingredients, []);
  assert.equal(reduce(original, { type: 'TOGGLE_INGREDIENT', id: '__proto__' }), original);
});

test('invalid selectors and unknown actions are ignored', () => {
  const state = initialState();
  for (const action of [{ type: 'UNKNOWN' }, { type: 'SET_TEXTURE', value: 'burnt' }, { type: 'SET_PACKAGING', value: 'box' }, {}, null]) assert.equal(reduce(state, action), state);
});

test('empty dish cannot start cooking', () => {
  const state = reduce(initialState(), { type: 'COOK' });
  assert.equal(state.dish.status, 'raw'); assert.equal(state.feedbackType, 'error');
});

test('cooking locks ingredients and texture, still allows packaging', () => {
  let state = reduce(initialState(), { type: 'TOGGLE_INGREDIENT', id: 'egg' });
  state = reduce(state, { type: 'COOK' });
  assert.equal(state.dish.status, 'cooking');
  assert.equal(reduce(state, { type: 'TOGGLE_INGREDIENT', id: 'rice' }), state);
  assert.equal(reduce(state, { type: 'SET_TEXTURE', value: 'crisp' }), state);
  assert.equal(reduce(state, { type: 'SET_PACKAGING', value: 'bag' }).dish.packaging, 'bag');
});

test('stale cook token cannot finish the active dish', () => {
  let state = reduce(initialState(), { type: 'TOGGLE_INGREDIENT', id: 'egg' });
  state = reduce(state, { type: 'COOK' });
  assert.equal(reduce(state, { type: 'COOK_DONE', token: state.dish.token - 1 }), state);
  assert.equal(reduce(state, { type: 'COOK_DONE', token: state.dish.token }).dish.status, 'cooked');
});

test('clearing while cooking cancels the old completion logically', () => {
  let state = reduce(initialState(), { type: 'TOGGLE_INGREDIENT', id: 'egg' });
  state = reduce(state, { type: 'COOK' });
  const staleToken = state.dish.token;
  state = reduce(state, { type: 'CLEAR' });
  assert.equal(state.dish.status, 'raw');
  state = reduce(state, { type: 'TOGGLE_INGREDIENT', id: 'rice' });
  state = reduce(state, { type: 'COOK' });
  assert.notEqual(state.dish.token, staleToken);
  assert.equal(reduce(state, { type: 'COOK_DONE', token: staleToken }), state);
});

test('restarting a stage invalidates old cooking completion even after a new cook', () => {
  let state = reduce(initialState(), { type: 'TOGGLE_INGREDIENT', id: 'egg' });
  state = reduce(state, { type: 'COOK' });
  const staleToken = state.dish.token;
  state = reduce(state, { type: 'RESTART_STAGE' });
  state = reduce(state, { type: 'TOGGLE_INGREDIENT', id: 'rice' });
  state = reduce(state, { type: 'COOK' });
  assert.notEqual(state.dish.token, staleToken);
  assert.equal(reduce(state, { type: 'COOK_DONE', token: staleToken }), state);
});

test('a correct order scores once, even when serve is repeated rapidly', () => {
  const state = reduce(prepare(initialState()), { type: 'SERVE' });
  assert.equal(state.score, 100); assert.equal(state.phase, 'served'); assert.deepEqual(state.servedIds, ['0:0']);
  assert.equal(reduce(state, { type: 'SERVE' }), state);
  assert.equal(reduce({ ...state, phase: 'playing' }, { type: 'SERVE' }).score, 100);
});

test('wrong order stays active and can be remade successfully', () => {
  let state = reduce(initialState(), { type: 'SERVE' });
  assert.equal(state.phase, 'playing'); assert.equal(state.orderIndex, 0); assert.equal(state.score, 0); assert.equal(state.mistakes, 1);
  state = reduce(state, { type: 'CLEAR' });
  state = reduce(prepare(state), { type: 'SERVE' });
  assert.equal(state.score, 100); assert.equal(state.phase, 'served');
});

test('wrong packaging can be corrected without recooking', () => {
  let state = prepare(initialState());
  state = reduce(state, { type: 'SET_PACKAGING', value: 'bag' });
  state = reduce(state, { type: 'SERVE' });
  assert.equal(state.phase, 'playing'); assert.equal(state.dish.status, 'cooked');
  state = reduce(state, { type: 'SET_PACKAGING', value: 'plate' });
  assert.equal(reduce(state, { type: 'SERVE' }).phase, 'served');
});

test('failed serving resets combo, deducts five, and never goes below zero', () => {
  let state = { ...initialState(), score: 7, combo: 3 };
  state = reduce(state, { type: 'SERVE' });
  assert.equal(state.score, 2); assert.equal(state.combo, 0);
  state = reduce(state, { type: 'SERVE' });
  assert.equal(state.score, 0);
});

test('combo bonus is capped at forty points', () => {
  const state = reduce({ ...prepare(initialState()), combo: 99 }, { type: 'SERVE' });
  assert.equal(state.score, 140);
});

test('next order requires serving and clears dish while preserving score', () => {
  let state = initialState();
  assert.equal(reduce(state, { type: 'NEXT_ORDER' }), state);
  state = reduce(prepare(state), { type: 'SERVE' });
  state = reduce(state, { type: 'NEXT_ORDER' });
  assert.equal(state.orderIndex, 1); assert.equal(state.score, 100); assert.equal(state.phase, 'playing'); assert.deepEqual(state.dish.ingredients, []);
  assert.equal(reduce(state, { type: 'NEXT_ORDER' }), state);
});

test('all five stages complete and award three stars on perfect play', () => {
  for (let stage = 0; stage < STAGES.length; stage++) {
    const state = completeStage(stage);
    assert.equal(state.phase, 'stageComplete'); assert.equal(state.servedIds.length, STAGES[stage].orders.length); assert.equal(stageStars(state), 3);
    assert.ok(state.score >= STAGES[stage].target);
  }
});

test('stage cannot advance early and final stage cannot overflow', () => {
  const initial = initialState();
  assert.equal(reduce(initial, { type: 'NEXT_STAGE' }), initial);
  assert.equal(reduce(completeStage(0), { type: 'NEXT_STAGE' }).stage, 1);
  const final = completeStage(4);
  assert.equal(reduce(final, { type: 'NEXT_STAGE' }), final);
});

test('star grading distinguishes unfinished, low score, recovered and perfect', () => {
  assert.equal(stageStars(initialState()), 0);
  const state = completeStage(0);
  assert.equal(stageStars({ ...state, mistakes: 10, score: 20 }), 1);
  assert.equal(stageStars({ ...state, mistakes: 1 }), 2);
  assert.equal(stageStars(state), 3);
});

test('broken, missing and unknown-version saves fall back safely', () => {
  for (const raw of [undefined, null, '', 'bad json', 'null', '[]', '{"version":999}', '{"version":1']) {
    const parsed = parseProgress(raw);
    assert.deepEqual(parsed, DEFAULT_PROGRESS);
    parsed.stars[0] = 3;
    assert.equal(DEFAULT_PROGRESS.stars[0], 0);
  }
});

test('progress parser sanitizes values and drops unknown fields', () => {
  const p = parseProgress(JSON.stringify({ version: 1, unlocked: 42, stars: [-1, 2, 99, '3'], best: [150, -5, 10001, null, 600], sound: 'yes', injected: true }));
  assert.equal(p.unlocked, 0); assert.deepEqual(p.stars, [0, 2, 0, 0, 0]); assert.deepEqual(p.best, [150, 0, 0, 0, 600]); assert.equal(p.sound, true); assert.equal(p.injected, undefined);
});

test('recording complete stages unlocks next and preserves better results', () => {
  const p = parseProgress(null);
  assert.equal(recordStage(p, initialState()), p);
  const complete = completeStage(0);
  const saved = recordStage(p, complete);
  assert.equal(saved.unlocked, 1); assert.equal(saved.stars[0], 3); assert.equal(saved.best[0], complete.score); assert.equal(p.unlocked, 0);
  const replay = recordStage(saved, { ...complete, mistakes: 30, score: 0 });
  assert.deepEqual(replay, saved);
  const last = recordStage(saved, completeStage(4));
  assert.equal(last.unlocked, 4);
});

test('final save survives serialization and keeps sound preference', () => {
  let p = { ...parseProgress(null), sound: false };
  for (let i = 0; i < 5; i++) p = recordStage(p, completeStage(i));
  assert.deepEqual(parseProgress(JSON.stringify(p)), p);
  assert.deepEqual(p.stars, [3, 3, 3, 3, 3]); assert.equal(p.sound, false);
});
