// player.js
import { state, worldWidthPx, worldHeightPx } from './state.js';

export const keys = {};
export function setupInput(canvas, shootSpell){
  window.addEventListener('keydown', e=>{ keys[e.key]=true; if(e.key===' '){ shootSpell(); e.preventDefault(); }});
  window.addEventListener('keyup', e=>{ keys[e.key]=false; });
  canvas.addEventListener('click', shootSpell);
}
export function playerMovement(){
  const p=state.player; p.vx=0; p.vy=0; // fixed typo (was pvy)
  if(keys['ArrowLeft']||keys['a']){ p.vx=-1; p.dir=-1; }
  if(keys['ArrowRight']||keys['d']){ p.vx=1; p.dir=1; }
  if(keys['ArrowUp']||keys['w']) p.vy=-1;
  if(keys['ArrowDown']||keys['s']) p.vy=1;
  // precision enforcement (2 decimals stored)
  p.moveSpeed = Math.round(p.moveSpeed*100)/100;
  p.x+=p.vx*p.moveSpeed; p.y+=p.vy*p.moveSpeed;
  const margin=8;
  p.x=Math.max(margin, Math.min(worldWidthPx()-margin, p.x));
  p.y=Math.max(margin, Math.min(worldHeightPx()-margin, p.y));
}
