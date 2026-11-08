package ma.autocarnet;
import android.content.Context;
import android.util.AtomicFile;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;
import org.json.*;

final class Store {
  static final long LIMIT = 250L * 1024 * 1024;
  static synchronized String load(Context c) throws IOException {
    File f = new File(c.getFilesDir(), "carnet.json");
    if (!f.exists() && !new File(f+".bak").exists()) return "";
    try (InputStream in = new AtomicFile(f).openRead()) { return new String(read(in, 16000000), StandardCharsets.UTF_8); }
  }
  static synchronized void save(Context c, String json) throws Exception {
    byte[] encoded=json.getBytes(StandardCharsets.UTF_8);if(encoded.length>16000000)throw new IOException("Limite de données textuelles atteinte (16 Mo). Réduisez les textes OCR conservés.");
    JSONObject d = new JSONObject(json);
    for (String id : photoIds(d)) if (!photo(c,id).isFile()) throw new IOException("Photo manquante");
    AtomicFile f = new AtomicFile(new File(c.getFilesDir(), "carnet.json"));
    FileOutputStream out = null;
    try { out=f.startWrite();out.write(encoded);f.finishWrite(out); }
    catch(Exception e) { if(out!=null)f.failWrite(out);throw e; }
  }
  static File photo(Context c, String id) throws IOException {
    if (!id.matches("[a-f0-9]{64}\\.(jpg|pdf)")) throw new IOException("Identifiant photo invalide");
    File dir=new File(c.getFilesDir(),"photos"); if(!dir.exists()&&!dir.mkdirs())throw new IOException();
    return new File(dir,id);
  }
  static String hash(byte[] bytes) throws Exception {
    StringBuilder b=new StringBuilder();for(byte x:MessageDigest.getInstance("SHA-256").digest(bytes))b.append(String.format(Locale.ROOT,"%02x",x&255));return b.toString();
  }
  static Set<String> photoIds(JSONObject d) throws Exception {
    Set<String> ids=new HashSet<>();JSONArray entries=d.getJSONArray("entries");
    for(int i=0;i<entries.length();i++){JSONArray a=entries.getJSONObject(i).optJSONArray("photos");if(a!=null)for(int j=0;j<a.length();j++)ids.add(a.getJSONObject(j).getString("id"));}
    JSONArray trash=d.optJSONArray("trash");if(trash!=null)for(int i=0;i<trash.length();i++){JSONObject e=trash.getJSONObject(i).getJSONObject("entry");JSONArray a=e.optJSONArray("photos");if(a!=null)for(int j=0;j<a.length();j++)ids.add(a.getJSONObject(j).getString("id"));}
    JSONObject parking=d.optJSONObject("parking");if(parking!=null){JSONArray a=parking.optJSONArray("photos");if(a!=null)for(int i=0;i<a.length();i++)ids.add(a.getJSONObject(i).getString("id"));}
    JSONArray parts=d.optJSONArray("parts");if(parts!=null)for(int i=0;i<parts.length();i++){JSONArray a=parts.getJSONObject(i).optJSONArray("photos");if(a!=null)for(int j=0;j<a.length();j++)ids.add(a.getJSONObject(j).getString("id"));}
    JSONArray pocket=d.optJSONArray("pocket");if(pocket!=null)for(int i=0;i<pocket.length();i++){JSONArray a=pocket.getJSONObject(i).optJSONArray("photos");if(a!=null)for(int j=0;j<a.length();j++)ids.add(a.getJSONObject(j).getString("id"));}
    for(String key:new String[]{"roadCases","conditionSessions"}){JSONArray records=d.optJSONArray(key);if(records!=null)for(int i=0;i<records.length();i++){JSONArray a=records.getJSONObject(i).optJSONArray("photos");if(a!=null)for(int k=0;k<a.length();k++)ids.add(a.getJSONObject(k).getString("id"));}}
    return ids;
  }
  static byte[] read(InputStream in, int max) throws IOException { ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(out.size()+n>max)throw new IOException("Fichier trop volumineux");out.write(b,0,n);}return out.toByteArray(); }
  static void exportZip(Context c, String json, OutputStream stream) throws Exception {
    Set<String> ids=photoIds(new JSONObject(json));
    long total=json.getBytes(StandardCharsets.UTF_8).length;
    if(ids.size()>19999)throw new IOException("Trop de photos pour une sauvegarde");
    for(String id:ids){File f=photo(c,id);if(!f.isFile())throw new IOException("Photo absente");total+=f.length();}
    if(total>LIMIT)throw new IOException("Sauvegarde trop volumineuse (250 Mo max)");
    try(ZipOutputStream zip=new ZipOutputStream(stream)) {
      zip.putNextEntry(new ZipEntry("carnet.json"));zip.write(json.getBytes(StandardCharsets.UTF_8));zip.closeEntry();
      for(String id:ids){zip.putNextEntry(new ZipEntry("photos/"+id));try(InputStream in=new FileInputStream(photo(c,id))){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)zip.write(b,0,n);}zip.closeEntry();}
    }
  }
  static void writeAttachment(Context c,String id,byte[] bytes)throws Exception {
    if(!id.equals(hash(bytes)+(id.endsWith(".pdf")?".pdf":".jpg")))throw new IOException("Fichier corrompu");
    AtomicFile target=new AtomicFile(photo(c,id));FileOutputStream out=null;
    try{out=target.startWrite();out.write(bytes);target.finishWrite(out);}catch(Exception e){if(out!=null)target.failWrite(out);throw e;}
  }
  static synchronized String importFile(Context c, InputStream source) throws Exception {
    BufferedInputStream in=new BufferedInputStream(source);in.mark(4);int first=in.read(),second=in.read();in.reset();
    if(first!='P'||second!='K')return new String(read(in,16000000),StandardCharsets.UTF_8);
    File stage=new File(c.getFilesDir(),"import-"+UUID.randomUUID());if(!stage.mkdirs())throw new IOException("Espace temporaire indisponible");
    try {
      String json=null;Set<String> seen=new HashSet<>();long total=0;
      try(ZipInputStream zip=new ZipInputStream(in)){ZipEntry e;while((e=zip.getNextEntry())!=null){
        if(seen.size()>=20000||!seen.add(e.getName()))throw new IOException("Archive invalide");
        if(e.isDirectory()){if(!e.getName().equals("photos/"))throw new IOException("Dossier invalide");continue;}
        boolean isData=e.getName().equals("carnet.json");
        if(!isData&&!e.getName().matches("photos/[a-f0-9]{64}\\.(jpg|pdf)"))throw new IOException("Archive invalide");
        byte[] bytes=read(zip,isData?16000000:e.getName().endsWith(".pdf")?20000000:5000000);total+=bytes.length;if(total>LIMIT)throw new IOException("Archive trop volumineuse (250 Mo max)");
        if(isData)json=new String(bytes,StandardCharsets.UTF_8);
        else {String id=e.getName().substring(7);if(!id.equals(hash(bytes)+(id.endsWith(".pdf")?".pdf":".jpg")))throw new IOException("Photo corrompue");try(FileOutputStream out=new FileOutputStream(new File(stage,id))){out.write(bytes);}}
      }}
      if(json==null)throw new IOException("Carnet absent");Set<String> ids=photoIds(new JSONObject(json));
      for(String id:ids)if(!seen.contains("photos/"+id))throw new IOException("Sauvegarde incomplète");
      for(String id:ids)try(InputStream bytes=new FileInputStream(new File(stage,id))){writeAttachment(c,id,read(bytes,id.endsWith(".pdf")?20000000:5000000));}
      return json;
    }finally{File[] files=stage.listFiles();if(files!=null)for(File f:files)f.delete();stage.delete();}
  }
}
