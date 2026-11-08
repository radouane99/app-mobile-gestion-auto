import urllib.request,json
from pathlib import Path
cities=[('fes','Fès',34.0333,-5.0000),('rabat','Rabat',34.0209,-6.8416),('bouznika','Bouznika',33.7894,-7.1597),('imouzzer','Imouzzer Kandar',33.73342,-5.0105),('tanger','Tanger',35.7595,-5.8340),('ifrane','Ifrane',33.5333,-5.1167),('meknes','Meknès',33.8935,-5.5473),('casablanca','Casablanca',33.5731,-7.5898)]
coords=';'.join(str(c[3])+','+str(c[2]) for c in cities)
url='https://router.project-osrm.org/table/v1/driving/'+coords+'?annotations=distance,duration'
req=urllib.request.Request(url,headers={'User-Agent':'AutoCarnet/3.1 personal offline route estimates'})
with urllib.request.urlopen(req,timeout=45) as r: raw=json.load(r)
assert raw['code']=='Ok' and len(raw['distances'])==len(cities)
result={'source':'OSRM / © OpenStreetMap contributors (ODbL)','sourceUrl':url,'retrieved':'2026-10-29','cities':[dict(id=c[0],name=c[1],lat=c[2],lon=c[3]) for c in cities],'distances':raw['distances'],'durations':raw['durations']}
Path('tools/routes/osrm-city-estimates.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
Path('app/src/main/assets/route-data.js').write_text('globalThis.RouteData='+json.dumps(result,ensure_ascii=False)+';\n',encoding='utf-8')
for i,c in enumerate(cities[1:],1):print('Fes -> '+c[1]+': '+str(round(raw['distances'][0][i]/1000,1))+' km')
