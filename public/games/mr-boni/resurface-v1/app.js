import {CONFIG,createGame,step,getStats,setPump,beginInspection,cancelAction,advanceLevel} from './engine.js';
import {ArenaRenderer} from './renderer.js';
import {createSoundEffects} from './audio.js';
import {createFeedback} from './feedback.js';
import {createDriveTapGesture} from './drive-tap.js';
import {createRecorder} from './replay.js';
import {createCampaign} from './campaign.js';
const $=id=>document.getElementById(id);
if(navigator.maxTouchPoints>0)document.body.classList.add('touch-device');
let game=createGame(),stats=getStats(game),finishMs=0,lastDumpEvent=0,lastExitBlock=0;
const recorder=createRecorder();
let hostFullscreen=false,starting=false,recordingFailed=false;
const campaign=createCampaign({onStart:initializeRun,onState:updateSaveState,onPause:()=>{if(game.status==='running'&&!activeDialog())showDialog('pause');},onFullscreen:active=>{hostFullscreen=active;updateFullscreen();},onSaved:result=>updateSaveState({kind:'saved',message:'Level '+result.highestLevelCompleted+' saved · '+formatTime(result.cumulativeTimeMs/1000)})});
const snowNames=['Light snow','Medium snow','Heavy snow'];
let highlighted=false,lastFrame=performance.now(),accumulator=0,lastHud=0,statsVersion='',lastNoticeId=0,lastOverloaded=false;
const sound=createSoundEffects(),feedback=createFeedback();
const held=new Set(),touchHeld=new Map(),touchButtons=new Map();
const driveTap=createDriveTapGesture();
const renderer=new ArenaRenderer($('arena'));
new ResizeObserver(()=>renderer.resize()).observe($('arena'));
const dialogs=[...document.querySelectorAll('dialog')];
const formatTime=seconds=>{const v=Math.max(0,Math.floor(seconds*100));return `${String(Math.floor(v/6000)).padStart(2,'0')}:${String(Math.floor(v/100)%60).padStart(2,'0')}.${String(v%100).padStart(2,'0')}`;};
const activeDialog=()=>dialogs.find(d=>d.open);
let fullscreenPending=false;
const fullscreenElement=()=>hostFullscreen;
function updateFullscreen(){const active=Boolean(fullscreenElement());$('fullscreen-button').setAttribute('aria-pressed',String(active));$('fullscreen-button').setAttribute('aria-label',active?'Exit full screen':'Enter full screen');$('fullscreen-button').title=active?'Exit full screen (F)':'Full screen (F)';renderer.resize();}
function toggleFullscreen(){clearInput();campaign.fullscreen(!hostFullscreen);}
document.addEventListener('fullscreenchange',updateFullscreen);document.addEventListener('webkitfullscreenchange',updateFullscreen);
window.visualViewport?.addEventListener('resize',()=>renderer.resize());
function updateSaveState(state){
 document.querySelectorAll('[data-save-status]').forEach(el=>{el.textContent=state.message;el.classList.toggle('error',state.kind.endsWith('error'));});
 $('save-status').textContent=state.message;
 if(state.kind==='start-error'){starting=false;document.querySelectorAll('[data-run-start]').forEach(b=>b.disabled=false);}
 if(state.kind==='save-error')toast('Your completed levels are kept for retry. Exit full screen to retry saving.',5000,{title:'Score not saved yet',kind:'warning',priority:4});
}
function record(action){
 if(recordingFailed)return false;
 try{action();return true;}catch{recordingFailed=true;clearInput();game.vehicle.speed=0;game.status='paused';sound.stop();
 toast('Start a new run. Your previously saved levels are still on the board.',6000,{title:'This run reached its recording limit',kind:'warning',priority:4});
 $('limit-reached').showModal();return false;}
}
function saveCheckpoint(){if(!recordingFailed)record(()=>campaign.checkpoint(recorder.snapshot()));}
function showLeaderboard(){if(game.status==='running')showDialog('pause');campaign.leaderboard();}
function toast(text,duration=3200,options={}){
 const notice=feedback.show({detail:text,key:text,duration,...options});
 if(notice&&options.cue)sound.play(options.cue);
 renderFeedback();
}
function renderFeedback(){
 const notice=feedback.current(),el=$('toast');
 el.classList.toggle('visible',Boolean(notice));
 document.body.dataset.noticeTarget=notice?.target||'';
 if(!notice||notice.id===lastNoticeId)return;
 lastNoticeId=notice.id;el.dataset.kind=notice.kind;
 $('toast-title').textContent=notice.title;$('toast-detail').textContent=notice.detail;
 $('toast-icon').textContent=notice.kind==='success'?'✓':notice.kind==='warning'?'!':'i';
}
function updateSound(){
 const state=sound.getState();
 $('sound-button').setAttribute('aria-pressed',String(state.enabled));
 $('sound-button').setAttribute('aria-label',state.enabled?'Mute sound effects':'Enable sound effects');
 $('sound-button').title=(state.enabled?'Mute':'Enable')+' sound effects (M)';
 $('sound-button').dataset.enabled=String(state.enabled);
 $('sound-label').textContent=!state.supported?'Sound unavailable':state.enabled?'Sound on':'Sound off';
 document.querySelectorAll('[data-sound-toggle]').forEach(button=>{button.textContent=state.enabled?'Sound on · mute':'Sound off · enable';button.setAttribute('aria-pressed',String(state.enabled));});
 document.querySelectorAll('[data-sound-test]').forEach(button=>{button.textContent=state.enabled?'Test sound':'Enable & test sound';button.disabled=!state.supported;});
}
function toggleSound(){sound.toggle();if(sound.getState().enabled)void sound.playFromGesture('preview').then(updateSound);updateSound();}
async function testSound(){
 if(!sound.getState().enabled)sound.setEnabled(true);
 updateSound();
 const played=await sound.playFromGesture('preview');
 updateSound();
 document.querySelectorAll('[data-sound-message]').forEach(message=>{message.dataset.error=String(!played);message.textContent=played?'Chime sent. If silent, check your tab and device volume.':'Sound could not start. Try again or use another browser.';});
}
function clearInput(){held.clear();touchHeld.clear();touchButtons.clear();driveTap.reset();document.querySelectorAll('[data-drive]').forEach(b=>b.classList.remove('pressed'));}
function stop(){if(game.status==='running')record(()=>recorder.recordAction([3]));clearInput();game.vehicle.speed=0;cancelAction(game);sound.stop();}
function showDialog(id){stop();if(game.status==='running')game.status='paused';$(id).showModal();}
function closeDialog(id){void sound.unlock();$(id).close();if(game.status==='paused'&&!activeDialog())game.status='running';$('arena').focus({preventScroll:true});}
function beginRun(){
 if(starting)return;starting=true;document.querySelectorAll('[data-run-start]').forEach(b=>b.disabled=true);
 updateSaveState({kind:'starting',message:'Starting your run…'});campaign.start();
}
function initializeRun(){
 starting=false;recordingFailed=false;recorder.reset();document.querySelectorAll('[data-run-start]').forEach(b=>b.disabled=false);
 sound.stop();void sound.unlock();feedback.clear();lastNoticeId=0;lastOverloaded=false;
 dialogs.forEach(d=>d.close());game=createGame();stats=getStats(game);game.status='ready';game.message='Level 1 · A light dusting. Finish this rink to move on.';finishMs=0;lastDumpEvent=0;lastExitBlock=0;highlighted=false;statsVersion='';accumulator=0;lastFrame=performance.now();setPump(game,1);clearInput();$('highlight-button').setAttribute('aria-pressed','false');$('save-score').disabled=false;$('save-status').textContent='';$('save-status').className='';
 renderer.showDumpIntro=true;document.body.classList.add('show-dump-intro');renderer.resize();
 $('dump-intro').showModal();$('start-cleaning').focus({preventScroll:true});updateHud();
}
function startCleaning(){
 if(!$('dump-intro').open)return;
 $('dump-intro').close();renderer.showDumpIntro=false;document.body.classList.remove('show-dump-intro');renderer.resize();
 game.status='running';clearInput();accumulator=0;lastFrame=performance.now();
 void sound.playFromGesture('preview').then(updateSound);$('arena').focus({preventScroll:true});
 toast('Level 1 · Light snow. One rink at a time.');updateHud();
}
function levelComplete(){
 if($('level-finished').open)return;stop();saveCheckpoint();stats=getStats(game);
 sound.play('levelComplete');
 $('level-finish-title').textContent='Level '+game.level+' complete!';
 $('level-finish-time').textContent=formatTime(game.levelTimes[game.level-1]);
 $('level-total-time').textContent='Total run time: '+formatTime(game.elapsed);
 $('next-level-description').textContent='Next: level '+(game.level+1)+' · '+snowNames[game.level]+'. Your tank starts empty.';
 $('next-level').innerHTML='Start level '+(game.level+1)+' <kbd>ENTER</kbd>';
 $('level-finished').showModal();$('next-level').focus();updateHud();
}
function nextLevel(){
 if(game.status!=='levelComplete'||!record(()=>recorder.recordAction([4])))return;
 if(!advanceLevel(game))return;
 void sound.unlock();sound.stop();feedback.clear();lastOverloaded=false;
 lastDumpEvent=game.dumpEvents;lastExitBlock=game.exitBlockedEvents;
 $('level-finished').close();clearInput();statsVersion='';stats=getStats(game);accumulator=0;lastFrame=performance.now();
 highlighted=false;renderer.showMissed=false;$('highlight-button').setAttribute('aria-pressed','false');
 $('arena').focus({preventScroll:true});toast('Level '+game.level+' · '+snowNames[game.level-1]);updateHud();
}
function pump(level){if(game.status!=='running')return;const previous=game.pump;const next=level>0&&game.pump===level?0:level;if(!record(()=>recorder.recordAction([1,next*2])))return;setPump(game,next);if(game.status==='running'&&previous!==game.pump)sound.play('pump',{level:game.pump});updateHud();}
function cycleDrivePump(){pump(game.pump===1?.5:game.pump===.5?0:1);}
function inspect(){if(game.status!=='running'||!record(()=>recorder.recordAction([2])))return;const ok=beginInspection(game);if(!ok)toast(Math.abs(game.vehicle.speed)>.1?'Stop completely before checking the tank.':game.message||'Stop, then check the tank.');}
function highlight(){highlighted=!highlighted;renderer.showMissed=highlighted;$('highlight-button').setAttribute('aria-pressed',String(highlighted));}
function pause(){if($('pause').open)closeDialog('pause');else if(game.status==='running')showDialog('pause');}
function restart(){if(game.status==='ready')return;showDialog('restart');$('confirm-restart').focus();}
function updateHud(){
 document.querySelector('.snow-panel').classList.toggle('tank-full',game.overloaded);
 $('clock-label').textContent=game.clockStarted?'TOTAL TIME':'ENTER ICE TO START';
 document.body.classList.toggle('show-missed',highlighted);
 $('highlight-button').firstChild.textContent=highlighted?'Hide missed spots ':'Show missed spots ';
 const pct=Math.min(100,Math.round(game.lastChecked/CONFIG.tankCapacity*100));
 $('snow-reading').textContent=pct+'%';$('snow-fill').style.width=pct+'%';$('snow-meter').setAttribute('aria-valuenow',String(pct));
 $('checked-label').textContent=game.lastChecked===0?'Last checked: empty · stop + E to inspect':`Last checked: ${pct}% · stop + E to inspect`;
 document.querySelectorAll('[data-pump]').forEach(b=>{const selected=Number(b.dataset.pump)===game.pump;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 const drivePump='PUMP '+(game.pump===1?'FULL':game.pump===.5?'HALF':'OFF');
 if($('drive-pump-label').textContent!==drivePump)$('drive-pump-label').textContent=drivePump;
 const current=stats.active;
 $('level-badge').textContent='LEVEL '+game.level+' / 3 · '+(current.complete?100:Math.floor(current.percent))+'%';$('level-title').textContent=snowNames[game.level-1];
 $('overall-percent').textContent=(current.complete?100:Math.floor(current.percent))+'%';
 const card=$('current-rink');card.classList.toggle('done',current.complete);card.querySelector('.progress-track span').style.width=current.percent+'%';
 document.querySelectorAll('[data-level]').forEach(el=>{const level=Number(el.dataset.level),done=game.levelTimes.length>=level;el.classList.toggle('done',done);el.classList.toggle('active',level===game.level);el.setAttribute('aria-label','Level '+level+': '+(done?'complete':level===game.level?'current':'up next'));el.textContent=done?'✓ '+level:String(level);});
 $('level-detail').textContent=current.complete?'Zero missed spots · zero pooling':`${Math.ceil(current.snow/current.total*100)}% snow remaining · ${current.dry ? "Dry spots to finish" : "No dry spots"} · ${current.wet ? "Pools to fix" : "No pools"}`;
 $('condition-note').textContent=current.complete?'Perfect ice. Level complete.':game.level===3?'Finish this rink to complete your run.':'Finish this rink to unlock level '+(game.level+1)+'.';
 $('action-progress').hidden=!game.action;
 if(game.action){$('action-label').textContent=game.action==='inspect'?'Checking snow tank…':'Unloading snow…';$('action-bar').value=game.action==='inspect'?game.inspection:game.dumping;}
}
function refreshStats(){const version=game.level+':'+game.levelTimes.length+':'+game.dumpEvents+':'+game.rinks.map(r=>r.version).join(',');if(version!==statsVersion){stats=getStats(game);statsVersion=version;}}
function finish(){if(finishMs)return;finishMs=Math.round(game.elapsed*1000);stop();saveCheckpoint();sound.play('runComplete');game.status='complete';stats=getStats(game);$('finish-time').textContent=formatTime(game.elapsed);$('level-splits').textContent=game.levelTimes.map((time,i)=>'Level '+(i+1)+': '+formatTime(time)).join(' · ');$('finished').showModal();$('save-score').focus();updateHud();}
function inputState(){const values=new Set([...held,...touchHeld.values()]);return {throttle:(values.has('ArrowUp')?1:0)-(values.has('ArrowDown')?1:0),steer:(values.has('ArrowRight')?1:0)-(values.has('ArrowLeft')?1:0),brake:values.has('Space')};}
function frame(now){
 const delta=Math.min((now-lastFrame)/1000,.15);lastFrame=now;
 if(game.status==='running'){
  const wasInspecting=game.action==='inspect';
  accumulator+=delta;const input=inputState();while(accumulator>=1/60&&game.status==='running'){if(!record(()=>recorder.recordStep(input)))break;step(game,input,1/60);accumulator-=1/60;}
  if(wasInspecting&&game.action===null&&game.inspection===1)toast(Math.round(game.lastChecked/CONFIG.tankCapacity*100)+'% full.',1800,{title:'Tank checked',kind:'success',priority:1,target:'tank',cue:'inspect'});
  if(game.overloaded&&!lastOverloaded)toast('Head to the dump. Driving spills snow.',4200,{title:'Tank full',kind:'warning',priority:2,key:'tank-full',target:'tank',cue:'warning'});
  lastOverloaded=game.overloaded;
  if(game.dumpEvents>lastDumpEvent){lastDumpEvent=game.dumpEvents;toast('Ready for another pass.',1000,{title:'Tank emptied',kind:'success',priority:4,key:'dump',target:'tank',cue:'dump'});}
  if(game.exitBlockedEvents>lastExitBlock){lastExitBlock=game.exitBlockedEvents;toast('Press 1 or tap OFF to leave the ice.',3200,{title:'Turn the pump OFF',kind:'warning',priority:3,key:'gate',target:'pump',cue:'warning'});}
  refreshStats();if(game.status==='levelComplete')levelComplete();else if(game.status==='complete')finish();
 }else accumulator=0;
 if(now-lastHud>100){$('clock').textContent=formatTime(game.elapsed);updateHud();lastHud=now;}
 renderer.showMissed=highlighted;renderer.render(game,stats);
 renderFeedback();
 requestAnimationFrame(frame);
}
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea')&&e.code!=='Escape')return;
 if(e.code==='KeyM'){e.preventDefault();if(!e.repeat)toggleSound();return;}
 if(game.status==='running')void sound.unlock();
 if(e.code==='KeyF'){e.preventDefault();if(!e.repeat)toggleFullscreen();return;}
 const modal=activeDialog();
 if(modal){
  if(modal.id==='dump-intro'){if(e.code==='Enter'||e.code==='Escape'){e.preventDefault();if(!e.repeat)startCleaning();}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();return;}
  if(e.code==='Escape'){e.preventDefault();if(modal.id==='welcome'||modal.id==='finished'||modal.id==='level-finished'||modal.id==='limit-reached')return;closeDialog(modal.id);}
  else if(e.code==='Enter'&&modal.id==='welcome'){e.preventDefault();beginRun();}
  else if(e.code==='Enter'&&modal.id==='level-finished'){e.preventDefault();if(!e.repeat)nextLevel();}
  else if(e.code==='Enter'&&modal.id==='restart'){e.preventDefault();beginRun();}
  else if(e.code==='KeyP'&&modal.id==='pause'){e.preventDefault();closeDialog('pause');}
  else if(e.code==='KeyR'&&modal.id==='finished'){e.preventDefault();beginRun();}
  return;
 }
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();held.add(e.code);return;}
 if(e.repeat)return;
 if(e.code==='Digit1')pump(0);else if(e.code==='Digit2')pump(.5);else if(e.code==='Digit3')pump(1);
 else if(e.code==='KeyE')inspect();else if(e.code==='KeyP'||e.code==='Escape')pause();else if(e.code==='KeyR')restart();else if(e.code==='KeyV')highlight();else if(e.code==='KeyH')showDialog('help');else if(e.code==='KeyL')showLeaderboard();
});
document.addEventListener('keyup',e=>held.delete(e.code));
window.addEventListener('blur',()=>{sound.stop();clearInput();if(!fullscreenPending&&game.status==='running'&&!activeDialog())showDialog('pause');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){sound.stop();clearInput();if(game.status==='running'&&!activeDialog())showDialog('pause');}});
document.addEventListener('pointerdown',()=>{if(game.status==='running')void sound.unlock();});
document.querySelectorAll('[data-pump]').forEach(b=>b.addEventListener('click',()=>pump(Number(b.dataset.pump))));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
dialogs.forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();if(d.id==='dump-intro')startCleaning();else if(d.id!=='welcome'&&d.id!=='finished'&&d.id!=='level-finished'&&d.id!=='limit-reached')closeDialog(d.id);}));
$('start-cleaning').onclick=startCleaning;
$('fullscreen-button').onclick=toggleFullscreen;
$('sound-button').onclick=toggleSound;
document.querySelectorAll('[data-sound-toggle]').forEach(button=>button.addEventListener('click',toggleSound));
document.querySelectorAll('[data-sound-test]').forEach(button=>button.addEventListener('click',testSound));
$('start-fullscreen').onclick=()=>{toggleFullscreen();beginRun();};
$('next-level').onclick=nextLevel;
$('welcome').addEventListener('submit',e=>{e.preventDefault();beginRun();});
$('inspect-button').onclick=inspect;$('highlight-button').onclick=highlight;$('pause-button').onclick=pause;$('restart-button').onclick=restart;$('confirm-restart').onclick=beginRun;$('play-again').onclick=beginRun;$('help-button').onclick=()=>showDialog('help');$('leaderboard-button').onclick=showLeaderboard;
const touchMap={forward:'ArrowUp',reverse:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',brake:'Space'};
document.querySelectorAll('[data-drive]').forEach(b=>{
 const isDrive=b.dataset.drive==='forward',direction=touchMap[b.dataset.drive];
 b.addEventListener('pointerdown',e=>{
  e.preventDefault();if(game.status!=='running'||activeDialog())return;
  b.setPointerCapture(e.pointerId);touchHeld.set(e.pointerId,direction);touchButtons.set(e.pointerId,b);b.classList.add('pressed');
  if(isDrive&&driveTap.down(e))cycleDrivePump();
 });
 if(isDrive)b.addEventListener('pointermove',e=>driveTap.move(e));
 const release=e=>{
  if(isDrive){if(e.type==='pointerup')driveTap.up(e);else driveTap.cancel(e.pointerId);}
  touchHeld.delete(e.pointerId);
  touchButtons.delete(e.pointerId);
  if(![...touchButtons.values()].includes(b))b.classList.remove('pressed');
 };
 b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);b.addEventListener('contextmenu',e=>e.preventDefault());
});
$('score-form').addEventListener('submit',e=>{e.preventDefault();showLeaderboard();});
$('limit-new-run').onclick=beginRun;
if(window.parent===window)window.location.replace('/games/mr-boni');
campaign.ready();updateFullscreen();updateSound();updateHud();$('welcome').showModal();$('welcome-title').focus({preventScroll:true});$('welcome').querySelector('.modal').scrollTop=0;$('welcome').scrollTop=0;requestAnimationFrame(frame);
// Read-only diagnostic summary: no mutation or win shortcut is exposed.
Object.defineProperty(window,'mrBoniSnapshot',{value:()=>({status:game.status,level:game.level,levelTimes:[...game.levelTimes],levelDumps:[...game.levelDumps],elapsed:game.elapsed,clockStarted:game.clockStarted,overloaded:game.overloaded,spillEvents:game.spillEvents,exitBlockedEvents:game.exitBlockedEvents,exitBlocked:game.exitBlocked,waterCarry:game.waterCarry,vehicle:{...game.vehicle},pump:game.pump,lastChecked:game.lastChecked,action:game.action,dumpEvents:game.dumpEvents,stats:getStats(game),highlighted,introShowing:renderer.showDumpIntro,camera:renderer.getCameraState(),audio:sound.getState()})});

