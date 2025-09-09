// render.js
import { state, worldWidthPx, worldHeightPx } from './state.js';
import * as C from './constants.js';
import { monsterImgLv1Ready, monsterImgLv3Ready, monsterImgLv1, monsterImgLv3, monsterImgLv2Ready, monsterImgLv2 } from './monsters.js';

// Safe fallbacks if running with older cached constants.js
const MAP_W = C.MAP_W ?? 40;
const MAP_H = C.MAP_H ?? 40;
const DRAW_TILE = C.DRAW_TILE ?? 16;
const SHOP_SIZE = C.SHOP_SIZE ?? 96;
const SHOP_CENTER_X = C.SHOP_CENTER_X ?? 80;
const SHOP_CENTER_Y = C.SHOP_CENTER_Y ?? 80;

// Dynamic size fallbacks (monsters + shop) similar to wizard recovery
let MON_BASE = (typeof C.MONSTER_BASE_SIZE === 'number') ? C.MONSTER_BASE_SIZE : (window.__MON_BASE ?? 24);
let MON_DELTA = (typeof C.MONSTER_LEVEL_DELTA === 'number') ? C.MONSTER_LEVEL_DELTA : (window.__MON_DELTA ?? 2);
if(typeof C.MONSTER_BASE_SIZE !== 'number' || typeof C.MONSTER_LEVEL_DELTA !== 'number'){
  try { import('./constants.js?mb=' + Date.now()).then(mod=>{ if(typeof mod.MONSTER_BASE_SIZE==='number'){ MON_BASE=mod.MONSTER_BASE_SIZE; window.__MON_BASE=MON_BASE; } if(typeof mod.MONSTER_LEVEL_DELTA==='number'){ MON_DELTA=mod.MONSTER_LEVEL_DELTA; window.__MON_DELTA=MON_DELTA; } }); } catch(_){}
}
window.__MON_BASE = MON_BASE; window.__MON_DELTA = MON_DELTA;
let SHOP_SZ = (typeof C.SHOP_SIZE === 'number') ? C.SHOP_SIZE : (window.__SHOP_SIZE ?? 128);
if(typeof C.SHOP_SIZE !== 'number'){
  try { import('./constants.js?sh=' + Date.now()).then(mod=>{ if(typeof mod.SHOP_SIZE==='number'){ SHOP_SZ = mod.SHOP_SIZE; window.__SHOP_SIZE=SHOP_SZ; } }); } catch(_){}
}
window.__SHOP_SIZE = SHOP_SZ;
let ESS_SIZE = (typeof C.ESSENCE_SIZE === 'number') ? C.ESSENCE_SIZE : (window.__ESSENCE_SIZE ?? 16);
if(typeof C.ESSENCE_SIZE !== 'number'){
  try { import('./constants.js?es=' + Date.now()).then(mod=>{ if(typeof mod.ESSENCE_SIZE==='number'){ ESS_SIZE=mod.ESSENCE_SIZE; window.__ESSENCE_SIZE=ESS_SIZE; } }); } catch(_){ }
}
window.__ESSENCE_SIZE = ESS_SIZE;
const LIVE_MONSTER_RESIZE = true; // monsters already sized per frame, flag kept for symmetry

function getMonsterSize(level){
  // Always compute from dynamic base/delta so changes reflect (with live flags)
  return (MON_BASE ?? 24) + (level-1) * (MON_DELTA ?? 2);
}
const camera={x:0,y:0};
export function getCamera(){ return camera; }

// Player sprite processing (trim once, scale on demand based on current constant)
const wizardImg=new Image();
let wizardReady=false;
let wizardTrim=null; // trimmed original
let wizardScaled=null; // scaled to lastHeight
let lastWizardHeight=-1;
let loggedConstOnce=false;
// Single debug flags (avoid duplicates)
const LIVE_WIZARD_RESCALE = true; // set false for perf
const SHOW_SIZE_DEBUG = true;

wizardImg.src='assets/wizard.png';
wizardImg.onload=()=>{
  const off=document.createElement('canvas'); off.width=wizardImg.width; off.height=wizardImg.height; const octx=off.getContext('2d');
  octx.drawImage(wizardImg,0,0); const imgData=octx.getImageData(0,0,off.width,off.height); const d=imgData.data;
  let minX=off.width, minY=off.height, maxX=0, maxY=0;
  for(let y=0;y<off.height;y++) for(let x=0;x<off.width;x++){
    const i=(y*off.width+x)*4; const r=d[i],g=d[i+1],b=d[i+2];
    if(r>240&&g>240&&b>240){ d[i+3]=0; continue; }
    if(d[i+3]===0) continue;
    if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
  }
  if(maxX<=minX||maxY<=minY){ wizardTrim=off; wizardReady=true; return; }
  octx.putImageData(imgData,0,0); const w=maxX-minX+1,h=maxY-minY+1; wizardTrim=document.createElement('canvas'); wizardTrim.width=w; wizardTrim.height=h; wizardTrim.getContext('2d').drawImage(off,minX,minY,w,h,0,0,w,h);
  wizardReady=true; lastWizardHeight=-1; // force first scale
};

function ensureWizardScaled(){
  if(!wizardReady || !wizardTrim) return;
  if(!loggedConstOnce){
    console.log('[WizardDebug:init] keys', Object.keys(C));
    console.log('[WizardDebug:init] C.WIZARD_HEIGHT=', C.WIZARD_HEIGHT, 'C.PLAYER_TARGET_HEIGHT=', C.PLAYER_TARGET_HEIGHT);
    console.log('[WizardDebug:init] rawImage', wizardImg.width+'x'+wizardImg.height, 'trimmed', wizardTrim.width+'x'+wizardTrim.height);
    loggedConstOnce=true;
  }
  const targetH = (WIZ_HEIGHT ?? C.WIZARD_HEIGHT ?? C.PLAYER_TARGET_HEIGHT ?? 48);
  if(LIVE_WIZARD_RESCALE) lastWizardHeight = -1; // force each frame when tuning
  if(targetH === lastWizardHeight && wizardScaled) return;
  const scale = targetH / wizardTrim.height;
  const scaled = document.createElement('canvas');
  scaled.height = targetH;
  scaled.width  = Math.max(1, Math.round(wizardTrim.width * scale));
  const sctx = scaled.getContext('2d'); sctx.imageSmoothingEnabled=false; sctx.drawImage(wizardTrim,0,0,scaled.width,scaled.height);
  wizardScaled = scaled; lastWizardHeight = targetH;
  console.log('[WizardDebug:scale]', { WIZARD_HEIGHT: C.WIZARD_HEIGHT, targetH, trimH: wizardTrim.height, scale:+scale.toFixed(4), out:wizardScaled.width+'x'+wizardScaled.height });
}

function drawHealthBar(ctx,x,y,w,h,ratio,bg,fill,outline=true){ ctx.fillStyle=bg; ctx.fillRect(x,y,w,h); ctx.fillStyle=fill; ctx.fillRect(x+1,y+1,Math.max(0,Math.floor((w-2)*ratio)),h-2); if(outline){ ctx.strokeStyle='#000'; ctx.strokeRect(x,y,w,h);} }

function fallbackColor(level){
  const maxGradientLevel=6; const clamped=Math.min(level,maxGradientLevel); const t=(clamped-1)/(maxGradientLevel-1); const hue=120*(1-t); const sat=70, light=45;
  const c=(1-Math.abs(2*light/100-1))*(sat/100); const x=c*(1-Math.abs((hue/60)%2-1)); const m=light/100-c/2; let r=0,g=0,b=0; if(hue<60){r=c;g=x;} else if(hue<120){r=x;g=c;} else if(hue<180){g=c;b=x;} else if(hue<240){g=x;b=c;} else if(hue<300){r=x;b=c;} else {r=c;b=x;} r=Math.round((r+m)*255); g=Math.round((g+m)*255); b=Math.round((b+m)*255); return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0'); }

const essenceImg = new Image(); let essenceReady=false; essenceImg.onload=()=>essenceReady=true; essenceImg.src='assets/essence.png';

// Wizard height robust fallback (handles rare undefined due to caching/eval ordering in some browsers/file:// quirks)
let WIZ_HEIGHT = typeof C.WIZARD_HEIGHT === 'number' ? C.WIZARD_HEIGHT : (window.__WIZARD_HEIGHT ?? undefined);
if(typeof WIZ_HEIGHT !== 'number'){
  console.warn('[WizardHeight] static import missing. Retrying dynamic import.');
  try { import('./constants.js?rt=' + Date.now()).then(mod=>{ if(typeof mod.WIZARD_HEIGHT === 'number'){ WIZ_HEIGHT = mod.WIZARD_HEIGHT; window.__WIZARD_HEIGHT = WIZ_HEIGHT; lastWizardHeight = -1; console.log('[WizardHeight] recovered via dynamic import', WIZ_HEIGHT); } else { console.warn('[WizardHeight] still undefined after dynamic import'); } }).catch(e=>console.warn('[WizardHeight] dynamic import failed', e)); } catch(e){ console.warn('[WizardHeight] dynamic import unsupported', e); }
}
window.__WIZARD_HEIGHT = WIZ_HEIGHT; // stash for any later reload race

export function draw(ctx, canvas){
  ctx.imageSmoothingEnabled=false;
  const desiredX=Math.floor(state.player.x - canvas.width/2);
  const desiredY=Math.floor(state.player.y - canvas.height/2);
  const maxX=worldWidthPx()-canvas.width; const maxY=worldHeightPx()-canvas.height;
  camera.x=Math.max(0,Math.min(maxX,desiredX)); camera.y=Math.max(0,Math.min(maxY,desiredY));
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const offsetX=worldWidthPx()<canvas.width? Math.floor((canvas.width-worldWidthPx())/2):0;
  const offsetY=worldHeightPx()<canvas.height? Math.floor((canvas.height-worldHeightPx())/2):0;
  const startTileX=Math.max(0,Math.floor(camera.x/DRAW_TILE)); const startTileY=Math.max(0,Math.floor(camera.y/DRAW_TILE));
  const endTileX=Math.min(MAP_W, Math.ceil((camera.x+canvas.width)/DRAW_TILE)); const endTileY=Math.min(MAP_H, Math.ceil((camera.y+canvas.height)/DRAW_TILE));
  for(let y=startTileY;y<endTileY;y++) for(let x=startTileX;x<endTileX;x++){ const t=state.map[y][x]; ctx.fillStyle=(t===0)?'#183018':'#4a4a4a'; ctx.fillRect(x*DRAW_TILE-camera.x+offsetX, y*DRAW_TILE-camera.y+offsetY, DRAW_TILE, DRAW_TILE); }
  // shop
  const shopSize = SHOP_SZ; const shopX = SHOP_CENTER_X - shopSize/2; const shopY = SHOP_CENTER_Y - shopSize/2;
  ctx.fillStyle='#704020'; ctx.fillRect(Math.floor(shopX - camera.x + offsetX), Math.floor(shopY - camera.y + offsetY), shopSize, shopSize);
  ctx.fillStyle='#8a5a2a'; ctx.fillRect(Math.floor(shopX - camera.x + offsetX)+8, Math.floor(shopY - camera.y + offsetY)+8, shopSize-16, shopSize-32);
  ctx.fillStyle='#222'; ctx.fillRect(Math.floor(shopX - camera.x + offsetX)+shopSize/2-12, Math.floor(shopY - camera.y + offsetY)+shopSize-40,24,40);
  ctx.fillStyle='#fff'; ctx.font='16px monospace'; ctx.fillText('SHOP', Math.floor(shopX - camera.x + offsetX)+shopSize/2-24, Math.floor(shopY - camera.y + offsetY)-4);
  const p=state.player;
  if(wizardReady){
    ensureWizardScaled();
    if(wizardScaled){
      const w=wizardScaled.width,h=wizardScaled.height;
      ctx.save();
      ctx.translate(Math.floor(p.x-camera.x+offsetX), Math.floor(p.y-camera.y+offsetY));
      ctx.scale(p.dir,1);
      ctx.drawImage(wizardScaled,-w/2,-h+8);
      ctx.restore();
      // health bar just ABOVE the sprite top
      const topY = p.y - h + 8; // sprite top after drawImage offset
      drawHealthBar(ctx, Math.floor(p.x - w/2 - camera.x + offsetX), Math.floor(topY - 8 - camera.y + offsetY), w, 6, p.hp/p.maxHp, '#003300', '#00cc33');
    }
  } else {
    // fallback placeholder (16x32) centered like before
    ctx.fillStyle='#6cf';
    ctx.fillRect(Math.floor(p.x-8-camera.x+offsetX),Math.floor(p.y-16-camera.y+offsetY),16,32);
    const topY = p.y - 16;
    drawHealthBar(ctx, Math.floor(p.x-8-camera.x+offsetX), Math.floor(topY - 8 - camera.y + offsetY), 16,5,p.hp/p.maxHp,'#003300','#00cc33');
  }
  for(let m of state.monsters){ if(m.x<camera.x-64||m.y<camera.y-64||m.x>camera.x+canvas.width+64||m.y>camera.y+canvas.height+64) continue; const ms=getMonsterSize(m.level); let drawn=false; if(m.level===1 && monsterImgLv1Ready){ ctx.drawImage(monsterImgLv1, Math.floor(m.x-ms/2-camera.x+offsetX), Math.floor(m.y-ms/2-camera.y+offsetY), ms, ms); drawn=true; } else if(m.level===2 && monsterImgLv2Ready){ ctx.drawImage(monsterImgLv2, Math.floor(m.x-ms/2-camera.x+offsetX), Math.floor(m.y-ms/2-camera.y+offsetY), ms, ms); drawn=true; } else if(m.level===3 && monsterImgLv3Ready){ ctx.drawImage(monsterImgLv3, Math.floor(m.x-ms/2-camera.x+offsetX), Math.floor(m.y-ms/2-camera.y+offsetY), ms, ms); drawn=true; } if(!drawn){ ctx.fillStyle=fallbackColor(m.level); ctx.fillRect(Math.floor(m.x-ms/2-camera.x+offsetX),Math.floor(m.y-ms/2-camera.y+offsetY),ms,ms); } drawHealthBar(ctx,Math.floor(m.x-(ms/2+2)-camera.x+offsetX),Math.floor(m.y-(ms/2+10)-camera.y+offsetY),ms+4,5,m.hp/m.maxHp,'#330000','#ff2222'); ctx.fillStyle='#fff'; ctx.font='10px monospace'; ctx.fillText('L'+m.level, Math.floor(m.x-8-camera.x+offsetX), Math.floor(m.y + (ms/2) + 8 - camera.y + offsetY)); }
  ctx.fillStyle='#ff0'; for(let pr of state.projectiles){ ctx.fillRect(Math.floor(pr.x-3-camera.x+offsetX), Math.floor(pr.y-3-camera.y+offsetY),6,6); }
  for(let ft of state.floatingTexts){ ft.y -= 0.3; ft.life--; if(ft.life<0) continue; ctx.globalAlpha=Math.max(0, ft.life/(ft.big?90:60)); ctx.fillStyle=ft.color; ctx.font= ft.big? '20px monospace':'12px monospace'; ctx.fillText(ft.text, Math.floor(ft.x-camera.x+offsetX), Math.floor(ft.y-camera.y+offsetY)); ctx.globalAlpha=1; }
  state.floatingTexts = state.floatingTexts.filter(f=>f.life>0);
  // player death countdown overlay
  if(state.player.dead){ ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height); const secs=Math.ceil(state.player.respawnTimer/60); ctx.fillStyle='#fff'; ctx.font='24px monospace'; ctx.fillText('Respawn in '+secs+'...', canvas.width/2-90, canvas.height/2); }
  // draw ground drops (essence)
  const esz = ESS_SIZE;
  for(const d of state.drops){
    const sx = Math.floor(d.x - esz/2 - camera.x + offsetX);
    const sy = Math.floor(d.y - esz/2 - camera.y + offsetY);
    if(essenceReady){ ctx.drawImage(essenceImg, sx, sy, esz, esz); } else { ctx.fillStyle='#5ff'; ctx.fillRect(sx, sy, esz, esz); }
  }
  if(SHOW_SIZE_DEBUG){
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(2,2,260,66); ctx.fillStyle='#fff'; ctx.font='10px monospace'; const wizHDisp=(WIZ_HEIGHT ?? C.WIZARD_HEIGHT); const tgt=(WIZ_HEIGHT ?? C.WIZARD_HEIGHT ?? C.PLAYER_TARGET_HEIGHT ?? 48); const trimH=wizardTrim?wizardTrim.height:'?'; const outH=wizardScaled?wizardScaled.height:'?'; const scaleTxt=(wizardTrim&&wizardScaled)?(outH/trimH).toFixed(2):'?'; ctx.fillText(`WIZ_HEIGHT:${wizHDisp} target:${tgt} scale:${scaleTxt}`,6,12); ctx.fillText(`MonBase:${MON_BASE} d:${MON_DELTA} LiveMon:${LIVE_MONSTER_RESIZE}`,6,24); ctx.fillText(`ShopSize:${SHOP_SZ}`,6,36); ctx.fillText(`trim:${trimH} out:${outH} ready:${wizardReady}`,6,48); ctx.fillText(WIZ_HEIGHT===undefined?'(wizard recovering...)':'',6,60); ctx.fillText(`EssSize:${ESS_SIZE}`,140,36); }
}
