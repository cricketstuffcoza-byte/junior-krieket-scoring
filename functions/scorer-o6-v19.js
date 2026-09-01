export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const matchId = url.searchParams.get('match');
  if (!matchId) return new Response('Geen wedstryd-ID ontvang nie.', { status: 400, headers: { 'content-type': 'text/plain; charset=UTF-8' } });

  const BLITZ_SIXERS = '1240ab91-046e-418f-8c40-b0f18628b095';
  const VIKINGS_DRAGONS = '54e506e4-dcdc-478c-b223-c748e784f5de';
  const LEGACY_CORE = 'https://raw.githubusercontent.com/cricketstuffcoza-byte/junior-krieket-scoring/o6-alpha-omega/Telkaart-O6-ALPHA-OMEGA-V16.html';

  const r = await fetch(LEGACY_CORE, { cf: { cacheTtl: 0 } });
  if (!r.ok) return new Response('Die O/6 scorer core kon nie gelaai word nie.', { status: 502 });
  let html = await r.text();

  if (matchId === BLITZ_SIXERS) {
    return new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' } });
  }

  const VIKINGS = [
    'De Wet Cilliers','Drikus Venter','Heinro Michau','Henrique Bronkhorst',
    'Joshua van Staden','Juandré Van Loggerenberg','Kai van Schoor','Ryan Nolte','Zayn Steynberg'
  ];
  const DRAGONS = [
    'Caelem Meeling','CJ Kruger','Dayden Joubert','DeAndre Joubert','Edward Nienaber',
    'Jacques Marais','Keegan Kruger','Lehan Benadie','Matthew Swanepoel','Preston Kruger','Tristan Theron'
  ];

  const safeMatch = { teamA:'Vikings', teamB:'Dragons', group:'U/6', date:'2026-08-31', time:'17:30', venue:'Laerskool Wonderboom' };
  const safePlayers = { Vikings:VIKINGS, Dragons:DRAGONS };

  if (matchId !== VIKINGS_DRAGONS) {
    const SB = 'https://moomommajyldjquncnrd.supabase.co';
    const KEY = 'sb_publishable_MIdISKN9MwYu5A8IzhYGBQ_VBBlEGAH';
    const H = { apikey:KEY, Authorization:'Bearer '+KEY };
    try {
      const mRes = await fetch(SB+'/rest/v1/matches?select=id,team_a_id,team_b_id,match_date,match_time,venue,age_group&id=eq.'+encodeURIComponent(matchId), {headers:H,cache:'no-store'});
      if (!mRes.ok) throw new Error('Wedstryd kon nie gelaai word nie.');
      const m = (await mRes.json())[0];
      if (!m) throw new Error('Wedstryd nie gevind nie.');
      const ids=[m.team_a_id,m.team_b_id].filter(Boolean).join(',');
      const tRes=await fetch(SB+'/rest/v1/teams?select=id,name&id=in.('+ids+')',{headers:H,cache:'no-store'});
      const pRes=await fetch(SB+'/rest/v1/players?select=first_name,surname,team_id&team_id=in.('+ids+')',{headers:H,cache:'no-store'});
      if(!tRes.ok||!pRes.ok) throw new Error('Span- of spelersdata kon nie gelaai word nie.');
      const teams=await tRes.json(), players=await pRes.json();
      const tm=Object.fromEntries(teams.map(x=>[x.id,x.name]));
      const a=tm[m.team_a_id]||'Span A', b=tm[m.team_b_id]||'Span B';
      safeMatch.teamA=a; safeMatch.teamB=b; safeMatch.date=m.match_date||''; safeMatch.time=String(m.match_time||'').slice(0,5); safeMatch.venue=m.venue||'';
      safePlayers[a]=players.filter(x=>x.team_id===m.team_a_id).map(x=>[x.first_name,x.surname].filter(Boolean).join(' ')).filter(Boolean);
      safePlayers[b]=players.filter(x=>x.team_id===m.team_b_id).map(x=>[x.first_name,x.surname].filter(Boolean).join(' ')).filter(Boolean);
    } catch(e) {
      return new Response(e.message||'Die wedstryd kon nie gelaai word nie.',{status:502,headers:{'content-type':'text/plain; charset=UTF-8'}});
    }
  }

  html=html.replace(/const MATCH=\{[^;]*\};/,'const MATCH='+JSON.stringify(safeMatch)+';');
  html=html.replace(/const PLAYERS=\{[\s\S]*?\};\s*const RULES=/,'const PLAYERS='+JSON.stringify(safePlayers)+';\nconst RULES=');
  html=html.replace(/<div class="locked">Blitzwolwe<\/div>/g,'<div class="locked">'+safeMatch.teamA+'</div>');
  html=html.replace(/<div class="locked">Sixers<\/div>/g,'<div class="locked">'+safeMatch.teamB+'</div>');
  html=html.replace(/<option>Blitzwolwe<\/option>/g,'<option>'+safeMatch.teamA+'</option>');
  html=html.replace(/<option>Sixers<\/option>/g,'<option>'+safeMatch.teamB+'</option>');
  html=html.replace('Plaaslike toetsweergawe • wedstrydinstellings is deur Admin vooraf bepaal','Alpha & Omega U/6 V19 • wedstrydinstellings is deur Admin vooraf bepaal');

  const enhancement=`<script>
(function(){
'use strict';
const MID=${JSON.stringify(matchId)}, A=${JSON.stringify(safeMatch.teamA)}, B=${JSON.stringify(safeMatch.teamB)};
const PA=${JSON.stringify(VIKINGS)}, PB=${JSON.stringify(DRAGONS)};
function byId(id){return document.getElementById(id)}
function savedKey(){return 'junior_krieket_v19_saved_'+MID}
function tossKey(){return 'junior_krieket_v19_toss_'+MID}
function readSaved(){try{const x=JSON.parse(localStorage.getItem(savedKey())||'null');return x&&x.state?x:null}catch(e){return null}}
function readToss(){try{return JSON.parse(localStorage.getItem(tossKey())||'null')}catch(e){return null}}
function writeToss(){try{const w=byId('tossWinner')?.value,d=byId('tossDecision')?.value;if(w&&d)localStorage.setItem(tossKey(),JSON.stringify({winner:w,decision:d}))}catch(e){}}
function applyToss(){const t=readToss();if(!t)return false;const w=byId('tossWinner'),d=byId('tossDecision');if(w)w.value=t.winner||'';if(d)d.value=t.decision||'';if(w&&d)byId('tossText').textContent=t.winner&&t.decision?t.winner+' het die toss gewen en gekies om '+(t.decision==='BAT'?'eerste te kolf':'eerste te boul')+'.':'Kies die toss-wenner en besluit.';return !!t}

/* Presence gate + correct resume workflow. */
(function presenceGate(){
 const start=byId('start');if(!start)return;
 const key='junior_krieket_v19_presence_'+MID;
 const modal=document.createElement('div');modal.id='o6PresenceGate';modal.className='modal hidden';
 modal.innerHTML='<div class="modalbox" style="width:min(900px,100%)"><h2>👥 Bevestig spelers wat vandag beskikbaar is</h2><div class="banner blue">Kies die spelers wat vandag beskikbaar en teenwoordig is. Net hierdie spelers sal vir kolf-, boul- en veldwerkkeuses beskikbaar wees.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><div><h3>'+A+'</h3><div id="o6PA"></div><div id="o6PAC" class="muted"></div></div><div><h3>'+B+'</h3><div id="o6PB"></div><div id="o6PBC" class="muted"></div></div></div><div id="o6PE" style="color:#b42318;font-weight:800;margin-top:10px"></div><div class="actions" style="margin-top:12px"><button id="o6PC" class="primary" type="button">BEVESTIG BESKIKBARE SPELERS & GAAN VOORT</button></div></div>';
 document.body.appendChild(modal);
 let savedPresence=null;try{savedPresence=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
 const presence={A:PA,B:PB};
 function draw(group,host,countHost){const chosen=(savedPresence&&savedPresence[group])||presence[group].slice();host.innerHTML='';presence[group].forEach(n=>{const l=document.createElement('label');l.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #e6e9ed';const c=document.createElement('input');c.type='checkbox';c.checked=chosen.includes(n);c.dataset.name=n;l.appendChild(c);l.appendChild(document.createTextNode(n));host.appendChild(l)});countHost.textContent=host.querySelectorAll('input:checked').length+' beskikbaar'}
 function show(){draw('A',byId('o6PA'),byId('o6PAC'));draw('B',byId('o6PB'),byId('o6PBC'));byId('o6PE').textContent='';modal.classList.remove('hidden')}
 function restoreSaved(saved,a,b){
   if(!saved||typeof state==='undefined')return false;
   try{
     PLAYERS[A]=a;PLAYERS[B]=b;
     Object.keys(saved.state||{}).forEach(k=>{state[k]=saved.state[k]});
     if(saved.players){Object.keys(saved.players).forEach(k=>{PLAYERS[k]=saved.players[k]})}
     PLAYERS[A]=a;PLAYERS[B]=b;
     undoStack=[];
     state.started=true;
     state.completed=!!state.completed;
     applyToss();
     byId('pairPanel')?.classList.add('hidden');byId('bowlerPanel')?.classList.add('hidden');byId('limitPanel')?.classList.add('hidden');byId('newBatterPanel')?.classList.add('hidden');byId('inningsPanel')?.classList.add('hidden');byId('wicketPanel')?.classList.add('hidden');byId('fielderPanel')?.classList.add('hidden');
     render();
     /* Re-open only the decision that was active when the match was saved. */
     if(state.pendingNewBatter){promptNew(state.striker||'Kolwer');}
     else if(state.pendingCoachThrow){render();}
     else if(state.pendingFielder){openFielderChooser(state.dismissalType||'RUN_OUT');}
     else if(state.pendingDismissal){buildDismissalChoices();byId('wicketPanel').classList.remove('hidden');}
     else if(state.started&&!state.completed&&!state.striker&&!state.nonStriker){openPair();}
     else if(state.started&&!state.completed&&state.striker&&state.nonStriker&&!state.bowler){openBowler();}
     render();
     return true;
   }catch(e){console.error('V19 saved restore',e);return false}
 }
 start.addEventListener('click',function(ev){
   ev.preventDefault();ev.stopImmediatePropagation();
   show();
 },true);
 byId('o6PC').addEventListener('click',function(){
   function pick(id){return Array.from(byId(id).querySelectorAll('input:checked')).map(x=>x.dataset.name)}
   const a=pick('o6PA'),b=pick('o6PB');
   if(a.length<2||b.length<2){byId('o6PE').textContent='Elke span moet minstens twee beskikbare spelers hê.';return}
   try{localStorage.setItem(key,JSON.stringify({A:a,B:b}))}catch(e){}
   modal.classList.add('hidden');
   const saved=readSaved();
   if(saved){
     if(!readToss()){
       byId('status').textContent='Gestoorde wedstryd word hervat. Die gestoorde telling en wedstrydstatus word gebruik; die toss is nie nodig om voort te gaan nie.';
       byId('status').className='banner blue';
     }
     if(!restoreSaved(saved,a,b)){byId('status').textContent='Die gestoorde wedstryd kon nie herstel word nie.';byId('status').className='banner red'}
   }else{
     applyToss();
     if(typeof start==='function')start();
   }
 });
})();

/* Remember toss choices for all future saves. */
byId('tossWinner')?.addEventListener('change',writeToss);byId('tossDecision')?.addEventListener('change',writeToss);applyToss();

/* Final uneven pair: current striker/non-striker may return. */
(function allowCurrentBattersAsReturners(){
 const panel=byId('pairPanel'),choices=byId('pairChoices');if(!panel||!choices)return;let sig='';
 function add(name){if(!name)return;if(Array.from(choices.children).some(el=>el.dataset.o6Returner===name))return;const b=document.createElement('button');b.type='button';b.className='btn choice';b.dataset.o6Returner=name;b.textContent='🔁 '+name+' (terugkerende kolwer)';b.addEventListener('click',function(){const i=state.selectedPair.indexOf(name);if(i>=0)state.selectedPair.splice(i,1);else if(state.selectedPair.length<2)state.selectedPair.push(name);Array.from(choices.children).forEach(x=>{const n=x.dataset.o6Returner||x.textContent.trim().replace(/^🔁 /,'').replace(/ \(terugkerende kolwer\)$/,'').replace(/ ✓ \d+ balle voltooi$/,'');x.classList.toggle('selected',state.selectedPair.includes(n))});byId('confirmPair').disabled=state.selectedPair.length!==2});choices.appendChild(b)}
 function refresh(){if(panel.classList.contains('hidden')){sig='';return}const msg=(byId('pairMessage')?.textContent||'').toLowerCase();if(!msg.includes('laaste ongelyke'))return;if(!state)return;const n=[state.striker,state.nonStriker].filter(Boolean),s=n.join('|')+'|'+choices.children.length;if(s===sig)return;sig=s;n.forEach(add)}
 new MutationObserver(refresh).observe(panel,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});setInterval(refresh,250);
})();

/* Manual strike switch. */
(function strikeSwitch(){const host=byId('striker');if(!host||!host.parentElement||byId('o6SwitchStrike'))return;const b=document.createElement('button');b.id='o6SwitchStrike';b.type='button';b.className='btn';b.textContent='🔄 WISSEL STRIKE';b.style.marginTop='10px';b.onclick=function(){if(!state||!state.started||!state.striker||!state.nonStriker)return;if(state.pendingNewBatter||state.pendingDismissal||state.pendingFielder||state.pendingCoachThrow||state.pairLimitAccepted||!state.bowler)return;if(typeof snapshot==='function')snapshot();[state.striker,state.nonStriker]=[state.nonStriker,state.striker];render()};host.parentElement.appendChild(b)})();

/* Block normal scoring while bowler selection is open. */
document.getElementById('normalButtons')?.addEventListener('click',function(ev){const p=byId('bowlerPanel');if(p&&!p.classList.contains('hidden')){ev.preventDefault();ev.stopImmediatePropagation()}},true);

/* Correct U/6 run-out: first choose the dismissed batsman, then fielder. */
(function runout(){
 const original=typeof confirmFielder==='function'?confirmFielder:null;
 window.dismissalSelected=function(kind){state.pendingDismissal=false;state.dismissalType=kind;byId('wicketPanel')?.classList.add('hidden');if(kind!=='RUN_OUT'){if(kind==='CAUGHT')openFielderChooser(kind);else{const coach=state.pendingCoachWicket;state.pendingCoachWicket=false;legal(0,coach?'COACH WICKET':'WICKET',true,kind)}return}const modal=document.createElement('div');modal.id='o6Runout';modal.className='modal';const box=document.createElement('div');box.className='modalbox';box.innerHTML='<h2>🏃 RUN OUT – WATSE KOLWER IS UIT?</h2><div class="banner blue">Kies presies watter een van die huidige twee kolwers gerun-out is.</div><div id="o6ROC" class="choiceGrid"></div><button id="o6ROCANCEL" class="btn" type="button" style="margin-top:10px;width:100%">KANSELLEER</button>';modal.appendChild(box);document.body.appendChild(modal);const c=byId('o6ROC');[state.striker,state.nonStriker].filter(Boolean).forEach(n=>{const b=document.createElement('button');b.type='button';b.className='btn choice';b.textContent=n;b.onclick=function(){state.pendingRunOutBatter=n;modal.remove();openFielderChooser('RUN_OUT');render()};c.appendChild(b)});byId('o6ROCANCEL').onclick=function(){modal.remove();state.dismissalType=null;render()}}
 window.confirmFielder=function(){if(state.dismissalType!=='RUN_OUT'){if(original)original();return}if(!state.selectedFielder)return;const target=state.pendingRunOutBatter||state.striker,t=team(),bo=bowler(),f=state.bats[state.selectedFielder],bat=state.bats[target];snapshot();if(f)f.runOuts=(f.runOuts||0)+1;if(bat){bat.dismissals=(bat.dismissals||0)+1;bat.balls++;state.pairFaceBalls[target]=(state.pairFaceBalls[target]||0)+1}t.legalBalls++;if(bo){bo.legalBalls++;bo.wickets++;bo.dots++}t.wickets++;state.pairBalls++;state.log.push({inn:state.innings,ball:t.legalBalls,over:overs(t.legalBalls-1),face:target,runs:0,kind:'WICKET',wicket:true,dismissal:'RUN OUT'});state.pendingFielder=false;state.pendingCoachWicket=false;state.pendingRunOutBatter=null;state.dismissalType=null;state.selectedFielder=null;byId('fielderPanel')?.classList.add('hidden');afterLegal(true,target);render()};
})();

/* Match-scoped reset only. */
document.addEventListener('click',function(ev){const btn=ev.target&&ev.target.closest?ev.target.closest('#reset'):null;if(!btn)return;ev.preventDefault();ev.stopImmediatePropagation();try{localStorage.removeItem(savedKey());localStorage.removeItem('junior_krieket_v19_presence_'+MID);localStorage.removeItem(tossKey())}catch(e){}window.location.reload()},true);
})();
</script>`;

  html=html.replace('</body>',enhancement+'</body>');
  return new Response(html,{headers:{'content-type':'text/html; charset=UTF-8','cache-control':'no-store'}});
}