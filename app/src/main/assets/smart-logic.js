(function(root){'use strict';
 const number=s=>{let v=String(s).trim().replace(/[\s\u00a0\u202f]/g,'');if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');const n=Number(v);return Number.isFinite(n)?n:null;};
 function parseOcr(text,kind){
  const raw=String(text),s=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(),out={};
  const numeric='([0-9]+(?:[ .][0-9]{3})*(?:[,.][0-9]{1,3})?)';
  const pick=(patterns,min,max,input=s)=>{for(const p of patterns){const match=input.match(new RegExp(p,'m'));if(match){const v=number(match[1]);if(v!==null&&v>=min&&v<=max)return v;}}return null;};
  if(kind==='compteur'){
   let km=pick(['(?:ODO(?:METER)?|COMPTEUR|KILOMETRAGE|TOTAL KM)\\s*[:=]?\\s*'+numeric,numeric+'\\s*KM\\b'],0,3000000);const single=s.trim().replace(/\s/g,'');if(km===null&&/^\d{3,7}$/.test(single)&&Number(single)<=3000000)km=Number(single);if(km!==null&&Number.isInteger(km))out.km={value:km,source:'lu - compteur à vérifier'};
  }else{
   const liters=pick(['(?:VOLUME|LITRES?|QUANTITE)\\s*[:=]?\\s*'+numeric,numeric+'\\s*(?:LITRES?|L)\\b'],0.01,500);
   const costText=s.split('\n').filter(line=>!/(?:PRIX\s*(?:\/\s*L|UNITAIRE|PAR LITRE|AU LITRE)|\bP[./ ]?U[.]?)/.test(line)).join('\n');
   const cost=pick(['(?:TOTAL(?: TTC)?|MONTANT|A PAYER|TTC)\\s*[:=]?\\s*'+numeric,numeric+'\\s*(?:DH|MAD)\\s*$'],0.01,20000,costText);
   const price=pick(['PRIX\\s*[/]\\s*L\\s*[:=]?\\s*'+numeric,'(?:PRIX(?:\\s+(?:UNITAIRE|PAR LITRE|AU LITRE))?|P[./ ]?U[.]?)\\s*[:=]?\\s*'+numeric,numeric+'\\s*(?:DH|MAD)\\s*[/]\\s*L\\b'],0.1,100);
   if(liters!==null)out.liters={value:liters,source:'lu'};if(cost!==null)out.cost={value:cost,source:'lu'};if(price!==null)out.price={value:price,source:'lu'};
   if(liters!==null&&price!==null&&cost===null)out.cost={value:Math.round(liters*price*100)/100,source:'calculé (litres × prix/L)'};
   if(liters!==null&&price!==null&&cost!==null&&Math.abs(cost-liters*price)>Math.max(1,cost*.02))out.mismatch=true;
  }
  return out;
 }
 function fuelTrend(d){const cycles=root.AutoLogic.measuredCycles(d).map(c=>({id:c.end.id,from:c.start.date,to:c.end.date,liters:c.liters,km:c.km,rate:100*c.liters/c.km}));if(cycles.length<3||cycles.at(-1).km<100)return null;const last=cycles.at(-1),previous=cycles.slice(0,-1).filter(c=>c.km>=100).slice(-5);if(previous.length<2)return null;const baseline=100*previous.reduce((s,c)=>s+c.liters,0)/previous.reduce((s,c)=>s+c.km,0);if(baseline<=0)return null;const increase=100*(last.rate/baseline-1);return {last,baseline,increase,alert:increase>20};}

 function validExtras(d){if(typeof ParkingLogic!=='undefined'&&!ParkingLogic.valid(d))return false;if(typeof WorkflowLogic!=='undefined'&&!WorkflowLogic.valid(d))return false;if(typeof TraceLogic!=='undefined'&&!TraceLogic.valid(d))return false;if(typeof EquipmentLogic!=='undefined'&&!EquipmentLogic.valid(d))return false;if(typeof AutoCoach!=='undefined'&&!AutoCoach.validate(d))return false;const id=s=>typeof s==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(s),str=(s,n=2000)=>typeof s==='string'&&s.length<=n,photo=p=>p&&/^[a-f0-9]{64}\.jpg$/.test(p.id)&&['facture','compteur','pompe','autre'].includes(p.kind),date=s=>s===''||root.AutoLogic.isDate(s);
  const ocr=x=>x.ocrTexts===undefined||(Array.isArray(x.ocrTexts)&&x.ocrTexts.length<=6&&new Set(x.ocrTexts.map(p=>p?.photoId)).size===x.ocrTexts.length&&x.ocrTexts.every(p=>p&&/^[a-f0-9]{64}\.jpg$/.test(p.photoId)&&str(p.text,6000)&&(x.photos||[]).some(photo=>photo.id===p.photoId)));
  if(typeof partLifeValid==='function'&&Array.isArray(d.parts)&&!d.parts.every(partLifeValid))return false;
  if(!d.entries.every(ocr)||(Array.isArray(d.parts)&&!d.parts.every(ocr)))return false;
  if(d.assistance!==undefined&&(!d.assistance||!['roadsideName','roadsidePhone','insuranceName','insurancePhone','policy','garageName','garagePhone','note'].every(k=>str(d.assistance[k],k==='note'?2000:150))))return false;
  if(d.parts!==undefined&&(!Array.isArray(d.parts)||d.parts.length>500||new Set(d.parts.map(p=>p?.id)).size!==d.parts.length||!d.parts.every(p=>p&&id(p.id)&&['oil','airfilter','fuelfilter','cabinfilter','battery','tires','brakes','distribution','other'].includes(p.category)&&['name','reference','brand','spec','note'].every(k=>str(p[k],k==='note'?2000:200))&&date(p.purchasedDate)&&date(p.installedDate)&&date(p.warrantyEnd)&&(!p.installedDate||!p.purchasedDate||p.installedDate>=p.purchasedDate)&&(p.installedKm===null||(Number.isInteger(p.installedKm)&&p.installedKm>=0))&&(!p.entryId||id(p.entryId))&&Array.isArray(p.photos)&&p.photos.length<=6&&p.photos.every(photo))))return false;
  return true;
 }
 const api={number,parseOcr,fuelTrend,validExtras};root.AutoSmart=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
