package ma.autocarnet;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.*;
import android.os.*;
import java.util.function.BiConsumer;
import org.json.*;

/** Foreground, user-triggered capture only; never reads a stale last-known position. */
final class ParkingLocator implements LocationListener {
 static final int PERMISSION=812;
 private final Activity activity;private final BiConsumer<String,String> callback;
 private final Handler handler=new Handler(Looper.getMainLooper());private LocationManager manager;private String requestId;private Location best;private boolean listening=false;private long startedNanos;
 private final Runnable timeout=()->{if(best!=null)success(best);else finish(error("timeout","Position introuvable. Essayez dehors ou notez le niveau et la place sans GPS."));};
 private final Runnable settle=()->{if(best!=null)success(best);};
 ParkingLocator(Activity a,BiConsumer<String,String> cb){activity=a;callback=cb;}
 void request(String id){if(requestId!=null)finish(error("cancelled","La recherche précédente a été remplacée."));requestId=id;best=null;startedNanos=SystemClock.elapsedRealtimeNanos();if(activity.checkSelfPermission("android.permission.ACCESS_FINE_LOCATION")!=PackageManager.PERMISSION_GRANTED&&activity.checkSelfPermission("android.permission.ACCESS_COARSE_LOCATION")!=PackageManager.PERMISSION_GRANTED){activity.requestPermissions(new String[]{"android.permission.ACCESS_FINE_LOCATION","android.permission.ACCESS_COARSE_LOCATION"},PERMISSION);return;}start();}
 void permissionResult(){if(requestId==null)return;if(activity.checkSelfPermission("android.permission.ACCESS_FINE_LOCATION")!=PackageManager.PERMISSION_GRANTED&&activity.checkSelfPermission("android.permission.ACCESS_COARSE_LOCATION")!=PackageManager.PERMISSION_GRANTED){finish(error("permission","Localisation non autorisée. Vous pouvez noter la place sans GPS."));return;}start();}
 private void start(){startedNanos=SystemClock.elapsedRealtimeNanos();manager=(LocationManager)activity.getSystemService(Context.LOCATION_SERVICE);boolean any=false;try{for(String provider:new String[]{LocationManager.GPS_PROVIDER,LocationManager.NETWORK_PROVIDER})if(manager.isProviderEnabled(provider)){try{manager.requestLocationUpdates(provider,0,0,this,Looper.getMainLooper());any=true;}catch(SecurityException denied){}}}catch(Exception e){}if(!any){finish(error("disabled","Activez la localisation du téléphone, ou notez la place sans GPS."));return;}listening=true;handler.postDelayed(timeout,45000);}
 @Override public void onLocationChanged(Location value){if(requestId==null||!ParkingRules.coordinates(value.getLatitude(),value.getLongitude())||!ParkingRules.fresh(SystemClock.elapsedRealtimeNanos(),value.getElapsedRealtimeNanos())||value.getElapsedRealtimeNanos()<startedNanos-5000000000L||!value.hasAccuracy()||!Float.isFinite(value.getAccuracy())||value.getAccuracy()<0||value.getTime()<=0)return;if(best==null||value.getAccuracy()<best.getAccuracy()){best=new Location(value);handler.removeCallbacks(settle);handler.postDelayed(settle,8000);}if(value.getAccuracy()<=25)success(value);}
 private void success(Location value){try{finish(new JSONObject().put("latitude",value.getLatitude()).put("longitude",value.getLongitude()).put("accuracy",value.getAccuracy()).put("capturedAt",java.time.Instant.ofEpochMilli(value.getTime()).toString()).toString());}catch(Exception e){finish(error("unavailable","Position indisponible."));}}
 private String error(String code,String message){try{return new JSONObject().put("error",message).put("code",code).toString();}catch(Exception e){return "{}";}}
 private void finish(String result){String id=requestId;requestId=null;handler.removeCallbacks(timeout);handler.removeCallbacks(settle);if(manager!=null)try{manager.removeUpdates(this);}catch(Exception ignored){}listening=false;best=null;if(id!=null)callback.accept(id,result);}
 void stop(){if(requestId!=null)finish(error("cancelled","Recherche arrêtée quand l’application passe en arrière-plan. Réessayez au premier plan."));else{handler.removeCallbacks(timeout);handler.removeCallbacks(settle);if(manager!=null)try{manager.removeUpdates(this);}catch(Exception ignored){}}}
 @Override public void onProviderEnabled(String provider){}
 @Override public void onProviderDisabled(String provider){}
 @Override public void onStatusChanged(String provider,int status,Bundle extras){}
}
