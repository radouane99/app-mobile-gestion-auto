'use strict';

// A reading has a date but no time. Keep each day's observed range.
function drivingMonth(vehicle, entries, period) {
  const samples = new Map();
  function record(date, km) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(km) || km < 0) return;
    const range = samples.get(date) || {date, min: km, max: km};
    range.min = Math.min(range.min, km);
    range.max = Math.max(range.max, km);
    samples.set(date, range);
  }
  if (vehicle.baselineKm > 0) record(vehicle.baselineDate, vehicle.baselineKm);
  for (const entry of entries) if (entry.hasKm !== false) record(entry.date, entry.km);
  const ranges = [...samples.values()].sort((a,b) => a.date.localeCompare(b.date));
  const days = new Map(), gaps = [];
  let known = 0, previous = null;
  for (const range of ranges) {
    if (range.date.startsWith(period)) {
      let daily = null, rawDelta = 0, spanDays = 1;
      known += range.max - range.min;
      if (previous && previous.max <= range.min) {
        const span = Math.max(1, Math.round((Date.parse(range.date) - Date.parse(previous.date)) / 86400000));
        spanDays = span;
        rawDelta = range.max - previous.max;
        if (previous.date.startsWith(period)) known += range.min - previous.max;
        if (span === 1) {
          daily = range.max - previous.max;
        } else if (span <= 3) {
          daily = Math.round((range.max - previous.max) / span);
          gaps.push({start:previous.date,end:range.date,km:range.min-previous.max,span});
        } else {
          gaps.push({start:previous.date,end:range.date,km:range.min-previous.max,span});
        }
      } else if (!previous && range.max > range.min) {
        daily = range.max - range.min;
        rawDelta = daily;
      }
      days.set(range.date, {...range, daily, rawDelta, spanDays, fromDate: previous ? previous.date : range.date});
    }
    previous = range;
  }
  const measured = [...days.values()].filter(day => day.daily !== null);
  const peak = measured.length ? Math.max(...measured.map(day => day.daily)) : 0;
  return {days,gaps,known,peak};
}

function analyzeMonthlyKm(vehicle, entries, period) {
  const samples = new Map();
  function record(date, km) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(km) || km < 0) return;
    const range = samples.get(date) || {date, min: km, max: km};
    range.min = Math.min(range.min, km);
    range.max = Math.max(range.max, km);
    samples.set(date, range);
  }
  if (vehicle?.baselineKm > 0) record(vehicle.baselineDate, vehicle.baselineKm);
  for (const entry of (entries || [])) if (entry.hasKm !== false) record(entry.date, entry.km);
  const ranges = [...samples.values()].sort((a,b) => a.date.localeCompare(b.date));

  const measuredRate = (typeof L !== 'undefined' && L.consumption) ? L.consumption(data) : null;
  const rate = (measuredRate && measuredRate > 0) ? measuredRate : 4.8; // 4.8 L/100km repère Dacia Logan 1.5 dCi
  const fuels = (entries || []).filter(e => e.type === 'fuel' && e.liters > 0 && e.cost > 0).sort((a,b) => a.date.localeCompare(b.date));
  const lastFuel = fuels.at(-1);
  const pricePerLiter = lastFuel ? (lastFuel.cost / lastFuel.liters) : 12.5;

  const intervals = [];
  let previous = null;
  for (const range of ranges) {
    if (previous && range.max >= previous.max) {
      const km = range.max - previous.max;
      const spanDays = Math.max(1, Math.round((Date.parse(range.date) - Date.parse(previous.date)) / 86400000));
      const kmPerDay = Math.round(km / spanDays);
      if (range.date.startsWith(period) && km > 0) {
        const liters = (km * rate) / 100;
        const cost = liters * pricePerLiter;
        intervals.push({
          fromDate: previous.date,
          toDate: range.date,
          fromKm: previous.max,
          toKm: range.max,
          km,
          spanDays,
          kmPerDay,
          liters,
          cost
        });
      }
    } else if (!previous && range.date.startsWith(period) && range.max > range.min) {
      const km = range.max - range.min;
      const liters = (km * rate) / 100;
      const cost = liters * pricePerLiter;
      intervals.push({
        fromDate: range.date,
        toDate: range.date,
        fromKm: range.min,
        toKm: range.max,
        km,
        spanDays: 1,
        kmPerDay: km,
        liters,
        cost
      });
    }
    previous = range;
  }

  const totalKm = intervals.reduce((s, x) => s + x.km, 0);
  const totalDays = intervals.reduce((s, x) => s + x.spanDays, 0);
  const avgKmPerDay = totalDays > 0 ? Math.round(totalKm / totalDays) : 0;
  const totalLiters = (totalKm * rate) / 100;
  const totalEstCost = totalLiters * pricePerLiter;

  const peakByDay = intervals.length
    ? [...intervals].sort((a, b) => b.kmPerDay - a.kmPerDay || b.km - a.km)[0]
    : null;
  const peakByRawKm = intervals.length
    ? [...intervals].sort((a, b) => b.km - a.km || b.kmPerDay - a.kmPerDay)[0]
    : null;
  const lastPoint = ranges.at(-1) || null;

  return {
    period,
    rate,
    measuredRate: measuredRate !== null,
    pricePerLiter,
    intervals,
    totalKm,
    totalDays,
    avgKmPerDay,
    totalLiters,
    totalEstCost,
    peakByDay,
    peakByRawKm,
    lastPoint
  };
}

function previewQuickDashboardKm() {
  const input = $('dashQuickKm');
  const dateInput = $('dashQuickDate');
  const box = $('dashQuickPreview');
  if (!input || !box) return;
  const val = Number(input.value);
  const dateVal = dateInput?.value || L.day();
  const info = analyzeMonthlyKm(data.vehicle, data.entries, dateVal.slice(0, 7));
  const prevKm = info.lastPoint ? info.lastPoint.max : (data.vehicle?.baselineKm || 0);
  const prevDate = info.lastPoint ? info.lastPoint.date : (data.vehicle?.baselineDate || dateVal);

  if (!input.value || !Number.isFinite(val) || val <= 0) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  if (val < prevKm && dateVal >= prevDate) {
    box.innerHTML = `<span class="val-red">⚠️ ${easyWords(
      `Inférieur au dernier compteur (${n(prevKm)} km). Il manque encore ${n(prevKm - val)} km.`,
      `Lower than last odometer (${n(prevKm)} km).`,
      `أقل من آخر عداد (${n(prevKm)} كم).`
    )}</span>`;
    return;
  }
  const deltaKm = Math.max(0, val - prevKm);
  const spanDays = Math.max(1, Math.round((Date.parse(dateVal) - Date.parse(prevDate)) / 86400000));
  const perDay = Math.round(deltaKm / spanDays);
  const liters = (deltaKm * info.rate) / 100;
  const cost = liters * info.pricePerLiter;
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
      <b class="val-green">➕ +${n(deltaKm)} km ${spanDays > 1 ? `(${spanDays} ${easyWords('jours', 'days', 'أيام')} · ${n(perDay)} km/${easyWords('j', 'd', 'يوم')})` : `(${easyWords('sur 1 jour', 'in 1 day', 'فنهار واحد')})`}</b>
      <span class="val-amber" style="font-weight:700">⛽ ≈ ${n(liters, 1)} L · ≈ ${n(cost, 0)} DH</span>
    </div>
  `;
}

function bumpQuickDashboardKm(addKm) {
  const input = $('dashQuickKm');
  if (!input) return;
  const base = currentKm() || 0;
  const currentVal = Number(input.value);
  input.value = (Number.isFinite(currentVal) && currentVal >= base ? currentVal : base) + addKm;
  previewQuickDashboardKm();
}

function saveQuickDashboardKm(event) {
  if (event) event.preventDefault();
  const kmVal = Number($('dashQuickKm')?.value);
  const dateVal = $('dashQuickDate')?.value || L.day();
  if (!Number.isSafeInteger(kmVal) || kmVal <= 0 || kmVal > 9999999 || !dateVal || dateVal > L.day()) {
    toast(easyWords('Vérifiez le compteur et la date.', 'Check odometer and date.', 'تأكد من العداد والتاريخ.'));
    return;
  }
  const points = [...(hasOdometer() ? [{date: data.vehicle.baselineDate, km: data.vehicle.baselineKm}] : []), ...data.entries.filter(e => e.hasKm !== false)];
  if (points.some(e => (e.date < dateVal && e.km > kmVal) || (e.date > dateVal && e.km < kmVal)) || points.some(e => e.date === dateVal && e.km > kmVal)) {
    toast(easyWords('Ce compteur est inférieur au dernier relevé enregistré.', 'Odometer is lower than the last reading.', 'هاد العداد أقل من آخر قراءة مسجلة.'));
    return;
  }
  const oldEntries = data.entries, oldVehicle = data.vehicle, previous = currentKm(), first = !hasOdometer();
  if (first) data.vehicle = {...data.vehicle, baselineKm: kmVal, baselineDate: dateVal};
  data.entries = [...data.entries, {
    id: crypto.randomUUID(),
    type: 'reading',
    date: dateVal,
    km: kmVal,
    cost: 0,
    hasKm: true,
    note: 'Relevé compteur rapide',
    photos: []
  }];
  if (!L.valid(data) || !save()) {
    data.entries = oldEntries;
    data.vehicle = oldVehicle;
    toast(easyWords('Erreur lors de l’enregistrement.', 'Could not save reading.', 'خطأ فالتسجيل.'));
    return;
  }
  const diff = kmVal - previous;
  render();
  toast(first
    ? easyWords('Compteur de départ enregistré !', 'Starting odometer saved!', 'تم تسجيل عداد البداية!')
    : `✓ +${n(diff)} km ${easyWords('ajoutés au suivi du mois !', 'added to monthly tracker!', 'تزادت فمتابعة الشهر!')}`
  );
}

function renderKmTrackerCard(period = L.day().slice(0, 7)) {
  const info = analyzeMonthlyKm(data.vehicle, data.entries, period);
  const curKm = currentKm();
  const lastDateStr = info.lastPoint ? date(info.lastPoint.date) : '—';
  const daysSinceLast = info.lastPoint
    ? Math.max(0, Math.round((Date.parse(L.day()) - Date.parse(info.lastPoint.date)) / 86400000))
    : null;

  const peak = info.peakByDay;
  const maxKm = info.intervals.length ? Math.max(...info.intervals.map(x => x.km)) : 1;
  const recentIntervals = [...info.intervals].reverse().slice(0, 5);

  return `
    <section class="card accent-card" style="border-left:4px solid #28748c;margin:12px 0">
      <div class="row" style="align-items:flex-start;gap:8px">
        <div>
          <span class="badge" style="background:#0e2a38;color:#7fd4ea;margin-bottom:4px;display:inline-block">
            📈 ${easyWords('SUIVI KM & JOUR RECORD', 'KM TRACKER & PEAK DAY', 'متابعة الكيلومترات وأعلى يوم')}
          </span>
          <h3 style="margin:2px 0">${easyWords('Kilométrage & Jour le plus consommé', 'Mileage & Highest Km Day', 'العداد والنهار اللي ضربتي فيه الطريق بزاف')}</h3>
        </div>
        <div style="text-align:right">
          <strong style="font-size:16px" class="val-green">${curKm > 0 ? n(curKm) + ' km' : '—'}</strong>
          <small style="display:block;font-size:11px;color:var(--muted)">
            ${daysSinceLast === 0
              ? easyWords('Relevé aujourd’hui', 'Updated today', 'تسجّل اليوم')
              : daysSinceLast === 1
                ? easyWords('Hier', 'Yesterday', 'البارح')
                : daysSinceLast !== null
                  ? easyWords(`Il y a ${daysSinceLast} j`, `${daysSinceLast}d ago`, `قبل ${daysSinceLast} أيام`)
                  : lastDateStr}
          </small>
        </div>
      </div>

      <form onsubmit="saveQuickDashboardKm(event)" class="sub-box" style="margin-top:10px;padding:10px">
        <label for="dashQuickKm" style="font-size:12px;font-weight:700;margin-bottom:4px;display:block">
          ⏱️ ${easyWords('Entrer le compteur (chaque 1 ou 2 jours) · Calcul auto :', 'Enter odometer (every 1–2 days) · Auto-calculates:', 'دخّل العداد (كل نهار أو يومين) · كيحسب راسو:')}
        </label>
        <div style="display:flex;gap:6px;align-items:center">
          <input id="dashQuickKm" type="number" min="${curKm || 0}" max="9999999" step="1" inputmode="numeric"
            placeholder="${curKm > 0 ? easyWords('Ex. ' + (curKm + 45), 'e.g. ' + (curKm + 45), 'مثال: ' + (curKm + 45)) : 'Ex. 64084'}"
            oninput="previewQuickDashboardKm()"
            style="flex:1.4;margin:0;font-weight:700;font-size:15px">
          <input id="dashQuickDate" type="date" value="${L.day()}" max="${L.day()}"
            onchange="previewQuickDashboardKm()"
            style="flex:1;margin:0;font-size:12px;padding:10px 6px">
          <button type="submit" class="primary" style="width:auto;margin:0;padding:10px 14px;font-weight:800">✓ OK</button>
        </div>
        <div class="quick" style="grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px">
          ${[20, 50, 100, 200].map( inc => `
            <button type="button" class="secondary" style="padding:6px 4px;font-size:11px;font-weight:700;margin:0" onclick="bumpQuickDashboardKm(${inc})">+${inc} km</button>
          `).join('')}
        </div>
        <div id="dashQuickPreview" class="precode-box" hidden style="margin-top:8px;padding:8px 10px;font-size:12px"></div>
      </form>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">
        <div class="sub-box" style="text-align:center;padding:8px 4px">
          <small style="font-size:11px;color:var(--muted);display:block">${easyWords('Ce mois-ci', 'This month', 'هاد الشهر')}</small>
          <strong style="font-size:15px">${n(info.totalKm)} km</strong>
        </div>
        <div class="sub-box" style="text-align:center;padding:8px 4px">
          <small style="font-size:11px;color:var(--muted);display:block">${easyWords('Moyenne / jour', 'Avg / day', 'المعدل / يوم')}</small>
          <strong style="font-size:15px">${n(info.avgKmPerDay)} km/j</strong>
        </div>
        <div class="sub-box" style="text-align:center;padding:8px 4px">
          <small style="font-size:11px;color:var(--muted);display:block">${easyWords('Gasoil estimé', 'Est. diesel', 'المازوط المقدر')}</small>
          <strong style="font-size:15px" class="val-amber">≈ ${n(info.totalLiters, 1)} L</strong>
        </div>
      </div>

      ${peak ? `
        <div class="precode-box" style="margin-top:10px;border-left:4px solid #f59e0b">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:800" class="val-amber">
              🏆 ${easyWords('JOUR RECORD DU MOIS (Plus gros km)', 'PEAK DAY OF THE MONTH', 'أعلى يوم فالشهر (أكثر كيلومترات)')}
            </span>
            <span class="badge due" style="font-size:11px">🔥 ${n(peak.kmPerDay)} km / ${easyWords('jour', 'day', 'يوم')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;flex-wrap:wrap;gap:8px">
            <div>
              <strong style="font-size:16px">+${n(peak.km)} km</strong>
              <small style="color:var(--muted);margin-left:4px">
                (${peak.spanDays === 1
                  ? date(peak.toDate)
                  : `${date(peak.fromDate)} → ${date(peak.toDate)} · ${peak.spanDays} ${easyWords('jours', 'days', 'أيام')}`})
              </small>
            </div>
            <div style="font-size:12px;font-weight:700" class="val-green">
              ⛽ ≈ ${n(peak.liters, 1)} L · ≈ ${n(peak.cost, 0)} DH
            </div>
          </div>
        </div>
      ` : `
        <p class="muted" style="margin-top:10px;font-size:12px">
          💡 ${easyWords(
            'Entrez votre compteur ci-dessus tous les 1 ou 2 jours : l’application calculera automatiquement vos kilomètres par jour et détectera le jour où vous avez le plus roulé.',
            'Enter your odometer every 1–2 days above: the app will automatically compute your daily km and highlight your peak driving day.',
            'دخّل العداد الفوق كل نهار أو يومين: التطبيق غادي يحسب راسو شحال ضربتي من كيلومتر ويبيّن ليك النهار اللي سقتي فيه بزاف.'
          )}
        </p>
      `}

      ${recentIntervals.length > 0 ? `
        <details style="margin-top:10px" ${recentIntervals.length <= 3 ? 'open' : ''}>
          <summary style="font-size:12px;font-weight:700;cursor:pointer">
            📊 ${easyWords(`Détail des relevés de ${period} (${info.intervals.length})`, `Readings in ${period} (${info.intervals.length})`, `تفاصيل قراءات الكيلومترات (${info.intervals.length})`)}
          </summary>
          <div style="margin-top:8px;display:grid;gap:6px">
            ${recentIntervals.map(item => {
              const isRecord = peak && item.toDate === peak.toDate && item.km === peak.km;
              const pct = Math.max(8, Math.round((item.km / maxKm) * 100));
              return `
                <div class="sub-box" style="padding:8px 10px;margin:0">
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
                    <span>
                      <b>${date(item.toDate)}</b>
                      <small style="color:var(--muted)">
                        ${item.spanDays > 1 ? `(${item.spanDays}j · ${n(item.kmPerDay)} km/j)` : `(${easyWords('1 jour', '1 day', 'نهار واحد')})`}
                      </small>
                      ${isRecord ? `<span class="badge due" style="font-size:10px;padding:1px 6px;margin-left:4px">🏆 Record</span>` : ''}
                    </span>
                    <span>
                      <strong class="val-green">+${n(item.km)} km</strong>
                      <small style="color:var(--muted)"> · ≈ ${n(item.liters, 1)} L</small>
                    </span>
                  </div>
                  <div class="progress" style="height:6px;margin-top:5px">
                    <i style="width:${pct}%;background:${isRecord ? '#f59e0b' : '#28748c'}"></i>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </details>
      ` : ''}
    </section>
  `;
}

function renderDrivingCalendar() {
  if (page !== 'stats' || financeAnnual || needsSetup()) return;
  const words = easyWords;
  const stats = drivingMonth(data.vehicle,data.entries,month);
  const [year, number] = month.split('-').map(Number);
  const count = new Date(year,number,0).getDate();
  const offset = (new Date(year,number-1,1).getDay()+6)%7;
  const host = document.createElement('section');
  host.className = 'card';host.id='drivingCalendar';
  host.style.margin = '14px 0';
  const locale = appLanguage === 'ar' ? 'ar-MA' : appLanguage === 'en' ? 'en-GB' : 'fr-FR';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin:12px 0';
  for (let i=0;i<7;i++) {
    const label=document.createElement('small');
    label.textContent=new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(2026,5,1+i));
    label.style.textAlign='center'; grid.append(label);
  }
  for(let i=0;i<offset;i++) grid.append(document.createElement('span'));
  const km = value => new Intl.NumberFormat(locale).format(value)+' km';
  const observation = words('Entre deux relevés consécutifs','Between consecutive daily readings','بين قراءتين في يومين متتاليين');
  const dayLabel = words('Aucun relevé','No reading','ما كايناش قراءة');
  const dates = [...stats.days.keys()];
  host.innerHTML='<h2>'+words('Ma conduite du mois','My driving this month','السياقة ديالي هاد الشهر')+'</h2>';
  const total = document.createElement('p');
  total.textContent = dates.length ? words('Distance observée','Observed distance','المسافة المسجّلة')+' · '+km(stats.known)+' ('+dates[0]+' → '+dates[dates.length-1]+')' : words('Enregistrez un compteur pour commencer.','Add a reading to start.','سجّل العداد باش تبدا.');
  host.append(total);
  if (dates.length === 1 && stats.known === 0) {
    total.textContent = words('Premier relevé du mois','First reading this month','أول قراءة فهاد الشهر')+' · '+dates[0]+' · '+km(stats.days.get(dates[0]).max);
  }
  if (dates.length >= 2) {
    const priorDate = new Date(Date.UTC(year,number-2,1));
    const prior = drivingMonth(data.vehicle,data.entries,priorDate.toISOString().slice(0,7));
    const priorDates = [...prior.days.keys()];
    if (priorDates.length >= 2 && priorDates[0].slice(-2) === dates[0].slice(-2)
        && priorDates[priorDates.length-1].slice(-2) === dates[dates.length-1].slice(-2)) {
      const comparison = document.createElement('p'), change=stats.known-prior.known;
      comparison.textContent=words('Écart avec les mêmes dates du mois précédent','Change over the same dates last month','الفرق على نفس الأيام فالشهر اللي فات')+' · '+(change>0?'+':'')+km(change);
      host.append(comparison);
    }
  }
  const info=document.createElement('p');info.setAttribute('aria-live','polite');
  info.textContent=words('Touchez un jour. Plus la couleur est foncée, plus la distance entre les relevés est élevée.','Tap a day. Darker colours mean a longer distance between readings.','ضغط على نهار. اللون الغامق كيعني مسافة أكثر بين القراءات.');
  for(let i=1;i<=count;i++){
    const date=month+'-'+String(i).padStart(2,'0'), day=stats.days.get(date);
    const button=document.createElement('button');button.type='button';button.textContent=String(i);
    button.style.cssText='padding:5px 0;min-width:0;min-height:37px;border-radius:8px';
    if(day && day.daily!==null){
      const fraction=stats.peak?day.daily/stats.peak:0;
      button.style.background=fraction>.65?'#146758':fraction>.25?'#a5d9c9':'#e2f0e9';
      button.style.color=fraction>.65?'white':'#102d26';
    } else if(day) button.style.border='2px solid #328a75';
    const description= !day ? dayLabel : words('Compteur','Odometer','العداد')+' '+km(day.max)+(day.daily!==null?' · '+observation+' '+km(day.daily):'');
    button.setAttribute('aria-label',date+' · '+description);
    button.onclick=()=>{
      info.textContent=date+' · '+description;
      if(!day||day.daily===null||day.daily<=0)return;
      const key=drivingTagKey(day), select=document.createElement('select');
      select.setAttribute('aria-label',words('Type de conduite','Driving type','نوع التنقل'));
      const options=[['',words('Non classé','Unclassified','بلا تصنيف')],['trip',words('Voyage','Trip','سفرة')],['ordinary',words('Trajet habituel','Usual driving','تنقل عادي')]];
      for(const [value,text] of options)select.add(new Option(text,value));
      select.value=data.drivingTags?.[key]||'';
      select.onchange=()=>{const previous=data.drivingTags;data.drivingTags={...previous};if(select.value)data.drivingTags[key]=select.value;else delete data.drivingTags[key];if(!save()){data.drivingTags=previous;select.value=previous?.[key]||'';return;}render();};
      info.append(select);
    };grid.append(button);
  }
  host.append(grid,info);
  const measured=[...stats.days.values()].filter(day=>day.daily>0);
  const trips=measured.filter(day=>data.drivingTags?.[drivingTagKey(day)]==='trip');
  if(trips.length){const text=document.createElement('p');text.textContent=words('Intervalles classés voyage','Intervals marked as trips','المسافات اللي علّمتي عليها سفر')+' · '+km(trips.reduce((sum,d)=>sum+d.daily,0));host.append(text);}
  const possible=measured.filter(day=>{
    if(data.drivingTags?.[drivingTagKey(day)])return false;
    const prior=recentDrivingDays(day.date).filter(d=>d.date<day.date&&d.daily>0).map(d=>d.daily).sort((a,b)=>a-b);
    return prior.length>=3 && day.daily>=2*prior[Math.floor(prior.length/2)];
  }).pop();
  if(possible){const hint=document.createElement('button');hint.className='link';hint.textContent=possible.date+' · '+km(possible.daily)+' · '+words('Était-ce un voyage ?','Was this a trip?','واش كانت سفرة؟');hint.onclick=()=>{const target=grid.querySelector('button[aria-label^="'+possible.date+'"]');target.click();info.scrollIntoView({block:'center'});};host.append(hint);}
  if(stats.peak>0){
    const peak=document.createElement('p');
    peak.textContent=words('Plus grand écart sur deux jours consécutifs','Largest consecutive-day interval','أكبر مسافة بين قراءتين يوميتين')+' · '+km(stats.peak)+' · '+[...stats.days.values()].filter(d=>d.daily===stats.peak).map(d=>d.date).join(', ');
    host.append(peak);
  }
  if(stats.gaps.length){
    const details=document.createElement('details'),summary=document.createElement('summary');
    summary.textContent=words('Distances sur plusieurs jours','Multi-day distances','المسافات اللي دازت فعدة أيام');details.append(summary);
    for(const gap of stats.gaps){const line=document.createElement('p');line.textContent=gap.start+' → '+gap.end+' · '+km(gap.km);details.append(line);}
    host.append(details);
  }
  const add=document.createElement('button');add.className='secondary';
  add.textContent=words('Relever mon compteur','Record odometer','نسجّل العداد');add.onclick=()=>openForm('reading');host.append(add);
  const label=document.createElement('label'),toggle=document.createElement('input');label.className='check';toggle.type='checkbox';toggle.checked=data.drivingReminder===true;
  label.append(toggle,document.createTextNode(words('Rappel tous les 2 jours sans relevé','Remind me after 2 days without a reading','فكّرني كل يومين إلا ما سجّلتش العداد')));
  toggle.onchange=()=>{const old=data.drivingReminder;data.drivingReminder=toggle.checked;if(!save()){data.drivingReminder=old;toggle.checked=old===true;return;}if(toggle.checked)toggleNotifications(true);};
  host.append(label);
  const trackerBox = document.createElement('div');
  trackerBox.innerHTML = typeof renderKmTrackerCard === 'function' ? renderKmTrackerCard(month) : '';
  const pdfBtn = $('main').querySelector('button[onclick^="financePdf"]');
  if (pdfBtn) {
    if (trackerBox.firstElementChild) pdfBtn.before(trackerBox.firstElementChild);
    pdfBtn.before(host);
  }
}
