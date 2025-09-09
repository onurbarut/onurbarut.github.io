// quests.js
import { state } from './state.js';
import { gainXP, gainGold } from './progress.js';

export function resetDailies(){
  const nowDay=Math.floor(Date.now()/86400000);
  if(nowDay!==state.lastDailyReset){
    state.lastDailyReset=nowDay;
    state.dailyQuests=[
      { id:'k10', type:'kill', target:10, progress:0, reward:{ xp:5, gold:20 }, title:'Defeat 10 critters' },
      { id:'c3', type:'collect', target:3, progress:0, reward:{ xp:3, gold:10 }, title:'Find 3 essence (drops)' },
      { id:'lvl2', type:'level', target:2, progress:()=> state.player.level>=2?1:0, dynamic:true, reward:{ xp:4, gold:15 }, title:'Reach level 2' }
    ];
  }
}
export function renderQuests(){
  const qp=document.getElementById('questPanel');
  qp.innerHTML='<b>Daily Quests</b><br>' + state.dailyQuests.map(q=>{
    if(q._done){
      return `<div class="quest done" data-q="${q.id}"><i>${q.title} - COMPLETE</i></div>`;
    }
    const prog=q.dynamic?(q.progress()*q.target):q.progress; const pct=Math.min(100, Math.floor((prog/q.target)*100));
    return `<div class="quest" data-q="${q.id}">${q.title} - ${prog}/${q.target} (${pct}%)</div>`; }).join('');
}
export function completeQuest(q){ if(q._done) return; if(q.dynamic){ if(q.progress()<1) return; } else if(q.progress<q.target) return; q._done=true; const bonusXp=Math.ceil(q.reward.xp*0.25); gainXP(q.reward.xp + bonusXp); gainGold(q.reward.gold); state._questsDirty=true; state.floatingTexts.push({x:state.player.x,y:state.player.y-30,text:`Quest: +${q.reward.xp+bonusXp} XP`,color:'#88f',life:70}); }
export function tickQuests(){ state.dailyQuests.forEach(q=>{ if(q.dynamic){ if(q.progress()>=1) completeQuest(q); } else if(q.progress>=q.target) completeQuest(q); }); }
export function maybeRenderQuests(){ if(state._questsDirty){ renderQuests(); state._questsDirty=false; } }
