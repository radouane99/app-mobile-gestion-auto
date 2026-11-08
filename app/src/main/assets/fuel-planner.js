'use strict';

function drivingTagKey(day) {
  return [day.date, day.max, day.daily].join('/');
}

function recentDrivingDays(today) {
  const end = new Date(today+'T00:00:00Z');
  const earliest = new Date(end.getTime()-59*86400000).toISOString().slice(0,10);
  const days=[];
  for(let i=0;i<3;i++){
    const period=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-i,1)).toISOString().slice(0,7);
    for(const day of drivingMonth(data.vehicle,data.entries,period).days.values()){
      if(day.daily!==null && day.date>=earliest && day.date<=today && data.drivingTags?.[drivingTagKey(day)]!=='trip') days.push(day);
    }
  }
  return days;
}

function fuelPlannerScreen() {
  if(needsSetup())return;
  const t=easyWords;
  const title=t('Combien de carburant prévoir ?','How much fuel should I budget?','شحال نوجد للمازوط؟');
  if(page==='home'){
    const row=document.querySelector('#main .easy-actions');
    if(row){
      const button=document.createElement('button');button.className='secondary';button.textContent=title;
      button.onclick=()=>navigate('fuelPlanner');row.after(button);
    }
    return;
  }
  if(page!=='fuelPlanner')return;
  $('add').style.display='none';
  const today=L.day(), days=recentDrivingDays(today);
  const moving=days.filter(d=>d.daily>0);
  const mean=values=>values.length?values.reduce((sum,d)=>sum+d.daily,0)/values.length:null;
  const norm=days.length>=3?mean(days):null;
  const fuels=L.sorted(data).slice().reverse().filter(e=>e.type==='fuel');
  const recent=fuels.find(e=>e.pumpUnitPrice>0||(e.cost>0&&e.liters>0));
  const price=recent?(recent.pumpUnitPrice||recent.cost/recent.liters):null;
  const measured=L.consumption(data);
  const date=new Date(today+'T00:00:00Z');
  const remaining=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate()-date.getUTCDate()+1;
  const input=(id,label,value)=>field(id,label,'number',value??'','min="0" step="any" inputmode="decimal"');
  $('main').innerHTML='<button id="fuelBack" class="link">← '+t('Accueil','Home','الرئيسية')+'</button><h1>'+title+'</h1><div class="card"><label for="planMode">'+t('Que souhaitez-vous estimer ?','What do you want to estimate?','شنو بغيتي تحسب؟')+'</label><select id="planMode"><option value="money">'+t('Avec mon budget','With my budget','بالدرهم اللي عندي')+'</option><option value="distance">'+t('Pour une distance','For a distance','لمسافة معيّنة')+'</option><option value="month">'+t('Finir le mois','Finish the month','نكمّل الشهر')+'</option></select><div id="planFields"></div>'+
    input('planPrice',t('Prix à la pompe (DH/L)','Pump price (DH/L)','ثمن اللتر (درهم)'),price?Number(price.toFixed(3)):'')+
    '<small>'+ (recent?t('Dernier achat','Last purchase','آخر شراء')+' · '+esc(recent.date):t('Saisissez le prix affiché à la station.','Enter the price at the station.','كتب الثمن اللي فالبومبة.'))+'</small>'+
    input('planRate',t('Consommation (L/100 km)','Consumption (L/100 km)','الاستهلاك (لتر لكل 100 كم)'),measured?Number(measured.toFixed(2)):'')+
    '<small>'+ (measured?t('Mesure de vos pleins, modifiable pour ce calcul.','Measured from full tanks. Editable for this estimate.','القياس من التعبئات الكاملة. تقدر تبدّلو لهاد الحساب.') : t('Pas de mesure disponible. Entrez votre hypothèse.','No measured rate yet. Enter your estimate.','مازال ما كاينش قياس. كتب التقدير ديالك.'))+'</small><div id="planAnswer" class="note" aria-live="polite"></div></div><button class="secondary" id="planRecord">'+t('Enregistrer un achat réel','Record an actual purchase','نسجّل شحال شريت بصح')+'</button>';
  $('fuelBack').onclick=()=>navigate('home');$('planRecord').onclick=()=>openForm('fuel');
  const fmt=value=>value.toLocaleString(appLanguage==='ar'?'ar-MA':appLanguage==='en'?'en-GB':'fr-FR',{maximumFractionDigits:2});
  const spent=fuels.filter(e=>e.date.startsWith(today.slice(0,7))).reduce((sum,e)=>sum+e.cost,0);
  function showLimit(forecast){
    const status=$('fuelLimitStatus');
    if(!status)return;
    const cap=data.monthlyFuelLimit;
    status.textContent=t('Achats du mois','Purchases this month','المازوط اللي خلّصتي هاد الشهر')+' · '+fmt(spent)+' DH';
    if(!(cap>0))return;
    const balance=cap-spent;
    status.textContent+=' · '+(balance>=0?t('Disponible','Available','باقي'):t('Déjà dépassé de','Already over by','فات السقف بـ'))+' '+fmt(Math.abs(balance))+' DH.';
    if(Number.isFinite(forecast)){
      const projected=Math.round((balance-forecast)*100)/100;
      status.textContent+=' '+(projected<0?t('Dépassement prévu','Projected overage','التجاوز المتوقّع'):t('Marge prévue','Projected headroom','المتبقّي المتوقّع'))+' · '+fmt(Math.abs(projected))+' DH.';
    }
  }
  function update(){
    const mode=$('planMode').value, price=$('planPrice').valueAsNumber, rate=$('planRate').valueAsNumber;
    const amount=$('planAmount').valueAsNumber, output=$('planAnswer');
    showLimit(null);
    if(![price,rate,amount].every(Number.isFinite)||price<=0||rate<=0||amount<0){
      output.textContent=t('Complétez les valeurs pour calculer.','Enter the missing values to calculate.','كمّل الخانات باش يتحسب التقدير.');return;
    }
    const perKm=price*rate/100;
    if(mode==='month'){
      const extra=$('planExtra').valueAsNumber;
      if(!Number.isFinite(extra)||extra<0){output.textContent=t('Vérifiez la distance supplémentaire.','Check extra distance.','راجع المسافة الإضافية.');return;}
      const routine=amount*remaining;
      showLimit((routine+extra)*perKm);
      output.textContent=t('Usage habituel','Usual driving','السياقة العادية')+' · '+fmt(routine)+' km / '+fmt(routine*perKm)+' DH + '+t('voyage supplémentaire','additional trip','السفرة الزايدة')+' · '+fmt(extra)+' km / '+fmt(extra*perKm)+' DH. '+t('Budget estimé','Estimated budget','الميزانية التقديرية')+' · '+fmt((routine+extra)*perKm)+' DH.';
    }else{
      const distance=mode==='money'?amount/perKm:amount;
      output.textContent=fmt(distance)+' km · '+fmt(distance*rate/100)+' L · '+fmt(distance*perKm)+' DH';
      if(mode==='money'&&moving.length>=3)output.textContent+=' · ≈ '+fmt(distance/mean(moving))+' '+t('jours de conduite habituels','usual driving days','أيام ديال السياقة المعتادة');
    }
  }
  function choose(){
    const mode=$('planMode').value;
    const label=mode==='money'?t('Mon budget (DH)','My budget (DH)','الميزانية (درهم)'):mode==='distance'?t('Distance prévue (km)','Planned distance (km)','المسافة (كم)'):t('Km habituels par jour, jours à zéro inclus','Usual km per calendar day including zero days','كم فالنهار مع حساب الأيام ديال صفر كم');
    
  const quickMoney = mode==='money' ? `
    <div class="quick" style="grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0 12px">
      ${[50, 100, 150, 200, 300, 500].map(v => `<button type="button" class="secondary" style="padding:8px 4px;font-size:12px;font-weight:700;text-align:center" onclick="$('planAmount').value=${v};$('planAmount').dispatchEvent(new Event('input',{bubbles:true}))">${v} DH</button>`).join('')}
    </div>` : '';
  $('planFields').innerHTML = input('planAmount', label, mode==='money'?100:mode==='distance'?'':norm===null?'':Number(norm.toFixed(2))) + quickMoney;

    if(mode==='month'){
      const basis=norm===null?t('Peu de relevés. Saisissez votre estimation quotidienne.','Few readings. Enter your own daily estimate.','القراءات قليلة. دخل تقديرك لليوم.'):t('Moyenne des intervalles quotidiens observés','Average of observed daily intervals','متوسط القراءات اليومية')+' ('+days.length+').';
      $('planFields').insertAdjacentHTML('beforeend','<p class="muted">'+basis+' '+remaining+' '+t('jours, aujourd’hui inclus.','days including today.','يوم مع اليوم.')+'</p>'+input('planExtra',t('Km de voyage en plus (retour inclus)','Additional trip km (include return)','كم زايدة ديال السفر مع الرجوع'),0));
      if(norm===null&&days.length){const values=days.map(d=>d.daily);$('planFields').insertAdjacentHTML('beforeend','<small>'+t('Intervalles observés','Observed intervals','المسافات اليومية المسجّلة')+' · '+fmt(Math.min(...values))+'–'+fmt(Math.max(...values))+' km</small>');}
      $('planFields').insertAdjacentHTML('beforeend','<details class="form-disclosure" id="fuelLimitSettings"><summary>'+t('Mon plafond mensuel de carburant','My monthly fuel limit','السقف الشهري ديال المازوط')+'</summary>'+input('fuelLimit',t('Plafond reconduit chaque mois (DH). Videz pour désactiver.','Recurring monthly limit (DH). Clear to disable.','السقف ديال كل شهر بالدرهم. خوّي الخانة باش توقفو.'),data.monthlyFuelLimit??'')+'<button class="secondary" id="saveFuelLimit">'+t('Enregistrer le plafond','Save limit','حفظ السقف')+'</button></details><p class="note" id="fuelLimitStatus" aria-live="polite"></p>');
      $('saveFuelLimit').onclick=()=>{
        const field=$('fuelLimit'), previous=data.monthlyFuelLimit;
        if(field.validity.badInput||(field.value!==''&&!(field.valueAsNumber>0))){field.focus();toast(t('Entrez un plafond positif.','Enter a positive limit.','دخل سقف أكبر من صفر.'));return;}
        if(field.value==='')delete data.monthlyFuelLimit;else data.monthlyFuelLimit=field.valueAsNumber;
        if(!save()){if(previous===undefined)delete data.monthlyFuelLimit;else data.monthlyFuelLimit=previous;return;}
        $('fuelLimitSettings').open=false;update();
      };
    }
    update();
  }
  $('planMode').onchange=choose;
  $('main').querySelector('.card').oninput=event=>{if(event.target.id!=='planMode')update();};
  choose();
}
