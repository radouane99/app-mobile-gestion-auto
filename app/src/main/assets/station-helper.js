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

