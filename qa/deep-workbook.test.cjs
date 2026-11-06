const { chromium } = require("playwright");
const assert=require("node:assert/strict"), fs=require("fs"), path=require("path");
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
const out=process.env.SCREENSHOT_DIR||"qa-artifacts";fs.mkdirSync(out,{recursive:true});
const scenarios=[
 {quest:0,expect:3,formulas:["=B2*C2","=B3*C3","=B4*C4"],macroRows:3,extra:false},
 {quest:1,expect:4,formulas:["=B2*C2","=ROUND(B3*C3*1.10,2)","=B4*C4","=SUM(D2:D3)-D4"],macroRows:1,extra:false},
 {quest:2,expect:4,formulas:["=B2+C2","=B3-C3","=ROUND(B4/C4,1)","=SUM(D2:D3)+B4"],macroRows:1,extra:false},
 {quest:3,expect:4,formulas:["=B2*C2","=ROUND(B3*C3*(1-E3/100),2)","=B4*C4+E4","=SUM(D2:D4)"],macroRows:1,extra:true,policy:"protect"},
 {quest:4,expect:4,formulas:["=B2+C2","=ROUND((B3+C3)*(1+E3/100),2)","=B4-C4","=SUM(D2:D4)"],macroRows:1,extra:true,policy:"disclose"},
 {quest:5,expect:4,formulas:["=ROUND(B2*C2*(1+E2/100),2)","=B3*C3-E3","=ROUND(B4*C4*(1-E4/100),2)","=SUM(D2:D4)"],macroRows:1,extra:true}
];
async function run(){
 const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--no-sandbox","--disable-gpu-sandbox"]});
 try{
  for(const a of scenarios){
   const ctx=await browser.newContext({viewport:{width:1440,height:900}});
   const page=await ctx.newPage();
   page.setDefaultTimeout(18000);
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.addInitScript(q=>{
    const state={quest:q,coins:250,score:0,hp:100,maxHp:100,adsSeen:3,adsDismissed:1,
      inbox:[],spamDisposed:[],policies:{},upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:1}};
    localStorage.setItem("office-hours-game-state-v3",JSON.stringify(state));
    localStorage.setItem("office-hours-started-v3","yes");
   },a.quest);
   const r=await page.goto(base,{waitUntil:"domcontentloaded",timeout:40000});assert.equal(r.status(),200);
   await page.getByRole("button",{name:/RESUME SHIFT/}).click();
   await page.getByTestId("launcher-sheets").click();
   await page.getByTestId("excel-sheet").waitFor();
   const targets=page.locator('[data-testid^="total-"]');
   assert.equal(await targets.count(),a.expect,'wrong number of answer rows on quest '+a.quest);
   assert.equal(await page.getByTestId("sheet-ledger").count(),a.extra?1:0,'E ledger mismatch');
   if(a.extra){const ledger=await page.getByTestId("sheet-ledger").innerText();assert.match(ledger,/E3:/);}
   const macro=page.getByTestId("macro-fill-button");await macro.click();
   let counter=await page.getByTestId("verified-count").innerText();
   assert.match(counter,new RegExp("^"+a.macroRows+"\/"+a.expect+" VERIFIED"),"macro solved too much: "+counter);
   if(a.quest>0){
     assert.equal(await page.getByTestId("formula-operators").count(),1);
     const wrong=page.getByTestId("total-1");
     await wrong.fill("=B3*C3");
     await wrong.press("Enter");
     if(a.quest>0){
       counter=await page.getByTestId("verified-count").innerText();assert.match(counter,/1\/4 VERIFIED/,"wrong operation passed");
     }
   }
   for(let i=0;i<a.formulas.length;i++){
    const input=page.getByTestId("total-"+i);
    await input.fill(a.formulas[i]);
    await input.press("Enter");
   }
   counter=await page.getByTestId("verified-count").innerText();
   assert.match(counter,new RegExp("^"+a.expect+"\/"+a.expect+" VERIFIED"),"valid formulas failed on quest "+a.quest+": "+counter);

   if(a.quest>0){
     const bar=await page.locator(".sheet-ribbon").boundingBox();
     const namebar=await page.locator(".sheet-name").boundingBox();
     const area=await page.locator(".os-app-body").boundingBox();
     assert(bar&&namebar&&area,"Missing workbook geometry");
     assert(bar.y>=area.y-3&&bar.y+bar.height<=area.y+area.height,
       "Workbook ribbon clipped after editing row 5: "+JSON.stringify({bar,area}));
     assert(namebar.y>=bar.y+bar.height-4,
       "Formula bar obscures ribbon: "+JSON.stringify({bar,namebar}));
     console.log("WORKBOOK_LAYOUT_PASS",a.quest+1,JSON.stringify({ribbonY:bar.y,areaY:area.y}));
   }
   if(a.policy){
     await page.getByTestId("policy-decision").waitFor();
     await page.getByTestId("policy-choice-"+a.policy).click();
     await page.getByTestId("policy-confirmed").waitFor();
   }
   await page.screenshot({path:path.join(out,"report-"+(a.quest+1)+".png"),animations:"disabled"});
   await page.getByRole("button",{name:/FILE COMPLETED REPORT/}).click();
   await page.getByTestId("research-beat-"+(a.quest+1)).waitFor();
   if(errors.length)throw Error("Quest "+a.quest+" browser errors: "+errors.join(" | "));
   console.log("ADVANCED_WORKBOOK_PASS",a.quest+1,counter);
   await ctx.close();
  }
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1});
