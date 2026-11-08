package ma.autocarnet;
import android.content.Context;
import org.json.JSONObject;
public class AIServiceTest{
 public static void main(String[] args)throws Exception{
  Context c=new Context();String[] rejected={"http://example.com/assistant","https://user:pass@example.com/assistant","https://example.com/assistant?key=x","https://example.com/#x","https://api.openai.com/v1/responses","file:///tmp/a","https://example.com:8080/assistant"};
  for(String value:rejected)if(AIService.validEndpoint(value))throw new AssertionError(value);
  if(!AIService.validEndpoint("https://example.com/assistant"))throw new AssertionError();
  if(new JSONObject(AIService.status(c)).getBoolean("configured"))throw new AssertionError();
  if(!new JSONObject(AIService.ask(c,"{\"question\":\"Bonjour\"}")).has("error"))throw new AssertionError();
  if(AIService.configure(c,"https://example.com/assistant","sk-never-put-provider-key-in-apk"))throw new AssertionError();
  if(!AIService.configure(c,"https://example.com/assistant","test-personal-service-token"))throw new AssertionError();
  if(!new JSONObject(AIService.status(c)).getBoolean("configured"))throw new AssertionError();
  if(new JSONObject(AIService.status(c)).has("token"))throw new AssertionError();
  if(AIService.configure(c,"https://other.example/assistant",""))throw new AssertionError();
  if(!AIService.configure(c,"https://example.com/assistant",""))throw new AssertionError();
  if(AIService.configure(c,"https://example.com/assistant","x\nInjected"))throw new AssertionError();
  System.out.println("IA native : HTTPS, refus redirections de configuration, clé fournisseur refusée, code privé non exposé, état et absence de configuration vérifiés sans appel externe.");
 }
}
