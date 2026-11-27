function exitSetup(){
  Net.logout();
  HK.go('welcome',{}, {reset:true});
  return true;
}
const minutesField = '<label class="label">Extra minutes</label><input class="field" id="minutes" type="number" min="1" max="1440" value="30"><div class="chips">'+[15,30,60].map(n=>'<button class="chip" data-minutes="'+n+'">'+n+' min</button>').join('')+'</div>';
function bindMinutes(el){$$('[data-minutes]',el).forEach(b=>b.onclick=()=>$('#minutes',el).value=b.dataset.minutes);}
function minutesOf(el){
  const n=Number($('#minutes',el).value);
  if (!Number.isInteger(n)||n<1||n>1440) throw Error('Choose 1 to 1440 minutes.');
  return n;
}
HK.screens.deviceLink=el=>{
  el.innerHTML='<div class="topbar"><button class="icon-btn" id="back">'+icon('back')+'</button><h1>Child sign-in</h1></div><div class="scroll"><div class="card"><p>Ask your parent for the link code shown on their phone.</p><input class="field" id="code" maxlength="12" placeholder="Link code"><button class="btn block" id="connect">Link this device</button></div></div>';
  $('#back',el).onclick=()=>HK.back();
  $('#connect',el).onclick=async()=>{
    try {
      const r=await Net.post('/api/device/link',{code:$('#code',el).value});
      Net.acceptSession(r.token,r.user);
      const c=Store.child(r.profile.id)||{...r.profile,stars:0,coins:0};
      Store.saveChild(c); Store.setActive(c.id);
      Store.set('offlinePin',r.offlinePin); Store.set('remoteUntil',0);Store.set('night_'+c.id,0);
      Store.saveSettings({...Store.settings(),bedtime:r.bedtime});
      routeByRole(); syncDevice().catch(()=>{});
    } catch(e){toast(e.message);}
  };
};
HK.screens.devices=(el,{id})=>{
  const c=Store.child(id);
  if(Net.role()!=='parent'||!c)return HK.boot();
  el.innerHTML='<div class="topbar"><button class="icon-btn" id="back">'+icon('back')+'</button><h1>'+esc(c.name)+' · Child device</h1></div><div class="scroll"><div class="card"><p id="activity">Checking device…</p><button class="btn block" id="pair">Create link code</button><p id="code"></p>'+minutesField+'<button class="btn block" id="grant">Allow extra time tonight</button><button class="btn ghost" id="unlink">Unlink device</button></div></div>';
  $('#back',el).onclick=()=>HK.back(); bindMinutes(el);
  let path;
  async function init(){
    if(!c.serverId){const r=await Net.post('/api/children',{local_id:c.id,name:c.name,birth:c.birth,color:c.color});c.serverId=r.id; Store.saveChild(c);}
    path='/api/children/'+c.serverId+'/device';
    const d=await Net.get(path);
    const a=JSON.parse(d.activity||'{}');
    $('#activity',el).textContent=d.seen ? (d.requested?'Extra time requested. ':'')+'Last seen '+new Date(d.seen).toLocaleString()+'. Today: learning '+Math.round(a.learn/60||0)+' min, games '+Math.round(a.game/60||0)+' min. Homework completed: '+(a.homework||0)+'. Stars: '+(a.stars||0)+'.' : 'No linked device yet.';
  }
  const ready=init();ready.catch(e=>toast(e.message));
  $('#pair',el).onclick=async()=>{try{await ready; const r=await Net.post(path+'-code',{bedtime:Store.settings().bedtime});$('#code',el).textContent='Link code: '+r.code+' (10 minutes). Your private offline approval PIN: '+r.pin+'. Keep this PIN with the parent.';}catch(e){toast(e.message);}};
  $('#grant',el).onclick=async()=>{try{await ready;await Net.post(path+'-time',{minutes:minutesOf(el)});toast('Time approved. The child device will update when connected.');await init();}catch(e){toast(e.message);}};
  $('#unlink',el).onclick=()=>confirmBox(el,'Unlink child device?','It will sign out when it next connects.','Unlink',async()=>{try{await ready;await Net.del(path);HK.render();}catch(e){toast(e.message);}});
  const timer=setInterval(()=>{if(path)init().catch(()=>{});},15000);
  return ()=>clearInterval(timer);
};
async function syncDevice(request=false){
  if(Net.role()!=='child'||Net.accessScreen())return;
  const token=Net.token(),c=Store.active();if(!c)return;
  const work=await HWDB.byChild(c.id).catch(()=>[]);
  if(token!==Net.token())return;
  const d=await Net.post('/api/device/status',{...Store.usage(c.id),stars:c.stars,request,homework:work.filter(h=>['approved','submitted'].includes(h.status)).length});
  if(token!==Net.token())return;
  Store.set('remoteUntil',d.until);
  if(Store.settings().bedtime!==d.bedtime)Store.saveSettings({...Store.settings(),bedtime:d.bedtime});
  if(HK.stack[HK.stack.length - 1]?.name==='sleep'&&!HK.isBedtime()) HK.toChild();
}
function bindNightControls(el){
  const button=$('#par',el);
  button.textContent='Parent approval';
  if(Net.role()==='child'){
    const ask=document.createElement('button');ask.className='btn';ask.textContent='Ask for more time';button.before(ask);
    ask.onclick=()=>syncDevice(true).then(()=>toast('Request sent to your parent.')).catch(e=>toast(e.message));
  }
  button.onclick=()=>{
    const box=modal(el,{title:'Allow extra time tonight',html:'<label class="label">Parent PIN</label><input type="password" class="field" inputmode="numeric" id="night-pin">'+minutesField,buttons:[{label:'Allow',keepOpen:true,onClick:async o=>{
      try{
        const n=minutesOf(o),pin=$('#night-pin',o).value;
        const attempts=Store.get('night_attempts',{}); if(attempts.until>Date.now())throw Error('Try again in five minutes.');
        let valid;
        if(Net.role()==='child'){
          const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('offline-'+pin));
          valid=Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')===Store.get('offlinePin',null);
        }else valid=(await hashPin(pin))===Store.parent()?.pinHash;
        if(!valid){const count=(attempts.count||0)+1;Store.set('night_attempts',count>=5?{until:Date.now()+300000}:{count});throw Error('Incorrect parent PIN.');}
        Store.set('night_attempts',{});Store.set('night_'+Store.activeId(),Date.now()+n*60000);o.remove();HK.toChild();
      }catch(e){toast(e.message);}
    }},{label:'Cancel',cls:'ghost'}]});
    bindMinutes(box);
  };
}
function enforceNight(){
  const screen=HK.stack[HK.stack.length - 1]?.name;
  if(!screen||Net.accessScreen()||!['parent','child'].includes(Net.role())||!Store.active())return;
  if(ADULT_SCREENS.includes(screen)||['pin','devices','terms','pickChild','welcome','acctAuth','deviceLink','sleep'].includes(screen))return;
  if(HK.isBedtime())HK.go('sleep',{}, {reset:true});
}
setInterval(enforceNight,1000);
setInterval(()=>{if(!document.hidden)syncDevice().catch(()=>{});},15000);
window.addEventListener('online',()=>syncDevice().catch(()=>{}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){enforceNight();syncDevice().catch(()=>{});}});
