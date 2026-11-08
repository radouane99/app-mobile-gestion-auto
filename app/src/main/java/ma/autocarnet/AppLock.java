package ma.autocarnet;
import android.app.*;
import android.content.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import android.hardware.biometrics.*;

final class AppLock {
 static final int REQUEST=91;
 final Activity activity;final android.view.View content;final FrameLayout root;final Runnable onUnlocked;final LinearLayout cover;
 volatile boolean unlocked=false;boolean authenticating=false,credential=false,suppressOnce=false;int token=0;String action="unlock";CancellationSignal cancellation;
 static boolean enabled(Context c){return c.getSharedPreferences("security",0).getBoolean("enabled",false);}
 AppLock(Activity a,FrameLayout r,View v,Runnable callback,Bundle state){activity=a;root=r;content=v;onUnlocked=callback;
  cover=new LinearLayout(a);cover.setOrientation(LinearLayout.VERTICAL);cover.setGravity(Gravity.CENTER);cover.setPadding(32,32,32,32);cover.setBackgroundColor(0xff101d2d);
  TextView title=new TextView(a);title.setText("AutoCarnet verrouillé");title.setTextSize(24);title.setTextColor(0xffffffff);cover.addView(title);
  TextView help=new TextView(a);help.setText("Déverrouillez avec votre biométrie ou le code de ce téléphone.");help.setTextColor(0xffb6d7cc);help.setGravity(Gravity.CENTER);help.setPadding(12,26,12,26);cover.addView(help);
  Button unlock=new Button(a);unlock.setText("Déverrouiller");unlock.setOnClickListener(vw->authenticate("unlock"));cover.addView(unlock);
  Button exit=new Button(a);exit.setText("Fermer");exit.setOnClickListener(vw->a.finish());cover.addView(exit);root.addView(cover,new FrameLayout.LayoutParams(-1,-1));
  if(state!=null&&state.getBoolean("lockCredentialPending",false)){authenticating=true;credential=true;action=state.getString("lockAction","unlock");}
  if(!enabled(a)){unlocked=true;showContent();}else showLocked();secureFlag();
 }
 boolean canAccess(){return !enabled(activity)||unlocked;}
 void secureFlag(){if(enabled(activity))activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);}
 void showLocked(){content.setVisibility(View.INVISIBLE);cover.setVisibility(View.VISIBLE);}
 void showContent(){content.setVisibility(View.VISIBLE);cover.setVisibility(View.GONE);}
 void resume(){secureFlag();if(!canAccess()){showLocked();if(suppressOnce){suppressOnce=false;return;}if(!activity.getSystemService(KeyguardManager.class).isDeviceSecure())return;if(!authenticating)authenticate("unlock");}else{showContent();onUnlocked.run();}}
 void stop(){if(enabled(activity)){unlocked=false;showLocked();}if(authenticating&&!credential){token++;authenticating=false;if(cancellation!=null)cancellation.cancel();}}
 void saveState(Bundle out){out.putBoolean("lockCredentialPending",authenticating&&credential);out.putString("lockAction",action);}
 void configure(boolean enable){if(!canAccess())return;authenticate(enable?"enable":"disable");}
 void lockNow(){if(!enabled(activity))return;unlocked=false;showLocked();authenticate("unlock");}
 void authenticate(String requested){
  if(authenticating)return;KeyguardManager kg=activity.getSystemService(KeyguardManager.class);
  if(!kg.isDeviceSecure()){Toast.makeText(activity,"Configurez d’abord un code/PIN de verrouillage Android, puis réessayez.",Toast.LENGTH_LONG).show();activity.startActivity(new Intent(android.provider.Settings.ACTION_SECURITY_SETTINGS));return;}
  action=requested;authenticating=true;credential=false;final int attempt=++token;
  if(enabled(activity)){unlocked=false;showLocked();}
  if(Build.VERSION.SDK_INT<28){credential();return;}
  try{
   BiometricPrompt.Builder builder=new BiometricPrompt.Builder(activity).setTitle("AutoCarnet").setSubtitle("Confirmez avec votre biométrie ou le code du téléphone");
   if(Build.VERSION.SDK_INT>=30)builder.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG|BiometricManager.Authenticators.DEVICE_CREDENTIAL);
   else builder.setNegativeButton("Code du téléphone",activity.getMainExecutor(),(d,w)->{if(token==attempt)credential();});
   cancellation=new CancellationSignal();builder.build().authenticate(cancellation,activity.getMainExecutor(),new BiometricPrompt.AuthenticationCallback(){
    @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result){if(token==attempt)success();}
    @Override public void onAuthenticationError(int code,CharSequence text){if(token!=attempt||credential)return;if(code==BiometricPrompt.BIOMETRIC_ERROR_HW_UNAVAILABLE||code==BiometricPrompt.BIOMETRIC_ERROR_NO_BIOMETRICS||code==BiometricPrompt.BIOMETRIC_ERROR_HW_NOT_PRESENT||code==BiometricPrompt.BIOMETRIC_ERROR_LOCKOUT||code==BiometricPrompt.BIOMETRIC_ERROR_LOCKOUT_PERMANENT){credential();return;}authenticating=false;suppressOnce=true;if(enabled(activity))showLocked();else showContent();}
   });
  }catch(Exception e){credential();}
 }
 void credential(){try{credential=true;Intent intent=activity.getSystemService(KeyguardManager.class).createConfirmDeviceCredentialIntent("AutoCarnet","Confirmez le code/PIN de ce téléphone");if(intent==null){authenticating=false;credential=false;return;}activity.startActivityForResult(intent,REQUEST);}catch(Exception e){authenticating=false;credential=false;Toast.makeText(activity,"Authentification Android indisponible",Toast.LENGTH_LONG).show();}}
 boolean result(int request,int result){if(request!=REQUEST)return false;if(!authenticating||!credential)return true;authenticating=false;credential=false;if(result==Activity.RESULT_OK)success();else{suppressOnce=true;if(enabled(activity)){unlocked=false;showLocked();}else showContent();}return true;}
 void success(){authenticating=false;credential=false;if(action.equals("enable"))activity.getSharedPreferences("security",0).edit().putBoolean("enabled",true).commit();if(action.equals("disable"))activity.getSharedPreferences("security",0).edit().putBoolean("enabled",false).commit();action="unlock";unlocked=true;secureFlag();showContent();onUnlocked.run();}
}
