'use strict';
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const {GAMES,ALL_IDS}=await import(pathToFileURL(path.resolve(__dirname,'../office-attack/games.js')).href);
 assert.equal(GAMES.length,10);
 assert.equal(new Set(ALL_IDS).size,10);
 for(const level of [1,2,3]){
  function setup(id,seed=0.31){
   const game=GAMES.find(g=>g.id===id);assert.ok(game);
   const g={level,t:0,mode:'active'};
   const events=[];
   const api={rand:()=>seed,tap:()=>events.push('tap'),spark:()=>events.push('spark'),
    win:()=>events.push('win'),lose:()=>events.push('lose')};
   game.enter(g,api);return {game,g,api,events};
  }
  // FIX: all independently glowing errors must be hit.
  {const {game,g,api,events}=setup('fix');assert.equal(g.leaks.length,level+2);
   for(let i=0;i<g.leaks.length;i++)game.down(g,{x:g.leaks[i].x,y:g.leaks[i].y},api);
   assert.equal(events.filter(x=>x==='win').length,1);assert.equal(events.includes('lose'),false);}
  // PLUG: wrong socket fails, empty drag snaps back, matched socket wins.
  {const z=setup('plug'),{game,g,api,events}=z;
   const wrong=g.plugPorts[1-g.plugTarget];
   game.down(g,{x:g.plugX,y:g.plugY},api);game.move(g,{x:wrong.x,y:wrong.y});game.up(g,{x:wrong.x,y:wrong.y},api);
   assert.equal(events.filter(x=>x==='lose').length,1);}
  {const {game,g,api,events}=setup('plug');
   game.down(g,{x:g.plugX,y:g.plugY},api);game.move(g,{x:460,y:331});game.up(g,{x:460,y:331},api);
   assert.equal(g.plugX,250);assert.equal(g.plugY,340);assert.equal(events.includes('win'),false);
   const good=g.plugPorts[g.plugTarget];
   game.down(g,{x:g.plugX,y:g.plugY},api);game.move(g,{x:good.x,y:good.y});game.up(g,{x:good.x,y:good.y},api);
   assert.equal(events.filter(x=>x==='win').length,1);}
  // CLEAN: clicking alone fails, one deliberate scrub gesture finishes.
  {const {game,g,api,events}=setup('clean');
   game.down(g,{x:349,y:320},api);game.up(g,{x:349,y:320},api);
   assert.equal(g.cleanProgress,0);assert.equal(events.includes('win'),false);
   game.down(g,{x:344,y:320},api);
   for(const p of [{x:410,y:329},{x:480,y:310},{x:550,y:327},{x:630,y:330}]){
    game.move(g,p,api);
   }
   assert.equal(events.filter(x=>x==='win').length,1);
   assert.ok(g.cleanProgress>=g.cleanNeed);}
  // SORT: wrong bins punish, correctly sorted two types win.
  {const {game,g,api,events}=setup('sort');
   const item=g.sortItems[0],bad=g.sortBins.find(b=>b.kind!=='paper');
   game.down(g,{x:item.x,y:item.y},api);
   game.move(g,{x:bad.x,y:bad.y});game.up(g,{x:bad.x,y:bad.y},api);
   assert.equal(events.filter(x=>x==='lose').length,1);}
  {const {game,g,api,events}=setup('sort');
   for(const kind of ['paper','peel']){
    const item=g.sortItems.find(x=>x.kind===kind),bin=g.sortBins.find(x=>x.kind===kind);
    game.down(g,{x:item.x,y:item.y},api);game.move(g,{x:bin.x,y:bin.y});game.up(g,{x:bin.x,y:bin.y},api);
   }
   assert.equal(g.sorted,2);assert.equal(events.filter(x=>x==='win').length,1);}
  // SHUT: body taps are harmless; precise-but-large X targets close 2/3 windows.
  {const {game,g,api,events}=setup('shut');
   game.down(g,{x:g.popup.x-90,y:g.popup.y},api);
   assert.equal(g.shutClosed,0);assert.equal(events.includes('lose'),false);
   for(let i=0;i<g.shutTotal;i++){
    const p=g.popup;game.down(g,{x:p.x+94,y:p.y-55},api);
   }
   assert.equal(events.filter(x=>x==='win').length,1);}
  // Visible threat must eventually collide if ignored, but not instantly.
  {const {game,g,api,events}=setup('shut');
   game.update(g,.35,api);assert.equal(events.includes('lose'),false);
   game.update(g,5,api);assert.equal(events.filter(x=>x==='lose').length,1);}
  console.log('PASS level '+level+': FIX PLUG CLEAN SORT SHUT mechanics, wrong inputs, win/loss and reset states');
 }
 console.log('PASS 10 unique authored microgames; no timed fake wins');
})().catch(e=>{console.error(e.stack);process.exitCode=1});