'use strict';
function easyWords(fr,en,ar){return appLanguage==='ar'?ar:appLanguage==='en'?en:fr;}

function flashCompteur() {
  const session = 'flash-compteur-' + crypto.randomUUID();
  openForm('reading');
  $('form').dataset.session = session;
  $('photoFirst').value = 'on';
  $('photoKind').value = 'compteur';
  const drawer = $('photos')?.closest('details');
  if (drawer) drawer.open = true;
  if (window.Android?.addPhoto) {
    Android.addPhoto('compteur', true, session);
  } else {
    toast(easyWords('Prenez une photo de votre compteur', 'Take a photo of your odometer', 'صوّر العداد ديال الطوموبيل'));
  }
}

function renderBeginner(){
  if(needsSetup()||page==='vehicleSetup'||page==='guide')return;
  if(page==='accidentReport'){if(typeof renderAccidentReport==='function')renderAccidentReport();return;}
  if(page==='roadCheck'){if(typeof renderRoadCheck==='function')renderRoadCheck();return;}
  if(page==='trafficFines'){if(typeof renderTrafficFines==='function')renderTrafficFines();return;}

  $('nav').innerHTML=[['home','home',easyWords('Accueil','Home','الرئيسية')],['history','history',easyWords('Mes dépenses','My expenses','مصاريفي')],['stats','stats',easyWords('Mon bilan','My report','الحصيلة')],['features','garage',easyWords('Plus','More','المزيد')]].map(([p,i,label])=>`<button class="${page===p||(p==='features'&&page==='garage')?'active':''}" onclick="navigate('${p}')">${uiIcon(i)}<span>${label}</span></button>`).join('');

  if(page==='home'){
    $('add').style.display='none';
    const main=$('main'),car=$('homeVehicle')?.firstElementChild,follow=$('homeFollowup'),recent=$('homeRecent')?.firstElementChild;
    const selectedMonth=L.day().slice(0,7),spent=data.entries.filter(e=>e.date.startsWith(selectedMonth)).reduce((a,e)=>a+e.cost,0);
    main.innerHTML=`
      <h1>${easyWords('Ma voiture, simplement','My car, made simple','سيارتي ببساطة')}</h1>
      <div id="easyVehicle"></div>
      
      <div class="easy-actions">
        <button class="easy-main" onclick="openForm('fuel')">
          ${uiIcon('fuel')}
          <span>
            <b>${easyWords('J’ai mis du carburant','I bought fuel','درت المازوط')}</b>
            <small>${easyWords('Montant, litres et compteur','Amount, litres and odometer','الثمن واللترات والعداد')}</small>
          </span>
          ${uiIcon('arrow')}
        </button>
        <button class="easy-main secondary" onclick="openActionSheet()">
          ${uiIcon('plus')}
          <span>
            <b>${easyWords('J’ai payé autre chose','I paid for something else','خلّصت شي حاجة أخرى')}</b>
            <small>${easyWords('Vidange, lavage, parking…','Oil change, wash, parking…','الزيت، الغسيل، الركن…')}</small>
          </span>
          ${uiIcon('arrow')}
        </button>
      </div>

      <div class="quick easy-secondary" style="grid-template-columns:1fr 1fr;gap:8px">
        <button class="pill-flash" onclick="flashCompteur()" style="padding:10px 8px;font-size:12px;font-weight:700">
          ⚡ ${easyWords('Flash Compteur','Flash Odometer','سكانير العداد')}
        </button>
        <button class="pill-police" onclick="navigate('roadCheck')" style="padding:10px 8px;font-size:12px;font-weight:700">
          👮 ${easyWords('Contrôle Routier','Police check','فحص الشرطة')}
        </button>
        <button class="pill-accident" onclick="navigate('accidentReport')" style="padding:10px 8px;font-size:12px;font-weight:700">
          🚨 ${easyWords('Constat & Accident','Accident helper','معاينة الحادثة')}
        </button>
        <button class="secondary" onclick="navigate('pocket')" style="padding:10px 8px;font-size:12px;font-weight:700">
          ${uiIcon('document')} ${easyWords('Mes papiers','My documents','الوثائق ديالي')}
        </button>
      </div>

      <div id="easyFollowup"></div>

      ${typeof renderKmTrackerCard==='function'?renderKmTrackerCard(selectedMonth):''}

      <button class="card easy-balance" onclick="month=L.day().slice(0,7);navigate('stats')">
        <span>${easyWords('Payé ce mois-ci','Paid this month','خلّصت هاد الشهر')} · ${selectedMonth}</span>
        <strong>${money(spent)}</strong>
        <small>${easyWords('Voir le détail','View details','نشوف التفاصيل')} →</small>
      </button>

      <div class="quick" style="grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <button class="secondary" onclick="openForm('reading')">
          ${uiIcon('reading')} ${easyWords('Relever compteur','Update odometer','نسجّل العداد')}
        </button>
        <button class="secondary" onclick="photoEntryChooser()">
          ${uiIcon('camera')} ${easyWords('Saisir via photo','Add via photo','نزيد بالتصويرة')}
        </button>
      </div>

      <div class="section row">
        <h2>${easyWords('Derniers ajouts','Latest entries','آخر التسجيلات')}</h2>
        <button class="link" onclick="navigate('history')">${easyWords('Tout voir','View all','نشوف الكل')}</button>
      </div>
      <div id="easyRecent"></div>

      <button class="secondary" onclick="navigate('assistant')">
        ${uiIcon('spark')} ${easyWords('Une question sur ma voiture ?','A question about my car?','عندي سؤال على طوموبيلي')}
      </button>
    `;

    if(car)$('easyVehicle').appendChild(car);
    if(follow)$('easyFollowup').appendChild(follow);
    if(recent)$('easyRecent').appendChild(recent);
    else $('easyRecent').textContent=easyWords('Vos prochaines dépenses apparaîtront ici.','Your next expenses will appear here.','المصاريف اللي غادي تسجّل تبان هنا.');
  }
}

// Six everyday choices; the complete list remains available on demand.
const fullActionSheet=openActionSheet;
openActionSheet=function(){
  fullActionSheet();
  const form=$('form');
  form.innerHTML=`
    <p class="muted">${easyWords('Qu’avez-vous payé ?','What did you pay for?','شنو خلّصتي؟')}</p>
    <div class="operation-grid">
      ${['oil','wash','parking','repair','insurance','other'].map(type=>actionButton(type,uiTranslate(labels[type]),`closeForm();openForm('${type}')`)).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <button type="button" class="secondary" onclick="closeForm();flashCompteur()">
        ⚡ ${easyWords('Flash Compteur', 'Flash Odometer', 'سكانير العداد')}
      </button>
      <button type="button" class="secondary" onclick="closeForm();navigate('accidentReport')">
        🚨 ${easyWords('Constat & Accident', 'Accident helper', 'معاينة الحادثة')}
      </button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
      <button type="button" class="secondary" onclick="closeForm();navigate('trafficFines')">
        ⚖️ ${easyWords('Amendes NARSA', 'Traffic Fines', 'غرامات السير')}
      </button>
      <button type="button" class="secondary" onclick="closeForm();renderQuickSpecs()">
        🛞 ${easyWords('Pression & Specs', 'Tire Pressure', 'ضغط العجلات')}
      </button>
    </div>
    <details class="card" style="margin-top:10px">
      <summary>${easyWords('Autre type de dépense','Another expense type','نوع آخر من المصاريف')}</summary>
      <div class="operation-grid">
        ${['fuel','tires','brakes','electrical','accessory','vignette','inspection','subscription','reading'].map(type=>actionButton(type,uiTranslate(labels[type]),`closeForm();openForm('${type}')`)).join('')}
      </div>
    </details>
  `;
};

const detailedEntryForm=simplifyEntryForm;
simplifyEntryForm=function(){
  detailedEntryForm();
  const form=$('form'),t=$('type').value,typeLabel=form.querySelector('label[for="type"]'),dateLabel=form.querySelector('label[for="date"]');
  if(!typeLabel||$('easyDateOptions'))return;
  const options=foldTrip(easyWords('Date et type · modifier si besoin','Date and type · change if needed','التاريخ والنوع · بدّل إلا بغيتي'),[typeLabel,$('type'),dateLabel,$('date')],'easyDateOptions');
  const dateSummary=document.createElement('p');
  dateSummary.className='muted';
  dateSummary.id='easyDateLabel';
  options.before(dateSummary);
  const updateDate=()=>dateSummary.textContent=uiTranslate(labels[$('type').value])+' · '+date($('date').value);
  updateDate();
  $('date').addEventListener('input',updateDate);
  $('type').addEventListener('change',updateDate);
  if(draftEditId)options.open=true;
  const cost=$('costfields'),kmLabel=form.querySelector('label[for="km"]');
  if(cost&&!cost.hidden&&kmLabel)kmLabel.before(cost);
  const noteLabel=form.querySelector('label[for="note"]');
  if(noteLabel&&$('note'))foldTrip(easyWords('Ajouter une note ou le nom du garage','Add a note or garage name','نزيد ملاحظة ولا اسم الكاراج'),[noteLabel,$('note')],'easyNote');
  form.querySelectorAll('p.muted').forEach(p=>{
    if(p.previousElementSibling?.id==='km')p.textContent=easyWords('Recopiez le compteur total affiché dans la voiture.','Copy the total odometer shown in your car.','كتب العداد الإجمالي اللي باين فالطوموبيل.');
  });
};

document.getElementById('form')?.addEventListener('invalid',event=>{let node=event.target.parentElement;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}},true);
