const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("fs");
const root=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
async function main(){
 const browser=await chromium.launch({headless:true,...(fs.existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{}),args:["--enable-webgl","--no-sandbox","--disable-gpu-sandbox"]});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.setItem("office-hours-game-state-v3",JSON.stringify({sentinel:"production-preserved"}));
   localStorage.setItem("office-hours-playful-preview-started-v1","yes");
   localStorage.setItem("office-hours-playful-preview-state-v1",JSON.stringify({
    quest:2,hp:100,maxHp:100,coins:200,score:0,adsSeen:3,adsDismissed:1,
    inbox:[],spamDisposed:[],policies:{},upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:1}
   }));
  });
  const response=await page.goto(root+"preview-playful.html",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response.status(),200);
  await page.getByRole("button",{name:/RESUME SHIFT/}).click();
  await page.getByTestId("launcher-sheets").click();
  await page.getByTestId("excel-sheet").waitFor();
  await page.getByTestId("macro-fill-button").click();
  assert.match(await page.getByTestId("verified-count").innerText(),/1\/3 VERIFIED/);
  await page.getByTestId("total-1").click();
  await page.getByTestId("choose-op-subtract").click();
  await page.getByTestId("total-2").click();
  await page.getByTestId("choose-op-divide").click();
  assert.match(await page.getByTestId("verified-count").innerText(),/3\/3 VERIFIED/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")).sentinel),"production-preserved");
  assert.equal(errors.length,0,errors.join("\n"));
  console.log("PREVIEW_ISOLATED_AND_PLAYABLE_PASS");
 }finally{await browser.close()}
}
main().catch(e=>{console.error("PREVIEW_SMOKE_FAIL",e.stack||e);process.exitCode=1});
