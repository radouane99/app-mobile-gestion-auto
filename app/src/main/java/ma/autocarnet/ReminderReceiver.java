package ma.autocarnet;

import android.app.*;

import android.content.*;

import android.os.Build;

import android.content.pm.PackageManager;

import org.json.*;

import java.time.*;

import java.time.temporal.ChronoUnit;

import java.util.*;



public class ReminderReceiver extends BroadcastReceiver {

  static final String CHANNEL="echeances";

  static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("rappels",0);}

  static void channel(Context c){c.getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel(CHANNEL,"Échéances voiture",NotificationManager.IMPORTANCE_DEFAULT));}

  static boolean allowed(Context c){channel(c);NotificationManager nm=c.getSystemService(NotificationManager.class);return (Build.VERSION.SDK_INT<33||c.checkSelfPermission("android.permission.POST_NOTIFICATIONS")==PackageManager.PERMISSION_GRANTED)&&nm.areNotificationsEnabled()&&nm.getNotificationChannel(CHANNEL).getImportance()!=NotificationManager.IMPORTANCE_NONE;}

  static PendingIntent alarm(Context c){return PendingIntent.getBroadcast(c,40,new Intent(c,ReminderReceiver.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}

  static void schedule(Context c){

    AlarmManager am=c.getSystemService(AlarmManager.class);am.cancel(alarm(c));

    if(!prefs(c).getBoolean("enabled",false))return;

    Calendar next=Calendar.getInstance();next.set(Calendar.HOUR_OF_DAY,9);next.set(Calendar.MINUTE,0);next.set(Calendar.SECOND,0);next.set(Calendar.MILLISECOND,0);if(next.getTimeInMillis()<=System.currentTimeMillis())next.add(Calendar.DATE,1);

    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,next.getTimeInMillis(),alarm(c));

  }

  static void notify(Context c,int id,String title,String text){

    if(!allowed(c))return;

    if(AppLock.enabled(c)){title="AutoCarnet";text="Une échéance ou un rapport vous attend. Déverrouillez l’application pour consulter les détails.";}

    Intent open=new Intent(c,MainActivity.class);open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);

    PendingIntent pi=PendingIntent.getActivity(c,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);

    int icon=c.getResources().getIdentifier("ic_notification","drawable",c.getPackageName());

    Notification n=new Notification.Builder(c,CHANNEL).setSmallIcon(icon!=0?icon:android.R.drawable.ic_popup_reminder).setContentTitle(title).setContentText(text).setStyle(new Notification.BigTextStyle().bigText(text)).setContentIntent(pi).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).build();

    c.getSystemService(NotificationManager.class).notify(id,n);

  }

  private static void checkRoad(Context c,JSONObject data)throws Exception{
    JSONArray cases=data.optJSONArray("roadCases");if(cases==null)return;for(int i=0;i<cases.length();i++){JSONObject item=cases.getJSONObject(i);String id=item.getString("id"),due=item.optString("due"),status=item.optString("status");int noticeId=400000000+(id.hashCode()&0x0fffffff);if(due.isEmpty()||status.equals("paid")||status.equals("closed")){c.getSystemService(NotificationManager.class).cancel(noticeId);continue;}long days=java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(),LocalDate.parse(due));String stage=days<0?"overdue":days==0?"today":days<=1?"day":days<=7?"week":days<=30?"month":"";if(stage.isEmpty())continue;String key="road-"+id,token=due+":"+stage;if(token.equals(prefs(c).getString(key,"")))continue;notify(c,noticeId,"AutoCarnet · échéance du dossier",item.getString("title")+" · date saisie : "+due+". Vérifiez le paiement ou les démarches à effectuer.");prefs(c).edit().putString(key,token).apply();}
  }
  private static void checkOdometerReminder(Context c, JSONObject data, JSONObject vehicle, JSONArray entries) {
    final int notificationId = 352;
    if (!data.optBoolean("drivingReminder", false)) {
      c.getSystemService(NotificationManager.class).cancel(notificationId);
      return;
    }
    LocalDate today = LocalDate.now();
    String latest = vehicle.optInt("baselineKm", 0) > 0 ? vehicle.optString("baselineDate") : "";
    for (int i = 0; i < entries.length(); i++) {
      JSONObject entry = entries.optJSONObject(i);
      if (entry == null || !entry.optBoolean("hasKm", true) || entry.isNull("km")) continue;
      String day = entry.optString("date");
      if (day.compareTo(latest) > 0) latest = day;
    }
    String lastNotice = prefs(c).getString("odometer-last-notice", "");
    String reference = latest.compareTo(lastNotice) > 0 ? latest : lastNotice;
    if (!reference.isEmpty() && ChronoUnit.DAYS.between(LocalDate.parse(reference), today) < 2) {
      if (latest.equals(today.toString())) c.getSystemService(NotificationManager.class).cancel(notificationId);
      return;
    }
    notify(c, notificationId, "AutoCarnet · Compteur", "Relevez le compteur pour compléter votre calendrier de conduite.");
    prefs(c).edit().putString("odometer-last-notice", today.toString()).apply();
  }

  static void check(Context c){

    if(!prefs(c).getBoolean("enabled",false)||!allowed(c))return;

    try {

      String raw=Store.load(c);if(raw.isEmpty())return;JSONObject data=new JSONObject(raw),v=data.getJSONObject("vehicle");JSONArray entries=data.getJSONArray("entries");int km=v.getInt("baselineKm");Map<String,JSONObject> latest=new HashMap<>();
      checkOdometerReminder(c,data,v,entries);
      checkRoad(c,data);

      for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);if(e.optBoolean("hasKm",true))km=Math.max(km,e.getInt("km"));String type=e.getString("type");if(!Arrays.asList("oil","tires","insurance","vignette","inspection").contains(type))continue;

        String when=e.optString("coverageStart",e.getString("date"));JSONObject old=latest.get(type);if(old==null||when.compareTo(old.optString("coverageStart",old.getString("date")))>0||(when.equals(old.optString("coverageStart",old.getString("date")))&&e.getInt("km")>=old.getInt("km")))latest.put(type,e);

      }

      for(String type:Arrays.asList("oil","tires","insurance","vignette","inspection")){

        JSONObject e=latest.get(type);int nid=100+Arrays.asList("oil","tires","insurance","vignette","inspection").indexOf(type);

        if(type.equals("tires")){c.getSystemService(NotificationManager.class).cancel(nid);continue;}

        if(e==null){c.getSystemService(NotificationManager.class).cancel(nid);continue;}

        String title=type.equals("oil")?"Vidange":type.equals("tires")?"Pneus":type.equals("insurance")?"Assurance":type.equals("vignette")?"Vignette":"Visite technique";

        LocalDate due;boolean kmDue=false;String detail="";int targetKm=-1,warnKm=0;

        if(type.equals("oil")||type.equals("tires")){String p=type.equals("oil")?"oil":"tire";JSONObject plan=e.optJSONObject("oilPlan");int months=plan!=null?plan.getInt("months"):v.getInt(p+"Months"),interval=plan!=null?plan.getInt("km"):v.getInt(p+"Interval");due=LocalDate.parse(e.getString("date")).plusMonths(months);int next=e.getInt("km")+interval;targetKm=next;warnKm=plan!=null?plan.getInt("warnKm"):v.optInt("oilWarnKm",500);kmDue=km>=next;detail=" · dernier compteur réel : "+km+" km · compteur cible : "+next+" km";}

        else {String end=e.optString("reminderDate",e.optString("coverageEnd",""));if(end.isEmpty()){c.getSystemService(NotificationManager.class).cancel(nid);continue;}due=LocalDate.parse(end);}

        if(type.equals("oil")){double estimate=OilBudget.next(data);if(Double.isFinite(estimate))detail+=" · budget estimatif : "+String.format(java.util.Locale.FRANCE,"%.2f",estimate)+" DH (derniers prix saisis)";}
        long days=ChronoUnit.DAYS.between(LocalDate.now(),due);String state=type.equals("oil")?ReminderRules.oilStage(LocalDate.now(),due,km,targetKm,warnKm):ReminderRules.stage(LocalDate.now(),due,kmDue);

        if(state==null){c.getSystemService(NotificationManager.class).cancel(nid);continue;}

        String key="sent-"+type,token=e.getString("id")+":"+due+":"+targetKm+":"+warnKm+":"+state;

        if(token.equals(prefs(c).getString(key,"")))continue;

        String message="km-soon".equals(state)?"Vidange bientôt : il reste "+(targetKm-km)+" km selon le dernier compteur saisi":kmDue?"Échéance kilométrique atteinte":days<0?"Échéance dépassée de "+(-days)+" jour(s)":days==0?"Échéance aujourd’hui":"Échéance dans "+days+" jour(s)";

        notify(c,nid,title+" · AutoCarnet",message+" ("+due+")"+detail);

        prefs(c).edit().putString(key,token).apply();

      }

      String[] services={"distribution","brakes","battery","airfilter","fuelfilter","cabinfilter","rotation","alignment"};

      JSONArray plans=data.optJSONArray("plans");

      for(int s=0;s<services.length;s++){

        JSONObject plan=null;if(plans!=null)for(int i=0;i<plans.length();i++)if(services[s].equals(plans.getJSONObject(i).optString("type")))plan=plans.getJSONObject(i);

        JSONObject last=null;for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);if(services[s].equals(e.optString("type"))&&(last==null||e.getString("date").compareTo(last.getString("date"))>0||(e.getString("date").equals(last.getString("date"))&&e.getInt("km")>=last.getInt("km"))))last=e;}

        int id=200+s;

        if(plan==null||!plan.optBoolean("enabled")||last==null){c.getSystemService(NotificationManager.class).cancel(id);continue;}

        serviceNotice(c,id,services[s],ReportPdf.LABELS.get(services[s]),last,plan.optInt("kmInterval"),plan.optInt("monthsInterval"),km);

      }

      JSONObject front=null,rear=null;

      for(JSONObject e:ReportPdf.entries(data)){if(e.optString("type").equals("tires")){JSONObject tire=e.optJSONObject("tire");String mounted=tire==null?"all":tire.optString("position","all");if(mounted.equals("all")||mounted.equals("front"))front=e;if(mounted.equals("all")||mounted.equals("rear"))rear=e;}else if(e.optString("type").equals("rotation")&&e.optBoolean("rotationSwap")){JSONObject swap=front;front=rear;rear=swap;}}

      for(int pos=0;pos<2;pos++){

        String position=pos==0?"front":"rear";JSONObject last=pos==0?front:rear;

        if(last==null)c.getSystemService(NotificationManager.class).cancel(210+pos);else serviceNotice(c,210+pos,"tires-"+position,"Pneus "+(pos==0?"avant":"arrière"),last,v.getInt("tireInterval"),v.getInt("tireMonths"),km);

      }

      String closingStage=MonthClosing.stage(data,LocalDate.now());
      if(closingStage==null)c.getSystemService(NotificationManager.class).cancel(690);
      else if(!closingStage.equals(prefs(c).getString("month-closing-sent",""))){String lang=c.getSharedPreferences("ui-language",0).getString("value","fr");notify(c,690,MonthClosing.title(lang),MonthClosing.message(closingStage,lang));prefs(c).edit().putString("month-closing-sent",closingStage).apply();}
      JSONObject config=data.optJSONObject("monthlyCheck");boolean enabled=config==null||config.optBoolean("enabled",true);int checkDay=config==null?1:config.optInt("day",1);String month=YearMonth.now().toString();boolean done=false;

      for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);if(!e.optString("type").equals("checkup")||!e.optString("date").startsWith(month))continue;JSONObject checks=e.optJSONObject("checks");boolean complete=checks!=null;for(String item:Arrays.asList("pressure","oilLevel","coolant","brakeFluid","lights","tiresVisual"))if(checks==null||!Arrays.asList("ok","attention").contains(checks.optString(item)))complete=false;if(complete)done=true;}

      if(enabled&&!done&&LocalDate.now().getDayOfMonth()>=checkDay&&!month.equals(prefs(c).getString("check-month",""))){notify(c,300,"AutoCarnet · contrôle mensuel","Relevez le compteur et vérifiez votre checklist : pression, niveaux, éclairage et pneus.");prefs(c).edit().putString("check-month",month).apply();}

      if(!enabled||done)c.getSystemService(NotificationManager.class).cancel(300);

      Set<String> reviewIds=new HashSet<>();
      for(int i=0;i<entries.length();i++){
        JSONObject entry=entries.getJSONObject(i),trace=entry.optJSONObject("trace");if(trace==null)continue;
        String eid=entry.getString("id"),review=trace.optString("reviewDate"),checked=trace.optString("checkedDate");reviewIds.add(eid);int noticeId=800000000+(eid.hashCode()&0x0fffffff);
        if(review.isEmpty()||review.compareTo(LocalDate.now().toString())>0||(!checked.isEmpty()&&checked.compareTo(review)>=0)){c.getSystemService(NotificationManager.class).cancel(noticeId);continue;}
        String token=eid+":"+review,key="review-"+eid;if(token.equals(prefs(c).getString(key,"")))continue;
        notify(c,noticeId,"AutoCarnet · résultat de l’intervention","Faites le point sur l’intervention du "+entry.getString("date")+" : "+trace.optString("component")+". Notez si le problème est résolu, revenu ou encore à surveiller.");prefs(c).edit().putString(key,token).apply();
      }
      for(String eid:prefs(c).getString("review-ids","").split(","))if(!eid.isEmpty()&&!reviewIds.contains(eid))c.getSystemService(NotificationManager.class).cancel(800000000+(eid.hashCode()&0x0fffffff));
      prefs(c).edit().putString("review-ids",String.join(",",reviewIds)).apply();
      JSONArray subscriptions=data.optJSONArray("subscriptions");Set<String> currentSubscriptions=new HashSet<>();

      if(subscriptions!=null)for(int i=0;i<subscriptions.length();i++){

        JSONObject sub=subscriptions.getJSONObject(i);String sid=sub.getString("id");currentSubscriptions.add(sid);int nid=400000000+(sid.hashCode()&0x0fffffff);

        if(!sub.optBoolean("enabled")){c.getSystemService(NotificationManager.class).cancel(nid);continue;}

        LocalDate start=LocalDate.parse(sub.getString("startDate")),due=start;

        for(int offset=0;offset<2400;offset++){due=start.plusMonths(offset);String period=YearMonth.from(due).toString();boolean paid=false;

          for(int j=0;j<entries.length();j++){JSONObject e=entries.getJSONObject(j);if((e.optString("type").equals("subscription")||e.optString("type").equals("parking"))&&sid.equals(e.optString("subscriptionId"))&&period.equals(e.optString("subscriptionPeriod")))paid=true;}

          if(!paid)break;

        }

        
        long days=ChronoUnit.DAYS.between(LocalDate.now(),due);String state=days<=0?"due":days<=7?"week":null;

        if(state==null){c.getSystemService(NotificationManager.class).cancel(nid);continue;}

        String key="subscription-"+sid,token=due+":"+state;if(token.equals(prefs(c).getString(key,"")))continue;

        notify(c,nid,"AutoCarnet · abonnement",sub.getString("title")+" : "+ReportPdf.num(sub.getDouble("amount"))+" DH prévus · échéance "+due+". Confirmez le paiement dans le carnet.");prefs(c).edit().putString(key,token).apply();

      }

      for(String sid:prefs(c).getString("subscription-ids","").split(","))if(!sid.isEmpty()&&!currentSubscriptions.contains(sid))c.getSystemService(NotificationManager.class).cancel(400000000+(sid.hashCode()&0x0fffffff));

      prefs(c).edit().putString("subscription-ids",String.join(",",currentSubscriptions)).apply();

      JSONObject coach=data.optJSONObject("coachProfile");

      if(coach!=null){

        c.getSystemService(NotificationManager.class).cancel(350);

        java.util.List<JSONObject> values=EngineCoach.assessed(data);JSONObject last=values.isEmpty()?null:values.get(values.size()-1);

        if(coach.optBoolean("enabled")&&last!=null&&last.optBoolean("high")){

          String noticeToken=last.getString("id")+":"+last.getString("status")+":"+last.getString("key");

          if(!noticeToken.equals(prefs(c).getString("coach-alert",""))){notify(c,351,"AutoCarnet · gasoil à vérifier",EngineCoach.mode(last.getJSONObject("context").getString("mode"))+" : "+ReportPdf.num(last.getDouble("rate"))+" L/100 km. "+EngineCoach.label(last.getString("status"))+". Vérifiez relevés et conditions ; un diagnostic nécessite un contrôle du véhicule.");prefs(c).edit().putString("coach-alert",noticeToken).apply();}

        }else c.getSystemService(NotificationManager.class).cancel(351);

      }else{c.getSystemService(NotificationManager.class).cancel(350);c.getSystemService(NotificationManager.class).cancel(351);

      }

      JSONArray parts=data.optJSONArray("parts");Set<String> currentParts=new HashSet<>();if(parts!=null)for(int i=0;i<parts.length();i++){JSONObject part=parts.getJSONObject(i);String id=part.getString("id"),end=part.optString("warrantyEnd");currentParts.add(id);int notificationId=10000+(id.hashCode()&0x0fffffff);if(end.isEmpty()){c.getSystemService(NotificationManager.class).cancel(notificationId);continue;}LocalDate due=LocalDate.parse(end);String stage=ReminderRules.stage(LocalDate.now(),due,false);if(stage==null){c.getSystemService(NotificationManager.class).cancel(notificationId);continue;}String token=end+":"+stage,key="part-"+id;if(token.equals(prefs(c).getString(key,"")))continue;notify(c,notificationId,"AutoCarnet · garantie renseignée",part.optString("name")+" : date renseignée au "+end+". Vérifiez les conditions sur la facture.");prefs(c).edit().putString(key,token).apply();}

      String previousParts=prefs(c).getString("parts-ids","");for(String id:previousParts.split(","))if(!id.isEmpty()&&!currentParts.contains(id))c.getSystemService(NotificationManager.class).cancel(10000+(id.hashCode()&0x0fffffff));prefs(c).edit().putString("parts-ids",String.join(",",currentParts)).apply();

    } catch(Exception ignored){}

  }

  static void serviceNotice(Context c,int id,String key,String label,JSONObject last,int intervalKm,int months,int km)throws Exception{

    boolean kmDue=intervalKm>0&&last.optBoolean("hasKm",true)&&km>=last.getInt("km")+intervalKm;

    LocalDate due=months>0?LocalDate.parse(last.getString("date")).plusMonths(months):LocalDate.now().plusYears(100);

    String state=ReminderRules.stage(LocalDate.now(),due,kmDue);if(state==null){c.getSystemService(NotificationManager.class).cancel(id);return;}

    String token=last.getString("id")+":"+last.getString("date")+":"+last.getInt("km")+":"+intervalKm+":"+months+":"+state,pref="sent-service-"+key;if(token.equals(prefs(c).getString(pref,"")))return;

    String message=kmDue?"Échéance kilométrique atteinte : "+(last.getInt("km")+intervalKm)+" km":"Échéance le "+due+" ("+ChronoUnit.DAYS.between(LocalDate.now(),due)+" jour(s))";

    notify(c,id,label+" · AutoCarnet",message);prefs(c).edit().putString(pref,token).apply();

  }

  @Override public void onReceive(Context c,Intent intent){check(c);schedule(c);AutoBackupJob.schedule(c,false);}

}

