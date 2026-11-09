#!/usr/bin/env node
// Independent static release-graph gate. Does not change any game files.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[], visited=new Set();
const entry=path.join(root,'night-shift-v3.html');
const exists=p=>fs.existsSync(p)&&fs.statSync(p).isFile();
const report=(from,s)=>errors.push(path.relative(root,from)+': '+s);
function ref(from,url,follow=false){
  if(/^(?:https?:|data:|#|\/\/)/.test(url))return;
  if(!url.startsWith('.')&&!url.startsWith('/')){if(follow)report(from,'bare module import '+url);return}
  const clean=url.split(/[?#]/)[0];
  const target=path.resolve(clean.startsWith('/')?root:path.dirname(from),clean.replace(/^\//,''));
  if(!target.startsWith(root+path.sep)){report(from,'path escapes repository: '+url);return}
  if(!exists(target)){report(from,'missing asset/module '+url);return}
  if(follow)scan(target);
}
function scan(file){
  if(visited.has(file))return;
  visited.add(file);
  const source=fs.readFileSync(file,'utf8');
  // Static from/import and literal dynamic imports.
  for(const match of source.matchAll(/(?:\b(?:import|export)\s+[^;\n]*?\s+from\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g))ref(file,match[1],true);
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(e){report(file,'Node syntax check failed: '+String(e.stderr||e.message).slice(0,300))}
}
if(!exists(entry))report(entry,'v3 entrypoint missing');
else{
  const html=fs.readFileSync(entry,'utf8');
  for(const m of html.matchAll(/<(script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi))ref(entry,m[2],m[1].toLowerCase()==='script');
}
if(exists(path.join(root,'night-shift-v3/app.js')))scan(path.join(root,'night-shift-v3/app.js'));
else report(entry,'missing main app');
if(!exists(path.join(root,'arcade-office-hd.html')))report(entry,'protected HD fallback missing');
console.log(JSON.stringify({pass:errors.length===0,modulesChecked:visited.size,errors},null,2));
if(errors.length)process.exitCode=1;
