const fs=require('node:fs');const file='app/src/main/assets/app.js';let s=fs.readFileSync(file,'utf8');
function sub(a,b){if(!s.includes(a))throw Error('Missing: '+a);s=s.replace(a,b);}
sub("insurance:'Assurance',other:","insurance:'Assurance',vignette:'Vignette',other:");
sub("insurance:'◇',other:","insurance:'◇',vignette:'▣',other:");
sub("['oil','tires','repair','insurance','other']","['oil','tires','repair','insurance','vignette','other']");
sub("if(page==='settings')settings();}","if(page==='settings')settings(); if(page==='stats')appendBudget(); if(page==='home'||page==='maintenance')appendDocuments();}");
sub("Version 1.0","Version 1.1");
sub("if(page==='settings')settings(); if(page", "if(page==='settings'){settings();appendNotifications();} if(page");
sub("<small>${e.type==='fuel'?", "<small>${e.type==='fuel'?"); // presence check
sub("${e.note?`<small>", "${e.photos?.length?`<small>▧ ${e.photos.length} photo(s)</small>`:''}${e.coverageEnd?`<small>Valable jusqu’au ${date(e.coverageEnd)}</small>`:''}${e.note?`<small>");
sub("switchType(e.type);$('dialog').showModal();", "installExtras(e,id);switchType(e.type);$('dialog').showModal();");
sub("if(item.date>L.day())", "item.photos=draftPhotos.map(p=>({...p}));if(['insurance','vignette'].includes(t)){item.coverageStart=f.get('coverageStart');item.coverageEnd=f.get('coverageEnd');}if(item.date>L.day())");
sub("if(save()){closeForm();render();toast('Opération enregistrée');}","if(save()){clearDraft();closeForm();render();toast('Opération enregistrée');}");
sub("if(save()){closeForm();render();}else data.entries=old;", "if(save()){clearDraft();closeForm();render();}else data.entries=old;");
sub("$('liters').disabled=t!=='fuel';}","$('liters').disabled=t!=='fuel';if($('coveragefields')){const doc=['insurance','vignette'].includes(t);$('coveragefields').hidden=!doc;['coverageStart','coverageEnd'].forEach(k=>{$(k).disabled=!doc;$(k).required=doc;});}} ");
sub("function closeForm(){if($('dialog').open)$('dialog').close();", "function closeForm(){if($('dialog').open){clearDraft();$('dialog').close();}");
sub("Données stockées sur ce téléphone. Exportez régulièrement une sauvegarde et avant de désinstaller l’application.","Données et photos stockées sur ce téléphone. Sur Android, la sauvegarde ZIP inclut toutes les photos enregistrées. Exportez-la avant de désinstaller l’application.");
sub("function exportData(){const raw=", "function exportData(){if(!window.Android&&data.entries.some(e=>e.photos?.length)){toast('Exportez depuis l’application Android pour inclure les photos.');return;}const raw=");
sub("if(save()){render();toast('Sauvegarde restaurée');}","if(save()){clearDraft();render();toast('Sauvegarde restaurée');}");
sub("\nrender();\n", "\nrender();\nrestoreDraft();\n");
fs.writeFileSync(file,s);
