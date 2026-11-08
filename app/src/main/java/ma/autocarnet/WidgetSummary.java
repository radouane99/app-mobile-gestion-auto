package ma.autocarnet;
import java.time.*;
import java.util.*;
import org.json.*;

/** Computes labels from saved readings only. No extrapolated odometer or automatic payment. */
final class WidgetSummary {
 static final class Value {double paid;String dueType="",dueDate="";Long oilKm=null;}
 static String action(String value){return Arrays.asList("reading","fuel","quick","home").contains(value)?value:"";}
 static Value calculate(JSONObject d,LocalDate today)throws Exception{
  Value out=new Value();String period=today.toString().substring(0,7);JSONObject v=d.getJSONObject("vehicle");JSONArray entries=d.getJSONArray("entries");Map<String,JSONObject> last=new HashMap<>();long km=v.optLong("baselineKm",0);
  for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);String date=e.getString("date"),type=e.getString("type");if(date.compareTo(today.toString())>0)continue;if(date.startsWith(period))out.paid+=e.optDouble("cost",0);if(e.optBoolean("hasKm",true))km=Math.max(km,e.optLong("km",0));JSONObject old=last.get(type);if(old==null||date.compareTo(old.getString("date"))>0||date.equals(old.getString("date"))&&e.optLong("km")>old.optLong("km"))last.put(type,e);}
  JSONObject oil=last.get("oil");if(oil!=null){JSONObject plan=oil.optJSONObject("oilPlan");int months=plan==null?v.optInt("oilMonths",12):plan.optInt("months",12);long interval=plan==null?v.optLong("oilInterval",10000):plan.optLong("km",10000);if(oil.optBoolean("hasKm",true))out.oilKm=oil.optLong("km")+interval-km;consider(out,"oil",LocalDate.parse(oil.getString("date")).plusMonths(months).toString());}
  JSONObject tires=last.get("tires");if(tires!=null)consider(out,"tires",LocalDate.parse(tires.getString("date")).plusMonths(v.optInt("tireMonths",60)).toString());
  JSONArray plans=d.optJSONArray("plans");if(plans!=null)for(int i=0;i<plans.length();i++){JSONObject p=plans.getJSONObject(i),e=last.get(p.optString("type"));if(p.optBoolean("enabled")&&p.optInt("monthsInterval")>0&&e!=null)consider(out,p.getString("type"),LocalDate.parse(e.getString("date")).plusMonths(p.getInt("monthsInterval")).toString());}
  return out;
 }
 static void consider(Value out,String type,String date){if(out.dueDate.isEmpty()||date.compareTo(out.dueDate)<0){out.dueDate=date;out.dueType=type;}}
}
