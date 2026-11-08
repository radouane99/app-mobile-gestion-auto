const fs = require('fs');

let planner = fs.readFileSync('app/src/main/assets/fuel-planner.js', 'utf8');

// Quick amount buttons (50 DH, 100 DH, 150 DH, 200 DH, 300 DH, 500 DH)
const target = `$('planFields').innerHTML=input('planAmount',label,mode==='money'?200:mode==='distance'?'':norm===null?'':Number(norm.toFixed(2)));`;

const replacement = `
  const quickMoney = mode==='money' ? \`
    <div class="quick" style="grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0 12px">
      \${[50, 100, 150, 200, 300, 500].map(v => \`<button type="button" class="secondary" style="padding:8px 4px;font-size:12px;font-weight:700;text-align:center" onclick="$('planAmount').value=\${v};$('planAmount').dispatchEvent(new Event('input',{bubbles:true}))">\${v} DH</button>\`).join('')}
    </div>\` : '';
  $('planFields').innerHTML = input('planAmount', label, mode==='money'?100:mode==='distance'?'':norm===null?'':Number(norm.toFixed(2))) + quickMoney;
`;

if (!planner.includes('quickMoney')) {
  planner = planner.replace(target, replacement);
  fs.writeFileSync('app/src/main/assets/fuel-planner.js', planner, 'utf8');
  console.log('fuel-planner.js updated with quick Moroccan DH buttons!');
} else {
  console.log('fuel-planner.js already updated.');
}

