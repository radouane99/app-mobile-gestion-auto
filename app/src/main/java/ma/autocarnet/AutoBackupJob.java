package ma.autocarnet;
import android.app.job.*;
import android.content.*;
import android.database.Cursor;
import android.net.Uri;
import android.os.PersistableBundle;
import android.provider.DocumentsContract;
import java.io.*;
import java.time.*;
import java.util.*;
import org.json.*;

public class AutoBackupJob extends JobService {
  static final int DAILY=81,CHANGE=82;
  private volatile boolean stopped;
  static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("backup",0);}
  static void schedule(Context c,boolean changed){
    JobScheduler jobs=c.getSystemService(JobScheduler.class);
    if(prefs(c).getString("tree","").isEmpty()){jobs.cancel(DAILY);jobs.cancel(CHANGE);return;}
    ComponentName name=new ComponentName(c,AutoBackupJob.class);
    if(jobs.getPendingJob(DAILY)==null)jobs.schedule(new JobInfo.Builder(DAILY,name).setPeriodic(24*60*60*1000L).setPersisted(true).build());
    if(changed&&jobs.getPendingJob(CHANGE)==null)jobs.schedule(new JobInfo.Builder(CHANGE,name).setMinimumLatency(30000).setOverrideDeadline(5*60*1000L).setPersisted(true).build());
  }
  static Uri create(Context c,Uri tree,String mime,String filename)throws Exception{
    Uri parent=DocumentsContract.buildDocumentUriUsingTree(tree,DocumentsContract.getTreeDocumentId(tree));Uri doc=DocumentsContract.createDocument(c.getContentResolver(),parent,mime,filename);if(doc==null)throw new IOException("Dossier non accessible en écriture");return doc;
  }
  static void deleteOwned(Context c,String uri){try{Uri u=Uri.parse(uri);try(Cursor cur=c.getContentResolver().query(u,new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME},null,null,null)){if(cur!=null&&cur.moveToFirst()&&cur.getString(0).matches("AutoCarnet-auto-[0-9TZ-]+-[a-f0-9-]+\\.zip"))DocumentsContract.deleteDocument(c.getContentResolver(),u);}}catch(Exception ignored){}}
  static synchronized void runBackup(Context c,boolean force)throws Exception{
    String treeValue=prefs(c).getString("tree","");if(treeValue.isEmpty())return;Uri tree=Uri.parse(treeValue);String json=Store.load(c);if(json.isEmpty())return;
    String digest=Store.hash(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    if(force||!digest.equals(prefs(c).getString("hash",""))){
      String stamp=LocalDateTime.now().withNano(0).toString().replace(":","-");Uri out=create(c,tree,"application/zip","AutoCarnet-auto-"+stamp+"-"+UUID.randomUUID()+".zip");
      try(OutputStream stream=c.getContentResolver().openOutputStream(out,"w")){if(stream==null)throw new IOException("Destination indisponible");Store.exportZip(c,json,stream);}catch(Exception e){try{DocumentsContract.deleteDocument(c.getContentResolver(),out);}catch(Exception ignored){}throw e;}
      JSONArray old=new JSONArray(prefs(c).getString("copies","[]")),keep=new JSONArray();keep.put(out.toString());for(int i=0;i<old.length();i++){if(i<2)keep.put(old.getString(i));else deleteOwned(c,old.getString(i));}
      prefs(c).edit().putString("copies",keep.toString()).putString("hash",digest).putLong("last",System.currentTimeMillis()).remove("error").apply();
    }
    // Close the last calendar month. Rebuild it if historical data change.
    YearMonth end=YearMonth.now().minusMonths(1),start=YearMonth.parse(prefs(c).getString("reportStart",end.toString()));
    if(start.isAfter(end))start=end;
    for(YearMonth cursor=start;!cursor.isAfter(end);cursor=cursor.plusMonths(1)){
    String month=cursor.toString(),reportKey="report-"+month;
    String reportHash=ReportPdf.fingerprint(new JSONObject(json),month);
    if(!reportHash.equals(prefs(c).getString(reportKey,""))){
      boolean firstReport=prefs(c).getString(reportKey,"").isEmpty();
      Uri pdf=create(c,tree,"application/pdf","AutoCarnet-rapport-"+month+"-"+System.currentTimeMillis()+".pdf");
      try(OutputStream stream=c.getContentResolver().openOutputStream(pdf,"w")){ReportPdf.write(new JSONObject(json),month,stream);}catch(Exception e){try{DocumentsContract.deleteDocument(c.getContentResolver(),pdf);}catch(Exception ignored){}throw e;}
      prefs(c).edit().putString(reportKey,reportHash).putString("lastReportMonth",month).putString("lastReportUri",pdf.toString()).remove("error").apply();
      if(firstReport&&ReminderReceiver.prefs(c).getBoolean("enabled",false))ReminderReceiver.notify(c,997,"AutoCarnet · rapport mensuel prêt","Le rapport PDF de "+month+" est enregistré dans votre dossier de sauvegarde.");
      if(firstReport&&ReminderReceiver.prefs(c).getBoolean("enabled",false)){JSONObject source=new JSONObject(json),profile=source.optJSONObject("coachProfile");if(profile!=null&&profile.optBoolean("enabled")){JSONObject result=EngineCoach.month(source,month);if(result.getInt("highCount")>0)ReminderReceiver.notify(c,352,"AutoCarnet · bilan gasoil "+month,result.getInt("highCount")+" cycle(s) au-dessus de votre repère personnel. Consultez les mesures et le contexte dans le rapport PDF.");}}
    }
    }
  }
  static void failure(Context c,Exception e){String error=e.getMessage()==null?"Vérifiez le dossier et les droits d’accès":e.getMessage();prefs(c).edit().putString("error",error).apply();if(ReminderReceiver.prefs(c).getBoolean("enabled",false))ReminderReceiver.notify(c,998,"AutoCarnet · sauvegarde à vérifier","La copie automatique a échoué. Ouvrez Réglages : "+error);}
  @Override public boolean onStartJob(JobParameters params){stopped=false;new Thread(()->{boolean retry=false;try{runBackup(this,false);}catch(Exception e){retry=true;failure(this,e);}finally{if(!stopped)jobFinished(params,retry);}}).start();return true;}
  @Override public boolean onStopJob(JobParameters params){stopped=true;return true;}
}
