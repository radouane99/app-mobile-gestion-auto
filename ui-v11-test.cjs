const {chromium}=require('C:/Users/RADOUANE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
await context.route('https://app.local/**',async route=>{const name=new URL(route.request().url()).pathname.slice(1)||'index.html';await route.fulfill({body:name.startsWith('photos/')?image:await fs.readFile(__dirname+'/app/src/main/assets/'+name),contentType:name.startsWith('photos/')?'image/png':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html'});});
let p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.nativeCalls=[];window.Android={load:()=>localStorage.getItem('autocarnet')||'',save:raw=>{localStorage.setItem('autocarnet',raw);return true;},notificationStatus:()=>JSON.stringify({enabled:window.mockEnabled||false,allowed:window.mockAllowed||false}),enableNotifications:e=>{window.mockEnabled=e;refreshNativeStatus();},notificationSettings:()=>nativeCalls.push('settings'),testNotification:()=>nativeCalls.push('test'),addPhoto:(kind,camera)=>nativeCalls.push({kind,camera}),exportData:raw=>nativeCalls.push({export:JSON.parse(raw)})};});
await p.goto('https://app.local/');await p.evaluate(()=>openForm('insurance'));
await p.locator('#date').fill('2026-01-01');await p.locator('#cost').fill('3650');await p.locator('#coverageStart').fill('2026-01-01');await p.locator('#coverageEnd').fill('2026-12-31');
await p.locator('#photoKind').selectOption('facture');await p.getByRole('button',{name:'Prendre une photo'}).click();assert.deepEqual(await p.evaluate(()=>nativeCalls.at(-1)),{kind:'facture',camera:true});
await p.reload();assert.equal(await p.locator('#dialog').evaluate(d=>d.open),true);assert.equal(await p.locator('#cost').inputValue(),'3650');
await p.evaluate(()=>receivePhoto('a'.repeat(64)+'.jpg','facture'));assert.equal(await p.locator('#photos img').count(),1);
await p.locator('#photos button').first().click();assert.equal(await p.locator('#photoViewer img').count(),1);await p.getByRole('button',{name:'Fermer',exact:false}).last().click();
await p.locator('#form button.primary').click();assert.equal(await p.evaluate(()=>data.entries.length),1);assert.equal(await p.evaluate(()=>data.entries.find(e=>e.type==='insurance').photos.length),1);assert.equal(await p.evaluate(()=>data.entries[0].hasKm),false);
await p.evaluate(()=>openForm('vignette'));await p.locator('#date').fill('2026-01-01');await p.locator('#cost').fill('700');await p.locator('#coverageStart').fill('2026-01-01');await p.locator('#coverageEnd').fill('2026-12-31');await p.locator('#form button.primary').click();assert.equal(await p.evaluate(()=>data.entries.length),2);
await p.evaluate(()=>{month='2026-10';navigate('stats');});const budget=await p.locator('#allBudget').innerText();assert.ok(budget.includes('4 350,00'));assert.ok(budget.includes('Assurance'));assert.ok(budget.includes('310,00'));
await p.screenshot({path:__dirname+'/dist/bilan-v11.png',fullPage:true});
await p.evaluate(()=>navigate('settings'));await p.locator('#notifyEnabled').check();assert.ok((await p.locator('#notificationStatus').innerText()).includes('autorisation Android nécessaire'));await p.evaluate(()=>{mockAllowed=true;refreshNativeStatus();});assert.ok((await p.locator('#notificationStatus').innerText()).includes('autorisés'));await p.getByRole('button',{name:'notification de test'}).click();assert.equal(await p.evaluate(()=>nativeCalls.at(-1)),'test');
await p.evaluate(()=>exportData());assert.equal(await p.evaluate(()=>nativeCalls.at(-1).export.entries[0].photos.length),1);
await p.evaluate(()=>navigate('home'));await p.screenshot({path:__dirname+'/dist/accueil-v11.png',fullPage:true});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await p.evaluate(()=>openForm('insurance',data.entries.find(e=>e.type==='insurance').id));assert.equal(await p.locator('#photos img').count(),1);await p.locator('#cost').fill('3600');await p.locator('#form button.primary').click();assert.equal(await p.evaluate(()=>data.entries.find(e=>e.type==='insurance').photos.length),1);
p.on('dialog',d=>d.accept());await p.evaluate(()=>openForm('insurance',data.entries.find(e=>e.type==='insurance').id));await p.getByRole('button',{name:'Retirer',exact:true}).click();await p.locator('#form button.primary').click();assert.equal(await p.evaluate(()=>data.entries.find(e=>e.type==='insurance').photos.length),0);
await p.evaluate(()=>receiveImport(JSON.stringify({version:1})));assert.equal(await p.evaluate(()=>data.entries.length),2);
await p.evaluate(()=>openForm('inspection'));await p.locator('#date').fill('2026-01-01');await p.locator('#cost').fill('400');await p.locator('#coverageStart').fill('2026-01-01');await p.locator('#coverageEnd').fill('2026-12-31');await p.locator('#reminderDate').fill('2026-12-15');await p.locator('#form button.primary').click();assert.equal(await p.evaluate(()=>data.entries.find(e=>e.type==='inspection').reminderDate),'2026-12-15');
await p.evaluate(()=>navigate('maintenance'));assert.ok((await p.locator('#main').innerText()).includes('15 déc. 2026'));await p.screenshot({path:__dirname+'/dist/documents-v11.png',fullPage:true});
assert.deepEqual(errors,[]);console.log('V1.1 UI OK : assurance, vignette, justificatifs, reprise du brouillon, coûts répartis, export et états des permissions (bridge simulé).');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
