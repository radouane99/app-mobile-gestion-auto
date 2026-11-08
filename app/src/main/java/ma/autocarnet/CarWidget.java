package ma.autocarnet;
import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.widget.RemoteViews;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.json.*;

public class CarWidget extends AppWidgetProvider {
 static String words(String lang,String fr,String en,String ar){return lang.equals("ar")?ar:lang.equals("en")?en:fr;}
 static int res(Context c,String kind,String name){return c.getResources().getIdentifier(name,kind,c.getPackageName());}
 static void update(Context c){try{AppWidgetManager m=AppWidgetManager.getInstance(c);int[] ids=m.getAppWidgetIds(new ComponentName(c,CarWidget.class));if(ids.length==0)return;RemoteViews v=new RemoteViews(c.getPackageName(),res(c,"layout","car_widget"));String lang=c.getSharedPreferences("ui-language",0).getString("value","fr");
  v.setTextViewText(res(c,"id","widget_title"),c.getString(res(c,"string","app_name")));
  String[] actions={"reading","fuel","quick"};String[] labels={words(lang,"Photo compteur","Odometer photo","صورة العداد"),words(lang,"Carburant","Fuel","المازوط"),words(lang,"Dépense rapide","Quick expense","مصروف سريع")};
  for(int i=0;i<actions.length;i++){v.setTextViewText(res(c,"id","widget_"+actions[i]),labels[i]);v.setOnClickPendingIntent(res(c,"id","widget_"+actions[i]),intent(c,actions[i],i+1));}
  v.setOnClickPendingIntent(res(c,"id","widget_root"),intent(c,"home",0));
  String amount=words(lang,"Ouvrez votre carnet pour commencer","Open your log to get started","حلّ التطبيق باش تبدا"),due="",oil="";
  if(AppLock.enabled(c)){amount=words(lang,"Données masquées · application protégée","Data hidden · app protected","المعلومات مخفية · التطبيق مقفول");}
  else try{String raw=Store.load(c);if(!raw.isEmpty()){WidgetSummary.Value s=WidgetSummary.calculate(new JSONObject(raw),LocalDate.now());Locale locale=lang.equals("ar")?Locale.forLanguageTag("ar-MA"):lang.equals("en")?Locale.UK:Locale.FRANCE;amount=words(lang,"Payé ce mois : ","Paid this month: ","المؤدّى هاد الشهر: ")+String.format(locale,"%,.2f DH",s.paid);if(!s.dueDate.isEmpty()){String title=ReportPdf.LABELS.getOrDefault(s.dueType,s.dueType);if(lang.equals("en"))title=s.dueType.equals("oil")?"Oil change":s.dueType.equals("tires")?"Tires":"Service";if(lang.equals("ar"))title=s.dueType.equals("oil")?"تغيير الزيت":s.dueType.equals("tires")?"الإطارات":"الصيانة";due=title+" · "+LocalDate.parse(s.dueDate).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));}else due=words(lang,"Entretien : dates à renseigner","Service: add dates","الصيانة: كمّل التواريخ");if(s.oilKm!=null)oil=words(lang,"Vidange : ","Oil change: ","تغيير الزيت: ")+(s.oilKm>0?String.format(locale,"%,d km",s.oilKm)+words(lang," restants"," remaining"," باقية"):words(lang,"seuil km atteint","km threshold reached","وصل العداد للموعد"));}}catch(Exception ignored){amount=words(lang,"Ouvrez le carnet pour actualiser","Open the log to refresh","حلّ التطبيق باش يتحدّث");}
  v.setTextViewText(res(c,"id","widget_amount"),amount);v.setTextViewText(res(c,"id","widget_due"),due);v.setTextViewText(res(c,"id","widget_oil"),oil);m.updateAppWidget(ids,v);
 }catch(Exception ignored){} }
 static PendingIntent intent(Context c,String action,int code){Intent i=new Intent(c,MainActivity.class).setAction(c.getPackageName()+".widget."+action).putExtra("widget_action",action).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);return PendingIntent.getActivity(c,800+code,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){update(c);}
 @Override public void onReceive(Context c,Intent i){super.onReceive(c,i);update(c);}
}
