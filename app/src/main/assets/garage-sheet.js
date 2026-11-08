'use strict';

function renderGarageSheet(){
  if(needsSetup())return;
  const t=easyWords,title=t('Fiche garage','Garage visit sheet','ورقة الكاراج');
  if(page==='maintenance'){
    const button=document.createElement('button');
    button.className='secondary';button.textContent=title;button.onclick=()=>navigate('garageSheet');
    $('main').querySelector('h1')?.after(button);
    return;
  }
  if(page!=='garageSheet')return;
  $('add').style.display='none';
  const oils=L.sorted(data).filter(entry=>entry.type==='oil'),last=oils.at(-1);
  const unknown=t('Non renseigné','Unknown','ما معروفش');
  const parts=new Map();
  oils.forEach((entry,index)=>{
    const groups=new Map();
    for(const line of entry.serviceLines||[]){
      const key=WorkflowLogic.lineKey(line);
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(line);
    }
    for(const [key,lines] of groups)parts.set(key,{entry,index,lines});
  });
  const defaults=[
    ['oil',t('Huile moteur','Engine oil','زيت الموتور')],
    ['oilfilter',t('Filtre à huile','Oil filter','فلتر الزيت')],
    ['fuelfilter',t('Filtre à gasoil','Diesel filter','فلتر المازوط')],
    ['airfilter',t('Filtre à air','Air filter','فلتر الهواء')]
  ];
  for(const [key,name] of defaults){
    if(!parts.has(key))parts.set(key,{lines:[{name,serviceKey:key,quantity:1,reference:''}]});
  }
  const main=$('main');
  main.innerHTML='<h1>'+title+'</h1><section class="card" id="garageSummary"></section><section class="card" id="garageParts"><h2>'+t('Pièces et derniers prix','Parts and previous prices','القطع وآخر الأثمنة')+'</h2><p>'+t('Après la visite, cochez uniquement les produits changés aujourd’hui.','After the visit, tick only the products actually changed today.','من بعد الخدمة، علّم غير على اللي تبدّل اليوم.')+'</p></section>';
  const summary=$('garageSummary');
  function paragraph(box,text){const p=document.createElement('p');p.textContent=text;box.append(p);}
  paragraph(summary,data.vehicle.name+' · '+t('Dernier compteur saisi','Last recorded odometer','آخر عداد مسجّل')+' · '+(hasOdometer()?n(currentKm())+' km':unknown));
  paragraph(summary,t('Dernière vidange personnelle','Last personal oil change','آخر فيدانج ديالك')+' · '+(last?date(last.date)+' · '+money(last.cost):unknown));
  if(last){
    for(const line of last.serviceLines||[])paragraph(summary,line.name+' · '+n(line.quantity,2)+' × '+money(line.unitPrice));
    paragraph(summary,t('Main-d’œuvre','Labour','اليد العاملة')+' · '+(Number.isFinite(last.trace?.labor)?money(last.trace.labor):unknown));
  }
  const archived=(data.historicalRecords||[]).filter(entry=>entry.type==='oil'&&entry.date).sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(archived)paragraph(summary,t('Archive de l’ancien propriétaire','Previous owner’s archive','أرشيف المالك السابق')+' · '+date(archived.date)+' · '+archived.text);
  const selections=[];
  for(const {entry,index,lines} of parts.values())for(const line of lines){
    const box=$('garageParts'),label=document.createElement('label'),cb=document.createElement('input');
    cb.type='checkbox';label.className='check';label.append(cb,document.createTextNode(line.name));box.append(label);selections.push({cb,line});
    if(!entry){paragraph(box,t('Dernier remplacement détaillé inconnu','Last documented replacement unknown','آخر تبديل مفصّل ما معروفش'));continue;}
    const passed=oils.length-1-index,frequency=line.everyOil||1;
    paragraph(box,[line.reference,date(entry.date),money(line.unitPrice),t('Vidanges enregistrées depuis','Oil changes recorded since','فيدانجات مسجّلة من بعد')+' '+passed,t('Fréquence prévue','Planned interval','التواتر المبرمج')+' '+frequency].filter(Boolean).join(' · '));
  }
  const start=document.createElement('button');start.className='primary';start.textContent=t('Saisir la vidange du jour','Enter today’s oil change','سجّل فيدانج اليوم');
  start.onclick=()=>{
    const chosen=selections.filter(item=>item.cb.checked);
    if(chosen.length>20){toast(t('Maximum 20 produits','Maximum 20 products','الحد هو 20 منتج'));return;}
    openForm('oil');
    serviceDraft=chosen.map(({line})=>({id:crypto.randomUUID(),name:line.name,reference:line.reference||'',serviceKey:line.serviceKey||'other',quantity:line.quantity||1,everyOil:line.everyOil||1,unitPrice:null,photoId:null}));
    $('serviceEnabled').checked=chosen.length>0;$('serviceLabor').value='';$('serviceFees').value='';
    renderServiceRows();toggleWorkflow('oil');stashDraft();
  };
  $('garageParts').append(start);
}
