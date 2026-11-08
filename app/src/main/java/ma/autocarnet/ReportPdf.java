package ma.autocarnet;

import android.graphics.*;

import android.graphics.pdf.PdfDocument;

import java.io.*;

import java.time.*;

import java.util.*;

import org.json.*;



final class ReportPdf {

  static java.time.Clock clock=java.time.Clock.systemDefaultZone();

  static LocalDate today(){return LocalDate.now(clock);}

  static final int INK=0xff132438,GREEN=0xff11775d,MUTED=0xff687986,LINE=0xffe4e9ec;

  static final Map<String,String> LABELS=new HashMap<>();

  static {String[][] pairs={{"parking","Parking"},{"wash","Lavage"},{"electrical","Électricité / éclairage"},{"accessory","Équipement / installation"},{"subscription","Abonnement voiture"},{"fuel","Carburant"},{"oil","Vidange"},{"tires","Pneus"},{"repair","Réparation"},{"insurance","Assurance"},{"vignette","Vignette"},{"inspection","Visite technique"},{"other","Autre dépense"},{"reading","Compteur"},{"distribution","Distribution"},{"brakes","Freins"},{"battery","Batterie"},{"airfilter","Filtre à air"},{"fuelfilter","Filtre à carburant"},{"cabinfilter","Filtre habitacle"},{"rotation","Permutation pneus"},{"alignment","Parallélisme"},{"incident","Incident"},{"checkup","Contrôle mensuel"}};for(String[] p:pairs)LABELS.put(p[0],p[1]);}

  static String num(double n){return String.format(Locale.FRANCE,"%,.2f",n).replace('\u202f',' ').replace('\u00a0',' ');}

  static List<JSONObject> entries(JSONObject data)throws Exception{List<JSONObject> all=new ArrayList<>();JSONArray a=data.getJSONArray("entries");for(int i=0;i<a.length();i++)all.add(a.getJSONObject(i));all.sort(Comparator.comparing((JSONObject e)->e.optString("date")).thenComparingDouble(e->e.optDouble("km")));return all;}

  static JSONObject previous(JSONObject d,String month)throws Exception {

    JSONObject v=d.getJSONObject("vehicle"),prev=null;

    if(v.getString("baselineDate").compareTo(month+"-01")<0)prev=new JSONObject().put("date",v.getString("baselineDate")).put("km",v.getDouble("baselineKm"));

    for(JSONObject e:entries(d))if(e.optBoolean("hasKm",true)&&e.getString("date").compareTo(month+"-01")<0&&(prev==null||e.getString("date").compareTo(prev.getString("date"))>0||(e.getString("date").equals(prev.getString("date"))&&e.getDouble("km")>prev.getDouble("km"))))prev=e;

    return prev;

  }

  static String fingerprint(JSONObject d,String month)throws Exception {

    JSONObject v=d.getJSONObject("vehicle");StringBuilder b=new StringBuilder("finance-v29|").append(month).append('|').append(v.optString("name")).append('|').append(v.optString("plate"));

    JSONObject prev=previous(d,month.length()==4?month+"-01":month);if(prev!=null)b.append('|').append(prev.getString("date")).append(':').append(prev.getDouble("km"));

    if(v.getString("baselineDate").startsWith(month))b.append('|').append(v.getString("baselineDate")).append(':').append(v.getDouble("baselineKm"));

    for(JSONObject e:entries(d))if(e.getString("date").startsWith(month))b.append('|').append(e.toString());

    JSONObject profile=d.optJSONObject("coachProfile");if(profile!=null){b.append("|coach-v1|").append(profile.toString());String end=FinanceReport.next(month).toString();for(JSONObject e:entries(d))if(e.optString("type").equals("fuel")&&e.optString("date").compareTo(end)<=0)b.append('|').append(e.toString());}

    b.append("|financial|").append(v.toString());
    String boundary=FinanceReport.next(month).toString();
    for(JSONObject e:entries(d))if(e.optString("date").compareTo(boundary)<=0||FinanceReport.doc(e.optString("type")))b.append('|').append(e.toString());
    b.append("|road-v1|");JSONArray roadCases=d.optJSONArray("roadCases");if(roadCases!=null)for(int i=0;i<roadCases.length();i++){JSONObject item=roadCases.getJSONObject(i);JSONArray refunds=item.optJSONArray("refunds");if(refunds!=null)for(int j=0;j<refunds.length();j++){JSONObject refund=refunds.getJSONObject(j);if(refund.optString("date").startsWith(month))b.append('|').append(item.optString("title")).append('|').append(refund.toString());}}
    return Store.hash(b.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));

  }

  static final class Layout implements AutoCloseable {

    final PdfDocument doc=new PdfDocument();final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);PdfDocument.Page page;Canvas canvas;int pageNo=0;float y;String month,name,heading;

    Layout(String m,String n){this("RAPPORT MENSUEL",m,n);}

    Layout(String h,String m,String n){heading=h;month=m;name=n;newPage();}

    void font(float size,int color,boolean bold){paint.setTextSize(size);paint.setColor(color);paint.setTypeface(bold?Typeface.create(Typeface.SANS_SERIF,Typeface.BOLD):Typeface.create(Typeface.SANS_SERIF,Typeface.NORMAL));}

    void text(String s,float x,float baseline,float size,int color,boolean bold){font(size,color,bold);canvas.drawText(s,x,baseline,paint);}

    void rect(float x,float top,float width,float height,int color){paint.setColor(color);canvas.drawRect(x,top,x+width,top+height,paint);}

    String fit(String s,float width,float size){font(size,INK,false);if(paint.measureText(s)<=width)return s;while(s.length()>0&&paint.measureText(s+"…")>width)s=s.substring(0,s.length()-1);return s+"…";}

    void finish(){if(page==null)return;rect(38,798,519,1,LINE);text("AutoCarnet · "+month+" · Rapport des données enregistrées",38,817,8,MUTED,false);text("Page "+pageNo,514,817,8,MUTED,false);doc.finishPage(page);page=null;}

    void newPage(){finish();page=doc.startPage(new PdfDocument.PageInfo.Builder(595,842,++pageNo).create());canvas=page.getCanvas();rect(0,0,595,8,GREEN);text("AUTOCARNET / "+heading,38,39,10,GREEN,true);text(month,38,70,26,INK,true);text(fit(name,519,11),38,92,11,MUTED,false);y=120;}

    void ensure(float height){if(y+height>777)newPage();}

    void heading(String title){ensure(80);text(title,38,y+16,14,INK,true);y+=32;}

    void paragraph(String s,int maxLines){

      font(9,MUTED,false);String remaining=s.replace('\n',' ');int lines=0;

      while(!remaining.isEmpty()&&lines<maxLines){int count=paint.breakText(remaining,true,519,null);if(count<=0)break;if(count<remaining.length()){int space=remaining.lastIndexOf(' ',count);if(space>count/2)count=space;}

        String line=remaining.substring(0,count).trim();remaining=remaining.substring(count).trim();if(lines==maxLines-1&&!remaining.isEmpty())line=fit(line+"…",519,9);

        ensure(14);text(line,38,y+10,9,MUTED,false);y+=14;lines++;

      }y+=5;

    }

    void metric(String label,String value,float x,float top){rect(x,top,252,62,0xffeff5f2);text(label,x+13,top+20,9,MUTED,false);text(value,x+13,top+45,19,INK,true);}

    void row(String label,String value){ensure(26);text(fit(label,370,10),38,y+12,10,INK,false);font(10,INK,true);canvas.drawText(value,557-paint.measureText(value),y+12,paint);rect(38,y+22,519,0.6f,LINE);y+=28;}

    public void close(){finish();doc.close();}

  }

  static void write(JSONObject data,String month,OutputStream out)throws Exception {

    FinanceReport.start(month);JSONObject v=data.getJSONObject("vehicle");List<JSONObject> list=new ArrayList<>();for(JSONObject e:entries(data))if(e.getString("date").startsWith(month))list.add(e);

    double total=0,fuel=0,liters=0;int fills=0,incidents=0,checks=0,missingLiters=0;Map<String,Double> cats=new TreeMap<>();

    for(JSONObject e:list){double cost=e.getDouble("cost");total+=cost;String type=e.getString("type");if(cost>0)cats.put(type,cats.getOrDefault(type,0d)+cost);if(type.equals("fuel")){fuel+=cost;if(e.isNull("liters"))missingLiters++;else liters+=e.getDouble("liters");fills++;}if(type.equals("incident"))incidents++;if(type.equals("checkup"))checks++;}

    List<JSONObject> points=new ArrayList<>();if(v.getString("baselineDate").startsWith(month))points.add(new JSONObject().put("date",v.getString("baselineDate")).put("km",v.getDouble("baselineKm")));for(JSONObject e:list)if(e.optBoolean("hasKm",true))points.add(e);points.sort(Comparator.comparing((JSONObject e)->e.optString("date")).thenComparingDouble(e->e.optDouble("km")));

    JSONObject prev=previous(data,month.length()==4?month+"-01":month),first=prev!=null?prev:points.isEmpty()?null:points.get(0),last=points.isEmpty()?null:points.get(points.size()-1);double km=last==null||first==null?0:Math.max(0,last.getDouble("km")-first.getDouble("km"));

    FinanceReport.Result financial=FinanceReport.calculate(data,month);km=financial.km;
    try(Layout pdf=new Layout(month.length()==4?"RAPPORT ANNUEL":"RAPPORT MENSUEL",month,v.optString("name")+(v.optString("plate").isEmpty()?"":" · "+v.optString("plate")))){

      float top=pdf.y;pdf.metric("TOTAL PAYÉ",num(total)+" DH",38,top);pdf.metric("CARBURANT PAYÉ",num(fuel)+" DH",305,top);pdf.metric(missingLiters>0?"LITRES RENSEIGNÉS (PARTIEL)":"LITRES DE CARBURANT ACHETÉS",num(liters)+" L",38,top+74);pdf.metric("DISTANCE RELEVÉE",num(km)+" km",305,top+74);pdf.y=top+153;

      pdf.paragraph(fills+" remplissage(s), y compris les ajouts partiels. Litres achetés : ils peuvent être consommés sur un autre mois.",3);

      pdf.paragraph("Distance des segments de compteur renseignés dans la période, sans extrapolation. "+(financial.partial?"Des limites mensuelles manquent ou sont ambiguës : distance partielle.":"Les limites mensuelles sont renseignées."),4);

      if(missingLiters>0)pdf.paragraph(missingLiters+" remplissage(s) avec litres manquants : paiement inclus, quantité inconnue, cycles incomplets exclus de la consommation.",3);
      pdf.heading("Dépenses par catégorie");if(cats.isEmpty())pdf.paragraph("Aucune dépense enregistrée pour cette période.",2);for(String type:cats.keySet())pdf.row(LABELS.getOrDefault(type,type),num(cats.get(type))+" DH");

      FinanceReport.append(pdf,data,month);
      pdf.heading(month.length()==4?"Carnet de l’année":"Carnet du mois");pdf.paragraph(list.size()+" opération(s) · "+incidents+" incident(s) enregistré(s) · "+checks+" contrôle(s) mensuel(s). Les photos et les notes complètes se trouvent dans la sauvegarde ZIP.",3);

      for(JSONObject e:list){

        pdf.ensure(70);String type=e.getString("type");pdf.text(e.getString("date")+"  "+LABELS.getOrDefault(type,type),38,pdf.y+13,10,INK,true);String amount=e.getDouble("cost")>0?num(e.getDouble("cost"))+" DH":"-";pdf.font(10,INK,true);pdf.canvas.drawText(amount,557-pdf.paint.measureText(amount),pdf.y+13,pdf.paint);pdf.y+=22;

        String detail=e.optBoolean("hasKm",true)?num(e.getDouble("km"))+" km":"Compteur non renseigné";if(type.equals("fuel")&&e.isNull("liters"))detail+=" · Litres non renseignés, à compléter";else if(type.equals("fuel"))detail+=" · "+num(e.getDouble("liters"))+" L · "+num(e.getDouble("cost")/e.getDouble("liters"))+" DH/L";if(e.has("coverageEnd"))detail+=" · Validité jusqu’au "+e.getString("coverageEnd");pdf.paragraph(detail,2);

        if(!e.optString("note").isEmpty())pdf.paragraph(e.getString("note"),3);

        JSONArray products=e.optJSONArray("serviceLines");if(products!=null)for(int row=0;row<products.length();row++){JSONObject line=products.getJSONObject(row);pdf.paragraph(line.getString("name")+" · "+line.optString("reference")+" · "+num(line.getDouble("quantity"))+" × "+num(line.getDouble("unitPrice"))+" DH = "+num(line.getDouble("quantity")*line.getDouble("unitPrice"))+" DH (déjà inclus)",2);}
        JSONObject oilPlan=e.optJSONObject("oilPlan");if(oilPlan!=null)pdf.paragraph("Prochaine vidange : "+num(e.getDouble("km")+oilPlan.getDouble("km"))+" km ou "+LocalDate.parse(e.getString("date")).plusMonths(oilPlan.getInt("months"))+", premier terme atteint. Avertissement à "+oilPlan.getInt("warnKm")+" km du compteur cible, selon les relevés réels.",3);
        JSONObject trace=e.optJSONObject("trace");if(trace!=null){
          if(trace.optBoolean("breakdown"))pdf.paragraph("Facture détaillée : pièces "+num(trace.optDouble("parts"))+" DH + main-d’œuvre "+num(trace.optDouble("labor"))+" DH + autres frais "+num(trace.optDouble("fees"))+" DH. Total déjà inclus dans la dépense.",3);
          String[][] fields={{"garage","Garage"},{"component","Pièce / problème"},{"oldPart","Pièce retirée"},{"newPart","Pièce montée"},{"reason","Motif"},{"before","Avant"},{"after","Après"},{"checkedDate","Date de vérification"},{"reviewDate","À revoir le"},{"resultNote","Observation"}};
          for(String[] pair:fields)if(!trace.optString(pair[0]).isEmpty())pdf.paragraph(pair[1]+" : "+trace.optString(pair[0]),2);
          String result=trace.optString("result");pdf.paragraph("Résultat saisi : "+(result.equals("resolved")?"résolu / fonctionnement vérifié":result.equals("returned")?"problème revenu":result.equals("watch")?"à surveiller":"pas encore vérifié"),3);
        }
        if(e.has("incident")){JSONObject i=e.getJSONObject("incident");pdf.paragraph("État enregistré : "+i.optString("status")+" · "+i.optString("resolution"),3);}

        pdf.rect(38,pdf.y,519,0.6f,LINE);pdf.y+=12;

      }

      if(month.length()!=4)EngineCoach.appendMonthly(pdf,data,month);

      pdf.heading("À conserver avec vos justificatifs");pdf.paragraph("Rapport généré le "+today()+" à partir des informations saisies. Il présente les paiements réels, sans ajouter une seconde fois les coûts répartis, ni l’épargne prévue. Les frais non saisis et la dépréciation ne sont pas estimés. Aucun diagnostic mécanique n’est produit.",5);

      pdf.finish();pdf.doc.writeTo(out);

    }

  }

}

