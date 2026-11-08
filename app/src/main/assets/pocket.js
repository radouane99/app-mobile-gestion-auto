'use strict';
const pocketTypes={license:['Permis de conduire','Driving licence','رخصة السياقة'],registration:['Carte grise','Vehicle registration','البطاقة الرمادية'],insurance:['Assurance','Insurance','التأمين'],tax:['Vignette','Road tax','الضريبة السنوية'],inspection:['Visite technique','Technical inspection','الفحص التقني']};
function pt(fr,en,ar){return appLanguage==='ar'?ar:appLanguage==='en'?en:fr;}
function pocketTitle(id){return pocketTypes[id]?.[appLanguage==='ar'?2:appLanguage==='en'?1:0]||id;}
let pocketDraft=null;
const pocketProofOwners=proofOwners;proofOwners=function(){return [...pocketProofOwners(),...(data.pocket||[]).map(x=>({source:'pocket',id:x.id,title:pocketTitle(x.id),date:'',km:null,cost:null,note:x.note,photos:x.photos.filter(p=>p.id.endsWith('.jpg'))})).filter(x=>x.photos.length)];};

// Coffre-fort Code Radio Renault/Dacia & N° Clé
function deriveRenaultCode(precode) {
  precode = String(precode || '').trim().toUpperCase();
  if (!/^[A-Z][0-9]{3}$/.test(precode)) return null;
  const c0 = precode.charCodeAt(0);
  const c1 = precode.charCodeAt(1);
  const c2 = precode.charCodeAt(2);
  const c3 = precode.charCodeAt(3);
  const x = c1 + (c0 * 10 - 698);
  if (x <= 0) return null;
  const y = c3 + (c2 * 10 + x) - 0x210;
  const z = ((y << 3) - y) % 100;
  const computed = Math.floor(z / 10) + (z % 10) * 10 + ((0x103 % x) % 100) * 100;
  return String(computed).padStart(4, '0');
}

let vaultCodeHidden = true;

function toggleVaultVisibility() {
  vaultCodeHidden = !vaultCodeHidden;
  renderPocket();
}

function copyRadioCode() {
  const code = localStorage.getItem('autocarnet-vault-radio') || '';
  if (!code) {
    toast(pt('Aucun code radio enregistré.', 'No radio code saved.', 'لا يوجد كود مسجل.'));
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(code);
  }
  toast(pt('Code radio copié : ' + code, 'Radio code copied: ' + code, 'تم نسخ كود الراديو: ' + code));
}

function saveVaultCodes() {
  const radio = ($('vaultRadioInput')?.value || '').trim();
  const key = ($('vaultKeyInput')?.value || '').trim();
  localStorage.setItem('autocarnet-vault-radio', radio);
  localStorage.setItem('autocarnet-vault-key', key);
  toast(pt('Codes enregistrés avec succès.', 'Codes saved securely.', 'تم حفظ الرموز بأمان.'));
  renderPocket();
}

function calculateAndApplyPrecode() {
  const pre = ($('vaultPrecodeInput')?.value || '').trim();
  const res = deriveRenaultCode(pre);
  const out = $('vaultPrecodeResult');
  if (!res) {
    if (out) out.innerHTML = `<span class="val-red" style="font-size:12px">${pt('Pré-code invalide. Exemple attendu : V188 ou S053 (1 lettre + 3 chiffres).', 'Invalid precode. Expected: 1 letter + 3 digits (e.g. V188).', 'الرمز الأولي غير صحيح. مثال: V188 (حرف و3 أرقام).')}</span>`;
    return;
  }
  if (out) {
    out.innerHTML = `
      <div class="sub-box" style="margin-top:10px;border-color:var(--green)">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span>${pt('Code PIN Radio calculé :', 'Calculated Radio PIN:', 'كود الراديو المحسوب:')}</span>
          <b class="val-green" style="font-size:22px;letter-spacing:3px">${res}</b>
        </div>
        <button type="button" class="primary" style="margin-top:10px;width:100%" onclick="if($('vaultRadioInput'))$('vaultRadioInput').value='${res}';localStorage.setItem('autocarnet-vault-radio','${res}');toast(pt('Code ${res} enregistré !','Code ${res} saved!','تم حفظ الكود ${res}!'));renderPocket();">${pt('💾 Enregistrer dans mon coffre-fort', 'Save to vault', 'حفظ في خزانتي')}</button>
      </div>`;
  }
}

function renderPocket(){
  if(needsSetup())return;
  if(page==='roadCheck'){renderRoadCheck();return;}
  if(page==='home'||page==='settings'){
    $('main').insertAdjacentHTML('beforeend',`<button class="all-features-button" onclick="navigate('pocket')">${uiIcon('document')} My Pocket · ${pt('Mes papiers','My documents','وثائقي')}</button>`);
  }
  if(page!=='pocket')return;
  $('add').style.display='none';

  const radioSaved = localStorage.getItem('autocarnet-vault-radio') || '';
  const keySaved = localStorage.getItem('autocarnet-vault-key') || '';

  $('main').innerHTML=`
    <h1>My Pocket</h1>
    <button class="primary" style="background:#0e2a38;border:2px solid #28748c;margin-bottom:16px;width:100%" onclick="navigate('roadCheck')">
      👮 ${pt('Mode Contrôle Routier · Papiers express', 'Police check mode · Express docs', 'فحص الشرطة والدرك · إظهار الوثائق فورا')}
    </button>
    <p class="muted">${pt('Vos copies personnelles, disponibles hors ligne. Photos recto/verso et PDF originaux (20 Mo maximum).','Your personal offline copies. Front/back photos and original PDFs (maximum 20 MB).','نسخك الشخصية متاحة بلا إنترنت. صور الوجه والظهر وملفات PDF الأصلية (20 ميغا كحد أقصى).')}</p>
    
    <div class="feature-grid">
      ${Object.keys(pocketTypes).map(id=>{
        const x=(data.pocket||[]).find(x=>x.id===id);
        return `<section class="card">
          <h2>${uiIcon('document')} ${pocketTitle(id)}</h2>
          <p>${x?.photos.length||0} ${pt('fichier(s)','file(s)','ملفات')}</p>
          ${(x?.photos||[]).map((p,i)=>`<button class="secondary" onclick="viewPocketFile('${id}',${i})">${p.id.endsWith('.pdf')?'PDF':pt('Photo','Photo','صورة')} ${i+1} · ${pt('Ouvrir','Open','فتح')}</button>`).join('')}
          <button class="primary" onclick="editPocket('${id}')">${pt('Ajouter / modifier','Add / edit','إضافة / تعديل')}</button>
        </section>`;
      }).join('')}
    </div>

    <!-- Coffre-Fort Clé & Radio Dacia -->
    <section class="accent-card" style="margin-top:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <h2>📻 ${pt('Coffre-Fort Sécurisé · Code Radio & Clé', 'Security Vault · Radio Code & Key', 'الخزانة الآمنة · كود الراديو والمفتاح')}</h2>
        <button type="button" class="link" onclick="toggleVaultVisibility()">${vaultCodeHidden ? '👁️ ' + pt('Afficher', 'Show', 'إظهار') : '🔒 ' + pt('Masquer', 'Hide', 'إخفاء')}</button>
      </div>
      <p class="muted">${pt('Gardez le code de déverrouillage autoradio et le code clé de votre Dacia sous la main en cas de débranchement de la batterie.', 'Keep your Dacia unlock radio code and key code handy.', 'احتفظ بكود الراديو والمفتاح لداسيا دايما معاك إلا تبلات البرية.')}</p>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
        <div class="sub-box">
          <small class="muted">${pt('Code PIN Radio', 'Radio PIN Code', 'كود الراديو')}</small>
          <div style="font-size:18px;font-weight:700;letter-spacing:2px;margin:4px 0">${vaultCodeHidden ? '••••' : (radioSaved || '—')}</div>
          ${radioSaved ? `<button type="button" class="link" style="font-size:11px" onclick="copyRadioCode()">📋 ${pt('Copier', 'Copy', 'نسخ')}</button>` : ''}
        </div>
        <div class="sub-box">
          <small class="muted">${pt('N° Clé / Transpondeur', 'Key code', 'رقم المفتاح')}</small>
          <div style="font-size:18px;font-weight:700;letter-spacing:1px;margin:4px 0">${vaultCodeHidden ? '••••••••' : (keySaved || '—')}</div>
        </div>
      </div>

      <details style="margin-top:10px">
        <summary style="cursor:pointer;font-weight:600">${pt('Modifier ou renseigner les codes', 'Edit or enter codes', 'تعديل أو إدخال الرموز')}</summary>
        <div style="margin-top:10px">
          <label for="vaultRadioInput">${pt('Code Radio (4 chiffres)', 'Radio Code (4 digits)', 'كود الراديو (4 أرقام)')}</label>
          <input type="text" id="vaultRadioInput" value="${esc(radioSaved)}" placeholder="Ex: 4839" maxlength="4" style="letter-spacing:3px;font-weight:bold">
          <label for="vaultKeyInput" style="margin-top:8px">${pt('Numéro Clé / Coque / Transpondeur', 'Key / Transponder code', 'رقم المفتاح أو السارية')}</label>
          <input type="text" id="vaultKeyInput" value="${esc(keySaved)}" placeholder="Ex: 7701... ou A123" maxlength="30">
          <button type="button" class="primary" style="margin-top:10px;width:100%" onclick="saveVaultCodes()">${pt('Enregistrer les codes', 'Save codes', 'حفظ الرموز')}</button>
        </div>
      </details>

      <details class="precode-box">
        <summary>💡 ${pt('Calculateur Pre-code Renault/Dacia (Gratuit)', 'Renault/Dacia Precode Calculator', 'حساب كود راديو داسيا بالمجان')}</summary>
        <div style="margin-top:10px">
          <p class="muted" style="font-size:12px">
            ${pt('Votre autoradio affiche <b>CODE</b> après avoir débranché la batterie ?<br>1. Allumez le poste et maintenez les touches <b>1 et 6</b> enfoncées pendant 3 secondes.<br>2. Un pré-code de 4 caractères s’affiche (ex: <b>V188</b> ou <b>S053</b>).<br>3. Entrez-le ici pour obtenir instantanément votre code PIN à 4 chiffres sans payer 100 à 150 DH.', 'Radio locked? Hold buttons 1 & 6 for 3s to read precode (e.g. V188) and calculate code instantly for free.', 'الراديو مبلوكي فطوموبيل؟ شعلو وضغط على الأزرار 1 و6 لمدة 3 ثواني باش يعطيك الرمز المبدئي (مثال V188) ودخلو هنا يحسب ليك الكود فالحين بلا ما تخلص 150 درهم.')}
          </p>
          <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
            <input type="text" id="vaultPrecodeInput" placeholder="Ex: V188" maxlength="4" style="text-transform:uppercase;flex:1;letter-spacing:2px;font-weight:bold">
            <button type="button" class="secondary" style="width:auto;margin-top:0;padding:12px 18px" onclick="calculateAndApplyPrecode()">${pt('Calculer', 'Calculate', 'حساب')}</button>
          </div>
          <div id="vaultPrecodeResult"></div>
        </div>
      </details>
    </section>

    <button class="secondary" style="margin-top:18px;width:100%" onclick="navigate('settings')">
      ${pt('Sauvegarde ZIP & verrouillage de l’application','ZIP backup & app lock','النسخ الاحتياطي ZIP وقفل التطبيق')}
    </button>
  `;
}

function viewPocketFile(id,index){
  const x=(data.pocket||[]).find(x=>x.id===id),p=x?.photos[index];
  if(!p)return;
  if(p.id.endsWith('.pdf')){
    if(window.Android?.openPocketPdf)Android.openPocketPdf(p.id);
    else toast('PDF disponible dans l’APK Android.');
  } else {
    openProof('pocket',id,x.photos.slice(0,index).filter(p=>p.id.endsWith('.jpg')).length);
  }
}

function keepPocketDraft(){
  if(!pocketDraft)return;
  pocketDraft.note=$('pocketNote')?.value||'';
  localStorage.setItem('autocarnet-pocket-draft',JSON.stringify(pocketDraft));
}

function editPocket(id,resume=false){
  if($('dialog').open)return;
  if(!resume){
    let saved;
    try{saved=JSON.parse(localStorage.getItem('autocarnet-pocket-draft')||'null');}catch(e){}
    pocketDraft=saved?.id===id?saved:{id,note:'',photos:[],...(structuredClone((data.pocket||[]).find(x=>x.id===id)||{})),session:'pocket-'+crypto.randomUUID()};
  }
  if(!pocketTypes[pocketDraft?.id])return;
  $('form').dataset.mode='pocket';
  $('form').dataset.session=pocketDraft.session;
  $('formtitle').textContent=pocketTitle(pocketDraft.id);
  $('form').innerHTML=`
    <p>${pt('Jusqu’à 6 fichiers par document.','Up to 6 files per document.','حتى 6 ملفات لكل وثيقة.')}</p>
    <div class="quick">
      <button type="button" onclick="addPocketFile('camera')">${uiIcon('camera')} ${pt('Photo','Photo','تصوير')}</button>
      <button type="button" onclick="addPocketFile('gallery')">${pt('Galerie','Gallery','الصور')}</button>
      <button type="button" onclick="addPocketFile('pdf')">＋ PDF</button>
    </div>
    <div id="pocketFiles"></div>
    <label for="pocketNote">${pt('Note','Note','ملاحظة')}</label>
    <textarea id="pocketNote" maxlength="1000">${esc(pocketDraft.note)}</textarea>
    <button type="submit" class="primary">${pt('Enregistrer','Save','حفظ')}</button>
    <button type="button" onclick="discardPocket()">${pt('Abandonner le brouillon','Discard draft','إلغاء المسودة')}</button>
  `;
  $('form').oninput=keepPocketDraft;
  $('form').onchange=keepPocketDraft;
  $('form').onsubmit=e=>{
    e.preventDefault();
    keepPocketDraft();
    const old=data.pocket,x={id:pocketDraft.id,note:pocketDraft.note,photos:pocketDraft.photos.map(p=>({...p}))};
    data.pocket=[...(old||[]).filter(p=>p.id!==x.id),x];
    if(!L.valid(data)||!save()){
      if(old===undefined)delete data.pocket;
      else data.pocket=old;
      return;
    }
    localStorage.removeItem('autocarnet-pocket-draft');
    pocketDraft=null;
    $('dialog').close();
    navigate('pocket');
  };
  $('dialog').showModal();
  drawPocketFiles();
  keepPocketDraft();
}

function drawPocketFiles(){
  $('pocketFiles').innerHTML=pocketDraft.photos.map((p,i)=>`
    <div class="card">${p.id.endsWith('.pdf')?'PDF':`<img style="max-width:100%;max-height:160px" src="https://app.local/photos/${p.id}" alt="Photo ${i+1}">`} ${i+1}
      <button type="button" onclick="pocketDraft.photos.splice(${i},1);keepPocketDraft();drawPocketFiles()">${pt('Retirer du brouillon','Remove from draft','حذف من المسودة')}</button>
    </div>
  `).join('');
}

function discardPocket(){
  localStorage.removeItem('autocarnet-pocket-draft');
  pocketDraft=null;
  $('dialog').close();
}

function addPocketFile(kind){
  if(pocketDraft.photos.length>=6)return toast(pt('Maximum 6 fichiers.','Maximum 6 files.','الحد الأقصى 6 ملفات.'));
  keepPocketDraft();
  if(kind==='pdf'&&window.Android?.addPocketPdf)Android.addPocketPdf(pocketDraft.session);
  else if(kind!=='pdf'&&window.Android?.addPhoto)Android.addPhoto('autre',kind==='camera',pocketDraft.session);
  else toast('Disponible dans l’APK Android.');
}

const previousPocketReceive=window.receivePhoto;
window.receivePhoto=function(id,kind,session){
  if(!session?.startsWith('pocket-'))return previousPocketReceive(id,kind,session);
  if(!pocketDraft){try{pocketDraft=JSON.parse(localStorage.getItem('autocarnet-pocket-draft')||'null');}catch(e){}}
  if(pocketDraft?.session!==session)return true;
  if(!/^[a-f0-9]{64}\.(jpg|pdf)$/.test(id))return false;
  if(!pocketDraft.photos.some(p=>p.id===id)){
    if(pocketDraft.photos.length>=6)return false;
    pocketDraft.photos.push({id,kind:'autre'});
  }
  localStorage.setItem('autocarnet-pocket-draft',JSON.stringify(pocketDraft));
  if(!$('dialog').open)editPocket(pocketDraft.id,true);
  if($('form').dataset.mode==='pocket'&&$('form').dataset.session===session)drawPocketFiles();
  return true;
};

// Mode Contrôle Routier / Barrage Police & Gendarmerie
function renderRoadCheck() {
  if (page !== 'roadCheck') return;
  $('add').style.display = 'none';
  const docs = ['license', 'registration', 'insurance', 'tax', 'inspection'];

  function docStatus(type) {
    const list = (data.entries || []).filter(e => e.type === type).sort((a, b) => (a.coverageStart || a.date).localeCompare(b.coverageStart || b.date));
    const last = list.at(-1);
    if (!last || !last.coverageEnd) return { badge: 'missing', label: pt('Validité à compléter', 'Validity to complete', 'أدخل تاريخ الصلاحية') };
    const days = L.days(L.day(), last.coverageEnd) - 1;
    if (days < 0) return { badge: 'due', label: pt('Expiré depuis ' + Math.abs(days) + ' j', 'Expired ' + Math.abs(days) + ' d ago', 'منتهية الصلاحية منذ ' + Math.abs(days) + ' يوم') };
    if (days <= 30) return { badge: 'warn', label: pt('Expire dans ' + days + ' j', 'Expires in ' + days + ' d', 'تنتهي خلال ' + days + ' يوم') };
    return { badge: 'ok', label: pt('Valide jusqu’au ' + date(last.coverageEnd), 'Valid until ' + date(last.coverageEnd), 'صالحة إلى غاية ' + date(last.coverageEnd)) };
  }

  const items = docs.map(id => {
    const p = (data.pocket || []).find(x => x.id === id);
    const count = p?.photos?.length || 0;
    const st = ['insurance', 'tax', 'inspection'].includes(id) ? docStatus(id) : null;
    return `
    <article class="road-check-doc">
      <div class="road-check-doc-head">
        <h3>${uiIcon('document')} ${pocketTitle(id)}</h3>
        ${st ? `<span class="road-check-badge ${st.badge}">${st.label}</span>` : (count > 0 ? `<span class="road-check-badge ok">${count} ${pt('fichier(s)', 'file(s)', 'ملفات')}</span>` : `<span class="road-check-badge missing">${pt('Non ajouté', 'Not added', 'غير مضافة')}</span>`)}
      </div>
      ${count === 0 ? `<p class="muted">${pt('Aucun fichier scanné pour ce document.', 'No file scanned for this document.', 'لا توجد نسخة مسجلة لهذه الوثيقة.')} <button class="link" onclick="editPocket('${id}')">${pt('Ajouter maintenant', 'Add now', 'أضف الآن')}</button></p>` : `
      <div class="road-check-preview">
        ${(p.photos || []).map((photo, idx) => photo.id.endsWith('.pdf') ?
          `<button class="road-check-pdf-btn" onclick="viewPocketFile('${id}',${idx})">${uiIcon('document')} PDF ${idx + 1}<span>${pt('Ouvrir', 'Open', 'فتح')}</span></button>` :
          `<img class="road-check-thumb" src="https://app.local/photos/${photo.id}" alt="${pocketTitle(id)} ${idx + 1}" onclick="viewPocketFile('${id}',${idx})">`
        ).join('')}
      </div>`}
      ${p?.note ? `<p class="muted" style="margin-top:6px;font-size:11px"><b>Note:</b> ${esc(p.note)}</p>` : ''}
    </article>`;
  }).join('');

  $('main').innerHTML = `
    <div class="road-check-hero">
      <h2>👮 ${pt('Contrôle Routier · فحص المراقبة', 'Police & Gendarmerie check', 'فحص الشرطة والدرك')}</h2>
      <p>${pt('Présentez vos documents en un coup d’œil. Touchez une photo pour l’agrandir en haute définition.', 'Show all vehicle documents at a glance. Tap any photo to zoom in full size.', 'اعرض وثائق السيارة بسرعة في نقط المراقبة. اضغط على أي وثيقة لتكبيرها.')}</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <button class="primary" style="flex:1;background:#0e684f" onclick="navigate('pocket')">← ${pt('Retour à My Pocket', 'Back to My Pocket', 'الرجوع إلى وثائقي')}</button>
      <button class="secondary" onclick="navigate('home')">⌂ ${pt('Accueil', 'Home', 'الرئيسية')}</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <button type="button" class="secondary" onclick="navigate('trafficFines')">⚖️ ${pt('Guide Amendes & Points', 'Traffic Fines & Points', 'دليل الغرامات والنقاط')}</button>
      <button type="button" class="secondary" onclick="renderQuickSpecs()">🛞 ${pt('Pression & Entretien', 'Tire Pressure & Specs', 'ضغط العجلات والصيانة')}</button>
    </div>
    ${typeof renderVignetteCard === 'function' ? renderVignetteCard() : ''}
    ${items}
    <button class="secondary" style="width:100%;margin-top:10px" onclick="navigate('pocket')">← ${pt('Retour à My Pocket', 'Back to My Pocket', 'الرجوع إلى وثائقي')}</button>
  `;
}
