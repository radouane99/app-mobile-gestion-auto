const {chromium}=require('C:/Users/RADOUANE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try {
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
await context.route('https://app.local/**',async route=>{const name=new URL(route.request().url()).pathname.slice(1)||'index.html';await route.fulfill({body:await fs.readFile(__dirname+'/app/src/main/assets/'+name),contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html'});});
const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('https://app.local/');
await p.evaluate(()=>navigate('settings'));
await p.locator('#name').fill('Renault Clio 1.5 dCi');
await p.locator('#baselineDate').fill('2026-01-01');await p.locator('#baselineKm').fill('100000');
await p.locator('#vehicle button.primary').click();
await p.evaluate(()=>openForm('fuel'));
await p.locator('#date').fill('2026-10-10');await p.locator('#km').fill('105000');await p.locator('#cost').fill('100');await p.locator('#liters').fill('8');await p.locator('#form button.primary').click();
assert.equal(await p.evaluate(()=>data.entries.length),1);
await p.reload();assert.equal(await p.evaluate(()=>data.entries[0].cost),100);
await p.evaluate(()=>openForm('oil'));
await p.locator('#date').fill('2026-05-10');await p.locator('#km').fill('102000');await p.locator('#cost').fill('600');await p.locator('#form button.primary').click();
assert.equal(await p.evaluate(()=>data.entries.length),2);
await p.evaluate(()=>navigate('maintenance'));assert.ok((await p.locator('#main').innerText()).includes('112'));
await p.evaluate(()=>navigate('home'));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
await p.screenshot({path:__dirname+'/dist/apercu.png',fullPage:true});
await p.evaluate(()=>navigate('stats'));assert.ok((await p.locator('#main').innerText()).includes('100,00'));
await p.evaluate(()=>receiveImport('{"version":999}'));assert.equal(await p.evaluate(()=>data.entries.length),2);
await p.evaluate(()=>openForm('fuel',data.entries.find(e=>e.type==='fuel').id));await p.locator('#cost').fill('150');await p.locator('#form button.primary').click();assert.equal(await p.evaluate(()=>data.entries.find(e=>e.type==='fuel').cost),150);
p.on('dialog',d=>d.accept());await p.evaluate(()=>openForm('fuel',data.entries.find(e=>e.type==='fuel').id));await p.locator('#delete').click();assert.equal(await p.evaluate(()=>data.entries.length),1);
assert.deepEqual(errors,[]);console.log('UI OK : mobile, saisie partielle, entretien historique, persistance, modification, suppression et import invalide.');
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
