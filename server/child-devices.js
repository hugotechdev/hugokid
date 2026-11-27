const { randomBytes, randomInt, createHash } = require('node:crypto');
const { db, q } = require('./db');
const A = require('./auth');
const { route, role, childFor, fail } = require('./router');
const digest = value => createHash('sha256').update(value).digest('hex');
db.exec(`CREATE TABLE IF NOT EXISTS child_devices (
 child INTEGER PRIMARY KEY, parent INTEGER NOT NULL, code TEXT UNIQUE, expires INTEGER DEFAULT 0,
 token TEXT UNIQUE, next_pin TEXT, bedtime TEXT, until_ms INTEGER DEFAULT 0, requested INTEGER DEFAULT 0,
 seen INTEGER DEFAULT 0, activity TEXT DEFAULT '{}')`);
function owned(u,p) {
  role(u,'parent');
  return childFor(u,p.id);
}
route('POST','/api/children/:id/device-code',(u,b,r,p)=>{
  const child=owned(u,p);
  q.run('DELETE FROM child_devices WHERE child=? AND parent<>?',child.id,u.id);
  const code=randomBytes(6).toString('hex').toUpperCase();
  const bedtime = b.bedtime === 'off' || /^([01]\d|2[0-3]):[0-5]\d$/.test(b.bedtime) ? b.bedtime : '20:30';
  q.run(`INSERT INTO child_devices(child,parent,code,expires,bedtime) VALUES(?,?,?,?,?)
    ON CONFLICT(child) DO UPDATE SET parent=excluded.parent,code=excluded.code,expires=excluded.expires,bedtime=excluded.bedtime`,
    child.id,u.id,digest(code),Date.now()+600000,bedtime);
  const pin=String(randomInt(100000,1000000));
  q.run('UPDATE child_devices SET next_pin=? WHERE child=?',digest('offline-'+pin),child.id);
  return {code,pin};
});
route('GET','/api/children/:id/device',(u,b,r,p)=>{
  const ch=owned(u,p);
  return q.get('SELECT seen, requested, until_ms, activity FROM child_devices WHERE child=? AND parent=?',ch.id,u.id)||{};
});
route('POST','/api/children/:id/device-time',(u,b,r,p)=>{
  const ch=owned(u,p);
  if (!Number.isInteger(b.minutes)||b.minutes<1||b.minutes>1440) fail(400,'Choose 1 to 1440 minutes.');
  if (!q.run('UPDATE child_devices SET until_ms=?, requested=0 WHERE child=? AND parent=? AND token IS NOT NULL',Date.now()+60000*b.minutes,ch.id,u.id).changes) fail(400,'Link the child device first.');
  return {ok:true};
});
route('DELETE','/api/children/:id/device',(u,b,r,p)=>{
  const ch=owned(u,p); q.run('DELETE FROM child_devices WHERE child=? AND parent=?',ch.id,u.id);return {ok:true};
});
const join = ' FROM child_devices d JOIN children c ON c.id=d.child AND c.parent_id=d.parent JOIN users u ON u.id=d.parent ';
const fields = 'SELECT d.*,c.name,c.birth,c.color,u.access_status ';
function publicChild(d){return {id:d.child,role:'child',name:d.name,access_status:d.access_status};}
route('POST','/api/device/link',(_,b)=>{
  const d=q.get(fields+join+'WHERE d.code=? AND d.expires>?',digest(String(b.code||'').trim().toUpperCase()),Date.now());
  if (!d || d.access_status!=='active') fail(400,'Invalid or expired link code.');
  const token='kid_'+randomBytes(32).toString('hex');
  q.run("UPDATE child_devices SET next_pin=NULL,code=NULL,token=?,seen=?,until_ms=0,requested=0,activity='{}' WHERE child=?",digest(token),Date.now(),d.child);
  return {token,offlinePin:d.next_pin,user:publicChild(d),profile:{id:'linked-'+d.child,serverId:d.child,name:d.name,birth:d.birth,color:d.color,religion:'values'},bedtime:d.bedtime};
});
function resolve(token){return q.get(fields+join+'WHERE d.token=?',digest(token));}
function authorize(req,path,method,b){
  const url=new URL(req.url,'http://x');
  const token=A.tokenOf(req) || (method==='FILE' ? url.searchParams.get('token') : null);
  if (!token?.startsWith('kid_')) return null;
  const d=resolve(token); if(!d) fail(401,'Link this device again.');
  if(path==='/api/me' && method==='GET') return {result:{user:publicChild(d)}};
  if(path==='/api/logout' && method==='POST'){q.run('DELETE FROM child_devices WHERE token=?',digest(token));return {result:{ok:true}};}
  if(d.access_status!=='active') {const {HttpError}=require('./router');const e=new HttpError(403,'Account access is paused.');e.accessStatus=d.access_status;throw e;}
  if(path==='/api/device/status' && method==='POST'){
    const activity={};
    for(const key of ['stars','learn','game','homework']) activity[key]=Math.max(0,Math.min(1e8,Math.floor(Number(b[key])||0)));
    q.run('UPDATE child_devices SET seen=?,activity=?,requested=CASE WHEN ? THEN 1 ELSE requested END WHERE child=?',Date.now(),JSON.stringify(activity),b.request===true?1:0,d.child);
    return {result:{until:d.until_ms,bedtime:d.bedtime}};
  }
  if (method==='UPLOAD' && Number(url.searchParams.get('child_id'))===d.child) return {parent:q.get('SELECT * FROM users WHERE id=?',d.parent)};
  if (method==='FILE'){
    const file=path.split('/').pop();
    const own=q.get('SELECT name FROM files WHERE name=? AND child_id=?',file,d.child);
    const attached=q.get(`SELECT h.id FROM homework h JOIN children c ON h.class_id=c.class_id, json_each(COALESCE(h.attachments,'[]')) a
      WHERE c.id=? AND json_extract(a.value,'$.file')=?`,d.child,file);
    if(own||attached)return {parent:q.get('SELECT * FROM users WHERE id=?',d.parent)};
  }
  if ((method==='GET' && path==='/api/children/'+d.child+'/homework') || (method==='POST' && path==='/api/children/'+d.child+'/submit')) return {parent:q.get('SELECT * FROM users WHERE id=?',d.parent)};
  fail(403,'This action requires a parent account.');
}
module.exports={authorize};
