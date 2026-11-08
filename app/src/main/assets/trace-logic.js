(function(root){
'use strict';
const categories=['oil','tires','repair','brakes','battery','distribution','airfilter','fuelfilter','cabinfilter','electrical','accessory','alignment','rotation'],num=x=>Number.isFinite(x)&&x>=0,str=x=>typeof x==='string'&&x.length<=1000;
function key(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function valid(d){
if(d.usageDays!==undefined&&(!Array.isArray(d.usageDays)||d.usageDays.length>20000||new Set(d.usageDays.map(x=>x?.date)).size!==d.usageDays.length||!d.usageDays.every(x=>x&&root.AutoLogic.isDate(x.date)&&typeof x.used==='boolean')))return false;
return d.entries.every(e=>{const t=e.trace;if(t===undefined)return true;if(!t||!categories.includes(e.type)||!['garage','component','oldPart','newPart','reason','before','after','resultNote'].every(k=>str(t[k]))||!['unreviewed','resolved','returned','watch'].includes(t.result)||!['unknown','yes','no'].includes(t.onTime)||!Number.isInteger(t.quality)||t.quality<0||t.quality>5||!(t.reviewDate===''||root.AutoLogic.isDate(t.reviewDate))||!(t.checkedDate===''||root.AutoLogic.isDate(t.checkedDate))||typeof t.breakdown!=='boolean')return false;
if(![t.parts,t.labor,t.fees].every(num))return false;return !t.breakdown||Math.abs(Math.round((t.parts+t.labor+t.fees)*100)-Math.round(e.cost*100))<=1;});
}
function repeated(d){const map=new Map();for(const e of root.AutoLogic.sorted(d)){const c=e.trace?.component?.trim();if(!c)continue;const k=key(c);if(!map.has(k))map.set(k,[]);map.get(k).push(e);}return [...map.values()].filter(a=>a.length>1);}
function garages(d){const map=new Map();for(const e of d.entries){const name=e.trace?.garage?.trim();if(!name)continue;const k=key(name);if(!map.has(k))map.set(k,{name,entries:[],cost:0,ratings:[]});const g=map.get(k);g.entries.push(e);g.cost+=e.cost;if(e.trace.quality)g.ratings.push(e.trace.quality);}return [...map.values()];}
function oilGaps(d){const rows=root.AutoLogic.sorted(d).filter(e=>e.type==='oil');return rows.map((e,i)=>({entry:e,previous:rows[i-1]||null,km:i&&e.hasKm!==false&&rows[i-1].hasKm!==false?e.km-rows[i-1].km:null,days:i?Math.round((Date.parse(e.date)-Date.parse(rows[i-1].date))/86400000):null}));}
function usage(d,m){const rows=(d.usageDays||[]).filter(x=>x.date.startsWith(m)),used=rows.filter(x=>x.used).length,total=d.entries.filter(e=>e.date.startsWith(m)).reduce((s,e)=>s+e.cost,0);return {known:rows.length,used,total,perDay:used?total/used:null};}
const api={valid,categories,key,repeated,garages,oilGaps,usage};root.TraceLogic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
