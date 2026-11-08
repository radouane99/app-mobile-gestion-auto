package ma.autocarnet;
import java.util.*;import org.json.*;
final class FuelTrend {
 static JSONObject analyze(JSONObject data)throws Exception{
  List<JSONObject> cycles=new ArrayList<>();JSONObject anchor=null;double liters=0;
  for(JSONObject e:ReportPdf.entries(data)){if(!e.optString("type").equals("fuel"))continue;if(!e.optBoolean("hasKm",true)){anchor=null;liters=0;continue;}if(anchor==null){if(e.optBoolean("full"))anchor=e;continue;}if(e.isNull("liters")){anchor=e.optBoolean("full")?e:null;liters=0;continue;}liters+=e.getDouble("liters");if(e.optBoolean("full")&&e.getDouble("km")>anchor.getDouble("km")){double km=e.getDouble("km")-anchor.getDouble("km");cycles.add(new JSONObject().put("id",e.getString("id")).put("liters",liters).put("km",km).put("rate",100*liters/km));anchor=e;liters=0;}}
  if(cycles.size()<3)return null;JSONObject last=cycles.get(cycles.size()-1);if(last.getDouble("km")<100)return null;List<JSONObject> previous=new ArrayList<>();for(int i=0;i<cycles.size()-1;i++)if(cycles.get(i).getDouble("km")>=100)previous.add(cycles.get(i));if(previous.size()<2)return null;double totalLiters=0,totalKm=0;for(int i=Math.max(0,previous.size()-5);i<previous.size();i++){totalLiters+=previous.get(i).getDouble("liters");totalKm+=previous.get(i).getDouble("km");}double baseline=100*totalLiters/totalKm;if(baseline<=0)return null;double increase=100*(last.getDouble("rate")/baseline-1);return new JSONObject().put("id",last.getString("id")).put("last",last.getDouble("rate")).put("baseline",baseline).put("increase",increase).put("alert",increase>20);
 }
}
