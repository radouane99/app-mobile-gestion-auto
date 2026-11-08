package ma.autocarnet;
import org.json.*;
import java.util.*;
/** Estimate from recorded product prices and user-defined oil-change frequencies. */
final class OilBudget {
 static double next(JSONObject data) throws JSONException {
  List<JSONObject> oils=new ArrayList<>();JSONArray entries=data.getJSONArray("entries");
  for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);if("oil".equals(e.optString("type")))oils.add(e);}
  oils.sort((a,b)->{int c=a.optString("date").compareTo(b.optString("date"));return c!=0?c:Integer.compare(a.optInt("km"),b.optInt("km"));});
  if(oils.isEmpty())return Double.NaN;JSONObject last=oils.get(oils.size()-1);JSONArray lines=last.optJSONArray("serviceLines");if(lines==null||lines.length()==0)return last.getDouble("cost");
  Map<String,List<JSONObject>> known=new HashMap<>();Map<String,Integer> indices=new HashMap<>();
  for(int i=0;i<oils.size();i++){JSONArray products=oils.get(i).optJSONArray("serviceLines");if(products==null)continue;Set<String> seen=new HashSet<>();for(int j=0;j<products.length();j++){JSONObject x=products.getJSONObject(j);String key=x.optString("serviceKey","other");if(key.equals("other")){key=x.optString("reference");if(key.isEmpty())key=x.getString("name");key=key.trim().toLowerCase(Locale.ROOT);}if(seen.add(key))known.put(key,new ArrayList<>());known.get(key).add(x);indices.put(key,i);}}
  JSONObject trace=last.optJSONObject("trace");double amount=trace==null?0:trace.optDouble("labor",0)+trace.optDouble("fees",0);
  for(String key:known.keySet())for(JSONObject x:known.get(key)){int passed=oils.size()-1-indices.get(key);if(passed>=x.optInt("everyOil",1)-1)amount+=x.getDouble("quantity")*x.getDouble("unitPrice");}
  return Math.round(amount*100)/100.0;
 }
}
