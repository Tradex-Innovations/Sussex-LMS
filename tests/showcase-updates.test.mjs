import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { serviceWorkerSource } from '../showcase/service-worker-template.mjs';
import { shouldReloadForRelease } from '../showcase/src/release-updates.js';
function harness({ old = [], windows = [], offline = false } = {}) {
 const scope='https://school.example/Sussex-LMS/showcase/',events={},deleted=[],messaged=[],fetched=[],installed=[],stored=new Map();let claims=0;
 class Request { constructor(input,options={}){Object.assign(this,typeof input==='string'?{url:new URL(input,scope).href,method:'GET',mode:'cors'}:input,options);} }
 const caches={keys:async()=>['unrelated-cache',...old,'sussex-showcase-current'],delete:async key=>{deleted.push(key);return true;},open:async key=>({addAll:async files=>installed.push(...files),match:async request=>stored.get(key+':'+(typeof request==='string'?request:request.url))})};
 const self={location:new URL(scope+'sw.js'),addEventListener:(type,handler)=>events[type]=handler,skipWaiting:async()=>{},clients:{claim:async()=>claims++,matchAll:async()=>windows.map(url=>({url,postMessage:data=>{messaged.push({url,data});}}))}};
 vm.runInNewContext(serviceWorkerSource('current',['./index.html','./assets/current.js']),{self,caches,URL,Request,fetch:async request=>{fetched.push(request);if(offline)throw Error('offline');return 'network';}});
 return {deleted,messaged,fetched,installed,stored,get claims(){return claims;},async run(type){let promise;events[type]({waitUntil:p=>promise=p});await promise;},async request(url,mode='navigate',method='GET'){let promise;events.fetch({request:new Request(url,{mode,method}),respondWith:p=>promise=p});return promise;}};
}
test('A new release notifies only showcase clients and clears only older showcase caches',async()=>{
 const map='https://school.example/Sussex-LMS/showcase/#mind-map/parent/fees';
 const h=harness({old:['sussex-showcase-old'],windows:[map,'https://school.example/Sussex-LMS/showcase/#family','https://school.example/Sussex-LMS/#parent/fees','https://school.example/other/showcase/#mind-map','https://foreign.example/Sussex-LMS/showcase/#mind-map']});
 await h.run('activate');assert.deepEqual(h.messaged.map(item=>item.url),[map,'https://school.example/Sussex-LMS/showcase/#family']);assert.ok(h.messaged.every(item=>item.data.type==='SUSSEX_SHOWCASE_UPDATED')); assert.deepEqual(h.deleted,['sussex-showcase-old']);assert.equal(h.claims,1);
});
test('Initial offline installation does not reload a newly opened map and fetches fresh cache entries',async()=>{
 const h=harness({windows:['https://school.example/Sussex-LMS/showcase/#mind-map']});await h.run('install');assert.equal(h.installed.length,2);assert.ok(h.installed.every(request=>request.cache==='reload'));await h.run('activate');assert.deepEqual(h.messaged,[]);
});
test('Online map navigation bypasses cached HTML and offline navigation falls back to the active release',async()=>{
 const url='https://school.example/Sussex-LMS/showcase/';const online=harness();assert.equal(await online.request(url),'network');assert.equal(online.fetched[0].cache,'no-store');
 const offline=harness({offline:true});offline.stored.set('sussex-showcase-current:./index.html','current offline HTML');assert.equal(await offline.request(url),'current offline HTML');
});
test('Fetch handling leaves LMS, foreign and POST requests alone and assets use only the active release cache',async()=>{
 const h=harness(),url='https://school.example/Sussex-LMS/showcase/assets/current.js';h.stored.set('sussex-showcase-current:'+url,'current asset');assert.equal(await h.request(url,'cors'),'current asset');assert.equal(h.fetched.length,0);
 assert.equal(await h.request('https://school.example/Sussex-LMS/#parent/fees'),undefined);assert.equal(await h.request('https://foreign.example/Sussex-LMS/showcase/'),undefined);assert.equal(await h.request(url,'cors','POST'),undefined);
});

test('Release messages refresh the current mind-map route while preserving chapters and ignoring unrelated messages',()=>{
 for(const hash of ['#mind-map','#mind-map/parent','#mind-map/parent/fees'])assert.equal(shouldReloadForRelease({type:'SUSSEX_SHOWCASE_UPDATED'},hash),true);
 for(const hash of ['#family','#roles','#mind-map-other'])assert.equal(shouldReloadForRelease({type:'SUSSEX_SHOWCASE_UPDATED'},hash),false);
 assert.equal(shouldReloadForRelease({type:'unrelated'},'#mind-map'),false);assert.equal(shouldReloadForRelease(null,'#mind-map'),false);
});
