#!/usr/bin/env node
/** Fail-closed production v3 QA gate. No mock input can count as a release pass. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {auditSeedGenerator} from './v3-game-invariants.mjs';
import {auditProductionSnapshot} from './v3-game-ledger-audit.mjs';
const args=process.argv.slice(2);
const val=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]};
const contract=JSON.parse(readFileSync(new URL('../design/v3/contract.json',import.meta.url),'utf8'));
const reject=(msg,details)=>{console.error('PRODUCTION_GATE_FAIL:',msg,details?JSON.stringify(details,null,2):'');process.exitCode=1};
if(args.includes('--snapshot')){
  const filename=val('--snapshot');
  if(!filename){reject('Provide a real production snapshot JSON path');process.exit(1)}
  try{
    const data=JSON.parse(readFileSync(filename,'utf8'));
    const verdict=auditProductionSnapshot(data,contract,{requireVictory:args.includes('--victory')});
    if(!verdict.ok)reject('Real SYSTEMS snapshot violated GDD invariants',verdict);
    else console.log('PRODUCTION_SNAPSHOT_INVARIANTS_PASS',JSON.stringify(verdict.summary));
  }catch(err){reject('Could not audit production snapshot: '+err.message)}
}else if(args.includes('--deck-module')){
  const file=val('--deck-module'),name=val('--export')||'createDeck';
  if(!file){reject('Supply a real production SYSTEMS module path');process.exit(1)}
  try{
    const mod=await import(pathToFileURL(resolve(file)).href);
    const makeDeck=mod[name];if(typeof makeDeck!=='function')throw Error('Missing export '+name);
    const result=auditSeedGenerator(seed=>{
      const x=makeDeck(seed);return Array.isArray(x)?x:x?.cardDeck||x?.deck;
    },contract,1000);
    if(!result.pass)reject('Actual production deck generator failed 1,000 seeds',result);
    else console.log('PRODUCTION_DECK_1000_SEED_PASS',result.coverage.join(','));
  }catch(err){reject('Could not execute production seed generator: '+err.message)}
}else{
  console.error('NO PRODUCTION TESTS RAN. Use --snapshot <actual-v3-JSON> or --deck-module <SYSTEMS-file> [--export makeDeck].');
  process.exitCode=2;
}
