#!/usr/bin/env node
/**
 * Reproducibly assemble an isolated specialist rehearsal.
 * Copies each lane's ONLY owned files to a NEW detached worktree via git show:
 * no index lock, no overwrites, no changes to any shared checkout/release.
 */
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const argv=process.argv.slice(2),arg=(x,def)=>{const i=argv.indexOf(x);return i<0?def:argv[i+1]};
const root=resolve(arg('--repo',process.cwd())),out=resolve(arg('--out',join(tmpdir(),'nightshift-rehearsal-'+Date.now())));
const manifest=JSON.parse(readFileSync(new URL('./rehearsal-sources.json',import.meta.url),'utf8'));
if(existsSync(out))throw Error('Destination already exists: '+out+'. Select a fresh path; nothing will be overwritten.');
function git(command,cwd=root){
 const r=spawnSync('git',command,{cwd,timeout:20000,maxBuffer:32*1024*1024,windowsHide:true});
 if(r.status!==0)throw Error('git '+command.slice(0,3).join(' ')+' failed: '+r.stderr.toString().slice(0,650));
 return r.stdout;
}
const repo=git(['rev-parse','--show-toplevel']).toString().trim();
if(resolve(repo)!==root)throw Error('--repo must be the root of a Git checkout/worktree: '+root);
const base=arg('--base',manifest.base);
const head=git(['rev-parse',base]).toString().trim();
git(['worktree','add','--detach',out,base]);
const paths=new Set(),results=[];
for(const lane of manifest.lanes){
 const item={lane:lane.name,branch:lane.ref,sha:null,files:[],skipped:[],error:null};
 try{
  item.sha=git(['rev-parse',lane.ref]).toString().trim();
  const listed=git(['ls-tree','-r','--name-only',lane.ref,'--',...lane.paths]).toString().split(/\r?\n/).filter(Boolean);
  if(listed.length===0){item.skipped.push('No files on branch');results.push(item);continue}
  for(const file of listed){
   if(paths.has(file)){item.skipped.push('Collision: '+file);continue}
   const target=resolve(out,file);
   if(!target.startsWith(out+sep)){item.skipped.push('Unsafe path: '+file);continue}
   if(existsSync(target)){item.skipped.push('Integrated source already exists; not overwritten: '+file);continue}
   const bytes=git(['show',lane.ref+':'+file]);
   mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);paths.add(file);item.files.push(file);
  }
 }catch(error){item.error=error.message}
 results.push(item);
 console.log(lane.name+': '+item.files.length+' copied'+(item.skipped.length?', '+item.skipped.length+' skipped':'')+(item.error?', '+item.error:''));
}
const summary={base,baseSha:head,output:out,createdAt:new Date().toISOString(),source:'local Git refs; no shared source modified',results};
writeFileSync(join(out,'v3-safetynet-assembly.json'),JSON.stringify(summary,null,2)+'\n');
console.log('REHEARSAL='+out);console.log('SOURCE_BRANCHES='+results.length+' FILES='+paths.size);
if(results.some(x=>x.error))process.exitCode=1;
