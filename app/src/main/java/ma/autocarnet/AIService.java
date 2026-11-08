package ma.autocarnet;
import android.content.Context;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.json.*;

/** Optional service connection. Never contains a provider API key or reads Store. */
final class AIService {
  static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("ai-service",0);}
  static boolean validEndpoint(String value){try{URI u=new URI(value);return "https".equals(u.getScheme())&&u.getHost()!=null&&!u.getHost().equalsIgnoreCase("api.openai.com")&&u.getUserInfo()==null&&u.getFragment()==null&&u.getQuery()==null&&(u.getPort()==-1||u.getPort()==443);}catch(Exception e){return false;}}
  static String status(Context c){try{return new JSONObject().put("configured",validEndpoint(prefs(c).getString("endpoint",""))&&!prefs(c).getString("token","").isEmpty()).put("endpoint",prefs(c).getString("endpoint","")).toString();}catch(Exception e){return "{}";}}
  static boolean configure(Context c,String endpoint,String token){endpoint=endpoint.trim();if(!validEndpoint(endpoint)||token==null||token.length()>2000||token.contains("\n")||token.contains("\r")||token.startsWith("sk-"))return false;if(token.isEmpty())token=prefs(c).getString("endpoint","").equals(endpoint)?prefs(c).getString("token",""):"";if(token.isEmpty())return false;prefs(c).edit().putString("endpoint",endpoint).putString("token",token).apply();return true;}
  static String ask(Context c,String raw){HttpsURLConnectionGuard connection=null;try{
    if(raw.length()>30000)throw new IOException("Requête trop longue");JSONObject payload=new JSONObject(raw);String question=payload.getString("question");if(question.trim().isEmpty()||question.length()>2000)throw new IOException("Question invalide");
    String endpoint=prefs(c).getString("endpoint",""),token=prefs(c).getString("token","");if(!validEndpoint(endpoint)||token.isEmpty())return new JSONObject().put("error","Configurez d’abord le service IA sécurisé. Le carnet hors ligne reste disponible.").toString();
    connection=new HttpsURLConnectionGuard((javax.net.ssl.HttpsURLConnection)new URL(endpoint).openConnection());javax.net.ssl.HttpsURLConnection http=connection.http;http.setInstanceFollowRedirects(false);http.setConnectTimeout(10000);http.setReadTimeout(50000);http.setRequestMethod("POST");http.setDoOutput(true);http.setRequestProperty("Authorization","Bearer "+token);http.setRequestProperty("Content-Type","application/json; charset=utf-8");byte[] bytes=payload.toString().getBytes(StandardCharsets.UTF_8);http.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=http.getOutputStream()){out.write(bytes);}int code=http.getResponseCode();if(code!=200)return new JSONObject().put("error",code==401||code==403?"Code d’accès refusé. Vérifiez la connexion au service.":code==429?"Limite du service atteinte. Réessayez plus tard.":"Service IA indisponible ("+code+"). Vos données restent enregistrées.").toString();
    ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=http.getInputStream()){byte[] buffer=new byte[4096];int count;while((count=in.read(buffer))!=-1){if(out.size()+count>100000)throw new IOException("Réponse trop longue");out.write(buffer,0,count);}}JSONObject response=new JSONObject(out.toString("UTF-8"));String answer=response.getString("answer");if(answer.length()>20000)throw new IOException("Réponse trop longue");return new JSONObject().put("answer",answer).toString();
  }catch(Exception e){return "{\"error\":\"Connexion IA impossible. Vérifiez Internet et la configuration du serveur.\"}";}finally{if(connection!=null)connection.http.disconnect();}}
  private static final class HttpsURLConnectionGuard{final javax.net.ssl.HttpsURLConnection http;HttpsURLConnectionGuard(javax.net.ssl.HttpsURLConnection value){http=value;}}
}
