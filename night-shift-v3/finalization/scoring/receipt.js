/**
 * Present an actual SYSTEMS ending through STORY's fully animated thermal receipt.
 * THE QUOTA's last physical CLOCK OUT gesture has already occurred by this point.
 * No new game actions, fictional counter events or inferred welfare outcomes.
 */
import {verifyFinalLedger} from './ledger.js';
import {createStoryExperience} from '../../story/presentation.js';

let cssLink=null;
function ensureStyle(){
 if(typeof document==='undefined')throw Error('Browser DOM required');
 if(cssLink?.isConnected)return cssLink;
 cssLink=document.createElement('link');
 cssLink.rel='stylesheet';
 cssLink.href=new URL('../../story/story.css',import.meta.url).href;
 cssLink.dataset.nightshiftVerifiedReceipt='true';
 document.head.append(cssLink);
 return cssLink;
}

/** @returns an immutable {slip, dispose, element} handle. Throws if incomplete. */
export function presentVerifiedClockout({host,runSnapshot,audio,onReplay=()=>{},reduceMotion=false}={}){
 if(!(host instanceof HTMLElement))throw TypeError('A real DOM host element is required');
 if(typeof onReplay!=='function')throw TypeError('onReplay must be a function');
 const slip=verifyFinalLedger(runSnapshot);
 ensureStyle();
 // At 521–800px STORY's inherited side-by-side receipt is too small to read.
 // Scope the correction to the ending, not to other agents' promotion layouts.
 if(!document.querySelector('style[data-ns-score-portrait]')){
  const responsive=document.createElement('style');
  responsive.dataset.nsScorePortrait='true';
  responsive.textContent='@media(min-width:521px) and (max-width:800px){'+
   '.ns-story .ns-end-center{display:flex!important;flex-direction:column!important;align-items:center!important;gap:10px!important;padding:9px 20px!important;}'+
   '.ns-story .ns-end-theatre{width:100%!important;height:145px!important;min-height:145px!important;max-height:145px!important;flex:0 0 145px!important;}'+
   '.ns-story .ns-end-theatre canvas{height:145px!important;max-height:145px!important;width:auto!important;}'+
   '.ns-story .ns-end-theatre .ns-big-stamp{font-size:23px!important;bottom:3px!important;padding:5px 18px!important;}'+
   '.ns-story .ns-receipt{width:100%!important;max-width:570px!important;margin:0 auto 10px!important;padding:24px 26px!important;}'+
   '.ns-story .ns-receipt-title{font-size:34px!important;}'+
   '.ns-story .ns-receipt-score{font-size:92px!important;}'+
   '.ns-story .ns-receipt-facts{font-size:12px!important;}'+
   '}';
  document.head.append(responsive);
 }
 const story=createStoryExperience({host,audio,reduceMotion});
 const article=story.showReceipt({run:runSnapshot,snapshot:slip.endingSnapshot,
   onReplay:()=>{story.dispose();onReplay()}});
 // STORY re-renders the thermal paper on every flip/details click. Keep the
 // source provenance and lens-specific message factual on every new sheet.
 const annotate=()=>{
  if(!article.isConnected)return;
  const footer=article.querySelector('.ns-receipt-bottom');
  if(footer&&!footer.querySelector('.ns-event-provenance')){
   const provenance=document.createElement('span');
   provenance.className='ns-event-provenance';
   provenance.textContent=' · '+slip.eventCount+' VERIFIED COMMITTED EVENTS';
   footer.append(provenance);
  }
  if(article.querySelector('.ns-receipt-title')?.textContent?.trim()==='PEOPLE & QUALITY'){
   const heading=article.querySelector('.ns-receipt h2');
   const conclusion=article.querySelector('.ns-receipt .ns-conclusion');
   if(heading)heading.textContent='PEOPLE & QUALITY · NOT A COMPANY AWARD';
   if(conclusion)conclusion.textContent=
    'Observed support: '+slip.workersHelped+'/'+slip.workersObserved+
    '. Software access: $'+slip.licence.givenDollars+' of $80.'+
    ' Safe notices: '+slip.noticesSafe+'/'+slip.noticesObserved+'.';
  }
 };
 const watcher=new MutationObserver(annotate);
 watcher.observe(article,{childList:true});
 annotate();
 return Object.freeze({slip,element:article,
  dispose:()=>{watcher.disconnect();story.dispose()},
  flip:()=>article.querySelector('[data-flip]')?.click()});
}