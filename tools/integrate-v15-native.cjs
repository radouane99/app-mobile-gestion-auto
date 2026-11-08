const fs=require('fs');let p='app/src/main/assets/coach.js',s=fs.readFileSync(p,'utf8').replace('if(data.coachProfile)return;', 'if(data.coachProfile)return false;').replace('data.coachProfile=AutoCoach.defaultProfile(data.vehicle.name);}', 'data.coachProfile=AutoCoach.defaultProfile(data.vehicle.name);return true;}');fs.writeFileSync(p,s);
p='app/src/main/assets/app.js';s=fs.readFileSync(p,'utf8').replace('\ninitializeCoach();','\nif(initializeCoach())save();');fs.writeFileSync(p,s);
p='app/src/main/java/ma/autocarnet/ReminderReceiver.java';s=fs.readFileSync(p,'utf8');const needle='      JSONObject trend=FuelTrend.analyze(data);';let i=s.indexOf(needle),end=s.indexOf('\n',i);if(i<0)throw Error('trend');const old=s.slice(i,end);s=s.slice(0,i)+`      JSONObject coach=data.optJSONObject("coachProfile");
      if(coach!=null){
        c.getSystemService(NotificationManager.class).cancel(350);
        java.util.List<JSONObject> values=EngineCoach.assessed(data);JSONObject last=values.isEmpty()?null:values.get(values.size()-1);
        if(coach.optBoolean("enabled")&&last!=null&&last.optBoolean("high")){
          String noticeToken=last.getString("id")+":"+last.getString("status")+":"+last.getString("key");
          if(!noticeToken.equals(prefs(c).getString("coach-alert",""))){notify(c,351,"AutoCarnet · gasoil à vérifier",EngineCoach.mode(last.getJSONObject("context").getString("mode"))+" : "+ReportPdf.num(last.getDouble("rate"))+" L/100 km. "+EngineCoach.label(last.getString("status"))+". Vérifiez relevés et conditions ; un diagnostic nécessite un contrôle du véhicule.");prefs(c).edit().putString("coach-alert",noticeToken).apply();}
        }else c.getSystemService(NotificationManager.class).cancel(351);
      }else{
${old}
      }`+s.slice(end);fs.writeFileSync(p,s);
p='test-native.ps1';s=fs.readFileSync(p,'utf8').replace('app\\src\\main\\java\\ma\\autocarnet\\FuelTrend.java','app\\src\\main\\java\\ma\\autocarnet\\FuelTrend.java app\\src\\main\\java\\ma\\autocarnet\\EngineCoach.java');fs.writeFileSync(p,s);
p='test-backup.ps1';s=fs.readFileSync(p,'utf8').replace("'app\\src\\main\\java\\ma\\autocarnet\\AutoBackupJob.java'", "'app\\src\\main\\java\\ma\\autocarnet\\AutoBackupJob.java','app\\src\\main\\java\\ma\\autocarnet\\EngineCoach.java'");fs.writeFileSync(p,s);
p='ui-v13-test.cjs';s=fs.readFileSync(p,'utf8').replace('Évolution de consommation · Diesel','Mon bilan intelligent');fs.writeFileSync(p,s);
