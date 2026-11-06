const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs");
fs.mkdirSync("qa-artifacts",{recursive:true});
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
async function run(){
 const browser=await chromium.launch({headless:true,...(fs.existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{}),args:["--enable-webgl","--no-sandbox","--disable-gpu-sandbox"]});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(16000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>{
    localStorage.setItem("office-hours-started-v3","yes");
    localStorage.removeItem("office-hours-director-v1");
    localStorage.setItem("office-hours-game-state-v3",JSON.stringify({
      quest:0,coins:250,hp:100,maxHp:100,score:0,adsSeen:0,adsDismissed:0,
      inbox:[],spamDisposed:[],policies:{},gameOver:false,won:false,
      upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:1}
    }));
  });
  let res=await page.goto(base+"director.html",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(res.status(),200);
  await page.getByRole("button",{name:/RESUME SHIFT/}).click();
  await page.getByTestId("window-mail").waitFor({timeout:15000});
  let midSeen=0;
  for(let q=0;q<6;q++){
    let ad=page.getByRole("button",{name:"Close advertisement"});
    for(let tries=0;tries<4;tries++)if(await ad.count())await ad.first().click();
    await page.getByTestId("launcher-sheets").click();
    await page.getByTestId("excel-sheet").waitFor();
    await page.getByTestId("macro-fill-button").click();
    assert.match(await page.getByTestId("verified-count").innerText(),/3\/3 VERIFIED/,"Workbook "+(q+1)+" does not complete");
    if(q===3)await page.getByTestId("policy-choice-protect").click();
    if(q===4)await page.getByTestId("policy-choice-disclose").click();
    await page.getByRole("button",{name:/FILE COMPLETED REPORT/}).click();
    await page.getByTestId("research-beat-"+(q+1)).waitFor();
    console.log("REPORT_PASS",q+1);
    if(q===2||q===5){
      await page.getByRole("button",{name:/FACE THE BOSS/}).click();
      await page.locator(".battle-panel").waitFor();
      if(q===5&&await page.getByTestId("team-intervention").count())await page.getByTestId("team-intervention").click();
      let turns=0;
      while(await page.locator(".battle-panel").count()&&turns++<28){
        const st=await page.evaluate(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")||"{}"));
        const heal=page.getByRole("button",{name:/PATCH/});
        if(st.hp<65&&st.coins>=20&&await heal.count()&&!await heal.isDisabled())await heal.click();
        else await page.getByRole("button",{name:/ATTACK/}).click();
      }
      assert.equal(await page.locator(".battle-panel").count(),0,"Boss "+(q+1)+" stalled");
      console.log("BOSS_PASS",q+1,turns);
      if(q===2){
        await page.getByRole("button",{name:/BACK TO WORK/}).click();
        await page.locator(".dc-incoming").waitFor({timeout:20000});
        await page.screenshot({path:"qa-artifacts/full-01-midpoint.png",animations:"disabled"});
        await page.locator("[data-dc=open]").click();
        await page.locator(".dc-track").waitFor();
        await page.locator("[data-dc=accessible]").click();
        await page.locator("[data-dc=staff]").click();
        await page.waitForFunction(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")||"{}").directorEvidence==="staff");
        midSeen++;
        console.log("EVIDENCE_INSERTION_PASS");
      }
    } else await page.getByRole("button",{name:/NEXT ASSIGNMENT/}).click();
  }
  assert.equal(midSeen,1,"Midpoint chapter should occur exactly once");
  await page.locator(".dc-eval-grade").waitFor({timeout:20000});
  await page.locator("[data-dc=toggle-people]").click();
  const focus=page.locator("[data-dc=toggle-focus]");
  const baseline=await page.evaluate(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")||"{}"));
  const interruptions=(baseline.adsSeen||0)+(baseline.adsDismissed||0)+(baseline.adClicked||0);
  if(await focus.isEnabled())await focus.click();
  else assert.equal(interruptions,0,"Attention controls should be disabled only when no interruptions happened");
  await page.screenshot({path:"qa-artifacts/full-02-calibration.png",animations:"disabled"});
  await page.locator("[data-dc=seal]").click();
  await page.locator(".dc-signature").waitFor();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")));
  assert.equal(state.won,true);
  assert.equal(state.quest,6);
  assert.equal(state.directorEvidence,"staff");
  assert.equal(errors.length,0,"JS errors: "+errors.join("|"));
  console.log("DIRECTOR_FULL_SIX_REPORT_SHIFT_PASS",JSON.stringify({reports:state.quest,won:state.won,evidence:state.directorEvidence,team:state.teamTrust,kpi:state.kpiPressure,jsErrors:errors.length}));
 }finally{await browser.close()}
}
run().catch(e=>{console.error("DIRECTOR_FULL_SHIFT_FAIL",e.stack||e);process.exitCode=1});