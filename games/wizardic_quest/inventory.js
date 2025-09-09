// inventory.js
import { state } from './state.js';

const essenceImg=new Image(); essenceImg.src='assets/essence.png';

export function renderInventory(){
  const inv=document.getElementById('inventory');
  const htmlItems = state.player.items.map(i=>{
    if(i==='Essence') return `<span class="item essence"><img src="assets/essence.png" alt="Essence" style="width:14px;height:14px;vertical-align:middle;image-rendering:pixelated;"> </span>`;
    return `<span class="item">${i}</span>`;
  }).join('');
  inv.innerHTML='<b>Inventory</b><br>' + htmlItems;
}
