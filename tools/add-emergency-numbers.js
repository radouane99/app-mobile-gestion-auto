const fs = require('fs');

let smart = fs.readFileSync('app/src/main/assets/smart.js', 'utf8');

const target = `<div class="section"><h2>Accès rapide</h2></div>`;
const replacement = `
<div class="section"><h2>🚨 \${easyWords('Numéros d’urgence au Maroc (Hors-ligne)', 'Emergency numbers in Morocco', 'أرقام الطوارئ في المغرب')}</h2></div>
<div class="quick" style="margin-bottom:16px">
  <button type="button" class="secondary" style="border-left:4px solid #b42318;padding:12px 8px;text-align:start" onclick="dialEmergency('19')">
    <b>🚓 19 · \${easyWords('Police (Ville)', 'Police (City)', 'الشرطة')}</b>
  </button>
  <button type="button" class="secondary" style="border-left:4px solid #0e684f;padding:12px 8px;text-align:start" onclick="dialEmergency('177')">
    <b>👮 177 · \${easyWords('Gendarmerie', 'Gendarmerie', 'الدرك الملكي')}</b>
  </button>
</div>
<div class="quick" style="margin-bottom:16px">
  <button type="button" class="secondary" style="border-left:4px solid #d9381e;padding:12px 8px;text-align:start" onclick="dialEmergency('15')">
    <b>🚑 15 · \${easyWords('Pompiers / Samu', 'Ambulance', 'الوقاية المدنية')}</b>
  </button>
  <button type="button" class="secondary" style="border-left:4px solid #28748c;padding:12px 8px;text-align:start" onclick="dialEmergency('5050')">
    <b>🛣️ 5050 · \${easyWords('Autoroutes (ADM)', 'Highway ADM', 'طرق السيارة ADM')}</b>
  </button>
</div>
<div class="section"><h2>Accès rapide</h2></div>
`;

if (!smart.includes('dialEmergency')) {
  smart = smart.replace(target, replacement);
  
  // Add dialEmergency helper function
  const dialHelper = `
function dialEmergency(num){
  if(window.Android?.dial){
    Android.dial(num);
  } else {
    window.location.href = 'tel:' + num;
  }
}
`;
  smart += '\n' + dialHelper;
  fs.writeFileSync('app/src/main/assets/smart.js', smart, 'utf8');
  console.log('smart.js updated with Morocco emergency numbers!');
} else {
  console.log('smart.js already has emergency numbers.');
}

