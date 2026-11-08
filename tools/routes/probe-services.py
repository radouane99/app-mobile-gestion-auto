import urllib.request,json,time
from pathlib import Path
urls={
'photon':'https://photon.komoot.io/api/?q=Fes%20Maroc&limit=5&lang=fr',
'fast':'https://router.project-osrm.org/route/v1/driving/-5.0,34.0333;-6.8416,34.0209?overview=false&steps=true',
'national':'https://router.project-osrm.org/route/v1/driving/-5.0,34.0333;-6.8416,34.0209?overview=false&steps=true&exclude=motorway'}
for name,url in urls.items():
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'AutoCarnet/3.2 (personal car logbook)'} )
  with urllib.request.urlopen(req,timeout=25) as r: raw=json.load(r)
  Path('tools/routes/probe-'+name+'.json').write_text(json.dumps(raw,ensure_ascii=False),encoding='utf-8')
  if name=='photon': print(name,[(f['properties'].get('name'),f['geometry']['coordinates']) for f in raw.get('features',[])])
  else: print(name,raw.get('code'),[(x.get('distance'),x.get('duration')) for x in raw.get('routes',[])])
 except Exception as e: print(name,str(e))
 time.sleep(1.2)
