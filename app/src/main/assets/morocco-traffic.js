// AutoCarnet · Outils Pratiques Maroc (Amendes NARSA, Pression Pneus, Alerte Vignette & Mutation Carte Grise)
'use strict';

const moroccoFines = [
  // 1ère Classe (700 DH)
  { id: 'vit_30_50', cls: 1, title: 'Excès de vitesse entre 30 et 50 km/h', titleAr: 'تجاوز السرعة بـ 30 إلى أقل من 50 كلم/س', base: 700, d24: 400, d15: 500, points: 4, cat: 'speed' },
  { id: 'feu_rouge', cls: 1, title: 'Non-respect de l’arrêt au feu rouge ou Stop', titleAr: 'عدم احترام الوقوف الإجباري عند الضوء الأحمر أو علامة قف', base: 700, d24: 400, d15: 500, points: 4, cat: 'priority' },
  { id: 'ligne_continue', cls: 1, title: 'Franchissement de la ligne continue', titleAr: 'عبور الخط المتصل', base: 700, d24: 400, d15: 500, points: 4, cat: 'maneuver' },
  { id: 'sens_interdit', cls: 1, title: 'Circulation en sens interdit', titleAr: 'السير في الاتجاه الممنوع', base: 700, d24: 400, d15: 500, points: 4, cat: 'maneuver' },
  { id: 'depassement_dangereux', cls: 1, title: 'Dépassement défectueux ou dangereux', titleAr: 'التجاوز المعيب أو الخطير', base: 700, d24: 400, d15: 500, points: 4, cat: 'maneuver' },
  { id: 'arret_urgence', cls: 1, title: 'Arrêt ou circulation sur bande d’arrêt d’urgence', titleAr: 'السير أو التوقف على شريط التوقف العاجل بالطريق السيار', base: 700, d24: 400, d15: 500, points: 0, cat: 'highway' },

  // 2ème Classe (500 DH)
  { id: 'vit_20_30', cls: 2, title: 'Excès de vitesse entre 20 et 30 km/h', titleAr: 'تجاوز السرعة بـ 20 إلى أقل من 30 كلم/س', base: 500, d24: 300, d15: 350, points: 2, cat: 'speed' },
  { id: 'telephone', cls: 2, title: 'Usage du téléphone tenu en main au volant', titleAr: 'استعمال الهاتف باليد أثناء السياقة', base: 500, d24: 300, d15: 350, points: 1, cat: 'safety' },
  { id: 'priorite_droite', cls: 2, title: 'Non-respect de la priorité à droite', titleAr: 'عدم احترام حق الأسبقية لليمين', base: 500, d24: 300, d15: 350, points: 2, cat: 'priority' },
  { id: 'pneus_lisses', cls: 2, title: 'Pneumatiques détériorés ou lisses', titleAr: 'إطارات ملساء أو غير مطابقة للمواصفات', base: 500, d24: 300, d15: 350, points: 0, cat: 'vehicle' },
  { id: 'surcharge_passagers', cls: 2, title: 'Dépassement du nombre de personnes autorisé', titleAr: 'تجاوز عدد الركاب المسموح به في بطاقة السيارة', base: 500, d24: 300, d15: 350, points: 0, cat: 'safety' },

  // 3ème Classe (300 DH)
  { id: 'vit_inf_20', cls: 3, title: 'Excès de vitesse de moins de 20 km/h', titleAr: 'تجاوز السرعة بأقل من 20 كلم/س', base: 300, d24: 150, d15: 200, points: 0, cat: 'speed' },
  { id: 'ceinture', cls: 3, title: 'Non-port de la ceinture de sécurité', titleAr: 'عدم وضع حزام السلامة', base: 300, d24: 150, d15: 200, points: 1, cat: 'safety' },
  { id: 'stationnement_interdit', cls: 3, title: 'Stationnement non réglementaire ou interdit', titleAr: 'الوقوف والتوقف غير القانوني أو الممنوع', base: 300, d24: 150, d15: 200, points: 0, cat: 'parking' },
  { id: 'feux_defaillants', cls: 3, title: 'Défaut ou panne d’éclairage ou de feux', titleAr: 'نقص أو عطل في أضواء السيارة', base: 300, d24: 150, d15: 200, points: 0, cat: 'vehicle' }
];

let fineFilter = 'all';

function mfText(fr, en, ar) {
  return appLanguage === 'ar' ? ar : appLanguage === 'en' ? en : fr;
}

// ---------------------------------------------------------------------------
// 1. Barème des Amendes & Points NARSA (100% Hors-ligne)
// ---------------------------------------------------------------------------
function renderTrafficFines() {
  if (page !== 'trafficFines') return;
  $('add').style.display = 'none';

  const list = moroccoFines.filter(f => {
    if (fineFilter === 'all') return true;
    if (fineFilter === 'speed') return f.cat === 'speed';
    if (fineFilter === 'points') return f.points > 0;
    if (fineFilter === 'cls1') return f.cls === 1;
    if (fineFilter === 'cls2') return f.cls === 2;
    if (fineFilter === 'cls3') return f.cls === 3;
    return true;
  });

  $('main').innerHTML = `
    <div class="fines-hero">
      <h2>⚖️ ${mfText('Code de la Route · دليل الغرامات والنقاط', 'Morocco Traffic Fines & Points', 'دليل مخالفات السير والنقاط بالمغرب')}</h2>
      <p>${mfText('Barème officiel NARSA des infractions au Maroc. Payez sous 24h ou 15 jours pour bénéficier d’une remise jusqu’à 50% !', 'Official Moroccan fines & point system. Pay within 24h or 15 days to save up to 50%!', 'الجدول الرسمي لغرامات السير بالمغرب. استفد من تخفيض حتى لـ 50% إلا خلستي فـ 24 ساعة!')}</p>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:14px">
      <button class="secondary" style="flex:1;margin-top:0" onclick="navigate('roadCheck')">👮 ${mfText('Contrôle Routier', 'Police check', 'فحص الشرطة')}</button>
      <button class="secondary" style="flex:1;margin-top:0" onclick="navigate('home')">⌂ ${mfText('Accueil', 'Home', 'الرئيسية')}</button>
    </div>

    <!-- Récapitulatif Remises Légales Maroc -->
    <section class="accent-card">
      <h3>⚡ ${mfText('Tarifs avec Réduction Rapide (Loi marocaine)', 'Discounted Fast-Pay Rates', 'جدول الأداء السريع مع التخفيض')}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px;text-align:center">
        <div class="sub-box" style="padding:8px">
          <small class="val-red">1ère Classe</small>
          <div style="font-size:12px;margin:3px 0"><strike class="muted">700 DH</strike></div>
          <span class="val-green">400 DH</span> <small class="muted" style="font-size:10px">(24h)</small><br>
          <span class="val-amber">500 DH</span> <small class="muted" style="font-size:10px">(15j)</small>
        </div>
        <div class="sub-box" style="padding:8px">
          <small class="val-red">2ème Classe</small>
          <div style="font-size:12px;margin:3px 0"><strike class="muted">500 DH</strike></div>
          <span class="val-green">300 DH</span> <small class="muted" style="font-size:10px">(24h)</small><br>
          <span class="val-amber">350 DH</span> <small class="muted" style="font-size:10px">(15j)</small>
        </div>
        <div class="sub-box" style="padding:8px">
          <small class="val-red">3ème Classe</small>
          <div style="font-size:12px;margin:3px 0"><strike class="muted">300 DH</strike></div>
          <span class="val-green">150 DH</span> <small class="muted" style="font-size:10px">(24h)</small><br>
          <span class="val-amber">200 DH</span> <small class="muted" style="font-size:10px">(15j)</small>
        </div>
      </div>
    </section>

    <!-- Filtres -->
    <div class="filter" style="margin-bottom:12px">
      ${[
        ['all', mfText('Toutes', 'All', 'الكل')],
        ['speed', mfText('Vitesse', 'Speed', 'السرعة')],
        ['points', mfText('Avec retrait points', 'With points', 'فيها سحب نقاط')],
        ['cls1', '1ère (700 DH)'],
        ['cls2', '2ème (500 DH)'],
        ['cls3', '3ème (300 DH)']
      ].map(([k, t]) => `<button class="${fineFilter === k ? 'selected' : ''}" onclick="fineFilter='${k}';renderTrafficFines()">${t}</button>`).join('')}
    </div>

    <!-- Liste des Infractions -->
    <div style="display:flex;flex-direction:column;gap:10px">
      ${list.map(f => `
        <article class="card" style="padding:14px;margin-bottom:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <h3 style="font-size:14px;margin:0;flex:1">${appLanguage === 'ar' ? f.titleAr : f.title}</h3>
            ${f.points > 0 ? `<span class="road-check-badge due">-${f.points} ${mfText('pts', 'pts', 'نقط')}</span>` : '<span class="road-check-badge ok">0 pt</span>'}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--line);flex-wrap:wrap;gap:6px">
            <div>
              <span class="muted" style="font-size:11px">${mfText('Tarif normal', 'Normal fee', 'التعريفة العادية')} : </span>
              <b>${f.base} DH</b>
            </div>
            <div>
              <span class="val-green" style="font-size:12px">⚡ 24h : ${f.d24} DH</span>
              <span class="val-amber" style="font-size:12px;margin-inline-start:8px">15j : ${f.d15} DH</span>
            </div>
          </div>
        </article>
      `).join('')}
    </div>

    <!-- Règle de récupération des points -->
    <section class="card" style="margin-top:16px">
      <h3>💡 ${mfText('Comment récupérer ses points au Maroc ?', 'How to recover points?', 'كيفاش ترجع النقاط ديالك فالمغرب؟')}</h3>
      <ul style="font-size:12px;line-height:1.7;margin:8px 0;padding-inline-start:18px" class="muted">
        <li><b>+4 ${mfText('points', 'points', 'نقاط')}</b> : ${mfText('automatiquement si aucune infraction pendant 1 an.', 'automatically if no violation for 1 year.', 'كتزادك تلقائيا إلا ما درتي حتى مخالفة لمدة سنة كاملة.')}</li>
        <li><b>${mfText('Totalité des 30 points', 'All 30 points', 'استرجاع 30 نقطة كاملة')}</b> : ${mfText('si aucune infraction pendant 3 années consécutives.', 'if no violation for 3 consecutive years.', 'إلا دازت 3 سنين بلا حتى مخالفة كترجع ليك 30 نقطة كاملة.')}</li>
        <li><b>+4 ${mfText('points', 'points', 'نقاط')}</b> : ${mfText('en effectuant une session d’éducation à la sécurité routière agréée par la NARSA.', 'after taking a road safety course.', 'بإجراء دورة التربية على السلامة الطرقية لدى مؤسسة مرخصة.')}</li>
      </ul>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 2. Fiche Réflexe Express : Pression Pneus & Huile
// ---------------------------------------------------------------------------
function renderQuickSpecs() {
  if ($('dialog').open) return;
  const isLogan = (data.vehicle?.name || '').toLowerCase().includes('dacia') || (data.vehicle?.name || '').toLowerCase().includes('logan');

  $('form').dataset.mode = 'quickSpecs';
  $('formtitle').textContent = mfText('Pression & Entretien Express', 'Tire Pressure & Quick Specs', 'ضغط العجلات والصيانة السريعة');
  $('form').innerHTML = `
    <div style="text-align:center;margin-bottom:12px">
      <span style="font-size:32px">🛞</span>
      <h3 style="margin:4px 0">${esc(data.vehicle?.name || 'Dacia Logan 1.5 dCi')}</h3>
      <small class="muted">${mfText('Recommandations constructeur pour station de gonflage et vidange', 'Manufacturer specifications for tire shop & oil change', 'المقاييس الموصى بها لمحطة نفخ العجلات وتغيير الزيت')}</small>
    </div>

    <!-- Pression des Pneus -->
    <div class="accent-card" style="margin-bottom:12px">
      <h3 style="margin-bottom:8px">🛞 ${mfText('Pression des Pneus (à froid)', 'Cold Tire Pressure', 'ضغط العجلات (على البارد)')}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="sub-box" style="text-align:center">
          <small class="muted">${mfText('Avant (Front)', 'Front', 'الأمام')}</small>
          <div class="val-green" style="font-size:20px">2.0 bar</div>
          <small class="muted">30 PSI ${isLogan ? '(2.2 chargé)' : ''}</small>
        </div>
        <div class="sub-box" style="text-align:center">
          <small class="muted">${mfText('Arrière (Rear)', 'Rear', 'الخلف')}</small>
          <div class="val-green" style="font-size:20px">2.0 bar</div>
          <small class="muted">30 PSI ${isLogan ? '(2.2 chargé)' : ''}</small>
        </div>
      </div>
      <div class="sub-box" style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
        <span>${mfText('Roue de secours', 'Spare tire', 'عجلة السكور الاحتياطية')} :</span>
        <span class="val-amber">2.5 bar <small class="muted">(36 PSI)</small></span>
      </div>
    </div>

    <!-- Huile & Moteur -->
    <div class="accent-card" style="margin-bottom:12px">
      <h3 style="margin-bottom:8px">🛢️ ${mfText('Huile Moteur & Capacités', 'Engine Oil & Capacities', 'زيت المحرك وسعة الخزان')}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
        <div style="display:flex;justify-content:space-between">
          <span class="muted">${mfText('Capacité avec filtre', 'Capacity with filter', 'سعة الزيت مع الفلتر')} :</span>
          <b>4.5 Litres</b>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span class="muted">${mfText('Viscosité préconisée', 'Recommended oil', 'نوع الزيت الموصى به')} :</span>
          <span class="val-green">5W-30 (RN0720 / C4)</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span class="muted">${mfText('Réservoir Gasoil', 'Fuel tank', 'سعة خزان المازوط')} :</span>
          <b>50 Litres (Gasoil 10)</b>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span class="muted">${mfText('Batterie recommandée', 'Battery', 'البطارية المناسبة')} :</span>
          <b>12V 60Ah à 70Ah</b>
        </div>
      </div>
    </div>

    <button type="button" class="primary" style="width:100%" onclick="$('dialog').close()">${mfText('Fermer', 'Close', 'إغلاق')}</button>
  `;
  $('form').onsubmit = e => e.preventDefault();
  $('dialog').showModal();
}

// ---------------------------------------------------------------------------
// 3. Alerte Intelligente « Vignette Maroc » (Majoration & Délais DGI)
// ---------------------------------------------------------------------------
function getMoroccoVignetteInfo(targetYear) {
  const currentDay = L.day();
  const year = targetYear || currentDay.slice(0, 4);
  const currentMonth = Number(currentDay.slice(5, 7));

  const fuelRaw = ((data.vehicle?.fuel || '') + ' ' + (data.vehicle?.name || '')).toLowerCase();
  const isDiesel = fuelRaw.includes('diesel') || fuelRaw.includes('dci') || fuelRaw.includes('gasoil') || fuelRaw.includes('hdi');
  const isElectric = fuelRaw.includes('electrique') || fuelRaw.includes('electric');

  const cv = Number(localStorage.getItem('autocarnet-vehicle-cv') || 6);

  let baseRate = 700;
  if (isElectric) {
    baseRate = 0;
  } else if (isDiesel) {
    if (cv < 8) baseRate = 700;
    else if (cv <= 10) baseRate = 1500;
    else if (cv <= 14) baseRate = 6000;
    else baseRate = 20000;
  } else {
    if (cv < 8) baseRate = 350;
    else if (cv <= 10) baseRate = 650;
    else if (cv <= 14) baseRate = 3000;
    else baseRate = 8000;
  }

  const paidEntry = (data.entries || []).find(e =>
    e.type === 'vignette' && (
      e.date.startsWith(year) ||
      (e.coverageStart && e.coverageStart.startsWith(year)) ||
      (e.coverageEnd && e.coverageEnd >= year + '-12-31')
    )
  );

  const isPaid = !!paidEntry;
  const deadline = year + '-01-31';
  const isLate = !isPaid && currentDay > deadline;
  const isJanuary = currentDay.startsWith(year + '-01');
  const isDecember = currentDay.startsWith(String(Number(year) - 1) + '-12');

  let penaltyForfait = 0;
  let majorationMois = 0;
  let monthsLate = 0;
  let totalWithPenalty = baseRate;

  if (isLate && baseRate > 0) {
    if (Number(currentDay.slice(0, 4)) === Number(year)) {
      monthsLate = Math.max(1, currentMonth - 1);
    } else if (Number(currentDay.slice(0, 4)) > Number(year)) {
      monthsLate = 12 * (Number(currentDay.slice(0, 4)) - Number(year)) + currentMonth - 1;
    }
    penaltyForfait = Math.max(100, Math.round(baseRate * 0.10));
    const extraMonths = Math.max(0, monthsLate - 1);
    const rateMajoration = 0.05 + (extraMonths * 0.005);
    majorationMois = Math.round(baseRate * rateMajoration);
    totalWithPenalty = baseRate + penaltyForfait + majorationMois;
  }

  return {
    year,
    cv,
    isDiesel,
    baseRate,
    isPaid,
    paidEntry,
    isLate,
    isJanuary,
    isDecember,
    monthsLate,
    penaltyForfait,
    majorationMois,
    totalWithPenalty,
    deadline
  };
}

function openVignetteQuickForm() {
  const info = getMoroccoVignetteInfo();
  openForm('vignette');

  if ($('cost')) $('cost').value = info.isLate ? info.totalWithPenalty : info.baseRate;
  if ($('date')) $('date').value = L.day();
  if ($('coverageStart')) $('coverageStart').value = info.year + '-01-01';
  if ($('coverageEnd')) $('coverageEnd').value = info.year + '-12-31';
  if ($('reminderDate')) $('reminderDate').value = (Number(info.year) + 1) + '-01-15';
  if ($('note')) $('note').value = 'Vignette Maroc ' + info.year + ' (' + info.cv + ' CV ' + (info.isDiesel ? 'Diesel' : 'Essence') + ')' + (info.isLate ? ' · payée en retard' : '');
}

function renderVignetteCard() {
  const info = getMoroccoVignetteInfo();

  let badgeHtml = '';
  let detailHtml = '';
  let actionHtml = '';

  if (info.isPaid) {
    badgeHtml = `<span class="road-check-badge ok">✓ ${mfText('Payée', 'Paid', 'مخلّصة')} (${info.year})</span>`;
    detailHtml = `
      <p class="val-green" style="margin:6px 0;font-size:13px">
        ✓ ${mfText('Vignette ' + info.year + ' en règle jusqu’au 31 Décembre ' + info.year + '.', 'Vignette ' + info.year + ' is valid until Dec 31, ' + info.year + '.', 'الضريبة السنوية لسنة ' + info.year + ' مخلصة وقانونية إلى غاية 31 دجنبر ' + info.year + '.')}
      </p>
      <small class="muted">${mfText('Montant réglé : ' + money(info.paidEntry.cost) + ' le ' + date(info.paidEntry.date), 'Paid: ' + money(info.paidEntry.cost) + ' on ' + date(info.paidEntry.date), 'المبلغ المؤدى: ' + money(info.paidEntry.cost) + ' بتاريخ ' + date(info.paidEntry.date))}</small>
    `;
  } else if (info.isLate) {
    badgeHtml = `<span class="road-check-badge due">🚨 ${mfText('Majoration Retard', 'Late Penalty', 'غرامة التأخير')}</span>`;
    detailHtml = `
      <p class="val-red" style="margin:6px 0;font-size:13px">
        ⚠️ ${mfText('La date limite du 31 Janvier est dépassée ! Une majoration légale de ' + (info.penaltyForfait + info.majorationMois) + ' DH s’applique.', 'Jan 31 deadline passed! Legal late fee of ' + (info.penaltyForfait + info.majorationMois) + ' DH applies.', 'فات أجل 31 يناير! كاين ذعيرة تأخير قانونية ديال ' + (info.penaltyForfait + info.majorationMois) + ' درهم.')}
      </p>
      <div class="sub-box" style="font-size:12px;margin:8px 0">
        <div>${mfText('Tarif de base', 'Base fee', 'الثمن الأصلي')} : <b>${info.baseRate} DH</b></div>
        <div>${mfText('Pénalité légale (10%)', 'Penalty (10%)', 'ذعيرة التأخير (10%)')} : <span class="val-red">+${info.penaltyForfait} DH</span></div>
        <div>${mfText('Majoration par mois de retard (' + info.monthsLate + ' m)', 'Monthly late fee', 'الزيادة الشهرية')} : <span class="val-red">+${info.majorationMois} DH</span></div>
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line);font-size:13px">
          <b>${mfText('Total estimé à payer', 'Total estimated', 'المجموع التقديري')} : <span class="val-amber">${info.totalWithPenalty} DH</span></b>
        </div>
      </div>
    `;
    actionHtml = `
      <button type="button" class="primary" style="width:100%" onclick="openVignetteQuickForm()">
        ＋ ${mfText('J’ai payé ma Vignette ' + info.year, 'I paid my Vignette', 'سجّل أداء الضريبة ديال ' + info.year)}
      </button>
    `;
  } else {
    badgeHtml = `<span class="road-check-badge warn">⏳ ${mfText('À régler avant 31 Janvier', 'Due Jan 31', 'قبل 31 يناير')}</span>`;
    detailHtml = `
      <p style="margin:6px 0;font-size:13px">
        ${mfText('Période officielle de paiement de la Vignette ' + info.year + ' (1er au 31 Janvier). Évitez les 10% + 5% de majoration !', 'Official Vignette payment period (Jan 1-31). Pay on time to avoid 10% + 5% penalty!', 'الفترة القانونية لأداء ضريبة السيارات ' + info.year + ' (من 1 إلى 31 يناير). خلّص قبل الأجل باش تفادى الغرامة!')}
      </p>
      <div style="font-size:14px;margin:6px 0">
        ${mfText('Tarif légal (' + info.cv + ' CV ' + (info.isDiesel ? 'Diesel' : 'Essence') + ')', 'Legal fee', 'التعريفة القانونية')} : <span class="val-green">${info.baseRate} DH</span>
      </div>
    `;
    actionHtml = `
      <button type="button" class="primary" style="width:100%" onclick="openVignetteQuickForm()">
        ＋ ${mfText('Enregistrer le paiement (' + info.baseRate + ' DH)', 'Record payment', 'تسجيل أداء الضريبة (' + info.baseRate + ' درهم)')}
      </button>
    `;
  }

  return `
    <article class="accent-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <h3 style="margin:0">💡 ${mfText('Vignette Maroc ' + info.year, 'Morocco Vignette ' + info.year, 'الضريبة السنوية على السيارات ' + info.year)}</h3>
        ${badgeHtml}
      </div>
      ${detailHtml}
      ${actionHtml}
      <button type="button" class="link" style="margin-top:8px;font-size:12px" onclick="renderVignetteSimulatorModal()">
        📊 ${mfText('Voir le barème officiel DGI Maroc & simulation', 'See official DGI tax scale', 'عرض جدول الضرائب وطريقة الحساب DGI')}
      </button>
    </article>
  `;
}

function renderVignetteSimulatorModal() {
  if ($('dialog').open) return;

  $('form').dataset.mode = 'vignetteSim';
  $('formtitle').textContent = mfText('Barème Vignette Maroc (DGI)', 'Morocco Vignette Tax Scale', 'جدول ضريبة السيارات بالمغرب');
  $('form').innerHTML = `
    <p class="muted" style="font-size:12px">
      ${mfText('Barème légal de la Taxe Spéciale Annuelle sur les Véhicules Automobiles (TSAVA) selon le Code Général des Impôts.', 'Official annual vehicle tax rates in Morocco according to the tax code.', 'التعريفة الرسمية للضريبة الخصوصية السنوية على السيارات حسب المدونة العامة للضرائب.')}
    </p>

    <div class="sub-box" style="margin-bottom:12px">
      <h4 class="val-green" style="margin:0 0 8px 0">⛽ ${mfText('Véhicules Diesel / Gasoil', 'Diesel vehicles', 'سيارات الديزل / المازوط')}</h4>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>Moins de 8 CV (ex: Dacia Logan 1.5 dCi) :</span> <b>700 DH</b>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>De 8 à 10 CV :</span> <b>1 500 DH</b>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>De 11 à 14 CV :</span> <b>6 000 DH</b>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>15 CV et plus :</span> <b>20 000 DH</b>
      </div>
    </div>

    <div class="sub-box" style="margin-bottom:12px">
      <h4 class="val-amber" style="margin:0 0 8px 0">⚡ ${mfText('Véhicules Essence', 'Petrol vehicles', 'سيارات البنزين / ليصانص')}</h4>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>Moins de 8 CV :</span> <b>350 DH</b>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>De 8 à 10 CV :</span> <b>650 DH</b>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>De 11 à 14 CV :</span> <b>3 000 DH</b>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
        <span>15 CV et plus :</span> <b>8 000 DH</b>
      </div>
    </div>

    <div class="note" style="font-size:12px;line-height:1.5">
      <b>💡 ${mfText('Règle des Majorations de Retard :', 'Late Penalty Rules:', 'قاعدة ذعيرة التأخير:')}</b><br>
      • ${mfText('Paiement entre le 1er et le 31 Janvier : Tarif normal sans frais.', 'Payment Jan 1-31: Normal fee without penalty.', 'الأداء بين 1 و31 يناير: التعريفة العادية بلا زيادة.')}<br>
      • ${mfText('Après le 31 Janvier : <b>10% de pénalité</b> + <b>5% pour le 1er mois</b> (Février) + <b>0,5% par mois supplémentaire</b> (minimum 100 DH).', 'After Jan 31: 10% penalty + 5% first month + 0.5% per month extra.', 'من بعد 31 يناير: 10% ذعيرة + 5% للشهر الأول + 0.5% لكل شهر إضافي (أدنى ذعيرة 100 درهم).')}<br>
      • ${mfText('Où payer ? Agences bancaires, GAB, applications m-banking (Attijari, CIH, Chaabi...) ou points de proximité (Tasshilat, Barid Cash).', 'Where to pay? Bank apps, ATMs, or cash agencies.', 'فين تخلّص؟ تطبيقات البنوك m-banking، الصراف الآلي GAB، تسهيلات أو بريد كاش.')}
    </div>

    <button type="button" class="primary" style="width:100%;margin-top:10px" onclick="$('dialog').close()">${mfText('Fermer', 'Close', 'إغلاق')}</button>
  `;
  $('form').onsubmit = e => e.preventDefault();
  $('dialog').showModal();
}

// ---------------------------------------------------------------------------
// 4. Simulateur Frais de Carte Grise & Mutation (Barid Cash / NARSA) + Passeport Revente Avito
// ---------------------------------------------------------------------------
function shareResaleWhatsApp() {
  const excluded = ['fuel', 'reading', 'incident', 'checkup', 'insurance', 'vignette', 'parking', 'wash'];
  const entries = L.sorted(data).reverse().filter(e => !excluded.includes(e.type)).slice(0, 12);
  const km = currentKm();
  const cons = L.consumption(data);

  const lines = [
    '🚗 *FICHE D’ENTRETIEN CERTIFIÉE · AUTOCARNET*',
    '🚘 *Véhicule* : ' + (data.vehicle?.name || 'Dacia Logan 1.5 dCi'),
    '⛽ *Motorisation* : ' + (data.vehicle?.fuel || 'Diesel'),
    '🛣️ *Kilométrage actuel* : ' + (km ? n(km) + ' km' : '—'),
    cons ? ('📊 *Consommation réelle* : ' + n(cons, 2) + ' L/100 km') : '',
    '------------------------',
    '🛠️ *DERNIERS ENTRETIENS SUIVIS* :'
  ].filter(Boolean);

  if (entries.length === 0) {
    lines.push('• Entretien régulier à jour');
  } else {
    for (const e of entries) {
      lines.push('• ' + e.date + ' (' + (e.hasKm === false ? '—' : n(e.km) + ' km') + ') : *' + (labels[e.type] || e.type) + '*' + (e.note ? ' — ' + e.note : ''));
    }
  }

  lines.push('------------------------');
  lines.push('✅ _Historique complet et factures vérifiables sur AutoCarnet_');

  const text = lines.join('\n');
  if (window.Android?.shareText) {
    Android.shareText(text, 'Passeport Revente AutoCarnet');
  } else {
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
  }
}

function renderMutationSimulatorCard() {
  const cv = Number(localStorage.getItem('autocarnet-vehicle-cv') || 6);
  const droitBase = (50 * cv) + 305;
  const visiteMutation = 250;
  const fraisBarid = 110;
  const totalEstime = droitBase + visiteMutation + fraisBarid;

  return `
    <div class="accent-card" style="margin-top:16px">
      <h2>💰 ${mfText('Simulateur Frais de Carte Grise & Mutation (NARSA / Barid Cash)', 'Registration Transfer Fee Simulator (Morocco)', 'حساب مصاريف تحويل البطاقة الرمادية (بريد كاش / نارسا)')}</h2>
      <p class="muted">${mfText('Calcul des frais officiels de changement de propriétaire au Maroc (Formule NARSA : 50 DH × CV + 305 DH).', 'Official ownership transfer fee calculation in Morocco.', 'حساب واجبات التسجيل وتحويل الملكية للسيارات المستعملة بالمغرب.')}</p>
      
      <label for="mutationCvSelect">${mfText('Puissance fiscale (Chevaux fiscaux - CV)', 'Fiscal horsepower (CV)', 'القوة الجبائية (الخيل CV)')}</label>
      <select id="mutationCvSelect" onchange="localStorage.setItem('autocarnet-vehicle-cv', this.value);render()">
        ${[4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16].map(n => `<option value="${n}" ${cv === n ? 'selected' : ''}>${n} CV ${n === 6 ? '(ex: Dacia Logan 1.5 dCi)' : ''}</option>`).join('')}
      </select>

      <div class="sub-box" style="margin-top:12px;font-size:13px">
        <div style="display:flex;justify-content:space-between;margin:4px 0">
          <span class="muted">${mfText('Droits de mutation NARSA (50 × ' + cv + ' + 305)', 'NARSA transfer fee', 'واجبات التسجيل نارسا')} :</span>
          <span class="val-green">${droitBase} DH</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin:4px 0">
          <span class="muted">${mfText('Visite technique spéciale mutation (env.)', 'Transfer inspection (approx.)', 'الفحص التقني الخاص بالبيع (تقريبا)')} :</span>
          <b>~${visiteMutation} DH</b>
        </div>
        <div style="display:flex;justify-content:space-between;margin:4px 0">
          <span class="muted">${mfText('Frais de dossier Barid Cash / Al Barid Bank', 'Barid Cash service fee', 'مصاريف ملف بريد كاش')} :</span>
          <b>~${fraisBarid} DH</b>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-size:15px">
          <b>${mfText('Budget total estimé (Acheteur)', 'Total estimated budget', 'الميزانية الإجمالية التقديرية')} :</b>
          <span class="val-amber">~${totalEstime} DH</span>
        </div>
      </div>

      <details class="precode-box">
        <summary>📋 ${mfText('Les 4 étapes obligatoires de vente/achat au Maroc', '4 mandatory steps in Morocco', 'المراحل الـ 4 الإجبارية للبيع والشراء بالمغرب')}</summary>
        <ol style="font-size:12px;line-height:1.6;margin:8px 0;padding-inline-start:18px" class="muted">
          <li><b>${mfText('Visite technique de mutation', 'Transfer inspection', 'الفحص التقني للبيع')}</b> : ${mfText('Effectuer le contrôle technique spécial vente dans un centre agréé.', 'Perform transfer inspection at an approved center.', 'إجراء الفحص التقني الخاص بنقل الملكية.')}</li>
          <li><b>mutationvehicule.ma</b> : ${mfText('Saisir la déclaration de vente en ligne sur le portail NARSA et imprimer le formulaire.', 'Fill online declaration on mutationvehicule.ma.', 'التصريح بالبيع عبر منصة mutationvehicule.ma وطبع الاستمارة.')}</li>
          <li><b>${mfText('Légalisation (Moqataâ)', 'Signature legalization', 'المصادقة على الإمضاء بالمقاطعة')}</b> : ${mfText('Légaliser l’engagement par le vendeur et l’acheteur (sans dettes ni opposition).', 'Legalize signatures of seller and buyer.', 'تصحيح الإمضاء من طرف البائع والمشتري في المقاطعة.')}</li>
          <li><b>${mfText('Dépôt Barid Cash (sous 30 jours)', 'Barid Cash submission (within 30 days)', 'إيداع الملف فبريد كاش (أقل من 30 يوم)')}</b> : ${mfText('Déposer le dossier complet et récupérer le récépissé provisoire valable 60 jours.', 'Submit complete file at Barid Cash.', 'إيداع الملف في بريد كاش واستلام الوصل المؤقت الصالح لـ 60 يوما.')}</li>
        </ol>
      </details>

      <button type="button" class="primary btn-whatsapp" style="width:100%;margin-top:12px" onclick="shareResaleWhatsApp()">
        💬 ${mfText('Partager le Passeport Revente (Avito / WhatsApp)', 'Share Resale Passport on WhatsApp', 'مشاركة ملخص الصيانة للبيع عبر واتساب / أفيتو')}
      </button>
    </div>
  `;
}
