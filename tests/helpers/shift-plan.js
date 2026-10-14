import {STAGES,initialState,getOrder,requiredIngredients,reduce} from '../../game.js';
export function prepareOrder(state,index){
 state=reduce(state,{type:'SELECT_ORDER',index});const order=getOrder(state);
 for(const id of requiredIngredients(order))state=reduce(state,{type:'TOGGLE_INGREDIENT',id});
 state=reduce(state,{type:'SET_TEXTURE',value:order.texture});state=reduce(state,{type:'SET_PACKAGING',value:order.packaging});state=reduce(state,{type:'COOK'});return reduce(state,{type:'COOK_DONE',token:state.dish.token});
}
export function solveShift(index){let state=initialState(index,index+1);const events=[];
 for(const i of STAGES[index].referencePlan){
  state=prepareOrder(state,i);events.push({order:i,phase:state.phase,fuel:state.fuel,turn:state.turn});if(state.phase!=='playing')return {state,events};
  const o=getOrder(state);if(o.pair!==undefined&&o.pair!==null&&!state.heldDish)state=reduce(state,{type:'HOLD'});else {state=reduce(state,{type:'SERVE'});state=reduce(state,{type:'NEXT_ORDER'});}
 }
 return {state,events};}
