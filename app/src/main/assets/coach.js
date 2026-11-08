'use strict';
const coachModes={city:'Ville',highway:'Autoroute',road:'Route',mixed:'Mixte',unknown:'Non précisé'},coachStatus={usual:'Proche de votre repère',high:'Au-dessus de votre repère',repeated:'Hausse répétée à vérifier',low:'Plus bas : relevés à confirmer',learning:'Apprentissage en cours',context:'Profil / contexte à compléter',short:'Mesure trop courte'};
const coachSource='https://www.renault.fr/faq-apres-vente.html';
function normalizeCoachData(d){const p=d?.coachProfile;if(!p||typeof p!=='object')return;p.phase??='';p.finish??='';p.forwardGears??=0;p.reverseGear??=true;p.catalogConfirmed=false;p.claimedPowerHp??=null;p.technicalType??='';p.fiscalCv??=null;p.cylinders??=null;p.seats??=null;}
function coachContext(c){return [coachModes[c.mode],c.traffic==='heavy'?'embouteillages':c.traffic==='normal'?'trafic habituel':'trafic non précisé',c.ac==='yes'?'clim fréquente':c.ac==='no'?'sans clim fréquente':'',c.shortTrips==='yes'?'trajets courts fréquents':c.shortTrips==='no'?'trajets non courts':'',c.load==='loaded'?'chargé':c.load==='normal'?'charge habituelle':''].filter(Boolean).join(' · ');}
function initializeCoach(){if(data.coachProfile)return false;data.coachProfile=AutoCoach.defaultProfile(data.vehicle.name);return true;}
function renderCoach(){if(page==='coach')renderCoachProfile();if(page==='stats')appendCoachMonth();if(page==='home'){const p=data.coachProfile,box=document.createElement('section'),kmText=currentKm()>0?'Compteur suivi : '+n(currentKm())+' km.':'Renseignez votre compteur réel pour commencer.';box.innerHTML=`<div class="section"><h2>Comprendre ma consommation</h2></div><div class="card"><h3>${esc(data.vehicle.name)} · ${coachModes[p.primaryUsage]}</h3><p class="muted">Mesures réelles et repères comparables ville / route / autoroute.<br>${kmText}</p><button class="link" onclick="navigate('coach')">Profil & repères de consommation →</button></div>`;$('main').appendChild(box);}if(page==='settings'){const button=document.createElement('button');button.className='secondary';button.textContent='Profil et repères de consommation';button.onclick=()=>navigate('coach');$('main').appendChild(button);}}

function addCoachFields(e){const c=e.context||{mode:'unknown',traffic:'unknown',ac:'unknown',shortTrips:'unknown',load:'unknown'};const block=document.createElement('div');block.id='coachFields';block.innerHTML=`<h3>Contexte depuis le dernier plein complet</h3><p class="muted">À renseigner surtout quand vous terminez un plein complet : décrivez les trajets de toute la période, y compris les ajouts partiels. Le type ne décrit pas seulement le trajet vers la pompe.</p>
<label for="fuelStation">⛽ ${pt('Station / Enseigne au Maroc', 'Gas station brand', 'محطة الوقود')} (${pt('facultatif', 'optional', 'اختياري')})</label>
<div class="quick" style="grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
  ${['Afriquia','Shell','TotalEnergies','Winxo'].map(st=>`<button type="button" class="secondary" style="padding:8px 4px;font-size:11px;text-align:center" onclick="setStationChoice('${st}')">${st}</button>`).join('')}
</div>
<div class="quick" style="grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
  ${['Petrom','Ola Energy','Ziz','Autre'].map(st=>`<button type="button" class="secondary" style="padding:8px 4px;font-size:11px;text-align:center" onclick="setStationChoice('${st}')">${st}</button>`).join('')}
</div>
<label for="driveMode">Type de trajets</label>
<select id="driveMode" name="driveMode">${Object.entries(coachModes).map(([k,v])=>`<option value="${k}" ${c.mode===k?'selected':''}>${v}</option>`).join('')}</select><button type="button" class="link" onclick="document.getElementById('driveMode').value=data.coachProfile.primaryUsage;stashDraft()">Utiliser mon usage habituel (${coachModes[data.coachProfile.primaryUsage]})</button><label for="driveTraffic">Trafic dominant</label><select id="driveTraffic" name="driveTraffic">${[['unknown','Non précisé'],['normal','Fluide / habituel'],['heavy','Embouteillages fréquents']].map(([k,v])=>`<option value="${k}" ${c.traffic===k?'selected':''}>${v}</option>`).join('')}</select><details style="margin:15px 0"><summary class="muted">Climatisation, trajets courts et charge (facultatif)</summary>${[['driveAc','Climatisation fréquente',c.ac,[['unknown','Non précisé'],['yes','Oui'],['no','Non']]],['driveShort','Trajets courts fréquents',c.shortTrips,[['unknown','Non précisé'],['yes','Oui'],['no','Non']]],['driveLoad','Charge habituelle',c.load,[['unknown','Non précisé'],['normal','Habituelle'],['loaded','Véhicule chargé']]]].map(([id,label,value,options])=>`<label for="${id}">${label}</label><select name="${id}" id="${id}">${options.map(([k,v])=>`<option value="${k}" ${value===k?'selected':''}>${v}</option>`).join('')}</select>`).join('')}</details><label class="check"><input type="checkbox" id="referenceEligible" name="referenceEligible" ${e.referenceEligible===false?'':'checked'}>Cette période peut contribuer à mon repère personnel</label><p class="muted">Décochez si une erreur de mesure ou un problème connu rend cette période peu représentative. Son carburant reste compté.</p>`;$('form').insertBefore(block,$('form').querySelector('button.primary'));}
function toggleCoachFields(type){if(!$('coachFields'))return;const fuel=type==='fuel';$('coachFields').hidden=!fuel;$('coachFields').querySelectorAll('input,select').forEach(el=>el.disabled=!fuel);}
function readCoachFields(item,f){if(item.type!=='fuel')return;item.context={mode:f.get('driveMode'),traffic:f.get('driveTraffic'),ac:f.get('driveAc'),shortTrips:f.get('driveShort'),load:f.get('driveLoad')};item.referenceEligible=f.get('referenceEligible')==='on';}
function coachInfoLink(url){if(window.Android&&Android.openCoachInfo)Android.openCoachInfo(url);else window.open(url,'_blank','noopener');}
function renderCoachProfile(){const p=data.coachProfile;$('main').innerHTML=`<div class="eyebrow">VOS MESURES, VOS REPÈRES</div><h1>Ma consommation</h1><div class="card"><h2 data-user-text>${esc(data.vehicle.name)}</h2><p class="muted">${esc(data.vehicle.fuel)} · ${esc(p.engine)} · ${esc(p.gearbox)}</p><button class="link" onclick="navigate('vehicleSetup')">Modifier la fiche véhicule</button></div><form class="card" id="coachProfileForm" style="margin-top:16px"><label class="check"><input id="coachEnabled" type="checkbox" ${p.enabled?'checked':''}>Activer l’analyse personnalisée</label><label for="coachUsage">Usage habituel</label><select id="coachUsage">${Object.entries(coachModes).map(([k,v])=>`<option value="${k}" ${p.primaryUsage===k?'selected':''}>${v}</option>`).join('')}</select>${field('referenceSince','Recalibrer depuis une date (facultatif)','date',p.referenceSince)}<p class="muted">Le repère est appris après au moins 3 cycles comparables et 500 km. Il reste fixe jusqu’à une recalibration volontaire. Aucun chiffre constructeur n’est deviné à partir du modèle.</p><details><summary>Définir mes propres plages (facultatif)</summary>${['city','highway','road','mixed'].map(k=>`<h3 style="margin-top:16px">${coachModes[k]}</h3><div class="fields"><div>${field('boundMin-'+k,'Mini L/100 km','number',p.bounds[k]?.min??'','min="0.1" max="50" step="0.1"')}</div><div>${field('boundMax-'+k,'Maxi L/100 km','number',p.bounds[k]?.max??'','min="0.1" max="50" step="0.1"')}</div></div>`).join('')}<p class="muted">Ces plages sont vos repères personnels, pas des normes du constructeur.</p></details><button class="primary">Enregistrer mes préférences</button></form><div class="section"><h2>Repères appris</h2></div><div class="card">${learnedSummary()}</div>`;$('coachProfileForm').onsubmit=e=>{e.preventDefault();const bounds={};for(const k of ['city','highway','road','mixed']){const a=$('boundMin-'+k).value,b=$('boundMax-'+k).value;if((a&&!b)||(!a&&b)){toast('Renseignez les deux limites ou laissez-les vides.');return;}bounds[k]=a&&b?{min:Number(a),max:Number(b)}:null;}commitSection('coachProfile',{...p,vehicleName:data.vehicle.name,enabled:$('coachEnabled').checked,primaryUsage:$('coachUsage').value,referenceSince:$('referenceSince').value,catalogConfirmed:false,bounds});};}

function learnedSummary(){const cycles=AutoCoach.allCycles(data),seen=new Set(),html=[];for(const c of cycles){if(c.context.mode==='unknown'||seen.has(c.key))continue;seen.add(c.key);const ref=AutoCoach.reference(data,c,cycles);const context=coachContext(c.context);html.push(`<p class="muted"><b>${context}</b><br>${ref&&ref.kind!=='learning'?`${n(ref.min,2)} – ${n(ref.max,2)} L/100 km · ${ref.kind==='manual'?'plage personnelle saisie':`${ref.count} cycles / ${n(ref.km)} km de calibration`}`:`Calibration : ${ref?.count||0} cycle(s), ${n(ref?.km||0)} km`}</p>`);}return html.join('')||'<p class="muted">Pas encore de cycle avec type de trajet renseigné. Ajoutez ou complétez le contexte des pleins dans le journal.</p>';}
function appendCoachMonth(){const p=data.coachProfile,m=AutoCoach.month(data,month),section=document.createElement('section');section.id='coachMonth';section.innerHTML=`<div class="section row"><h2>Mon bilan intelligent</h2><button class="link" onclick="navigate('coach')">Profil →</button></div><div class="card"><div class="eyebrow">${esc(p.make)} ${esc(p.model)} ${p.year} · ${esc(p.engine)}</div>${!p.enabled?'<p class="muted">Suivi personnalisé désactivé.</p>':p.vehicleName!==data.vehicle.name?'<div class="note">Profil à confirmer après changement du nom de la voiture.</div>':m.rate===null?'<p class="muted">Consommation non mesurable pour ce mois avec les données actuelles. Chaque ajout partiel reste compté dans les achats ; des niveaux de réservoir comparables sont nécessaires pour mesurer des litres réellement consommés.</p>':`<h2 style="margin-top:16px">${n(m.rate,2)} L / 100 km mesurés</h2><p class="muted">${n(m.liters,2)} L sur ${n(m.km)} km · ${m.cycles.length} cycle(s). ${m.complete?'Relevés de plein aux limites du mois.':'Période partielle : ce taux ne représente pas forcément tout le mois.'}</p>${m.groups.map(g=>`<div class="coach-result"><div class="row"><h3>${coachModes[g.mode]} · ${n(g.rate,2)} L/100 km</h3><span class="badge ${g.highCount?'due':''}">${g.highCount?g.highCount+' cycle(s) à vérifier':'Dernier cycle : '+coachStatus[g.last.status]}</span></div><p class="muted">${g.count} cycle(s) · ${n(g.km)} km<br>${g.last.reference&&g.last.reference.kind!=='learning'?`Repère du dernier cycle ${g.last.reference.kind==='manual'?'saisi':'appris'} : ${n(g.last.reference.min,2)} – ${n(g.last.reference.max,2)} L/100 km`:`${g.last.reference?.kind==='learning'?`Calibration : ${g.last.reference.count} cycle(s) / ${n(g.last.reference.km)} km`:'Complétez le type de trajet et les conditions du cycle.'}`}<br>${g.highCount} cycle(s) au-dessus du repère dans cette période.<br>Dernier contexte : ${esc(coachContext(g.last.context))}<br>Dernière mesure : ${date(g.last.from)} → ${date(g.last.to)}</p></div>`).join('')}${m.highCount?`<div class="note"><b>${m.repeated?'Hausse répétée observée pendant cette période. Si elle se poursuit dans des conditions comparables, faites contrôler le véhicule.':'Un cycle est au-dessus de votre repère : confirmez la mesure et les conditions.'}</b><p>Vérifiez les litres et compteurs, puis le contexte : embouteillages, petits trajets, climatisation, charge et relief. Contrôlez la pression selon le manuel et le suivi d’entretien. Si la hausse persiste, demandez un diagnostic au garage ; ce bilan ne désigne pas une pièce en panne.</p></div>`:''}`}<p class="muted">Le seuil appris utilise une médiane robuste et une marge de suivi (au moins 20 % ou 0,6 L/100 km, élargie si les mesures fluctuent). Ce sont des repères de surveillance, pas des limites constructeur ni une preuve de bon état mécanique.</p>${typeof stationComparisonSummary === 'function' ? stationComparisonSummary() : ''}<button class="link" onclick="navigate('coach')">Renseigner / vérifier mon profil</button></div>`;$('main').appendChild(section);}


function setStationChoice(name){
  const note = $('note');
  if(!note) return;
  const stations = ['Afriquia','Shell','TotalEnergies','Winxo','Petrom','Ola Energy','Ziz'];
  let val = note.value.trim();
  stations.forEach(s=>{ val = val.replace(new RegExp('\\b'+s+'\\b','gi'), '').trim(); });
  if(name!=='Autre'){ val = (name + (val ? ' · ' + val : '')).trim(); }
  note.value = val;
  toast('Station : ' + name);
}


// Helper pour le comparateur des stations-service au Maroc
const MOROCCO_STATIONS = [
  'Afriquia',
  'Shell',
  'TotalEnergies',
  'Winxo',
  'Petrom',
  'Ola Energy',
  'Ziz',
  'Autre station'
];

function stationLabel(name) {
  if (!name) return 'Non précisée';
  const match = MOROCCO_STATIONS.find(s => s.toLowerCase() === name.toLowerCase());
  return match || name;
}

function detectStationFromNote(note) {
  if (!note) return null;
  const lower = note.toLowerCase();
  for (const s of MOROCCO_STATIONS) {
    if (lower.includes(s.toLowerCase())) return s;
  }
  return null;
}

function stationComparisonSummary() {
  const entries = (data.entries || []).filter(e => e.type === 'fuel' && e.liters > 0);
  if (!entries.length) return '';
  
  const stats = {};
  for (const s of MOROCCO_STATIONS) stats[s] = { count: 0, liters: 0, cost: 0 };
  stats['Autre station'] = { count: 0, liters: 0, cost: 0 };

  entries.forEach(e => {
    const st = detectStationFromNote(e.note) || 'Autre station';
    if (!stats[st]) stats[st] = { count: 0, liters: 0, cost: 0 };
    stats[st].count++;
    stats[st].liters += e.liters;
    stats[st].cost += e.cost;
  });

  const active = Object.entries(stats).filter(([_, v]) => v.count > 0);
  if (!active.length) return '';

  return `
    <div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">
      <h3>⛽ ${easyWords('Comparateur des stations (Maroc)', 'Gas station summary (Morocco)', 'مقارنة محطات الوقود (المغرب)')}</h3>
      <p class="muted">${easyWords('Dépenses et prix moyen par enseigne selon vos pleins.', 'Expenses and average price by fuel brand.', 'المصاريف ومتوسط الثمن لكل محطة حسب تعبئاتك.')}</p>
      <div class="station-grid">
        ${active.map(([st, v]) => `
          <div class="station-card">
            <b>${esc(st)}</b>
            <strong>${v.liters > 0 ? money(v.cost / v.liters) + ' / L' : '—'}</strong>
            <small>${v.count} ${easyWords('plein(s)', 'fill-up(s)', 'تعبئة')} · ${n(v.liters, 1)} L</small>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${money(v.cost)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
