// map.js
import { MAP_W, MAP_H } from './constants.js';
import { state, worldWidthPx, worldHeightPx } from './state.js';

export function genMap(){
  state.map = [];
  for(let y=0;y<MAP_H;y++){
    const row=[];
    for(let x=0;x<MAP_W;x++){
      if(x===0||y===0||x===MAP_W-1||y===MAP_H-1) row.push(1); else row.push(Math.random()<0.06?1:0);
    }
    state.map.push(row);
  }
  for(let pass=0;pass<2;pass++){
    const copy = state.map.map(r=>r.slice());
    for(let y=1;y<MAP_H-1;y++){
      for(let x=1;x<MAP_W-1;x++){
        let n=0; for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){ if(!ox&&!oy) continue; if(copy[y+oy][x+ox]) n++; }
        if(n>=5) state.map[y][x]=1; else if(n<=2) state.map[y][x]=0;
      }
    }
  }
  state.player.x = worldWidthPx()/2;
  state.player.y = worldHeightPx()/2;
}
