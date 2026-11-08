package ma.autocarnet;
import java.util.Locale;
final class ParkingRules {
 static boolean coordinates(double lat,double lon){return Double.isFinite(lat)&&Double.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;}
 static boolean fresh(long nowElapsed,long locationElapsed){return locationElapsed>0&&locationElapsed<=nowElapsed&&nowElapsed-locationElapsed<=60000000000L;}
 static String pair(double lat,double lon){if(!coordinates(lat,lon))throw new IllegalArgumentException();return String.format(Locale.US,"%.7f,%.7f",lat,lon);}
 static String map(double lat,double lon,boolean directions){String value=pair(lat,lon).replace(",","%2C");return directions?"https://www.google.com/maps/dir/?api=1&destination="+value+"&travelmode=walking":"https://www.google.com/maps/search/?api=1&query="+value;}
}
