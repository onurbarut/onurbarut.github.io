// monsters.js
import { state, worldWidthPx, worldHeightPx } from './state.js';
import { irand } from './utils.js';
import { updateStatsUI } from './progress.js';

export let monsterImgLv1Ready=false, monsterImgLv3Ready=false;
export let monsterImgLv2Ready=false;
export let monsterImgLv1Missing=false, monsterImgLv3Missing=false;
export let monsterImgLv2Missing=false;
export const monsterImgLv1 = new Image();
export const monsterImgLv2 = new Image();
export const monsterImgLv3 = new Image();
const _monsterCacheTag = `?v=${Date.now()}`;
function logStatus(label){
  console.log(`[MonsterImg][Status] ${label} `+
    `L1 ready=${monsterImgLv1Ready} miss=${monsterImgLv1Missing} size=${monsterImgLv1.naturalWidth}x${monsterImgLv1.naturalHeight}; `+
    `L2 ready=${monsterImgLv2Ready} miss=${monsterImgLv2Missing} size=${monsterImgLv2.naturalWidth}x${monsterImgLv2.naturalHeight}; `+
    `L3 ready=${monsterImgLv3Ready} miss=${monsterImgLv3Missing} size=${monsterImgLv3.naturalWidth}x${monsterImgLv3.naturalHeight}`);
}
monsterImgLv1.onload=()=>{ monsterImgLv1Ready = monsterImgLv1.naturalWidth>0; console.log('[MonsterImg] L1 loaded'); logStatus('onload'); };
monsterImgLv2.onload=()=>{ monsterImgLv2Ready = monsterImgLv2.naturalWidth>0; console.log('[MonsterImg] L2 loaded'); logStatus('onload'); };
monsterImgLv3.onload=()=>{ monsterImgLv3Ready = monsterImgLv3.naturalWidth>0; console.log('[MonsterImg] L3 loaded'); logStatus('onload'); };
monsterImgLv1.onerror=e=>{ monsterImgLv1Missing=true; console.warn('[MonsterImg] L1 failed', e?.message||e); logStatus('error'); };
monsterImgLv2.onerror=e=>{ monsterImgLv2Missing=true; console.warn('[MonsterImg] L2 failed', e?.message||e); logStatus('error'); };
monsterImgLv3.onerror=e=>{ monsterImgLv3Missing=true; console.warn('[MonsterImg] L3 failed', e?.message||e); logStatus('error'); };
monsterImgLv1.src='assets/monster_lv1.png'+_monsterCacheTag;
monsterImgLv2.src='assets/monster_lv2.png'+_monsterCacheTag;
monsterImgLv3.src='assets/monster_lv3.png'+_monsterCacheTag;
window.addEventListener('keydown',ev=>{ if(ev.key==='l') logStatus('manual'); });
setTimeout(()=>{ if(!monsterImgLv1Ready && !monsterImgLv1Missing) logStatus('L1 pending 2s'); if(!monsterImgLv2Ready && !monsterImgLv2Missing) logStatus('L2 pending 2s'); if(!monsterImgLv3Ready && !monsterImgLv3Missing) logStatus('L3 pending 2s'); },2000);

export function createMonster(){
  const r=Math.random();
  let lvl=1; if(r>0.85) lvl=3; else if(r>0.55) lvl=2;
  if(Math.random()<0.15) console.log('[MonsterSpawn] level', lvl);
  const baseHp=3; const hp=baseHp+(lvl-1)*4;
  // assign type: higher chance melee, some ranged
  const type = Math.random() < 0.7 ? 'melee' : 'ranged';
  const dmgBase = type==='melee'? 1:1;
  const armor = +(0.1*(lvl-1)).toFixed(2);
  const moveSpeed = +(((type==='melee'?0.35:0.25)+(lvl-1)*0.03).toFixed(2));
  const attackSpeed = (type==='melee'?50:80) - (lvl-1)*4; // lower = faster (frames)
  const attackRange = type==='melee'? 20 : 140 + (lvl-1)*10;
  return {
    x: irand(32, worldWidthPx()-32),
    y: irand(32, worldHeightPx()-32),
    hp, maxHp:hp,
    level:lvl,
    type,
    atk: dmgBase + (lvl-1),
    armor,
    moveSpeed,
    attackSpeed,
    attackRange,
    atkRange: attackRange,
    atkCooldown: attackSpeed,
    atkTimer: 0,
    projectileSpeed: 1.2 + lvl*0.2,
    xpReward:1+(lvl-1)*2,
    goldReward:1+(lvl-1)*3,
    essenceChance:0.2+(lvl-1)*0.1,
    cd:0
  };
}
export function spawnMonster(){ state.monsters.push(createMonster()); }
export function ensureMonsters(){ if(state.monsters.length<6) spawnMonster(); }
export function updateMonsters(){
  const p = state.player;
  for(let m of state.monsters){
    if(m.hp <= 0) continue;
    const dx = p.x - m.x; const dy = p.y - m.y; const dist = Math.hypot(dx, dy) || 0.0001;
    // movement
    const chaseRadius = 220;
    if(dist < chaseRadius){
      const speed = m.moveSpeed;
      if(dist > m.attackRange * 0.85){
        m.x += (dx / dist) * speed;
        m.y += (dy / dist) * speed;
      }
    }
    if(m.atkTimer > 0) m.atkTimer--;
    if(dist <= m.attackRange && m.atkTimer<=0){
      if(m.type==='melee'){
        const raw = m.atk; const dmg = Math.max(1, Math.round(raw));
        const mitigated = dmg - Math.min(dmg-1, p.armor||0);
        p.hp -= mitigated;
        updateStatsUI(); // live HP update
        state.floatingTexts.push({x:p.x + (Math.random()*6-3), y:p.y-10, text:`-${mitigated}`, color:'#55aaff', life:50});
      } else if(m.type==='ranged') {
        state.projectiles.push({ x: m.x, y: m.y, vx: (dx/dist)*m.projectileSpeed, vy: (dy/dist)*m.projectileSpeed, life: 180, fromMonster:true, dmg:m.atk });
      }
      m.atkTimer = m.attackSpeed;
    }
  }
  state.monsters = state.monsters.filter(m=>m.hp>0);
}
