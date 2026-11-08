/* Create a single offline HTML review artifact by bundling the source-composed
 * independently authored modules. The result is NOT a production release.
 * Run from isolated staging cwd; dependencies installed in release-harness.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const esbuild=require('esbuild');

(async()=>{
 const root=process.cwd();
 const entry=path.join(root,'previews/v3-release-composition.html');
 const target=path.join(root,'qa-artifacts/v3-release-composition/playable/index.html');
 const html=fs.readFileSync(entry,'utf8');
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/i);
 if(!script)throw Error('Unable to locate the exact integration-rehearsal ESM entry');
 const bundle=await esbuild.build({
  stdin:{contents:script[1],resolveDir:path.dirname(entry),sourcefile:'v3-release-composition-inline.js',loader:'js'},
  write:false,bundle:true,platform:'browser',format:'iife',
  minify:true,target:['es2022'],legalComments:'none',logLevel:'warning',
  treeShaking:true,metafile:true
 });
 if(bundle.errors?.length)throw Error('esbuild failed: '+JSON.stringify(bundle.errors));
 if(bundle.outputFiles.length!==1)throw Error('Single-file bundle unexpectedly emitted multiple files');
 let js=bundle.outputFiles[0].text;
 // A literal closing script token inside bundled JavaScript would prematurely
 // terminate the HTML parser. Escape it without changing executable semantics.
 js=js.replace(/<\/script/gi,'<\\/script');
 const standalone=html.replace(script[0],'<script>'+js+'</script>');
 if(standalone.includes('<script type="module">'))throw Error('Stale module import');
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,standalone);
 const stat=fs.statSync(target);
 const summary={entry:'index.html',bytes:stat.size,sourceModules:Object.keys(bundle.metafile.inputs).length,
  noExternalJs:!/<script\s+src=/.test(standalone),createdAt:new Date().toISOString()};
 fs.writeFileSync(path.join(path.dirname(target),'build.json'),JSON.stringify(summary,null,2));
 console.log('OFFLINE_REHEARSAL_BUNDLE',JSON.stringify(summary));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
