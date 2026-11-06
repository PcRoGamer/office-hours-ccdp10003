const {chromium}=require("playwright");
const assert=require("node:assert/strict"),fs=require("fs");
fs.mkdirSync("qa-playful-screens",{recursive:true});
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
const operations=[
 ["*","*","*"],["*","+","-"],["+","-","/"],["*","-","+"],["+","-","/"],["*","+","-"]
];
const opNames={"+":"add","-":"subtract","*":"multiply","/":"divide"};
async function open(browser,quest,macro){
 const p=await browser.newPage({viewport:{width:1440,height:900}});
 p.setDefaultTimeout(15000);
 const errors=[];p.on("pageerror",e=>errors.push(e.message));
 await p.addInitScript(([q,m])=>{
  localStorage.setItem("office-hours-started-v3","yes");
  localStorage.setItem("office-hours-game-state-v3",JSON.stringify({
   quest:q,coins:250,hp:100,maxHp:100,score:0,adsSeen:3,adsDismissed:1,
   inbox:[],spamDisposed:[],policies:{},
   upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:m}
  }));
 },[quest,macro]);
 const r=await p.goto(base,{waitUntil:"domcontentloaded",timeout:45000});
 assert.equal(r.status(),200);
 await p.getByRole("button",{name:/RESUME SHIFT/}).click();
 await p.getByTestId("launcher-sheets").click();
 await p.getByTestId("excel-sheet").waitFor();
 await p.waitForTimeout(830);
 return {p,errors};
}
async function pick(p,row,op){
 await p.getByTestId("total-"+row).click();
 assert.match(await p.getByTestId("choose-row").innerText(),new RegExp("D"+(row+2)));
 await p.getByTestId("choose-op-"+opNames[op]).click();
}
async function drag(p,a,b){
 const x=await p.locator(a).boundingBox(),y=await p.locator(b).boundingBox();
 assert(x&&y);
 await p.mouse.move(x.x+x.width/2,x.y+x.height/2);
 await p.mouse.down();
 await p.mouse.move(y.x+y.width/2,y.y+y.height/2,{steps:22});
 await p.mouse.up();
}
async function main(){
 const browser=await chromium.launch({headless:true,...(fs.existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{}),args:["--enable-webgl","--no-sandbox","--disable-gpu-sandbox"]});
 try{
  for(let quest=0;quest<6;quest++){
   const {p,errors}=await open(browser,quest,1);
   if(quest===0){
    assert.equal(await p.getByTestId("choose-operation").count(),0,"Do not intrude on first tutorial");
    await p.getByTestId("macro-fill-button").click();
    assert.match(await p.getByTestId("verified-count").innerText(),/3\/3 VERIFIED/);
   }else{
    assert.equal(await p.getByTestId("choose-operation").count(),1,"Missing small operator picker");
    assert.equal(await p.locator(".operation-choice").count(),4,"Unexpected control clutter");
    await p.getByTestId("macro-fill-button").click();
    assert.match(await p.getByTestId("verified-count").innerText(),/1\/3 VERIFIED/,"Auto-Pilot must not finish an audit");
    await pick(p,1,"*");
    if(operations[quest][1]!=="*"){
     assert.match(await p.getByTestId("verified-count").innerText(),/1\/3 VERIFIED/,"Wrong operation accepted");
     assert.match(await p.getByTestId("choose-clue").innerText(),/Not quite/);
    }
    await pick(p,1,operations[quest][1]);
    await pick(p,2,operations[quest][2]);
    assert.match(await p.getByTestId("verified-count").innerText(),/3\/3 VERIFIED/,"Report not completed");
    const row=await p.locator(".sheet-choose").boundingBox();
    const area=await p.locator(".os-app-body").boundingBox();
    assert(row&&area&&row.y>=area.y-3&&row.y+row.height<area.y+area.height-4,"Operator controls clipped");
   }
   if(quest===3||quest===4){
    await p.getByTestId("policy-decision").waitFor();
    await p.getByTestId("policy-choice-"+(quest===3?"protect":"disclose")).click();
   }
   await p.screenshot({path:"qa-playful-screens/report-"+(quest+1)+".png",animations:"disabled",timeout:20000});
   assert.equal(errors.length,0,"Browser errors: "+errors.join(" | "));
   console.log("THREE_ROW_REPORT_PASS",quest+1);
   await p.close();
  }
  let {p,errors}=await open(browser,0,0);
  await drag(p,'[data-testid="sheet-cell-B2"]','[data-testid="sheet-cell-C2"]');
  await p.waitForFunction(()=>document.querySelector('[data-testid="sheet-formula-bar"]')?.value==="=B2*C2");
  await p.getByTestId("total-0").click();
  await drag(p,'[data-testid="fill-handle-0"]','[data-testid="sheet-cell-D4"]');
  await p.waitForFunction(()=>document.querySelector('[data-testid="verified-count"]')?.textContent?.includes("3/3"));
  console.log("ORIGINAL_TUTORIAL_DRAG_PASS");
  assert.equal(errors.length,0);
  await p.close();
  ({p,errors}=await open(browser,2,0));
  await drag(p,'[data-testid="sheet-cell-B3"]','[data-testid="sheet-cell-C3"]');
  assert.match(await p.getByTestId("choose-row").innerText(),/D3/,"Advanced drag should select row instead of answering it");
  assert.match(await p.getByTestId("verified-count").innerText(),/0\/3 VERIFIED/,"Advanced drag must not auto-answer");
  await pick(p,1,"-");
  await p.close();
 } finally {await browser.close()}
}
main().catch(e=>{console.error("PLAYFUL_QA_FAIL",e.stack||e);process.exitCode=1});
