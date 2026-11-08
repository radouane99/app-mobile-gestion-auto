package ma.autocarnet;

import android.app.*;

import android.os.*;

import android.content.*;

import android.webkit.*;

import android.net.Uri;

import android.widget.Toast;

import android.graphics.*;

import android.media.ExifInterface;

import android.provider.MediaStore;

import java.io.*;

import org.json.JSONObject;



public class MainActivity extends Activity {

  private WebView web;
  private String pendingWidgetAction="";private boolean widgetDispatching=false;

  private AppLock appLock;private boolean webLoaded=false,pageReady=false;

  private final java.util.ArrayDeque<String> deferred=new java.util.ArrayDeque<>();

  private String pendingExport,photoKind="facture",photoSession="";

  private Uri cameraUri=Uri.parse("content://ma.autocarnet.capture/capture.jpg");

  private volatile boolean busy=false;
  private volatile boolean aiBusy=false;
  private ParkingLocator parkingLocator;
  private final java.util.concurrent.atomic.AtomicBoolean routeBusy=new java.util.concurrent.atomic.AtomicBoolean(false);

  public void onCreate(Bundle state){

    super.onCreate(state);
    if(state!=null)pendingWidgetAction=state.getString("widgetAction","");readWidgetIntent(getIntent());

    if(state!=null){photoKind=state.getString("photoKind","facture");photoSession=state.getString("photoSession","");}

    try{if(Store.load(this).isEmpty()){String old=getPreferences(0).getString("data","");if(!old.isEmpty())Store.save(this,old);}}catch(Exception ignored){}

    getWindow().setStatusBarColor(0xff101d2d);getWindow().setNavigationBarColor(0xff101d2d);

    if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
    parkingLocator=new ParkingLocator(this,(id,result)->js("window.receiveParkingLocation && window.receiveParkingLocation("+JSONObject.quote(id)+","+JSONObject.quote(result)+")"));
    web=new WebView(this);

    WebView.setWebContentsDebuggingEnabled(false);web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);web.getSettings().setSafeBrowsingEnabled(true);web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);web.getSettings().setBuiltInZoomControls(true);web.getSettings().setDisplayZoomControls(false);

    web.setWebChromeClient(new WebChromeClient(){@Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){String lang=getSharedPreferences("ui-language",0).getString("value","fr");new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton(lang.equals("ar")?"تأكيد":lang.equals("en")?"Confirm":"Confirmer",(d,w)->result.confirm()).setNegativeButton(lang.equals("ar")?"إلغاء":lang.equals("en")?"Cancel":"Annuler",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}});

    web.addJavascriptInterface(new Bridge(),"Android");

    web.setWebViewClient(new WebViewClient(){

      @Override public void onPageFinished(WebView v,String url){if(url.equals("https://app.local/index.html")){pageReady=true;flushDeferred();deliverPhoto();deliverWidgetAction();}}

      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return true;}

      @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){

        if(!"https".equals(r.getUrl().getScheme())||!"app.local".equals(r.getUrl().getHost())||(r.getUrl().getPort()!=-1&&r.getUrl().getPort()!=443)||!"GET".equals(r.getMethod()))return empty();String path=r.getUrl().getPath();if(path==null||path.equals("/"))path="/index.html";

        try{if(path.startsWith("/photos/")){if(!path.matches("/photos/[a-f0-9]{64}\\.jpg")||!authorized())return empty();return new WebResourceResponse("image/jpeg",null,new FileInputStream(Store.photo(MainActivity.this,path.substring(8))));}

          if(path.matches("/ocr/[a-zA-Z0-9._-]+"))return new WebResourceResponse(path.endsWith(".js")?"text/javascript":path.endsWith(".wasm")?"application/wasm":"application/octet-stream",path.endsWith(".js")?"UTF-8":null,getAssets().open(path.substring(1)));

          if(!path.matches("/(index.html|app.js|widget.js|equipment-details.js|road.js|road-logic.js|part-life.js|driving-calendar.js|fuel-planner.js|garage-sheet.js|logic.js|smart-logic.js|insights-logic.js|coach-logic.js|extras.js|advanced.js|smart.js|insights.js|coach.js|usability.js|usability.css|parking.js|parking-logic.js|localization-extra.js|localization.js|localization.css|theme.js|theme.css|route-data.js|route-logic.js|toll-data.js|trip-budget.js|trip-simple.js|refine.css|refine.js|beginner.js|ocr-review.js|pocket.js|connected-routes.js|routes.js|closing.js|finance.js|finance-logic.js|workflow.js|workflow-logic.js|ease.js|ease-logic.js|proofs.js|product.js|product.css|assistant.js|assistant-vocab.js|assistant-logic.js|trace.js|trace-logic.js|equipment.js|equipment-logic.js|brand.svg|style.css)"))return empty();

          return new WebResourceResponse(path.endsWith(".svg")?"image/svg+xml":path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":"text/html","UTF-8",getAssets().open(path.substring(1)));

        }catch(Exception e){return empty();}

      }

    });

    android.widget.FrameLayout root=new android.widget.FrameLayout(this);root.setBackgroundColor(0xff101d2d);
    root.setOnApplyWindowInsetsListener((view,insets)->{
      int left,top,right,bottom;
      if(Build.VERSION.SDK_INT>=30){android.graphics.Insets safe=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.displayCutout()|android.view.WindowInsets.Type.ime());left=safe.left;top=safe.top;right=safe.right;bottom=safe.bottom;}
      else{left=insets.getSystemWindowInsetLeft();top=insets.getSystemWindowInsetTop();right=insets.getSystemWindowInsetRight();bottom=insets.getSystemWindowInsetBottom();if(Build.VERSION.SDK_INT>=28&&insets.getDisplayCutout()!=null){android.view.DisplayCutout cutout=insets.getDisplayCutout();left=Math.max(left,cutout.getSafeInsetLeft());top=Math.max(top,cutout.getSafeInsetTop());right=Math.max(right,cutout.getSafeInsetRight());bottom=Math.max(bottom,cutout.getSafeInsetBottom());}}
      // Resize the WebView viewport itself: CSS fixed/sticky controls must stay inside the safe area.
      view.setPadding(left,top,right,bottom);
      return Build.VERSION.SDK_INT>=30?android.view.WindowInsets.CONSUMED:insets.consumeSystemWindowInsets();
    });
    root.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));setContentView(root);root.requestApplyInsets();appLock=new AppLock(this,root,web,()->unlockContent(),state);ReminderReceiver.channel(this);ReminderReceiver.schedule(this);AutoBackupJob.schedule(this,false);

  }

  private void parkingIntent(boolean share){if(!authorized())return;try{JSONObject p=new JSONObject(Store.load(this)).getJSONObject("parking");if(p.isNull("latitude")||p.isNull("longitude"))return;double lat=p.getDouble("latitude"),lon=p.getDouble("longitude");String url=ParkingRules.map(lat,lon,!share);if(share){Intent intent=new Intent(Intent.ACTION_SEND);intent.setType("text/plain");intent.putExtra(Intent.EXTRA_TEXT,url);startActivity(Intent.createChooser(intent,"Maps / WhatsApp"));}else startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){message("Position ou application de partage indisponible");}}

  private WebResourceResponse empty(){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}

  private void message(String text){runOnUiThread(()->Toast.makeText(this,text,Toast.LENGTH_LONG).show());}

  private void connectedRequest(String id,java.util.concurrent.Callable<JSONObject> work){if(id==null||!id.matches("[a-zA-Z0-9-]{1,100}"))return;if(!routeBusy.compareAndSet(false,true)){js("window.receiveConnectedRoute && window.receiveConnectedRoute("+JSONObject.quote(id)+",{error:'Une recherche est déjà en cours.'})");return;}new Thread(()->{JSONObject result;try{result=work.call();}catch(Exception e){result=new JSONObject();try{result.put("error", "Connexion ou itinéraire indisponible. Aucun ancien trajet n’a été appliqué. Réessayez ou changez les points.");}catch(Exception ignored){}}finally{routeBusy.set(false);}js("window.receiveConnectedRoute && window.receiveConnectedRoute("+JSONObject.quote(id)+","+result.toString()+")");}).start();}

  private boolean authorized(){return appLock!=null&&appLock.canAccess();}

  private void requireUnlocked(){if(!authorized())throw new SecurityException("AutoCarnet verrouillé");}

  private void js(String script){runOnUiThread(()->{if(!authorized()||!pageReady){if(!deferred.contains(script))deferred.add(script);return;}web.evaluateJavascript(script,null);});}

  private void flushDeferred(){if(!authorized()||!pageReady)return;while(!deferred.isEmpty())web.evaluateJavascript(deferred.removeFirst(),null);}

  private void readWidgetIntent(Intent intent){if(intent==null)return;String action=WidgetSummary.action(intent.getStringExtra("widget_action"));if(!action.isEmpty())pendingWidgetAction=action;intent.removeExtra("widget_action");}
  @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);readWidgetIntent(intent);deliverWidgetAction();}
  private void deliverWidgetAction(){if(!authorized()||!pageReady||pendingWidgetAction.isEmpty()||widgetDispatching)return;String action=pendingWidgetAction;widgetDispatching=true;web.evaluateJavascript("window.openWidgetAction ? window.openWidgetAction("+JSONObject.quote(action)+") : false",result->{widgetDispatching=false;if("true".equals(result)&&pendingWidgetAction.equals(action))pendingWidgetAction="";});}
  private void unlockContent(){CarWidget.update(this);if(!webLoaded){webLoaded=true;web.loadUrl("https://app.local/index.html");}else{flushDeferred();deliverPhoto();deliverWidgetAction();js("window.refreshLockStatus && window.refreshLockStatus()");}}

  @Override protected void onSaveInstanceState(Bundle out){super.onSaveInstanceState(out);out.putString("widgetAction",pendingWidgetAction);out.putString("photoKind",photoKind);out.putString("photoSession",photoSession);if(appLock!=null)appLock.saveState(out);}

  @Override protected void onResume(){super.onResume();CarWidget.update(this);if(appLock!=null)appLock.resume();if(web!=null){js("window.refreshNativeStatus && window.refreshNativeStatus()");js("window.refreshBackupStatus && window.refreshBackupStatus()");}ReminderReceiver.check(this);ReminderReceiver.schedule(this);AutoBackupJob.schedule(this,false);}

  @Override protected void onStop(){if(parkingLocator!=null)parkingLocator.stop();if(appLock!=null)appLock.stop();super.onStop();}

  @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){super.onRequestPermissionsResult(request,permissions,grants);if(request==ParkingLocator.PERMISSION){if(authorized())parkingLocator.permissionResult();else parkingLocator.stop();return;}ReminderReceiver.check(this);js("window.refreshNativeStatus && window.refreshNativeStatus()");}

  class Bridge {
    @JavascriptInterface public void requestParkingLocation(String id){requireUnlocked();if(id!=null&&id.matches("[a-zA-Z0-9-]{1,100}"))runOnUiThread(()->{if(authorized())parkingLocator.request(id);});}
    @JavascriptInterface public void cancelParkingLocation(){requireUnlocked();runOnUiThread(()->parkingLocator.stop());}
    @JavascriptInterface public void openParkingSettings(String reason){requireUnlocked();runOnUiThread(()->{try{Intent i="permission".equals(reason)?new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+getPackageName())):new Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS);startActivity(i);}catch(Exception e){message("Réglages indisponibles");}});}
    @JavascriptInterface public void searchTripCity(String id,String query,String country){requireUnlocked();connectedRequest(id,()->ConnectedRoutes.search(query,country));}
    @JavascriptInterface public void calculateTripRoute(String id,double a,double b,double c,double d,boolean national,boolean round){requireUnlocked();connectedRequest(id,()->ConnectedRoutes.route(a,b,c,d,national,round));}
    @JavascriptInterface public void openConnectedTripMap(double a,double b,double c,double d,boolean national){requireUnlocked();if(!ParkingRules.coordinates(a,b)||!ParkingRules.coordinates(c,d))return;String url="https://www.google.com/maps/dir/?api=1&origin="+ParkingRules.pair(a,b).replace(",","%2C")+"&destination="+ParkingRules.pair(c,d).replace(",","%2C")+"&travelmode=driving"+(national?"&avoid=highways":"");runOnUiThread(()->{if(!authorized())return;try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){message("Maps indisponible");}});}
    @JavascriptInterface public void openTollInfo(){requireUnlocked();runOnUiThread(()->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://www.adm.co.ma/fr/grille-tarifaire-sur-le-reseau")));}catch(Exception e){message("Navigateur indisponible");}});}
    @JavascriptInterface public void openTripMap(double lat1,double lon1,double lat2,double lon2){requireUnlocked();if(!ParkingRules.coordinates(lat1,lon1)||!ParkingRules.coordinates(lat2,lon2))return;String url="https://www.google.com/maps/dir/?api=1&origin="+ParkingRules.pair(lat1,lon1).replace(",","%2C")+"&destination="+ParkingRules.pair(lat2,lon2).replace(",","%2C")+"&travelmode=driving";runOnUiThread(()->{if(!authorized())return;try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){message("Maps indisponible");}});}
    @JavascriptInterface public void openParkingMap(){requireUnlocked();runOnUiThread(()->parkingIntent(false));}
    @JavascriptInterface public void shareParking(){requireUnlocked();runOnUiThread(()->parkingIntent(true));}
    @JavascriptInterface public void shareText(String text,String title){requireUnlocked();if(text==null||text.isEmpty())return;runOnUiThread(()->{try{Intent i=new Intent(Intent.ACTION_SEND);i.setType("text/plain");i.putExtra(Intent.EXTRA_TEXT,text);startActivity(Intent.createChooser(i,title!=null?title:"Partager"));}catch(Exception e){message("Application de partage indisponible");}});}

    @JavascriptInterface public String pinCarWidget(){requireUnlocked();android.appwidget.AppWidgetManager m=android.appwidget.AppWidgetManager.getInstance(MainActivity.this);if(!m.isRequestPinAppWidgetSupported())return "unsupported";runOnUiThread(()->{m.requestPinAppWidget(new ComponentName(MainActivity.this,CarWidget.class),null,null);CarWidget.update(MainActivity.this);});return "requested";}
    @JavascriptInterface public void setUiLanguage(String value){requireUnlocked();if(java.util.Arrays.asList("fr","en","ar").contains(value))getSharedPreferences("ui-language",0).edit().putString("value",value).apply();CarWidget.update(MainActivity.this);}

    @JavascriptInterface public String aiStatus(){requireUnlocked();return AIService.status(MainActivity.this);}
    @JavascriptInterface public boolean configureAI(String endpoint,String token){requireUnlocked();return AIService.configure(MainActivity.this,endpoint,token);}
    @JavascriptInterface public void clearAIConfig(){requireUnlocked();AIService.prefs(MainActivity.this).edit().clear().apply();}
    @JavascriptInterface public synchronized void askAI(String id,String payload){requireUnlocked();if(id==null||!id.matches("[a-zA-Z0-9-]{1,100}"))return;if(aiBusy){js("window.receiveAI("+JSONObject.quote(id)+", "+JSONObject.quote("{\"error\":\"Une réponse est déjà en cours.\"}")+")");return;}aiBusy=true;new Thread(()->{String result=AIService.ask(MainActivity.this,payload);aiBusy=false;js("window.receiveAI("+JSONObject.quote(id)+","+JSONObject.quote(result)+")");}).start();}


    @JavascriptInterface public String lockStatus(){return "{\"enabled\":"+AppLock.enabled(MainActivity.this)+",\"deviceSecure\":"+getSystemService(KeyguardManager.class).isDeviceSecure()+"}";}

    @JavascriptInterface public void configureLock(boolean enable){requireUnlocked();runOnUiThread(()->appLock.configure(enable));}

    @JavascriptInterface public void lockNow(){requireUnlocked();runOnUiThread(()->appLock.lockNow());}

    @JavascriptInterface public void openRoutingInfo(String key){requireUnlocked();String url="map".equals(key)?"https://www.openstreetmap.org/fixthemap":"https://valhalla.github.io/valhalla/start/introduction/";runOnUiThread(()->{if(!authorized())return;try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){message("Navigateur indisponible");}});}
    @JavascriptInterface public void openCoachInfo(String url){requireUnlocked();if(!java.util.Arrays.asList("https://www.renault.fr/faq-apres-vente.html","https://www.dacia.fr/regles-environnementales/wltp.html").contains(url))return;runOnUiThread(()->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){message("Aucun navigateur disponible");}});}

    @JavascriptInterface public String load(){requireUnlocked();try{return Store.load(MainActivity.this);}catch(Exception e){return "INVALID";}}

    @JavascriptInterface public boolean save(String json){requireUnlocked();try{Store.save(MainActivity.this,json);runOnUiThread(()->{CarWidget.update(MainActivity.this);ReminderReceiver.check(MainActivity.this);ReminderReceiver.schedule(MainActivity.this);AutoBackupJob.schedule(MainActivity.this,true);});return true;}catch(Exception e){return false;}}

    @JavascriptInterface public void exportData(String json){requireUnlocked();try{try(FileOutputStream out=new FileOutputStream(new File(getCacheDir(),"export.json"))){out.write(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));}pendingExport=json;runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.setType("application/zip");i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,"AutoCarnet-sauvegarde.zip");startActivityForResult(i,10);});}catch(Exception e){message("Impossible de préparer la sauvegarde");}}

    @JavascriptInterface public void importData(){requireUnlocked();runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("*/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,11);});}

    @JavascriptInterface public void chooseBackupFolder(){requireUnlocked();runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);startActivityForResult(i,14);});}

    @JavascriptInterface public String backupStatus(){requireUnlocked();try{return new JSONObject().put("enabled",!AutoBackupJob.prefs(MainActivity.this).getString("tree","").isEmpty()).put("last",AutoBackupJob.prefs(MainActivity.this).getLong("last",0)).put("error",AutoBackupJob.prefs(MainActivity.this).getString("error","")).put("reportMonth",AutoBackupJob.prefs(MainActivity.this).getString("lastReportMonth","")).toString();}catch(Exception e){return "{}";}}

    @JavascriptInterface public void backupNow(){requireUnlocked();new Thread(()->{try{if(AutoBackupJob.prefs(MainActivity.this).getString("tree","").isEmpty()){message("Choisissez d’abord un dossier de sauvegarde.");return;}message("Sauvegarde en cours…");AutoBackupJob.runBackup(MainActivity.this,true);message("Sauvegarde terminée");}catch(Exception e){AutoBackupJob.failure(MainActivity.this,e);message("Sauvegarde impossible : "+e.getMessage());}finally{js("window.refreshBackupStatus && window.refreshBackupStatus()");}}).start();}

    @JavascriptInterface public void disableAutoBackup(){requireUnlocked();AutoBackupJob.prefs(MainActivity.this).edit().remove("tree").apply();runOnUiThread(()->{AutoBackupJob.schedule(MainActivity.this,false);js("window.refreshBackupStatus && window.refreshBackupStatus()");});}

    @JavascriptInterface public void exportCsv(String csv,String month){requireUnlocked();if(!month.matches("[0-9]{4}-[0-9]{2}"))return;try{try(FileOutputStream out=new FileOutputStream(new File(getCacheDir(),"expenses.csv"))){out.write(csv.getBytes(java.nio.charset.StandardCharsets.UTF_8));}runOnUiThread(()->createFile("text/csv","AutoCarnet-"+month+".csv",15));}catch(Exception e){message("Export CSV impossible");}}

    @JavascriptInterface public void exportReport(String month){requireUnlocked();new Thread(()->{try{FinanceReport.start(month);String json=Store.load(MainActivity.this);if(json.isEmpty()){message("Enregistrez votre voiture ou une opération avant de créer un rapport.");return;}try(OutputStream out=new FileOutputStream(new File(getCacheDir(),"report.pdf"))){ReportPdf.write(new JSONObject(json),month,out);}runOnUiThread(()->createFile("application/pdf","AutoCarnet-rapport-"+month+".pdf",16));}catch(Exception e){message("Rapport PDF impossible : "+e.getMessage());}}).start();}

    @JavascriptInterface public void exportRoad(String options){requireUnlocked();new Thread(()->{try{JSONObject d=new JSONObject(Store.load(MainActivity.this));try(OutputStream out=new FileOutputStream(new File(getCacheDir(),"road.pdf"))){RoadReport.write(MainActivity.this,d,new JSONObject(options),out);}runOnUiThread(()->createFile("application/pdf","AutoCarnet-dossier-etat.pdf",19));}catch(Exception e){message("Dossier PDF impossible : "+e.getMessage());}}).start();}
    @JavascriptInterface public void exportResale(String options){requireUnlocked();new Thread(()->{try{String json=Store.load(MainActivity.this);if(json.isEmpty())throw new IOException("Carnet vide");try(OutputStream out=new FileOutputStream(new File(getCacheDir(),"resale.pdf"))){ResalePdf.write(MainActivity.this,new JSONObject(json),new JSONObject(options),out);}runOnUiThread(()->createFile("application/pdf","AutoCarnet-dossier-revente.pdf",17));}catch(Exception e){message("Dossier PDF impossible : "+e.getMessage());}}).start();}

    @JavascriptInterface public void dial(String phone){requireUnlocked();if(!phone.matches("[+0-9 ().-]{3,40}"))return;runOnUiThread(()->{try{startActivity(new Intent(Intent.ACTION_DIAL,Uri.parse("tel:"+phone.replaceAll("[^+0-9]",""))));}catch(Exception e){message("Aucune application téléphone disponible");}});}

    @JavascriptInterface public String notificationStatus(){requireUnlocked();return "{\"enabled\":"+ReminderReceiver.prefs(MainActivity.this).getBoolean("enabled",false)+",\"allowed\":"+ReminderReceiver.allowed(MainActivity.this)+"}";}

    @JavascriptInterface public void enableNotifications(boolean enable){requireUnlocked();runOnUiThread(()->{ReminderReceiver.prefs(MainActivity.this).edit().putBoolean("enabled",enable).apply();if(enable&&Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=android.content.pm.PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},90);if(!enable)getSystemService(NotificationManager.class).cancelAll();ReminderReceiver.check(MainActivity.this);ReminderReceiver.schedule(MainActivity.this);js("window.refreshNativeStatus && window.refreshNativeStatus()");});}

    @JavascriptInterface public void notificationSettings(){requireUnlocked();runOnUiThread(()->{Intent i=new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);i.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,getPackageName());startActivity(i);});}

    @JavascriptInterface public void testNotification(){requireUnlocked();runOnUiThread(()->{if(ReminderReceiver.allowed(MainActivity.this))ReminderReceiver.notify(MainActivity.this,999,"AutoCarnet · test réussi","Les rappels de votre voiture peuvent s’afficher sur ce téléphone.");else message("Autorisez les notifications dans les réglages Android.");});}

    @JavascriptInterface public void addPocketPdf(String session){requireUnlocked();if(session==null||!session.matches("(pocket|road)-[a-zA-Z0-9-]{1,80}"))return;photoSession=session;photoKind="autre";getSharedPreferences("pending",0).edit().putString("session",session).putString("kind","autre").commit();runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("application/pdf");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,18);});}
    @JavascriptInterface public void openPocketPdf(String id){requireUnlocked();if(id==null||!id.matches("[a-f0-9]{64}\\.pdf"))return;runOnUiThread(()->{try{if(!Store.photoIds(new JSONObject(Store.load(MainActivity.this))).contains(id))return;Uri u=Uri.parse("content://"+getPackageName()+".capture/pocket/"+id);Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(u,"application/pdf");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);i.setClipData(ClipData.newRawUri("PDF",u));startActivity(i);}catch(Exception e){message("Installez un lecteur PDF pour ouvrir ce document.");}});}
    @JavascriptInterface public void addPhoto(String kind,boolean camera,String session){requireUnlocked();

      if(!kind.matches("facture|compteur|pompe|autre")||!session.matches("[a-zA-Z0-9-]{1,100}"))return;photoKind=kind;photoSession=session;

      runOnUiThread(()->{try{if(camera){File capture=new File(getCacheDir(),"capture.jpg");if(capture.exists())capture.delete();Intent i=new Intent(MediaStore.ACTION_IMAGE_CAPTURE);i.putExtra(MediaStore.EXTRA_OUTPUT,cameraUri);i.setClipData(ClipData.newRawUri("Photo AutoCarnet",cameraUri));i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);startActivityForResult(i,13);}else{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("image/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,12);}}catch(Exception e){message("Appareil photo indisponible. Essayez la galerie.");}});

    }

  }

  private void createFile(String mime,String name,int request){Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.setType(mime);i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,request);}

  private String savePhoto(Uri uri)throws Exception{

    BitmapFactory.Options opts=new BitmapFactory.Options();opts.inJustDecodeBounds=true;try(InputStream in=getContentResolver().openInputStream(uri)){BitmapFactory.decodeStream(in,null,opts);}if(opts.outWidth<=0||opts.outHeight<=0)throw new IOException("Image illisible");

    int rotation=1;try(InputStream in=getContentResolver().openInputStream(uri)){rotation=new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION,1);}catch(Exception ignored){}

    opts.inJustDecodeBounds=false;opts.inSampleSize=1;while(Math.max(opts.outWidth,opts.outHeight)/opts.inSampleSize>2400)opts.inSampleSize*=2;

    Bitmap b;try(InputStream in=getContentResolver().openInputStream(uri)){b=BitmapFactory.decodeStream(in,null,opts);}if(b==null)throw new IOException();

    Matrix m=new Matrix();switch(rotation){case 2:m.setScale(-1,1);break;case 3:m.setRotate(180);break;case 4:m.setScale(1,-1);break;case 5:m.setRotate(90);m.postScale(-1,1);break;case 6:m.setRotate(90);break;case 7:m.setRotate(270);m.postScale(-1,1);break;case 8:m.setRotate(270);break;}

    Bitmap oriented=Bitmap.createBitmap(b,0,0,b.getWidth(),b.getHeight(),m,true);if(oriented!=b)b.recycle();b=oriented;

    float scale=Math.min(1f,1800f/Math.max(b.getWidth(),b.getHeight()));if(scale<1){Bitmap resized=Bitmap.createScaledBitmap(b,Math.round(b.getWidth()*scale),Math.round(b.getHeight()*scale),true);b.recycle();b=resized;}

    ByteArrayOutputStream bytes=new ByteArrayOutputStream();b.compress(Bitmap.CompressFormat.JPEG,85,bytes);b.recycle();byte[] raw=bytes.toByteArray();String id=Store.hash(raw)+".jpg";Store.writeAttachment(this,id,raw);return id;

  }

  protected void onActivityResult(int request,int result,Intent data){

    super.onActivityResult(request,result,data);if(appLock!=null&&appLock.result(request,result))return;if(result!=RESULT_OK)return;Uri uri=request==13?cameraUri:data==null?null:data.getData();if(uri==null)return;

    if(request==14){try{int flags=data.getFlags()&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);getContentResolver().takePersistableUriPermission(uri,flags);AutoBackupJob.prefs(this).edit().clear().putString("tree",uri.toString()).putString("reportStart",java.time.YearMonth.now().minusMonths(1).toString()).commit();AutoBackupJob.schedule(this,true);js("window.refreshBackupStatus && window.refreshBackupStatus()");message("Sauvegarde automatique activée pour ce dossier");}catch(Exception e){message("Ce dossier ne permet pas de conserver les droits d’accès. Choisissez un autre dossier.");}return;}

    if(busy){message("Une opération est déjà en cours.");return;}busy=true;String exported=pendingExport,kind=photoKind,session=photoSession;

    message(request==10?"Création de la sauvegarde…":request==11?"Lecture de la sauvegarde…":"Préparation de la photo…");

    new Thread(()->{try{

      if(request==10){String contents=exported;if(contents==null)try(InputStream in=new FileInputStream(new File(getCacheDir(),"export.json"))){contents=new String(Store.read(in,16000000),java.nio.charset.StandardCharsets.UTF_8);}try(OutputStream out=getContentResolver().openOutputStream(uri)){Store.exportZip(this,contents,out);}pendingExport=null;new File(getCacheDir(),"export.json").delete();message("Sauvegarde complète exportée, photos incluses");}

      else if(request==11){try(InputStream in=getContentResolver().openInputStream(uri)){String json=Store.importFile(this,in);js("window.receiveImport("+JSONObject.quote(json)+")");}}

      else if(request==15||request==16||request==17||request==19){File source=new File(getCacheDir(),request==15?"expenses.csv":request==16?"report.pdf":request==19?"road.pdf":"resale.pdf");try(InputStream in=new FileInputStream(source);OutputStream out=getContentResolver().openOutputStream(uri)){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}message(request==15?"CSV exporté":"PDF exporté");}

      else if(request==18){byte[] bytes;try(InputStream in=getContentResolver().openInputStream(uri)){bytes=Store.read(in,20000000);}if(bytes.length<5||!new String(bytes,0,5,java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-"))throw new IOException("PDF invalide");String id=Store.hash(bytes)+".pdf";Store.writeAttachment(this,id,bytes);getSharedPreferences("pending",0).edit().putString("photo",id).putString("kind","autre").putString("session",session).commit();runOnUiThread(()->deliverPhoto());}
      else if(request==12||request==13){String id=savePhoto(uri);getSharedPreferences("pending",0).edit().putString("photo",id).putString("kind",kind).putString("session",session).commit();runOnUiThread(()->deliverPhoto());}

    }catch(Exception e){message("Opération impossible : "+(e.getMessage()==null?"vérifiez le fichier et l’espace disponible":e.getMessage()));}

    finally{busy=false;if(request==13){revokeUriPermission(cameraUri,Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);new File(getCacheDir(),"capture.jpg").delete();}}}).start();

  }

  private void deliverPhoto(){if(!authorized()||!pageReady)return;android.content.SharedPreferences prefs=getSharedPreferences("pending",0);String id=prefs.getString("photo",null);if(id==null)return;String kind=prefs.getString("kind","autre"),session=prefs.getString("session","");web.evaluateJavascript("window.receivePhoto ? window.receivePhoto("+JSONObject.quote(id)+","+JSONObject.quote(kind)+","+JSONObject.quote(session)+") : false",result->{if("true".equals(result)&&id.equals(prefs.getString("photo",null)))prefs.edit().remove("photo").remove("kind").remove("session").apply();});}

  @Override public void onBackPressed(){if(!authorized()){finish();return;}web.evaluateJavascript("(function(){if(document.getElementById('proofViewer')&&document.getElementById('proofViewer').open){closeProofViewer();return true;}if(document.getElementById('dialog').open){closeForm();return true;}if(page!=='home'){navigate('home');return true;}return false;})()",v->{if("false".equals(v))finish();});}

}

