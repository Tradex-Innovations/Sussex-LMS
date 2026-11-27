import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import { branchDirectory } from '../dist/network-data.js';
import { serviceWorkerSource } from './service-worker-template.mjs';
import { screenshots } from './src/screens.js';

const here=path.dirname(fileURLToPath(import.meta.url)),app=path.dirname(here);
const cleanText=text=>text.replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,'').replace(/\n+$/,'\n');
async function cleanCopiedText(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await cleanCopiedText(file);else if(/\.(js|css|html|json|svg|txt)$/.test(entry.name)||entry.name==='LICENSE')await fs.writeFile(file,cleanText(await fs.readFile(file,'utf8')));}}
export const productRoot=path.join(app,'dist/product');
export function neutralText(text){
 return text.replaceAll('sussex-parent-demo-session','school-product-parent-demo-session')
  .replaceAll('campusway-','school-product-')
  .replaceAll('sussex-college-network-logo.png','product-mark.svg')
  .replaceAll('Sussex College Network','School Management Platform')
  .replaceAll('SUSSEX COLLEGE NETWORK','SCHOOL MANAGEMENT PLATFORM')
  .replaceAll('Sussex College','Campus').replaceAll('Sussex','School')
  .replaceAll('SUSSEX_SHOWCASE_UPDATED','SCHOOL_PRODUCT_UPDATED')
  .replaceAll('SUSSEX','SCHOOL').replaceAll('sussex-showcase-','school-product-')
  .replaceAll('sussex','school').replaceAll('SCN-','NET-');
}
export const productMark='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#102d40"/><path d="m12 27 20-13 20 13M17 28v23h30V28M26 51V36h12v15" fill="none" stroke="#e3bd73" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export async function buildProductPortal(){
 const root=path.join(productRoot,'portal');await fs.rm(root,{recursive:true,force:true});await fs.mkdir(root,{recursive:true});
 // Only the existing public frontend is copied. Presentation outputs and local
 // configuration are excluded. Each variation has separate browser storage.
 for(const entry of await fs.readdir(path.join(app,'dist'),{withFileTypes:true})){
  if(entry.isFile()&&/\.(js|css|html)$/.test(entry.name)){
   let content=neutralText(await fs.readFile(path.join(app,'dist',entry.name),'utf8'));
   if(entry.name==='app.js')content=content.replace(/<img class="brand-logo"[^>]*>/g,'${icon("school", 32)}');
   content=content.replaceAll('>Campus<span>Network</span></span>','>School<span>Platform</span></span>');
   if(entry.name==='parent-login.js')content=content.replace(/<img src="\.\/assets\/product-mark\.svg" alt="">/g,'');
   if(entry.name==='network.js')content=content.replace('Official school page','School directory');
   if(entry.name==='index.html')content=content.replace('type="image/png"','type="image/svg+xml"');
   await fs.writeFile(path.join(root,entry.name),content);
  }
 }
 for(const dir of ['assets','vendor'])await fs.cp(path.join(app,'dist',dir),path.join(root,dir),{recursive:true,filter:source=>!['.DS_Store','sussex-college-network-logo.png','favicon.png'].includes(path.basename(source))});
 await fs.writeFile(path.join(root,'assets/product-mark.svg'),productMark);
 const branches=branchDirectory.map(({id,slug,name,location,province,lat,lon,directoryIndex})=>({id,slug,name,location,province,lat,lon,directoryIndex,school:'Campus '+name,address:name+', Sri Lanka · Illustrative campus',source:'./#chairman/overview/transport',mapSource:''}));
 await fs.writeFile(path.join(root,'network-data.js'),'// Illustrative campus records for the common product walkthrough.\nexport const branchDirectory = '+JSON.stringify(branches,null,2)+';\n');
 await cleanCopiedText(root);
 // Give transformed modules their own content version, independent of the client site.
 const modules=(await fs.readdir(root)).filter(name=>name.endsWith('.js')).sort(),hash=crypto.createHash('sha256');
 for(const name of [...modules,'styles.css'])hash.update(name).update(await fs.readFile(path.join(root,name)));
 const version=hash.digest('hex').slice(0,12),imports=Object.fromEntries(modules.map(name=>['./'+name,'./'+name+'?v='+version]));
 const index=path.join(root,'index.html');let html=await fs.readFile(index,'utf8');
 html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/,'<script type="importmap">'+JSON.stringify({imports})+'</script>').replace(/(app\.js|styles\.css)\?v=[a-f0-9]+/g,'$1?v='+version);
 await fs.writeFile(index,html);
 return root;
}
export function productSource(name,original){
 let text=original;
 if(name==='main.jsx')text=text.replace('<img src="./assets/sussex-college-network-logo.png" alt="Sussex College Network logo"/><span>Sussex College<br/>Network</span>','<Icon name="school" size={32}/><span>School Management<br/>Platform</span>');
 if(name==='RoleMindMap.jsx')text=text.replace('<img src="./assets/sussex-college-network-logo.png" alt=""/>','<Icon name="network" size={40}/>').replace('12 roles across the Sussex College Network','12 roles across your school network').replace('SUSSEX COLLEGE NETWORK','YOUR SCHOOL NETWORK');
 text=neutralText(text).replaceAll('../../dist/','../../../dist/product/portal/');
 if(name==='main.jsx')text=text.replaceAll('· Mind map · School','· Mind map · School Management Platform').replaceAll('· Connected Transport · School','· Connected Transport · School Management Platform');
 if(name==='data.js'){
  text=text.replace("page.pathname.endsWith('/showcase')","page.pathname.endsWith('/product')").replace("return new URL('../', page).href;","return new URL('./portal/', page).href;").replace('http://localhost/showcase/','http://localhost/product/');
  text=text.replace('not a claim about the current School fleet','not a claim about any actual school fleet').replace('20-school network','illustrative multi-school network');
 }
 return text;
}
async function writeProductWorker(){
 const files=[];async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else if(entry.name!=='sw.js')files.push('./'+path.relative(productRoot,file).replaceAll(path.sep,'/'));}}
 await walk(productRoot);files.push('./');const hash=crypto.createHash('sha256');
 hash.update(neutralText(serviceWorkerSource('',[])));
 for(const file of files){hash.update(file);if(file!=='./')hash.update(await fs.readFile(path.join(productRoot,file)));}
 await fs.writeFile(path.join(productRoot,'sw.js'),neutralText(serviceWorkerSource(hash.digest('hex').slice(0,12),files)));
 console.log('Common product offline cache:',files.length,'local assets');
}
export async function buildProduct(){
 const portal=await buildProductPortal(),stage=path.join(here,'.product-build');
 await fs.rm(stage,{recursive:true,force:true});await fs.mkdir(path.join(stage,'src'),{recursive:true});
 const manifest=JSON.parse(await fs.readFile(path.join(here,'product-public/assets/screens/captures.json'),'utf8'));
 for(const name of await fs.readdir(path.join(here,'src'))){
  let content=productSource(name,await fs.readFile(path.join(here,'src',name),'utf8'));
  if(name==='screens.js'){
   const gallery=Object.fromEntries(Object.entries(screenshots).map(([id,shot])=>{const capture=manifest.captures.find(c=>c.id===id);if(!capture)throw new Error('Missing neutral capture: '+id);return [id,{...shot,file:capture.file,width:capture.width,height:capture.height}];}));
   content=content.replace(/export const screenshots = \{[\s\S]*?\n\};/,'export const screenshots = '+JSON.stringify(gallery,null,2)+';');
  }
  await fs.writeFile(path.join(stage,'src',name),content);
 }
 await fs.cp(path.join(here,'product-public'),path.join(stage,'public'),{recursive:true});
 await fs.mkdir(path.join(stage,'public/assets'),{recursive:true});
 for(const name of ['dm-sans.woff2','DM-Sans-OFL.txt']){const target=path.join(stage,'public/assets',name);await fs.copyFile(path.join(here,'public/assets',name),target);if(name.endsWith('.txt'))await fs.writeFile(target,cleanText(await fs.readFile(target,'utf8')));}
 await fs.writeFile(path.join(stage,'public/assets/product-mark.svg'),productMark);
 let html=neutralText(await fs.readFile(path.join(here,'index.html'),'utf8')).replace('assets/favicon.png','assets/product-mark.svg');
 await fs.writeFile(path.join(stage,'index.html'),html);
 // Preserve portal output, and remove only this product presentation's old assets.
 for(const entry of await fs.readdir(productRoot))if(entry!=='portal')await fs.rm(path.join(productRoot,entry),{recursive:true,force:true});
 await build({configFile:false,root:stage,base:'./',build:{outDir:productRoot,emptyOutDir:false,chunkSizeWarningLimit:1400}});
 await writeProductWorker();
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 if(process.argv.includes('--portal-only'))await buildProductPortal();else await buildProduct();
}
