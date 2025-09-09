// progress.js
import { state } from './state.js';

function clamp2(v){ return Math.round(v*100)/100; }

export function updateStatsUI(){
  const p=state.player;
  // enforce storage precision (2 decimals) for float-like stats
  p.armor = clamp2(p.armor); p.moveSpeed = clamp2(p.moveSpeed);
  document.getElementById('level').textContent='Lv '+p.level;
  document.getElementById('xp').textContent=p.xp;
  document.getElementById('xpMax').textContent=p.xpMax;
  document.getElementById('gold').textContent=p.gold;
  let hpEl = document.getElementById('hp');
  if(!hpEl){
    const stats = document.getElementById('stats');
    const span = document.createElement('span'); span.id='hp'; stats.appendChild(document.createElement('br')); stats.appendChild(span);
    hpEl = span;
  }
  // Display integers only (avoid long float artifacts)
  hpEl.textContent = `HP ${Math.round(p.hp)}/${Math.round(p.maxHp)} | ATK ${Math.round(p.attack)} | ARM ${Math.round(p.armor)} | MS ${Math.round(p.moveSpeed)} | AS ${Math.round(p.attackSpeed)}`;
}
export function gainXP(n){
  const p=state.player; p.xp+=n;
  while(p.xp>=p.xpMax){
    p.xp-=p.xpMax; p.level++; p.xpMax=Math.floor(p.xpMax*1.4)+5; p.maxHp += 2; p.attack += 1; p.armor = clamp2(p.armor + 0.2); p.moveSpeed = clamp2(p.moveSpeed + 0.02); p.attackSpeed = Math.max(6, p.attackSpeed-1); p.hp = p.maxHp; // full heal
    state.floatingTexts.push({x:p.x,y:p.y-24,text:`LEVEL UP!`,color:'#ffdd55',life:90,big:true});
  }
  updateStatsUI();
}
export function gainGold(n){ state.player.gold+=n; updateStatsUI(); }
