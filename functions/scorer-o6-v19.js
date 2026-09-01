export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const matchId = url.searchParams.get('match');
  if (!matchId) return new Response('Geen wedstryd-ID ontvang nie.', { status: 400, headers: { 'content-type': 'text/plain; charset=UTF-8' } });
  const coreUrl = 'https://raw.githubusercontent.com/cricketstuffcoza-byte/junior-krieket-scoring/o6-alpha-omega/Telkaart-O6-ALPHA-OMEGA-V16.html';
  const r = await fetch(coreUrl, { cf: { cacheTtl: 0 } });
  if (!r.ok) return new Response('Die U/6 scorer core kon nie gelaai word nie.', { status: 502 });
  let html = await r.text();
  const injected = `<script>
(function(){
'use strict';
const __MID=${JSON.stringify(matchId)};
const __SB='https://moomommajyldjquncnrd.supabase.co';
const __KEY='sb_publishable_MIdISKN9MwYu5A8IzhYGBQ_VBBlEGAH';
const __H={apikey:__KEY,Authorization:'Bearer '+__KEY};
async function __get(p){const r=await fetch(__SB+'/rest/v1/'+p,{headers:__H,cache:'no-store'});if(!r.ok)throw Error(await r.text());return r.json()}
async function __matchBootstrap(){
 try{
  const m=(await __get('matches?select=id,team_a_id,team_b_id,match_date,match_time,venue,age_group&id=eq.'+encodeURIComponent(__MID)))[0];
  if(!m)throw Error('Wedstryd nie gevind nie.');
  const ids=[m.team_a_id,m.team_b_id].filter(Boolean);
  const ts=await __get('teams?select=id,name&id=in.('+ids.join(',')+')');
  const ps=await __get('players?select=first_name,surname,team_id&team_id=in.('+ids.join(',')+')');
  const tm=Object.fromEntries(ts.map(x=>[x.id,x.name]));
  const a=tm[m.team_a_id]||'Span A',b=tm[m.team_b_id]||'Span B';
  if(typeof MATCH!=='undefined')Object.assign(MATCH,{teamA:a,teamB:b,date:m.match_date||'',time:String(m.match_time||'').slice(0,5),venue:m.venue||'',group:'U/6'});
  if(typeof PLAYERS!=='undefined'){
   PLAYERS[a]=ps.filter(x=>x.team_id===m.team_a_id).map(x=>[x.first_name,x.surname].filter(Boolean).join(' ')).filter(Boolean);
   PLAYERS[b]=ps.filter(x=>x.team_id===m.team_b_id).map(x=>[x.first_name,x.surname].filter(Boolean).join(' ')).filter(Boolean);
   if(a!=='Blitzwolwe')delete PLAYERS.Blitzwolwe;
   if(b!=='Sixers')delete PLAYERS.Sixers;
  }
  if(typeof fresh==='function')state=fresh();
  if(typeof undoStack!=='undefined')undoStack=[];
  document.querySelectorAll('.locked').forEach(e=>{if(e.textContent.trim()==='Blitzwolwe')e.textContent=a;if(e.textContent.trim()==='Sixers')e.textContent=b});
  if(typeof render==='function')render();
  __presence(a,b);
 }catch(e){console.error('O6 match bootstrap',e);const s=document.getElementById('status');if(s){s.textContent=e.message||String(e);s.className='banner red'}}
}
function __presence(a,b){
 if(document.getElementById('o6Presence'))return;
 const savedKey='junior_krieket_v19_presence_'+__MID;let saved=null;try{saved=JSON.parse(localStorage.getItem(savedKey)||'null')}catch(e){}
 const modal=document.createElement('div');modal.id='o6Presence';modal.className='modal';
 modal.innerHTML='<div class="modalbox" style="width:min(900px,100%)"><h2>👥 Bevestig spelers wat vandag beskikbaar is</h2><div class="banner blue">Kies die spelers wat vandag beskikbaar en teenwoordig is. Net hierdie spelers sal vir kolf-, boul- en veldwerkkeuses beskikbaar wees.</div><div class="two" style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><div><h3>'+a+'</h3><div id="o6PA"></div><div id="o6PAC" class="muted"></div></div><div><h3>'+b+'</h3><div id="o6PB"></div><div id="o6PBC" class="muted"></div></div></div><div id="o6PE" style="color:#b42318;font-weight:800;margin-top:10px"></div><div class="actions" style="margin-top:12px"><button id="o6PC" class="primary" type="button">BEVESTIG BESKIKBARE SPELERS & BEGIN</button></div></div>';
 document.body.appendChild(modal);
 function draw(team,host,countHost){const names=PLAYERS[team]||[];const chosen=(saved&&saved[team])||names.slice();host.innerHTML='';names.forEach(n=>{const row=document.createElement('label');row.style.display='flex';row.style.alignItems='center';row.style.gap='8px';row.style.padding='8px 0';row.style.borderBottom='1px solid #e6e9ed';const cb=document.createElement('input');cb.type='checkbox';cb.checked=chosen.includes(n);cb.dataset.name=n;row.appendChild(cb);row.appendChild(document.createTextNode(n));host.appendChild(row)});const update=()=>{const n=[...host.querySelectorAll('input:checked')].length;countHost.textContent=n+' beskikbaar';};host.addEventListener('change',update);update()}
 draw(a,document.getElementById('o6PA'),document.getElementById('o6PAC'));draw(b,document.getElementById('o6PB'),document.getElementById('o6PBC'));
 document.getElementById('o6PC').onclick=()=>{const pick=id=>[...document.querySelectorAll('#'+id+' input:checked')].map(x=>x.dataset.name);const pa=pick('o6PA'),pb=pick('o6PB');if(pa.length<2||pb.length<2){document.getElementById('o6PE').textContent='Elke span moet minstens twee beskikbare spelers hê.';return}PLAYERS[a]=pa;PLAYERS[b]=pb;try{localStorage.setItem(savedKey,JSON.stringify({[a]:pa,[b]:pb}))}catch(e){}modal.remove();if(typeof render==='function')render()};
}
function __hidePanels(){['pairPanel','bowlerPanel','limitPanel','newBatterPanel','inningsPanel','finalPanel','coachPanel','wicketPanel','fielderPanel'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.add('hidden')})}
function __syncUI(){if(typeof state==='undefined'||!state)return;__hidePanels();if(!state.started){if(typeof render==='function')render();return}if(state.pendingFielder){document.getElementById('fielderPanel')?.classList.remove('hidden');return}if(state.pendingDismissal){document.getElementById('wicketPanel')?.classList.remove('hidden');return}if(state.pendingNewBatter){document.getElementById('newBatterPanel')?.classList.remove('hidden');return}if(state.pendingCoachThrow){document.getElementById('coachPanel')?.classList.remove('hidden');return}if(state.pairLimitAccepted){document.getElementById('limitPanel')?.classList.remove('hidden');return}if(!state.striker||!state.nonStriker){if(typeof openPair==='function')openPair();return}if(!state.bowler){if(typeof openBowler==='function')openBowler();return}}
function __addStrikeSwitch(){if(document.getElementById('o6SwitchStrike'))return;const host=document.getElementById('striker');if(!host||!host.parentElement)return;const b=document.createElement('button');b.id='o6SwitchStrike';b.type='button';b.className='btn';b.textContent='🔄 WISSEL STRIKE';b.style.marginTop='10px';b.onclick=function(){if(!state?.started||!state.striker||!state.nonStriker)return;if(state.pendingNewBatter||state.pendingDismissal||state.pendingFielder||state.pendingCoachThrow||state.pairLimitAccepted||!state.bowler)return;if(typeof snapshot==='function')snapshot();[state.striker,state.nonStriker]=[state.nonStriker,state.striker];render()};host.parentElement.appendChild(b)}
const __openBowler=typeof openBowler==='function'?openBowler:null;if(__openBowler){openBowler=function(){if(state)state.bowler=null;__openBowler();render()}}
function __guardBall(ev){const p=document.getElementById('bowlerPanel');if(p&&!p.classList.contains('hidden')){ev.preventDefault();ev.stopImmediatePropagation()}}document.getElementById('normalButtons')?.addEventListener('click',__guardBall,true);document.getElementById('coachPanel')?.addEventListener('click',__guardBall,true);
function __runoutBatterChooser(){let m=document.getElementById('o6RunoutChooser');if(m)m.remove();m=document.createElement('div');m.id='o6RunoutChooser';m.className='modal';const box=document.createElement('div');box.className='modalbox';box.innerHTML='<h2>🏃 RUN OUT</h2><div class="banner blue">Watter kolwer is uit?</div><div id="o6RunoutChoices" class="choiceGrid"></div><button id="o6RunoutCancel" class="btn" type="button" style="margin-top:10px;width:100%">KANSELLEER</button>';m.appendChild(box);document.body.appendChild(m);const c=document.getElementById('o6RunoutChoices');[state.striker,state.nonStriker].filter(Boolean).forEach(name=>{const b=document.createElement('button');b.type='button';b.className='btn choice';b.textContent=name;b.onclick=function(){state.pendingRunOutBatter=name;m.remove();openFielderChooser('RUN_OUT');render()};c.appendChild(b)});document.getElementById('o6RunoutCancel').onclick=function(){m.remove();state.pendingDismissal=false;state.dismissalType=null;render()}}
dismissalSelected=function(kind){state.pendingDismissal=false;state.dismissalType=kind;document.getElementById('wicketPanel')?.classList.add('hidden');if(kind==='RUN_OUT'&&MATCH.group!=='U/8'){__runoutBatterChooser();return}if(kind==='CAUGHT'||kind==='RUN_OUT'){openFielderChooser(kind)}else{const fromCoach=state.pendingCoachWicket;state.pendingCoachWicket=false;legal(0,fromCoach?'COACH WICKET':'WICKET',true,kind)}};
const __originalConfirmFielder=typeof confirmFielder==='function'?confirmFielder:null;
confirmFielder=function(){if(!state.selectedFielder||!state.dismissalType)return;if(state.dismissalType==='RUN_OUT'&&MATCH.group!=='U/8'){snapshot();const f=state.bats[state.selectedFielder];if(f)f.runOuts=(f.runOuts||0)+1;const targetName=state.pendingRunOutBatter||state.striker;const target=state.bats[targetName];if(target){target.dismissals=(target.dismissals||0)+1;target.balls++;state.pairFaceBalls[targetName]=(state.pairFaceBalls[targetName]||0)+1}const t=team(),bo=bowler();t.legalBalls++;if(bo){bo.legalBalls++;bo.dots++;}state.pairBalls++;t.wickets++;if(bo)bo.wickets++;state.pendingFielder=false;state.pendingCoachWicket=false;state.pendingRunOutBatter=null;state.dismissalType=null;state.selectedFielder=null;document.getElementById('fielderPanel')?.classList.add('hidden');state.log.push({inn:state.innings,ball:t.legalBalls,over:overs(t.legalBalls-1),face:targetName,runs:0,kind:'WICKET',wicket:true,dismissal:'RUN OUT'});afterLegal(true,targetName);render();return}if(__originalConfirmFielder)__originalConfirmFielder()};
const __reset=document.getElementById('reset');if(__reset)__reset.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();try{localStorage.removeItem('junior_krieket_v19_saved_'+__MID);localStorage.removeItem('junior_krieket_v19_presence_'+__MID)}catch(e){}window.location.reload()},true);
const __restore=typeof restore==='function'?restore:null;if(__restore)restore=function(){__restore();__syncUI()};
setTimeout(__addStrikeSwitch,100);
})();
</script>`;
  html = html.replace('</body>', injected + '</body>');
  return new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' } });
}
