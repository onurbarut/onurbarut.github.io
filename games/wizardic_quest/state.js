// state.js
import { MAP_W, MAP_H, DRAW_TILE } from './constants.js';

export function worldWidthPx() { return MAP_W * DRAW_TILE; }
export function worldHeightPx() { return MAP_H * DRAW_TILE; }

export const state = {
  time: 0,
  player: { x: 0, y: 0, vx: 0, vy: 0, dir: 1, hp: 10, maxHp: 10, xp: 0, xpMax: 10, level: 1, gold: 0, skins: ['base'], skin: 'base', items: [], dead:false, respawnTimer:0, attack:1, armor:0, moveSpeed:1.2, attackSpeed:12, attackRange:0 },
  monsters: [],
  projectiles: [],
  map: [],
  quests: [],
  dailyQuests: [],
  lastDailyReset: 0,
  floatingTexts: [],
  drops: [] // ground item drops (e.g., Essence)
};
