/** Same-origin game messages only. Accounts and guest capabilities stay in the host page. */
export const PROTOCOL = 'mrboni-league-v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createCampaign({ host = window.parent, origin = window.location.origin, listen = window,
  newId = () => crypto.randomUUID(), onStart, onState = () => {}, onPause = () => {}, onFullscreen = () => {}, onSaved = () => {} }) {
  let requestId = null, activeRun = null, acceptedRequest = null, disposed = false;
  const send = message => { if (!disposed) host.postMessage({protocol:PROTOCOL,...message},origin); };
  function receive(event) {
    if (disposed || event.source !== host || event.origin !== origin) return;
    const message = event.data;
    if (!message || message.protocol !== PROTOCOL) return;
    if (message.type === 'hello') { send({type:'ready'}); }
    else if (message.type === 'start' && requestId && message.requestId === requestId && message.requestId !== acceptedRequest) {
      if (!message.run || !UUID.test(message.run.runId) || message.run.rulesetVersion !== 'resurface-v1') return;
      acceptedRequest=requestId; activeRun=message.run.runId; requestId=null;
      onStart(message.run);
    } else if (message.type === 'state' && typeof message.kind === 'string' && typeof message.message === 'string') {
      onState({kind:message.kind,message:message.message});
    } else if (message.type === 'error' && message.requestId === requestId && typeof message.message === 'string') {
      onState({kind:'start-error',message:message.message});
    } else if (message.type === 'pause') onPause();
    else if (message.type === 'fullscreen' && typeof message.active === 'boolean') onFullscreen(message.active);
    else if (message.type === 'saved' && message.runId === activeRun && message.result?.runId === activeRun) onSaved(message.result);
  }
  listen.addEventListener('message',receive);
  return Object.freeze({
    ready() { send({type:'ready'}); },
    start() { requestId ||= newId(); send({type:'start',requestId}); },
    checkpoint(commands) { if(activeRun)send({type:'checkpoint',runId:activeRun,commands}); },
    fullscreen(active) { send({type:'fullscreen',active}); },
    leaderboard() { send({type:'leaderboard'}); },
    dispose() { disposed=true;listen.removeEventListener('message',receive); },
  });
}
