package ma.autocarnet;
import android.content.Context;
import android.graphics.*;
import java.io.*;
import java.time.LocalDate;
import java.util.*;
import org.json.*;

final class ResalePdf {
 static Set<String> ids(JSONArray a)throws Exception{Set<String> set=new LinkedHashSet<>();if(a!=null)for(int i=0;i<a.length();i++)set.add(a.getString(i));return set;}
 static void write(Context c,JSONObject data,JSONObject options,OutputStream out)throws Exception{
  Set<String> selected=ids(options.optJSONArray("entryIds")),photos=ids(options.optJSONArray("photoIds"));boolean costs=options.optBoolean("includeCost"),notes=options.optBoolean("includeNotes"),plate=options.optBoolean("includePlate"),parts=options.optBoolean("includeParts");
  if(photos.size()>60)throw new IOException("Maximum 60 justificatifs par dossier");
  List<JSONObject> entries=new ArrayList<>();Map<String,String> allowedPhotos=new LinkedHashMap<>();Set<String> found=new HashSet<>();double total=0;
  for(JSONObject e:ReportPdf.entries(data))if(selected.contains(e.getString("id"))){entries.add(e);found.add(e.getString("id"));total+=e.getDouble("cost");JSONArray a=e.optJSONArray("photos");if(a!=null)for(int i=0;i<a.length();i++){String id=a.getJSONObject(i).getString("id");allowedPhotos.put(id,e.getString("date")+" · "+ReportPdf.LABELS.getOrDefault(e.getString("type"),e.getString("type")));}}
  if(!found.equals(selected))throw new IOException("Une opération sélectionnée n’existe plus");
  JSONArray partList=parts?data.optJSONArray("parts"):null;if(partList==null)partList=new JSONArray();
  for(int i=0;i<partList.length();i++){JSONObject p=partList.getJSONObject(i);JSONArray a=p.optJSONArray("photos");if(a!=null)for(int j=0;j<a.length();j++)allowedPhotos.put(a.getJSONObject(j).getString("id"),"Pièce : "+p.optString("name"));}
  if(entries.isEmpty()&&partList.length()==0)throw new IOException("Choisissez des opérations ou des pièces à inclure");
  if(!allowedPhotos.keySet().containsAll(photos))throw new IOException("Un justificatif ne correspond pas aux informations sélectionnées");
  JSONObject vehicle=data.getJSONObject("vehicle");String name=vehicle.optString("name")+" · Diesel / Gasoil"+(plate&&!vehicle.optString("plate").isEmpty()?" · "+vehicle.optString("plate"):"");
  try(ReportPdf.Layout pdf=new ReportPdf.Layout("ENTRETIEN & REVENTE","Historique sélectionné",name)){
   pdf.paragraph("Dossier constitué le "+ReportPdf.today()+" à partir des informations saisies par le propriétaire. Il ne constitue ni une expertise mécanique, ni un historique exhaustif ou certifié.",4);
   pdf.row("Opérations sélectionnées",String.valueOf(entries.size()));pdf.row("Justificatifs sélectionnés",String.valueOf(photos.size()));if(costs)pdf.row("Total des paiements sélectionnés",ReportPdf.num(total)+" DH");
   pdf.heading("Historique choisi");
   for(JSONObject e:entries){pdf.ensure(66);String label=e.getString("date")+"  "+ReportPdf.LABELS.getOrDefault(e.getString("type"),e.getString("type"));pdf.text(pdf.fit(label,costs?380:519,10),38,pdf.y+13,10,ReportPdf.INK,true);if(costs){String value=ReportPdf.num(e.getDouble("cost"))+" DH";pdf.font(10,ReportPdf.INK,true);pdf.canvas.drawText(value,557-pdf.paint.measureText(value),pdf.y+13,pdf.paint);}pdf.y+=23;pdf.paragraph(e.optBoolean("hasKm",true)?"Compteur : "+ReportPdf.num(e.getDouble("km"))+" km":"Compteur non renseigné",2);if(e.has("coverageEnd"))pdf.paragraph("Validité renseignée jusqu’au "+e.getString("coverageEnd"),2);if(notes&&!e.optString("note").isEmpty())pdf.paragraph(e.getString("note"),100);if(notes&&e.has("incident")){JSONObject i=e.getJSONObject("incident");pdf.paragraph("Incident : "+i.optString("status")+" · "+i.optString("resolution"),100);}pdf.rect(38,pdf.y,519,.6f,ReportPdf.LINE);pdf.y+=10;}
   if(parts){pdf.heading("Références de pièces renseignées");for(int i=0;i<partList.length();i++){JSONObject p=partList.getJSONObject(i);pdf.heading(pdf.fit(p.optString("name"),519,14));pdf.paragraph("Marque : "+p.optString("brand")+" · Référence : "+p.optString("reference"),4);pdf.paragraph("Norme / spécification : "+p.optString("spec"),4);if(!p.optString("installedDate").isEmpty())pdf.paragraph("Montage : "+p.getString("installedDate")+(p.isNull("installedKm")?"":" · "+p.optInt("installedKm")+" km"),2);if(!p.optString("warrantyEnd").isEmpty())pdf.paragraph("Date de fin de garantie renseignée : "+p.getString("warrantyEnd")+" (conditions à vérifier sur le justificatif)",3);if(notes)pdf.paragraph(p.optString("note"),100);}}
   for(String id:photos){File file=Store.photo(c,id);if(!file.isFile())throw new IOException("Justificatif manquant");BitmapFactory.Options opts=new BitmapFactory.Options();opts.inJustDecodeBounds=true;BitmapFactory.decodeFile(file.getAbsolutePath(),opts);if(opts.outWidth<=0||opts.outHeight<=0)throw new IOException("Justificatif illisible");opts.inJustDecodeBounds=false;opts.inSampleSize=1;while(Math.max(opts.outWidth,opts.outHeight)/opts.inSampleSize>1800)opts.inSampleSize*=2;Bitmap bitmap=BitmapFactory.decodeFile(file.getAbsolutePath(),opts);if(bitmap==null)throw new IOException("Image impossible à ouvrir");try{pdf.newPage();pdf.heading("Justificatif sélectionné");pdf.paragraph(allowedPhotos.get(id),3);float maxHeight=777-pdf.y-25,scale=Math.min(519f/bitmap.getWidth(),maxHeight/bitmap.getHeight()),w=bitmap.getWidth()*scale,h=bitmap.getHeight()*scale;pdf.canvas.drawBitmap(bitmap,null,new RectF(38+(519-w)/2,pdf.y,38+(519+w)/2,pdf.y+h),pdf.paint);pdf.y+=h+12;pdf.paragraph("Copie du justificatif conservé dans le carnet du propriétaire.",2);}finally{bitmap.recycle();}}
   pdf.finish();pdf.doc.writeTo(out);
  }
 }
}
