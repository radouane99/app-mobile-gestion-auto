import importlib.util, json, os, threading, unittest, urllib.request, urllib.error
from http.server import ThreadingHTTPServer
spec=importlib.util.spec_from_file_location('gateway','server/assistant_server.py'); gateway=importlib.util.module_from_spec(spec);spec.loader.exec_module(gateway)
class GatewayTests(unittest.TestCase):
 def test_privacy_and_schema(self):
  req=gateway.build_request({'question':'Mon bilan ?', 'summary':{'plate':'SECRET-PLATE','vehicle':{'name':'Test','plate':'SECRET-PLATE'},'latest':[{'type':'oil','date':'2026-10-01','cost':100,'note':'PRIVATE-NOTE','photos':['PRIVATE-PHOTO']}] }},'test-model')
  self.assertFalse(req['store']);self.assertEqual(req['max_output_tokens'],800)
  for secret in ['SECRET-PLATE','PRIVATE-NOTE','PRIVATE-PHOTO']:self.assertNotIn(secret,json.dumps(req))
  for bad in [{},{'question':''},{'question':'x'*2001},{'question':'ok','summary':'invalid'}]:
   with self.assertRaises(ValueError):gateway.build_request(bad,'test-model')
 def test_http_auth_and_success_without_provider_call(self):
  os.environ['AUTOCARNET_ACCESS_TOKEN']='test-only-personal-code-not-a-real-secret';os.environ['OPENAI_MODEL']='test-model';gateway._buckets.clear();calls=[]
  gateway.provider_answer=lambda p:calls.append(p) or 'Réponse simulée'
  server=ThreadingHTTPServer(('127.0.0.1',0),gateway.Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();url='http://127.0.0.1:'+str(server.server_port)+'/assistant'
  def request(payload,token=None):
   headers={'Content-Type':'application/json'}
   if token:headers['Authorization']='Bearer '+token
   req=urllib.request.Request(url,data=json.dumps(payload).encode(),headers=headers)
   try:
    with urllib.request.urlopen(req) as r:return r.status,json.load(r)
   except urllib.error.HTTPError as e:return e.code,json.load(e)
  try:
   self.assertEqual(request({'question':'ok'})[0],401);self.assertEqual(calls,[])
   code,result=request({'question':'bonjour'},os.environ['AUTOCARNET_ACCESS_TOKEN']);self.assertEqual(code,200);self.assertEqual(result['answer'],'Réponse simulée');self.assertEqual(len(calls),1)
   self.assertEqual(request({'question':''},os.environ['AUTOCARNET_ACCESS_TOKEN'])[0],400)
   for _ in range(10):last=request({'question':'ok'},os.environ['AUTOCARNET_ACCESS_TOKEN'])
   self.assertEqual(last[0],429)
  finally:server.shutdown();server.server_close()
unittest.main()
