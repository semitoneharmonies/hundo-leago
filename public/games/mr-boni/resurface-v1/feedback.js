/** One readable notice at a time; repeated collision events cannot spam it. */
export function createFeedback({now=()=>performance.now()}={}) {
  let active=null, sequence=0;
  const recent=new Map();
  const current=()=>{if(active&&now()>=active.until)active=null;return active;};
  return {
    show({title='Heads up',detail='',kind='info',key=title,priority=0,duration=3200,target=''}) {
      const time=now(), previous=current();
      if(previous&&previous.priority>priority)return null;
      if(time-(recent.get(key)??-Infinity)<1500)return null;
      for(const [id,at] of recent)if(time-at>10000)recent.delete(id);
      recent.set(key,time);
      active=Object.freeze({id:++sequence,title,detail,kind,key,priority,target,until:time+duration});
      return active;
    },
    current,
    clear(){active=null;recent.clear();},
  };
}
