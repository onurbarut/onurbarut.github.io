// constants.js
export const TILE = 16;
export const MAP_W = 40;
export const MAP_H = 40;
export const DRAW_TILE = TILE;

// Wizard/player sprite target height (configurable)
export const WIZARD_HEIGHT = 96;
// Backwards compatibility
export const PLAYER_TARGET_HEIGHT = WIZARD_HEIGHT;

// Shop / building configuration
export const SHOP_CENTER_X = 80;
export const SHOP_CENTER_Y = 80;
export const SHOP_SIZE = 196; // square side length
export const SHOP_INTERACT_RADIUS = 60;

// Dropped item (essence) configuration
export const ESSENCE_SIZE = 48; // pixel size of square essence icon when rendered and its pickup hitbox radius base

// Monster sizing configuration
export const MONSTER_BASE_SIZE = 96; // base pixel size for level 1
export const MONSTER_LEVEL_DELTA = 2; // extra pixels added per level step
export function monsterSize(level){ return MONSTER_BASE_SIZE + (level-1)*MONSTER_LEVEL_DELTA; }
