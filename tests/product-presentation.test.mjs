import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { productSource } from '../showcase/build-product.mjs';
import * as originalMap from '../showcase/src/mind-map-data.js';
import { roles as clientRoles } from '../dist/data.js';
import { freshState, loadState, roles } from '../dist/product/portal/data.js';
import { branchDirectory } from '../dist/product/portal/network-data.js';
import { branchStaff } from '../dist/product/portal/chairman-data.js';
import { readParentSession } from '../dist/product/portal/parent-login.js';
import { screenshots } from '../showcase/src/screens.js';
import { blackPixelFraction } from './helpers/png-quality.mjs';
const root=new URL('../',import.meta.url),product=new URL('../dist/product/',import.meta.url);
async function generatedModule(name){
 let code=productSource(name,fs.readFileSync(new URL('../showcase/src/'+name,import.meta.url),'utf8'));
 code=code.replace(/from (['"])(\.\.\/\.\.\/\.\.\/dist\/product\/portal\/[^'"]+)\1/g,(_,quote,file)=>'from '+quote+pathToFileURL(path.resolve(fileURLToPath(new URL('../showcase/.product-build/src/',import.meta.url)),file)).href+quote);
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
test('Common presentation retains the exact twelve-role architecture and feature catalogue',async()=>{
 const generic=await generatedModule('mind-map-data.js');
 for(const key of ['mindMapRoles','architectureNodes','architectureLinks','familyServiceLinks','collaborationLinks','architectureSize'])assert.deepEqual(generic[key],originalMap[key],key);
 for(const id of Object.keys(roles))assert.deepEqual(generic.roleMapLayout(id),originalMap.roleMapLayout(id));
 assert.deepEqual(roles,clientRoles);
});
test('Common workspace links stay inside product/portal on localhost and project hosting',async()=>{
 const generic=await generatedModule('data.js');
 for(const suffix of ['product/','product','product/index.html'])assert.equal(generic.prototypeBaseFor('https://tradex-innovations.github.io/Sussex-LMS/'+suffix+'#mind-map/parent'),'https://tradex-innovations.github.io/Sussex-LMS/product/portal/');
 assert.equal(generic.prototypeBaseFor('http://127.0.0.1:4183/product/#network'),'http://127.0.0.1:4183/product/portal/');
});
test('Neutral sample campuses preserve scope/index fields and valid staff rendering',()=>{
 const state=freshState();assert.equal(branchDirectory.length,20);
 for(const [index,branch]of branchDirectory.entries()){
  assert.equal(branch.directoryIndex,index);assert.doesNotMatch(JSON.stringify(branch),/sussex|branch_network/i);
  assert.ok(branchStaff(state,branch).every(person=>person.name&&person.designation));
 }
 assert.doesNotMatch(JSON.stringify(state),/sussex/i);
 const data=fs.readFileSync(new URL('portal/data.js',product),'utf8'),login=fs.readFileSync(new URL('portal/parent-login.js',product),'utf8');
 assert.match(data,/school-product-demo-v1/);assert.doesNotMatch(data,/campusway-demo-v1/);assert.match(login,/school-product-parent-demo-session/);
});
test('All neutral screenshots are fresh complete captures with correct dimensions',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../showcase/product-public/assets/screens/captures.json',import.meta.url)));
 assert.equal(manifest.captures.length,Object.keys(screenshots).length);
 for(const c of manifest.captures){
  const bytes=fs.readFileSync(new URL('../showcase/product-public/assets/screens/'+c.file,import.meta.url));
  assert.equal(bytes.readUInt32BE(16),c.width);assert.equal(bytes.readUInt32BE(20),c.height);assert.equal(c.route,screenshots[c.id].route);assert.ok(blackPixelFraction(bytes)<.25,c.id);
  if(screenshots[c.id].mobile)assert.ok(c.height/c.width>1.7,c.id);
  assert.ok(!bytes.equals(fs.readFileSync(new URL('../showcase/public/assets/screens/'+screenshots[c.id].file,import.meta.url))),c.id+' must not reuse a branded image');
 }
});
test('Common published text/assets and cache are independent of the client version',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(new URL(e.name+'/',dir)):[new URL(e.name,dir)]);
 for(const url of walk(product)){
  assert.doesNotMatch(path.basename(url.pathname),/sussex/i);
  if(/\.(js|css|html|json|svg|txt)$/.test(url.pathname))assert.doesNotMatch(fs.readFileSync(url,'utf8'),/sussex/i,url.pathname);
 }
 const worker=fs.readFileSync(new URL('sw.js',product),'utf8');assert.match(worker,/school-product-/);assert.doesNotMatch(worker,/sussex-showcase-/);
 assert.match(fs.readFileSync(new URL('dist/showcase/sw.js',root),'utf8'),/sussex-showcase-/);
});

test('Common portal reads only its own records and Parent session keys',()=>{
 const reads=[],previousLocal=globalThis.localStorage,previousSession=globalThis.sessionStorage;
 globalThis.localStorage={getItem:key=>{reads.push(key);return key==='campusway-demo-v1'?'{"clientRecord":true}':null;}};
 globalThis.sessionStorage={getItem:key=>{reads.push(key);return key==='sussex-parent-demo-session'?'{"guardianId":"client-guardian"}':null;}};
 try{assert.equal(loadState().clientRecord,undefined);assert.equal(readParentSession(),null);assert.deepEqual(reads,['school-product-demo-v1','school-product-parent-demo-session']);}
 finally{if(previousLocal===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousLocal;if(previousSession===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=previousSession;}
});
test('Common worker preserves client caches/pages and messages only product clients',async()=>{
 const code=fs.readFileSync(new URL('sw.js',product),'utf8'),current=code.match(/const CACHE = '([^']+)'/)[1],scope='https://school.example/site/product/',events={},deleted=[],messages=[];
 const caches={keys:async()=>['sussex-showcase-client','unrelated-cache','school-product-old',current],delete:async key=>deleted.push(key)};
 const self={location:new URL(scope+'sw.js'),addEventListener:(type,fn)=>events[type]=fn,clients:{claim:async()=>{},matchAll:async()=>[scope+'#mind-map/parent','https://school.example/site/showcase/#mind-map','https://school.example/site/#parent/transport'].map(url=>({url,postMessage:data=>messages.push({url,type:data.type})}))}};
 vm.runInNewContext(code,{self,caches,URL});let activation;events.activate({waitUntil:p=>activation=p});await activation;
 assert.deepEqual(deleted,['school-product-old']);assert.deepEqual(messages,[{url:scope+'#mind-map/parent',type:'SCHOOL_PRODUCT_UPDATED'}]);
 for(const url of ['https://school.example/site/showcase/','https://school.example/site/','https://other.example/site/product/']){
  let handled=false;events.fetch({request:{url,method:'GET'},respondWith:()=>handled=true});assert.equal(handled,false,url);
 }
});
