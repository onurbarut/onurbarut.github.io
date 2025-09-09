// projectiles.js
import { state } from './state.js';
export let lastShotFrame=-999;
export const SHOT_COOLDOWN=()=> state.player.attackSpeed; // function now
export function shootSpell(){
  if(state.time - lastShotFrame < SHOT_COOLDOWN()) return; lastShotFrame=state.time;
  state.projectiles.push({ x: state.player.x + (state.player.dir*6), y: state.player.y, vx: state.player.dir*2, life:90, dmg: state.player.attack });
}
