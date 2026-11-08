(function(root){'use strict';
const views=['front','rear','left','right','frontLeft','frontRight','rearLeft','rearRight','detail'];
const id=x=>typeof x==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(x),str=(x,max=2000)=>typeof x==='string'&&x.length<=max;
const money=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=10000000;
const stamp=x=>str(x,40)&&/^\d{4}-\d\d-\d\dT/.test(x)&&Number.isFinite(Date.parse(x));
const list=(x,max,fn)=>Array.isArray(x)&&x.length<=max&&x.every(fn);
const unique=a=>new Set(a).size===a.length;
function valid(d){if(!d||typeof d!=='object')return false;const date=x=>root.AutoLogic.isDate(x),optional=x=>x===''||date(x),photos=a=>list(a,30,p=>p&&/^[a-f0-9]{64}\.(jpg|pdf)$/.test(p.id)&&p.kind==='autre'&&views.includes(p.view)&&stamp(p.addedAt));
 if(d.roadCases!==undefined&&(!list(d.roadCases,1000,c=>c&&id(c.id)&&['fine','tow','accident','damage'].includes(c.type)&&str(c.title,150)&&c.title.trim()&&date(c.date)&&optional(c.lastSeen)&&(!c.lastSeen||c.lastSeen<=c.date)&&optional(c.due)&&['open','paid','disputed','closed'].includes(c.status)&&str(c.location,200)&&str(c.contact,200)&&str(c.reference,200)&&str(c.note)&&stamp(c.createdAt)&&stamp(c.updatedAt)&&
 (c.amountDue===null||money(c.amountDue))&&(c.expectedRefund===null||money(c.expectedRefund))&&views.includes(c.area)&&str(c.beforeId,100)&&str(c.afterId,100)&&photos(c.photos)&&list(c.entryIds,200,id)&&unique(c.entryIds)&&list(c.refunds,100,r=>r&&id(r.id)&&date(r.date)&&money(r.amount)&&r.amount>0&&str(r.note,500)&&stamp(r.addedAt))&&unique(c.refunds.map(r=>r.id)))||!unique(d.roadCases.map(c=>c.id))||!unique(d.roadCases.flatMap(c=>c.entryIds))))return false;
 if(d.conditionSessions!==undefined&&(!list(d.conditionSessions,1000,s=>s&&id(s.id)&&date(s.capturedDate)&&stamp(s.addedAt)&&str(s.location,200)&&str(s.note)&&str(s.caseId,100)&&(s.km===null||Number.isInteger(s.km)&&s.km>=0&&s.km<=3000000)&&photos(s.photos)&&s.photos.every(p=>p.id.endsWith('.jpg')))||!unique(d.conditionSessions.map(s=>s.id))))return false;
 return true;
}
function totals(d,c){const entries=d.entries.filter(e=>c.entryIds.includes(e.id)),paid=entries.reduce((a,e)=>a+e.cost,0),received=c.refunds.reduce((a,r)=>a+r.amount,0);return {entries,paid,received,net:paid-received,pending:c.amountDue===null?null:Math.max(0,c.amountDue-paid),missing:c.entryIds.filter(id=>!entries.some(e=>e.id===id)).length};}
function refunds(d,period){return (d.roadCases||[]).flatMap(c=>c.refunds.filter(r=>r.date.startsWith(period)).map(r=>({...r,caseId:c.id,title:c.title})));}
root.RoadLogic={views,valid,totals,refunds};if(typeof module!=='undefined')module.exports=root.RoadLogic;
})(typeof window!=='undefined'?window:globalThis);
