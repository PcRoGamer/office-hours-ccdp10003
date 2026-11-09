#!/usr/bin/env node
'use strict';
/*
 * Night Shift v3: real-browser, first-promotion primary-game-research check.
 * This tests rendered and clickable research labels, NOT just source strings.
 *
 * node qa/v3-course-story-research.test.cjs --url=http://127.0.0.1:4173/previews/v3-story.html
 * Optional NODE_PATH points at the installed Playwright package.
 * Use QA_OUTPUT_DIR to collect real screenshots/reports.
 */
const fs=require('node:fs');
const path=require('node:path');
const args=process.argv.slice(2);
const get=(key,defaultValue)=>{const x=args.find(s=>s.startsWith('--'+key+'='));return x?x.slice(key.length+3):defaultValue};
const url=get('url','http://127.0.0.1:4173/previews/v3-story.html');
const out=path.resolve(get('output',process.env.QA_OUTPUT_DIR || 'qa-artifacts/v3-course-story'));
const STUDIES=[
 {name:'Dumb Ways to Die',regex:/dumb\s*ways\s*to\s*die/i,
  source:/^(?:www\.)?(?:gamesforchange\.org|dumbwaystodie\.com|julianfrost\.co\.nz|tinywideopenspaces\.com)$/i},
 {name:'Brotato',regex:/brotato/i,
  source:/^(?:www\.)?(?:store\.steampowered\.com|blobfishgames\.notion\.site|godotengine\.org)$/i},
 {name:'Job Simulator',regex:/job\s*simulator/i,
  source:/^(?:www\.)?(?:jobsimulatorgame\.com|owlchemylabs\.com)$/i}
];
const safeWrite=(name,data)=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,name),data)};
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const report={url,scope:'REAL RENDERED FIRST-PROMOTION RESEARCH DISCOVERABILITY, NOT UNIVERSITY GRADE',
    inspectedAt:new Date().toISOString(),viewport:'1440x900',checks:[],sources:[],pageErrors:[],screenshots:[],status:'BLOCKED'};
  let browser;
  const check=(id,ok,detail)=>{
    report.checks.push({id,status:ok?'PASS':'FAIL',detail});
  };
  try{
    const {chromium}=require('playwright');
    const options={headless:true,args:['--no-sandbox']};
    if(process.platform==='win32'){
      for(const p of ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe']){
        if(fs.existsSync(p)){options.executablePath=p;break;}
      }
    }else if(fs.existsSync('/usr/bin/google-chrome'))options.executablePath='/usr/bin/google-chrome';
    browser=await chromium.launch(options);
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    page.on('pageerror',e=>report.pageErrors.push(e.message));
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
    check('PREVIEW_HTTP_200',response&&response.status()===200,
      'HTTP status '+(response?.status()||'navigation failed'));
    await page.waitForTimeout(350);
    const first=page.locator('#launch');
    check('FIRST_PROMOTION_ENTRY',await first.count()>0 && await first.isVisible(),
      'Actual visible first-promotion preview launch button');
    if(await first.count() && await first.isVisible())await first.click();
    else throw Error('No visible first-promotion control');
    const panel=page.locator('#story');
    await panel.waitFor({state:'visible',timeout:7500});
    const phase=await page.evaluate(()=>window.__storyPreview?.phase ?? null);
    check('AUTHENTIC_FIRST_PROMOTION',phase===1,
      'Story preview first promotion state '+phase);
    const shot='promotion-before-opening-sources.png';
    await page.screenshot({path:path.join(out,shot)});
    report.screenshots.push(shot);
    // Click the actual optional disclosure controls, don't count inaccessible hidden citations.
    const details=panel.locator('details.ns-source');
    let disclosureCount=await details.count();
    for(let i=0;i<disclosureCount;i++){
      const d=details.nth(i);
      if(!(await d.evaluate(x=>x.open)))await d.locator('summary').click();
    }
    await page.waitForTimeout(120);
    const links=await panel.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>({
      label:(n.textContent||n.getAttribute('aria-label')||'').trim(),
      url:n.href, visible:(()=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);
        return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})()
    })));
    report.sources=links;
    check('IN_GAME_SOURCE_LINK_DISCLOSURE',disclosureCount>0 && links.some(x=>x.visible),
      'Opened '+disclosureCount+' real source disclosures; visible clickable sources '+links.filter(x=>x.visible).length);
    for(const study of STUDIES){
      const matched=links.filter(x=>x.visible && study.regex.test(x.label) && (()=>{
        try{const u=new URL(x.url);return u.protocol==='https:' && study.source.test(u.host)}catch{return false}
      })());
      check('PRIMARY_SOURCE_'+study.name.replace(/\W+/g,'_').toUpperCase(),matched.length>0,
        matched.length?matched.map(x=>x.label+' '+x.url).join('; '):
        'No disclosed clickable authoritative primary link labeled '+study.name+' in first promotion');
    }
    const words=(await panel.innerText()).replace(/\s+/g,' ').trim();
    const whyNow=/why\s+now|tiny\s+challenges.*next|each\s+one.*next|build.*next\s+(?:game|challenge|job)/i.test(words);
    check('WHY_NOW_WITHIN_FIRST_PROMOTION',whyNow,
      whyNow?'Legible why-now rationale in live first promotion':
      'No first-promotion why-now/rationale demonstrated in visible copy; source documents alone are insufficient');
    const noTechnicalErrors=report.pageErrors.length===0;
    check('NO_PAGE_EXCEPTIONS',noTechnicalErrors,report.pageErrors.slice(0,3).join('; ')||'No JavaScript page exceptions');
    const opened='promotion-open-sources.png';
    await page.screenshot({path:path.join(out,opened)});
    report.screenshots.push(opened);
    await page.close();
  }catch(e){report.error=String(e.stack||e).slice(0,1100);}
  finally{if(browser)await browser.close().catch(()=>{});}
  const failed=report.checks.filter(c=>c.status==='FAIL');
  report.status=report.error?'BLOCKED':failed.length?'GDD_RESEARCH_FAIL':'PROMOTION_RESEARCH_PASS_ONLY';
  report.failedChecks=failed.map(x=>x.id);
  safeWrite('evidence.json',JSON.stringify(report,null,2)+'\n');
  safeWrite('evidence.md',['# First-promotion research audit','','**URL:** '+url,
    '**Result:** '+report.status,'','| Check | Actual | Detail |',
    '| --- | --- | --- |',...report.checks.map(x=>'| '+x.id+' | '+x.status+' | '+x.detail.replace(/\|/g,'/')+' |'),
    '','This is browser evidence for the named promotion state only. It does not assert actual full gameplay or a course grade.'].join('\n')+'\n');
  console.log(JSON.stringify({status:report.status,failed:report.failedChecks,
    sources:report.sources,screenCaptures:report.screenshots,output:out,
    error:report.error||null},null,2));
  if(report.status!=='PROMOTION_RESEARCH_PASS_ONLY')process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
