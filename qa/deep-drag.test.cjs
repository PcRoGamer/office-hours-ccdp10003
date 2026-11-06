const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("fs");
const url=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
async function start(browser,quest,macro){
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.setDefaultTimeout(17000);
 await page.addInitScript(([q,m])=>{
  const state={quest:q,coins:250,score:0,hp:100,maxHp:100,adsSeen:3,adsDismissed:1,
   inbox:[],spamDisposed:[],policies:{},upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:m}};
  localStorage.setItem("office-hours-game-state-v3",JSON.stringify(state));
  localStorage.setItem("office-hours-started-v3","yes");
 },[quest,macro]);
 const r=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
 assert.equal(r.status(),200);
 await page.getByRole("button",{name:/RESUME SHIFT/}).click();
 await page.getByTestId("launcher-sheets").click();
 await page.getByTestId("excel-sheet").waitFor();
 return page;
}
async function dragBetween(page,startSel,endSel){
 const a=await page.locator(startSel).boundingBox(),b=await page.locator(endSel).boundingBox();
 assert(a&&b,"Missing drag geometry "+startSel+" to "+endSel);
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:24});
 await page.mouse.up();
}
async function run(){
 const browser=await chromium.launch({headless:true,...(fs.existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{}),args:["--enable-webgl","--no-sandbox","--disable-gpu-sandbox"]});
 try{
  let page=await start(browser,0,0);
  await dragBetween(page,'[data-testid="sheet-cell-B2"]','[data-testid="sheet-cell-C2"]');
  const formula=await page.getByTestId("sheet-formula-bar").inputValue();
  assert.equal(formula,"=B2*C2","Old B2/C2 tutorial drag lost its arithmetic: "+formula);
  assert.match(await page.getByTestId("verified-count").innerText(),/1\/3 VERIFIED/);
  await page.getByTestId("total-0").click();
  await dragBetween(page,'[data-testid="fill-handle-0"]','[data-testid="sheet-cell-D4"]');
  assert.match(await page.getByTestId("verified-count").innerText(),/3\/3 VERIFIED/,"Original D2→D4 fill-down broken");
  console.log("FIRST_REPORT_DRAG_RIGHT_AND_DOWN_PASS");
  await page.close();
  page=await start(browser,2,0);
  await dragBetween(page,'[data-testid="sheet-cell-B3"]','[data-testid="sheet-cell-C3"]');
  assert.equal(await page.getByTestId("sheet-formula-bar").inputValue(),"=B3","Advanced drag must insert a reference without choosing an operation");
  await page.getByTestId("formula-operators").getByRole("button",{name:"−"}).click();
  assert.equal(await page.getByTestId("sheet-formula-bar").inputValue(),"=B3-");
  await page.getByTestId("total-1").fill("=B3-C3");
  await page.getByTestId("total-1").press("Enter");
  assert.match(await page.getByTestId("verified-count").innerText(),/1\/4 VERIFIED/,"Subtract not verified");
  await page.getByTestId("total-0").fill("31");
  await page.getByTestId("total-0").press("Enter");
  assert.match(await page.getByTestId("verified-count").innerText(),/1\/4 VERIFIED/,"Numeric bypass permitted on advanced sheet");
  await page.getByTestId("total-0").fill("=B2+C2");
  await page.getByTestId("total-0").press("Enter");
  await page.getByTestId("total-0").click();
  await dragBetween(page,'[data-testid="fill-handle-0"]','[data-testid="sheet-cell-D4"]');
  const count=await page.getByTestId("verified-count").innerText();
  assert.match(count,/1\/4 VERIFIED/,"Advanced copying one formula must not solve other operations: "+count);
  await page.getByTestId("total-1").fill("=B3-C3");
  await page.getByTestId("total-1").press("Enter");
  await page.getByTestId("total-2").fill("=ROUND(B4/C4,1)");
  await page.getByTestId("total-2").press("Enter");
  await page.getByTestId("total-3").fill("=SUM(D2:D3)+B4");
  await page.getByTestId("total-3").press("Enter");
  assert.match(await page.getByTestId("verified-count").innerText(),/4\/4 VERIFIED/);
  console.log("ADVANCED_REFERENCE_DRAG_OPERATORS_NUMERIC_GUARD_PASS");
  await page.close();
 }finally{await browser.close()}
}
run().catch(e=>{console.error("DRAG_REGRESSION_FAIL",e.stack||e);process.exitCode=1});
