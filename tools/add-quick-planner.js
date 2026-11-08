const fs = require('fs');

let beginner = fs.readFileSync('app/src/main/assets/beginner.js', 'utf8');

// Replace easy-secondary grid so it has 3 clear actionable items:
// 1. Photo 2. Controle Routier 3. Mes papiers
// And right below it, add a direct button for: "Calculateur d'autonomie (100 DH = km ?)"
const target = `<button onclick="photoEntryChooser()">${uiIcon('camera')} ${easyWords('Ajouter avec une photo','Add from a photo','نزيد بالتصويرة')}</button><button onclick="navigate('roadCheck')" style="background:#0e2a38;color:#fff;border-color:#28748c">👮 ${easyWords('Contrôle Routier','Police check','فحص الشرطة')}</button><button onclick="navigate('pocket')">${uiIcon('document')} ${easyWords('Mes papiers','My documents','الوثائق ديالي')}</button>`;

const replacement = `<button onclick="photoEntryChooser()">${uiIcon('camera')} ${easyWords('Ajouter avec une photo','Add from a photo','نزيد بالتصويرة')}</button><button onclick="navigate('roadCheck')" style="background:#0e2a38;color:#fff;border-color:#28748c">👮 ${easyWords('Contrôle Routier','Police check','فحص الشرطة')}</button><button onclick="navigate('pocket')">${uiIcon('document')} ${easyWords('Mes papiers','My documents','الوثائق ديالي')}</button><button onclick="navigate('fuelPlanner')" style="background:#f0faf6;border-color:#b4e2d3;color:#0e684f;grid-column:span 3;text-align:center;font-weight:700">🧮 ${easyWords('Calculateur d’autonomie · 100 DH = combien de km ?', 'Range estimator · 100 DH = how many km?', 'حساب المسافة · 100 درهم شحال تدرب؟')}</button>`;

if (!beginner.includes("navigate('fuelPlanner')")) {
  beginner = beginner.replace(target, replacement);
  fs.writeFileSync('app/src/main/assets/beginner.js', beginner, 'utf8');
  console.log('beginner.js updated with quick fuel planner link!');
} else {
  console.log('beginner.js already updated.');
}

