# Wizardic Quest (Browser Prototype)

## Summary
A lightweight pixel-art wizard arena prototype. Focus areas: responsive entity scaling via configurable constants, live daily quests, pickup & inventory loop, and iterative rendering/debug tooling. Pure HTML5 Canvas + ES Modules (no bundler) for fast iteration.

## Key Features
- Core Loop: Move, shoot projectiles, defeat monsters, gain XP & gold, level up.
- Dynamic Scaling System:
  * Configurable sizes in `constants.js`: `WIZARD_HEIGHT`, `MONSTER_BASE_SIZE`, `MONSTER_LEVEL_DELTA`, `SHOP_SIZE`, `ESSENCE_SIZE`.
  * Wizard sprite auto-trim + scale cache (live rescale flag).
  * Monsters & shop use runtime fallbacks; modifying constants then reloading reflects new sizes.
  * Robust fallback + dynamic re-import if a constant is transiently `undefined` (helps with some browser caching / file:// quirks).
- Monsters:
  * Multiple levels (1–3) with per-level images (`assets/monster_lv*.png`).
  * Level-based stats: HP, armor, attack speed/range, projectile vs melee types.
- Combat:
  * Player spell projectiles, monster melee/ranged attacks.
  * Damage floating text, death handling, mitigation via armor.
- Essence Drops & Inventory:
  * Chance-based ground drops (essence) with configurable size + radial pickup detection.
  * Visual pickup feedback & daily quest integration.
- Daily Quests (auto-generated per real day): kill, collect, reach level; tracked & UI updated live.
- UI / UX:
  * Collapsible stats/quest panel (reduces playfield occlusion).
  * Live stats updating (HP, ATK, ARM, Move Speed, Attack Speed) with integers displayed, internal precision stored (2 decimals for some progressive stats).
  * On-screen size/debug overlay (toggle variable in `render.js`).
- Visual Polish:
  * Wizard health bar positioned above sprite; monster bars auto width.
  * Floating text fade & leveling celebration.
- Defensive Runtime Logic:
  * Dynamic ES module re-import for constants recovery.
  * Window stashing of last-known good constant values.

## Recent Changes (Changelog)
- Added configurable size constants (`WIZARD_HEIGHT`, `SHOP_SIZE`, `MONSTER_BASE_SIZE`, `MONSTER_LEVEL_DELTA`, `ESSENCE_SIZE`).
- Implemented wizard sprite trimming + scalable cached rendering.
- Added dynamic scaling & fallback system for monsters, shop, and essence drops.
- Moved wizard health bar above sprite (consistent with monsters).
- Expanded monster hitboxes to full rendered square (no projectile “ghost” pass-through).
- Added level 2 and 3 monster sprites & adaptive drawing.
- Essence drop size now configurable + enlarged radial pickup detection (no more edge “dodges”).
- Live stat panel updates immediately on damage, pickup, XP gain, and level ups.
- Added daily quest completion debug button.
- Implemented floating text for damage, XP, level-up, and pickups.
- Introduced collapsible UI panel to avoid covering play area.
- Added fallback/dynamic import recovery for constants that were intermittently undefined in some load orders.

## File Structure (Key)
- `index.html` Landing menu.
- `game.html` Main game canvas & UI container.
- `constants.js` Centralized tunables / scaling constants.
- `render.js` Camera, draw loop, wizard scaling pipeline, debug overlay.
- `monsters.js` Monster assets, spawning, AI update (movement + attacks).
- `combat.js` Projectile updates, collision, damage, drops, essence pickup.
- `progress.js` XP/level logic + stats UI sync & precision clamping.
- `inventory.js` Inventory rendering (essence icons).
- `quests.js` Daily quest generation & tracking.
- `state.js` Global game state container & helpers.
- `style.css` UI styling & collapsible panel.
- `assets/` Sprite images (wizard, monsters, essence).

## Running / Playing
### Quick (no server)
Open `webgame/game.html` (or `index.html` then start) directly in a modern desktop browser. (Some dynamic import fallback logs may appear when using `file://`.)

### Recommended (local HTTP server)
```
cd webgame
python3 -m http.server 8080   # or: npx serve .
# Navigate to: http://localhost:8080/game.html
```
Why: Avoids certain caching / module timing quirks and enables consistent dynamic imports.

### Controls
- Move: WASD / Arrow Keys
- Shoot: Left mouse click (aims to cursor)

### Loop
Defeat monsters → gain XP & gold → level up → complete daily quests → collect essence.

## Development Workflow
1. Edit constants in `constants.js` to tune sizes & pacing.
2. Enable/disable debug overlay: toggle `SHOW_SIZE_DEBUG` (and `LIVE_WIZARD_RESCALE`) in `render.js`.
3. Resize wizard / monsters / shop / essence by changing their constants then reload page (wizard can live-rescale every frame when flag is true).
4. Use the debug daily quest completion button to accelerate testing of reward flows.
5. Check console logs (`[WizardDebug:*]`, `[MonsterImg]`, `[WizardHeight]`) for scaling & asset load diagnostics.

## Build / Deployment
No build step required (plain ES modules). For deployment, host the `webgame/` directory on any static server / CDN. Optional optimization: pre-compress assets (PNG) & enable HTTP caching.

## Configuration Reference (constants.js)
- `WIZARD_HEIGHT`: Target rendered height after trimming.
- `PLAYER_TARGET_HEIGHT`: Alias for compatibility (mirrors wizard height).
- `SHOP_SIZE`: Square building footprint.
- `MONSTER_BASE_SIZE` + `MONSTER_LEVEL_DELTA`: Size formula per monster level.
- `ESSENCE_SIZE`: Pixel size (width=height) of essence drop & its pickup hitbox basis.
- `SHOP_CENTER_X/Y`: World position of shop center.

## Collision / Hitboxes
- Monsters: Full square of their rendered size (centered at `(m.x, m.y)`).
- Player projectiles: Point-square test vs monster bounding box.
- Essence pickup: Radial overlap (wizard body radius + essence half-size) ensuring visual contact always collects.
- Player HP bar anchored above trimmed sprite top for clarity.

## Precision & Stats
- Internal fractional increases (armor, move speed) stored at 2-decimal precision (see `clamp2` in `progress.js`). UI displays integers for readability.

## Debug Flags (in code)
- `LIVE_WIZARD_RESCALE` (render.js): Forces wizard to recompute scaling each frame (tuning mode).
- `SHOW_SIZE_DEBUG` (render.js): On-screen overlay of size diagnostics.

## Known Limitations / Technical Debt
- No persistence (progress resets on reload).
- Simple pathing & no separation (monsters overlap each other / player).
- Projectiles do not have sprite rotation / direction indicator.
- No sound effects or music.
- Balance passes minimal; XP & drop rates are placeholder.

## Planned / TODO
Short-term:
- Add pause menu & toggle for debug overlay.
- Monster variety: additional behaviors (dash, AoE).
- Spell variants (cooldowns, damage types, area spells).
- Gold sink: basic shop interactions (currently decorative only).
- Essence usage: crafting or upgrades.
- LocalStorage persistence (quests & inventory).

Medium-term:
- Equipment & rarity system (armor, wands, trinkets) with stat modifiers.
- Boss / elite spawns with telegraphed attacks.
- Wave or time-based escalation.
- Particle effects for hits & pickups.

Long-term / Stretch:
- Mobile control scheme & responsive UI scaling.
- Multi-spell loadout & hotkeys.
- Save export/import.
- Performance pass (offscreen canvas pooling, sprite atlasing).

## Contributing (Internal Dev Notes)
- Keep new constants centralized in `constants.js` and reference dynamically (avoid hard-coded literals in loops).
- When adding new sprite assets, consider trimming & caching similar to wizard if size variance matters.
- Maintain defensive fallback pattern (`typeof C.X === 'number' ? ...`) if early-load race conditions appear.

## License
Prototype code: MIT (adjust or add NOTICE file if third-party assets introduced). Art assets currently assumed internal / placeholder.

---
Enjoy building & experimenting! Adjust sizes in `constants.js` and reload to immediately feel the difference.
