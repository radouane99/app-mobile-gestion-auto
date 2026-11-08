const assert=require('node:assert/strict');require('./app/src/main/assets/smart-logic.js');require('./app/src/main/assets/ocr-review.js');const p=AutoSmart.parseOcr;
assert.equal(p('SOUS TOTAL 150 DH\nTOTAL TTC 180 DH\nMONNAIE RENDUE 20 DH','facture').cost.value,180);
assert.equal(p('TOTAL 150 DH\nTOTAL 180 DH','facture').cost,undefined);assert.equal(p('TOTAL 150 DH\nTOTAL 180 DH','facture').ambiguous,true);
assert.equal(p('المبلغ ٢٠٠٫٠٠\nVOLUME ١٦٫٠٠٠\nPRIX UNITAIRE ١٢٫٥٠','pompe').cost.value,200);
assert.equal(p('TOTAL 1 234,56 DH','facture').cost.value,1234.56);
assert.equal(p('TRIP 125 KM\nODO 64084','compteur').km.value,64084);
assert.equal(p('TRIP 125 KM','compteur').km,undefined);
assert.equal(p('ODO 64084\nODO 65084','compteur').km,undefined);
assert.equal(p('VOLUME 10 L\nPRIX UNITAIRE 12,50','pompe').cost.value,125);
assert.equal(p('TOTAL 140 DH\nVOLUME 10 L\nPRIX UNITAIRE 12,50','pompe').mismatch,true);
assert.equal(p('TOTAL 150 DH\nTOTAL 180 DH\nVOLUME 10 L\nPRIX UNITAIRE 12,50','pompe').cost,undefined);
console.log('OCR: totals priority, ambiguity refusal, decimal formats, Arabic digits, odometer/trip separation, calculated vs read, consistency passed.');

// Tests des nouvelles fonctionnalités Maroc & Dashboard Km Tracker
const fs = require('node:fs');
const vm = require('node:vm');
const L = require('./app/src/main/assets/logic.js');
global.window = global;
global.AutoLogic = L;
global.L = L;
global.appLanguage = 'fr';
global.easyWords = (fr, en, ar) => global.appLanguage === 'ar' ? ar : global.appLanguage === 'en' ? en : fr;
global.n = (x, d = 0) => Number(x).toFixed(d);
global.money = x => Number(x).toFixed(2) + ' DH';
global.date = s => s;
global.esc = s => String(s ?? '');
global.$ = () => null;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.data = L.blank();
global.data.vehicle.name = 'Dacia Logan Prestige';
global.data.vehicle.fuel = 'Diesel';
global.data.vehicle.baselineDate = '2026-11-01';
global.data.vehicle.baselineKm = 64000;
global.currentKm = () => Math.max(global.data.vehicle.baselineKm, ...global.data.entries.filter(e => e.hasKm !== false).map(e => e.km));
global.hasOdometer = () => true;
global.proofOwners = () => [];

vm.runInThisContext(fs.readFileSync('./app/src/main/assets/pocket.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('./app/src/main/assets/morocco-traffic.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('./app/src/main/assets/driving-calendar.js', 'utf8'));
require('./app/src/main/assets/coach-logic.js');
require('./app/src/main/assets/assistant-vocab.js');
const AL = require('./app/src/main/assets/assistant-logic.js');

// 1. Calculateur Pre-code Radio Renault / Dacia
assert.equal(deriveRenaultCode('S053'), '7913');
assert.equal(deriveRenaultCode('V188'), '4839');
assert.equal(deriveRenaultCode('Q420'), '9588');
assert.equal(deriveRenaultCode('A050'), null);

// 2. Barème Vignette Maroc & Majorations DGI
const vig = getMoroccoVignetteInfo('2026');
assert.equal(vig.baseRate, 700);
assert.equal(vig.isDiesel, true);
assert.equal(vig.isPaid, false);
assert.equal(vig.isLate, true);
assert.equal(vig.penaltyForfait, 100);
assert.equal(vig.totalWithPenalty > 700, true);

// 3. Dashboard Suivi Kilométrique & Jour Record (1 jour et 2 jours)
global.data.entries = [
  { id: 'r1', type: 'reading', date: '2026-11-02', km: 64060, cost: 0, hasKm: true, note: '', photos: [] }, // +60 km sur 1j (60 km/j)
  { id: 'r2', type: 'reading', date: '2026-11-04', km: 64220, cost: 0, hasKm: true, note: '', photos: [] }, // +160 km sur 2j (80 km/j)
  { id: 'r3', type: 'reading', date: '2026-11-05', km: 64470, cost: 0, hasKm: true, note: '', photos: [] }  // +250 km sur 1j (250 km/j -> RECORD!)
];
const kmStats = analyzeMonthlyKm(global.data.vehicle, global.data.entries, '2026-11');
assert.equal(kmStats.totalKm, 470);
assert.equal(kmStats.totalDays, 4);
assert.equal(kmStats.avgKmPerDay, 118);
assert.equal(kmStats.peakByDay.toDate, '2026-11-05');
assert.equal(kmStats.peakByDay.km, 250);
assert.equal(kmStats.peakByDay.kmPerDay, 250);

// 4. Assistant Maroc & Jour Record
assert.equal(AL.answer(global.data, 'ch7al la vignette', '2026-11').action, 'documents');
assert.equal(AL.answer(global.data, 'code radio dacia', '2026-11').action, 'pocket');
assert.equal(AL.answer(global.data, 'controle routier barrage', '2026-11').action, 'roadCheck');
assert.equal(AL.answer(global.data, 'constat accident', '2026-11').action, 'accidentReport');
assert.equal(AL.answer(global.data, 'amende narsa', '2026-11').action, 'trafficFines');
assert.equal(AL.answer(global.data, 'jour record du mois', '2026-11').context.intent, 'peakKm');
console.log('Morocco & Dashboard KM Tracker tests passed (Pre-code Radio, Vignette DGI, Peak Km Day, Assistant).');
