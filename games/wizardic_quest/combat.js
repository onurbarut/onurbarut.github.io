// combat.js
import { state } from './state.js';
import { gainXP, gainGold, updateStatsUI } from './progress.js';
import { renderInventory } from './inventory.js';
import * as C from './constants.js';

function getMonsterSize(level){
  const base = (typeof C.MONSTER_BASE_SIZE==='number')?C.MONSTER_BASE_SIZE:96;
  const delta = (typeof C.MONSTER_LEVEL_DELTA==='number')?C.MONSTER_LEVEL_DELTA:2;
  return base + (level-1)*delta;
}
let ESS_SIZE = (typeof C.ESSENCE_SIZE==='number')?C.ESSENCE_SIZE:(window.__ESSENCE_SIZE ?? 16);
if(typeof C.ESSENCE_SIZE !== 'number'){
  try { import('./constants.js?es='+Date.now()).then(mod=>{ if(typeof mod.ESSENCE_SIZE==='number'){ ESS_SIZE=mod.ESSENCE_SIZE; window.__ESSENCE_SIZE=ESS_SIZE; } }); } catch(_){ }
}
window.__ESSENCE_SIZE = ESS_SIZE;

export function updateProjectiles(){
  for(let pr of state.projectiles){
    pr.x+=pr.vx; pr.life--;
    // Skip monster projectiles when checking damage to monsters (avoid self-hit on spawn)
    if(pr.fromMonster) continue;
    for(let m of state.monsters){
      const ms = getMonsterSize(m.level);
      if(pr.x >= m.x - ms/2 && pr.x <= m.x + ms/2 && pr.y >= m.y - ms/2 && pr.y <= m.y + ms/2){
        const dmg = pr.dmg || 1;
        const mitigated = Math.max(1, dmg - (m.armor? Math.floor(m.armor):0));
        m.hp -= mitigated; pr.life=0;
        state.floatingTexts.push({x:m.x,y:m.y-10,text:`-${mitigated}`,color:'#ff8844',life:45});
        if(m.hp<=0){
          m.hp = 0; m.dead = true;
            // spawn essence drop on ground instead of instant add
          state.floatingTexts.push({x:m.x,y:m.y-20,text:`+${m.xpReward}xp`,color:'#6f6',life:60});
          gainXP(m.xpReward); gainGold(m.goldReward);
          if(Math.random()<m.essenceChance){
            state.drops.push({type:'Essence', x:m.x, y:m.y, life:900});
          }
          const kq=state.dailyQuests.find(q=>q.id==='k10'); if(kq){ kq.progress++; state._questsDirty=true; }
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter(pr=>pr.life>0);
  // Monster projectile vs player
  for(let pr of state.projectiles){
    if(!pr.fromMonster) continue;
    if(Math.abs(pr.x - state.player.x) < 10 && Math.abs(pr.y - state.player.y) < 14){
      state.player.hp -= pr.dmg || 1; pr.life = 0;
      updateStatsUI(); // reflect ranged damage
      state.floatingTexts.push({x:state.player.x,y:state.player.y-10,text:`-${pr.dmg||1}`,color:'#55aaff',life:50});
    }
  }
  state.projectiles = state.projectiles.filter(pr=>pr.life>0);
  if(state.player.hp <= 0 && !state.player.dead){
    // death penalties
    const lostXp = Math.floor(state.player.xpMax * 0.15);
    state.floatingTexts.push({x:state.player.x,y:state.player.y-18,text:`DEAD -${lostXp}xp`,color:'#ff0',life:120});
    state.player.xp = Math.max(0, state.player.xp - lostXp);
    for(let i=0;i<2 && state.player.items.length>0;i++) state.player.items.pop();
    state.player.dead = true;
    state.player.respawnTimer = 600; // 10s at 60fps
    updateStatsUI();
  }
  // pickup logic for drops
  const esz = ESS_SIZE;
  // derive wizard size (approx) for pickup radius
  const wizH = (typeof C.WIZARD_HEIGHT==='number'? C.WIZARD_HEIGHT : 48);
  const pickupRadius = wizH * 0.45; // generous so visual contact always picks up
  const wizCenterY = state.player.y - wizH/2 + 8; // matches render offset logic
  for(let i=state.drops.length-1;i>=0;i--){
    const d=state.drops[i]; d.life--; if(d.life<=0){ state.drops.splice(i,1); continue; }
    const dx = d.x - state.player.x;
    const dy = d.y - wizCenterY;
    const maxDist = (esz/2) + pickupRadius;
    if(dx*dx + dy*dy <= maxDist*maxDist){
      state.player.items.push(d.type);
      if(d.type==='Essence'){
        const cq=state.dailyQuests.find(q=>q.id==='c3'); if(cq){ cq.progress++; state._questsDirty=true; }
      }
      state.floatingTexts.push({x:state.player.x,y:state.player.y-16,text:`Got ${d.type}`,color:'#acf',life:50});
      state.drops.splice(i,1);
      renderInventory();
      updateStatsUI();
    }
  }
}
