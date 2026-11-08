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
    ${items}
    <button class="secondary" style="width:100%;margin-top:10px" onclick="navigate('pocket')">← ${pt('Retour à My Pocket', 'Back to My Pocket', 'الرجوع إلى وثائقي')}</button>
  `;
}

