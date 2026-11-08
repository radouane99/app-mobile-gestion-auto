import urllib.request,urllib.parse,json,time
from pathlib import Path
for mode in ['fast','national']:
 payload={'locations':[{'lat':34.0333,'lon':-5.0},{'lat':34.0209,'lon':-6.8416}],'costing':'auto','units':'kilometers','language':'fr-FR','costing_options':{'auto':{'use_highways':1 if mode=='fast' else 0,'exclude_highways':mode=='national','use_tolls':1 if mode=='fast' else 0}}}
 url='https://valhalla1.openstreetmap.de/route?json='+urllib.parse.quote(json.dumps(payload))
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'AutoCarnet/3.2 (personal car logbook)','X-Client-Id':'ma.autocarnet.radouane'})
  with urllib.request.urlopen(req,timeout=30) as r: raw=json.load(r)
  Path('tools/routes/probe-valhalla-'+mode+'.json').write_text(json.dumps(raw,ensure_ascii=False),encoding='utf-8')
  print(mode,json.dumps(raw.get('trip',{}).get('summary',raw.get('error')),ensure_ascii=True))
 except urllib.error.HTTPError as e: print(mode,e.code,e.read().decode()[:500])
 time.sleep(1.2)
