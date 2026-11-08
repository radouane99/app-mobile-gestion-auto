(function(root){
'use strict';
const validId=s=>typeof s==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(s),text=s=>typeof s==='string'&&s.length<=1000;
function next(d,s){let due=s.startDate;for(let i=0;i<2400;i++){const period=due.slice(0,7);if(!d.entries.some(e=>['subscription','parking'].includes(e.type)&&e.subscriptionId===s.id&&e.subscriptionPeriod===period))return {date:due,period};due=root.AutoLogic.addMonths(s.startDate,i+1);}return null;}
function valid(d){
if(typeof equipmentDetailsValid==='function'&&!equipmentDetailsValid(d))return false;
for(const key of ['projects','subscriptions'])if(d[key]!==undefined&&(!Array.isArray(d[key])||d[key].length>100||new Set(d[key].map(x=>x?.id)).size!==d[key].length))return false;
if(!(d.projects||[]).every(p=>p&&validId(p.id)&&text(p.title)&&text(p.note)&&['repair','brakes','electrical','accessory'].includes(p.type)&&['planned','cancelled'].includes(p.status)&&Number.isFinite(p.budget)&&p.budget>=0))return false;
if(!(d.subscriptions||[]).every(s=>s&&validId(s.id)&&text(s.title)&&Number.isFinite(s.amount)&&s.amount>0&&root.AutoLogic.isDate(s.startDate)&&typeof s.enabled==='boolean'&&(s.kind===undefined||['subscription','parking'].includes(s.kind))))return false;
const seen=new Set();return d.entries.every(e=>{if(e.projectId!==undefined&&!validId(e.projectId))return false;if(e.subscriptionId!==undefined){const plan=(d.subscriptions||[]).find(s=>s.id===e.subscriptionId);if(plan&&e.type!==(plan.kind==='parking'?'parking':'subscription'))return false;const key=e.subscriptionId+':'+e.subscriptionPeriod;if(!['subscription','parking'].includes(e.type)||!validId(e.subscriptionId)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(e.subscriptionPeriod)||seen.has(key))return false;seen.add(key);}return true;});
}
const api={next,valid};root.EquipmentLogic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
