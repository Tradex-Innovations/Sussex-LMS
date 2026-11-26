import { serviceWorkerSource } from './service-worker-template.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve('../dist/showcase'),list=[];
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else if(!['sw.js','offline-showcase.zip'].includes(entry.name))list.push('./'+path.relative(root,file).replaceAll(path.sep,'/'));}}
walk(root);list.push('./');const hash=crypto.createHash('sha256').update(serviceWorkerSource('', [])).update(list.join('|'));for(const file of list)if(file!=='./')hash.update(fs.readFileSync(path.join(root,file)));const version=hash.digest('hex').slice(0,12);
fs.writeFileSync(path.join(root,'sw.js'), serviceWorkerSource(version, list));
console.log('Offline cache:', list.length, 'local assets');
