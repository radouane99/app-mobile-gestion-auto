import urllib.request,json
from pathlib import Path
url='https://routing.openstreetmap.de/routed-car/route/v1/driving/-5.0,34.0333;-6.8416,34.0209?overview=false&steps=true&exclude=motorway'
try:
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AutoCarnet/3.2 (personal car logbook)'}),timeout=25) as r: raw=json.load(r)
 Path('tools/routes/probe-national-fossgis.json').write_text(json.dumps(raw),encoding='utf-8')
 print(raw.get('code'),[(x.get('distance'),x.get('duration')) for x in raw.get('routes',[])])
except urllib.error.HTTPError as e: print(e.code,e.read().decode()[:600])
