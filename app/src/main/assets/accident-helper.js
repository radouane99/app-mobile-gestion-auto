// Mode Constat Amiable & Accidents
let accidentDraft = {
  photos: [],
  otherPlate: '',
  otherInsurance: '',
  otherDriver: '',
  note: ''
};

try {
  const saved = localStorage.getItem('autocarnet-accident-draft');
  if (saved) accidentDraft = Object.assign(accidentDraft, JSON.parse(saved));
} catch (e) {}

function accidentText(fr, en, ar) {
  return appLanguage === 'ar' ? ar : appLanguage === 'en' ? en : fr;
}

function persistAccidentDraft() {
  try {
    localStorage.setItem('autocarnet-accident-draft', JSON.stringify(accidentDraft));
  } catch (e) {}
}

function renderAccidentReport() {
  if (page !== 'accidentReport') return;
  $('add').style.display = 'none';

  const steps = [
    { key: 'otherPlate', title: accidentText('1. Plaque & Véhicule adverse', '1. Other vehicle & plate', '1. لوحة وسيارة الطرف الآخر'), hint: accidentText('Photographiez le matricule et la marque de l’autre voiture.', 'Take a clear photo of the other license plate.', 'صوّر الترقيم والنوع ديال الطوموبيل الأخرى.') },
    { key: 'otherPapers', title: accidentText('2. Permis & Assurance adverse', '2. Driver licence & insurance', '2. رخصة سياقة وتأمين السائق'), hint: accidentText('Photographiez l’attestation d’assurance et le permis du conducteur adverse.', 'Photograph the insurance certificate and driver licence.', 'صوّر شهادة التأمين وبيرمي السائق الآخر.') },
    { key: 'scene', title: accidentText('3. Position des deux voitures sur la voie', '3. Position of both cars', '3. موضع السيارتين فالطريق'), hint: accidentText('Vue d’ensemble montrant les deux voitures et les lignes au sol AVANT de bouger.', 'Wide angle showing both cars and road markings before moving.', 'صورة واسعة كتبين الطوموبيلات بجوج مع خطوط الطريق قبل ما تحركهم.') },
    { key: 'damages', title: accidentText('4. Dégâts & Choc', '4. Vehicle damages', '4. الأضرار والخسائر'), hint: accidentText('Photos rapprochées des dégâts sur les deux voitures.', 'Close-up photos of damages on both vehicles.', 'صور واضحة للأضرار والخربشات فكلتا السيارتين.') }
  ];

  const photosList = accidentDraft.photos.map((p, idx) => `
    <div style="position:relative;display:inline-block;margin:4px">
      <img src="https://app.local/photos/${p.id}" style="width:90px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #ccc">
      <button type="button" style="position:absolute;top:2px;right:2px;background:#000c;color:#fff;border:0;border-radius:50%;width:22px;height:22px;font-size:11px" onclick="accidentDraft.photos.splice(${idx},1);persistAccidentDraft();renderAccidentReport()">×</button>
    </div>
  `).join('');

  $('main').innerHTML = `
    <div class="accident-hero">
      <h2>🚨 ${accidentText('Constat & Accident · معاينة الحادثة', 'Accident & Claim Helper', 'معاينة الحادثة والتأمين')}</h2>
      <p>${accidentText('Guide pas-à-pas pour constituer un dossier d’assurance complet sans rien oublier sous le stress.', 'Step-by-step guide to document the accident for your insurance.', 'دليل خطوة بخطوة باش تجمع كاع الأدلة ديال الحادثة للتأمين بلا ما تنسى والو تحت الضغط.')}</p>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:14px">
      <button class="secondary" style="flex:1" onclick="navigate('home')">← ${accidentText('Accueil', 'Home', 'الرئيسية')}</button>
      <button class="primary btn-whatsapp" style="flex:1" onclick="shareAccidentWhatsApp()">💬 WhatsApp</button>
    </div>

    ${steps.map(s => `
      <section class="accident-step">
        <h3>${s.title}</h3>
        <small>${s.hint}</small>
        <div class="quick" style="grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">
          <button type="button" class="secondary" onclick="addAccidentPhoto(true)">📷 ${accidentText('Prendre photo', 'Take photo', 'التقاط صورة')}</button>
          <button type="button" class="secondary" onclick="addAccidentPhoto(false)">📁 ${accidentText('Galerie', 'Gallery', 'الصور')}</button>
        </div>
      </section>
    `).join('')}

    <section class="card" style="margin-top:14px">
      <h3>${accidentText('Photos enregistrées dans ce dossier', 'Photos in this file', 'الصور المسجلة في هذا الملف')} (${accidentDraft.photos.length})</h3>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">
        ${photosList || `<p class="muted">${accidentText('Aucune photo prise pour le moment.', 'No photos taken yet.', 'مازال ما كاين حتى صورة.')}</p>`}
      </div>
    </section>

    <section class="card" style="margin-top:14px">
      <h3>${accidentText('Informations du conducteur adverse', 'Other driver info', 'معلومات الطرف الآخر')}</h3>
      ${field('accidentPlate', accidentText('Immatriculation adverse (Matricule)', 'Other plate', 'ترقيم سيارة الطرف الآخر'), 'text', accidentDraft.otherPlate, 'placeholder="Ex. 12345 | A | 15"')}
      ${field('accidentInsurance', accidentText('Compagnie & N° de police', 'Insurance company & policy', 'شركة ورقم عقد التأمين'), 'text', accidentDraft.otherInsurance, 'placeholder="Ex. Wafa Assurance - 98765432"')}
      ${field('accidentDriver', accidentText('Nom & Téléphone du conducteur', 'Driver name & phone', 'اسم ورقم هاتف السائق'), 'text', accidentDraft.otherDriver, 'placeholder="Ex. Mohamed - 0600000000"')}
      <label for="accidentNote">${accidentText('Circonstances / Remarques', 'Accident notes', 'ظروف الحادثة وملاحظات')}</label>
      <textarea id="accidentNote" placeholder="${accidentText('Ex. L’autre véhicule m’a heurté par l’arrière au feu rouge.', 'Ex. Rear-ended at red light.', 'مثال: ضربني من اللور فالضو الحمر.')}">${esc(accidentDraft.note)}</textarea>
    </section>

    <button type="button" class="primary btn-whatsapp" style="width:100%;font-weight:700;margin-top:16px;padding:15px;font-size:15px" onclick="saveAccidentDraft();shareAccidentWhatsApp()">
      💬 ${accidentText('Partager tout le dossier sur WhatsApp', 'Share accident file on WhatsApp', 'إرسال التقرير كامل عبر واتساب')}
    </button>
    <button type="button" class="secondary" style="width:100%;margin-top:8px" onclick="resetAccidentDraft()">
      🗑️ ${accidentText('Effacer ce dossier d’accident', 'Clear accident file', 'مسح ملف الحادثة')}
    </button>
  `;

  for (const [id, key] of [['accidentPlate', 'otherPlate'], ['accidentInsurance', 'otherInsurance'], ['accidentDriver', 'otherDriver']]) {
    $(id)?.addEventListener('input', e => { accidentDraft[key] = e.target.value; persistAccidentDraft(); });
  }
  $('accidentNote')?.addEventListener('input', e => { accidentDraft.note = e.target.value; persistAccidentDraft(); });
}

function saveAccidentDraft() {
  if ($('accidentPlate')) accidentDraft.otherPlate = $('accidentPlate').value;
  if ($('accidentInsurance')) accidentDraft.otherInsurance = $('accidentInsurance').value;
  if ($('accidentDriver')) accidentDraft.otherDriver = $('accidentDriver').value;
  if ($('accidentNote')) accidentDraft.note = $('accidentNote').value;
  persistAccidentDraft();
}

function resetAccidentDraft() {
  if (!confirm(accidentText('Voulez-vous effacer ce dossier d’accident ?', 'Reset this accident file?', 'واش متأكد باغي تمسح ملف الحادثة؟'))) return;
  accidentDraft = { photos: [], otherPlate: '', otherInsurance: '', otherDriver: '', note: '' };
  persistAccidentDraft();
  renderAccidentReport();
  toast(accidentText('Dossier réinitialisé.', 'File reset.', 'تمت إعادة تعيين الملف.'));
}

function addAccidentPhoto(camera) {
  saveAccidentDraft();
  if (window.Android?.addPhoto) {
    Android.addPhoto('autre', camera, 'accident-' + crypto.randomUUID());
  } else {
    toast('Disponible dans l’APK Android.');
  }
}

// Receive photo into accident draft
const previousAccidentReceive = window.receivePhoto;
window.receivePhoto = function(id, kind, session) {
  if (session?.startsWith('accident-')) {
    if (!accidentDraft.photos.some(p => p.id === id)) {
      accidentDraft.photos.push({ id, kind: 'autre' });
      persistAccidentDraft();
    }
    if (page === 'accidentReport') renderAccidentReport();
    return true;
  }
  return previousAccidentReceive ? previousAccidentReceive(id, kind, session) : true;
};

function shareAccidentWhatsApp() {
  saveAccidentDraft();
  const d = accidentDraft;
  const lines = [
    '🚨 *AutoCarnet · Dossier Constat / Accident*',
    '📅 *Date* : ' + L.day(),
    '🚗 *Mon véhicule* : ' + (data.vehicle?.name || 'Dacia Logan') + ' (' + (data.vehicle?.plate || '—') + ')',
    '------------------------',
    '🚘 *Véhicule adverse* : ' + (d.otherPlate || 'Non précisé'),
    '📋 *Assurance adverse* : ' + (d.otherInsurance || 'Non précisée'),
    '👤 *Conducteur adverse* : ' + (d.otherDriver || 'Non précisé'),
    '📸 *Photos enregistrées* : ' + d.photos.length + ' photo(s)',
    d.note ? ('📝 *Remarques* : ' + d.note) : '',
    '------------------------',
    '📱 _Généré par AutoCarnet Assistance_'
  ].filter(Boolean);

  const text = lines.join('\n');

  if (window.Android?.shareText) {
    Android.shareText(text, 'Dossier Constat Accident');
  } else {
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
  }
}
