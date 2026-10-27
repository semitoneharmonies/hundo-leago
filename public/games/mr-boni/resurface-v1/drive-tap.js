// Recognizes a touch tap followed by a second press, which may stay held to drive.
// The caller owns pointer capture, driving and the resulting pump change.
export function createDriveTapGesture(){
 const held=new Set();
 let press=null,previousTap=null;
 const point=e=>({x:e.clientX,y:e.clientY});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const valid=e=>e.pointerType==='touch'&&Number.isFinite(e.pointerId)&&Number.isFinite(e.timeStamp)&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY);
 function reset(){held.clear();press=null;previousTap=null;}
 function down(e){
  if(!valid(e)||held.has(e.pointerId))return false;
  held.add(e.pointerId);
  if(held.size>1){press=null;previousTap=null;return false;}
  const start=point(e),gap=previousTap?e.timeStamp-previousTap.at:Infinity;
  const matched=Boolean(previousTap&&gap>=0&&gap<=330&&distance(start,previousTap)<=40);
  previousTap=null;
  press={id:e.pointerId,at:e.timeStamp,...start,moved:false,consumed:matched};
  return matched;
 }
 function move(e){
  if(!valid(e)||press?.id!==e.pointerId)return;
  if(distance(point(e),press)>28)press.moved=true;
 }
 function up(e){
  if(e.pointerType!=='touch'||!held.delete(e.pointerId))return;
  if(press?.id!==e.pointerId)return;
  const completed=press;press=null;
  const duration=e.timeStamp-completed.at;
  if(valid(e)&&!held.size&&!completed.consumed&&!completed.moved&&duration>=0&&duration<=250&&distance(point(e),completed)<=28){
   previousTap={at:e.timeStamp,...point(e)};
  }else previousTap=null;
 }
 function cancel(pointerId){
  if(pointerId===undefined){reset();return;}
  // Browsers send lostpointercapture after pointerup: the completed tap must survive.
  if(!held.delete(pointerId))return;
  press=null;previousTap=null;
 }
 return {down,move,up,cancel,reset};
}
