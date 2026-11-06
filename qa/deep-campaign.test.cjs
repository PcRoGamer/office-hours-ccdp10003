const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("fs");fs.mkdirSync("qa-artifacts",{recursive:true});
const forms=[
 ["=B2*C2","=B3*C3","=B4*C4"],
 ["=B2*C2","=ROUND(B3*C3*1.10,2)","=B4*C4","=SUM(D2:D3)-D4"],
 ["=B2+C2","=B3-C3","=ROUND(B4/C4,1)","=SUM(D2:D3)+B4"],
 ["=B2*C2","=ROUND(B3*C3*(1-E3/100),2)","=B4*C4+E4","=SUM(D2:D4)"],
 ["=B2+C2","=ROUND((B3+C3)*(1+E3/100),2)","=B4-C4","=SUM(D2:D4)"],
 ["=ROUND(B2*C2*(1+E2/100),2)","=B3*C3-E3","=ROUND(B4*C4*(1-E4/100),2)","=SUM(D2:D4)"]
];
async function play(){
 const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--no-sandbox","--disable-gpu-sandbox"]});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(16000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const res=await page.goto(process.env.TEST_BASE_URL||"http://127.0.0.1:4173/",{waitUntil:"domcontentloaded",timeout:40000});assert.equal(res.status(),200);
  await page.getByRole("button",{name:/CLOCK IN.*START SHIFT/}).click();
  await page.getByTestId("window-mail").waitFor();
  for(let q=0;q<6;q++){
    for(let i=0;i<3;i++)if(await page.getByRole("button",{name:"Close advertisement"}).count())await page.getByRole("button",{name:"Close advertisement"}).first().click();
    await page.getByTestId("launcher-sheets").click();
    await page.getByTestId("excel-sheet").waitFor();
    for(let i=0;i<forms[q].length;i++){
      const input=page.getByTestId("total-"+i);
      await input.fill(forms[q][i]);await input.press("Enter");
    }
    assert.match(await page.getByTestId("verified-count").innerText(),new RegExp(forms[q].length+"\/"+forms[q].length+" VERIFIED"),"Report "+(q+1)+" was not verified");
    if(q===3)await page.getByTestId("policy-choice-protect").click();
    if(q===4)await page.getByTestId("policy-choice-disclose").click();
  // State is captured by the per-report visual QA; do not stall the journey on GPU screenshot synchronization.
    await page.getByRole("button",{name:/FILE COMPLETED REPORT/}).click();
    await page.getByTestId("research-beat-"+(q+1)).waitFor();
    console.log("CAMPAIGN_REPORT_PASS",q+1);
    if(q===2||q===5){
      await page.getByRole("button",{name:/FACE THE BOSS/}).click();
      await page.locator(".battle-panel").waitFor();
      if(q===5&&await page.getByTestId("team-intervention").count())await page.getByTestId("team-intervention").click();
      let turns=0;
      while(await page.locator(".battle-panel").count()&&turns++<26){
        const health=await page.evaluate(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")||"{}").hp);
        const heal=page.getByRole("button",{name:/PATCH/});
        if(health<65&&await heal.count()&&!await heal.isDisabled())await heal.click();
        else await page.getByRole("button",{name:/ATTACK/}).click();
      }
      assert.equal(await page.locator(".battle-panel").count(),0,"Boss could not be defeated at report "+(q+1));
      console.log("CAMPAIGN_BOSS_PASS",q+1,turns);
      if(q===2)await page.getByRole("button",{name:/BACK TO WORK/}).click();
    }else await page.getByRole("button",{name:/NEXT ASSIGNMENT/}).click();
  }
  await page.locator(".final-report").waitFor();
  assert.match(await page.locator(".final-report").innerText(),/SHIFT SURVIVED/);
  assert.equal(errors.length,0,errors.join("\n"));
  // State is captured by the per-report visual QA; do not stall the journey on GPU screenshot synchronization.
  console.log("FULL_CAMPAIGN_ADVANCED_PASS",forms.length,"reports, 2 bosses");
 }finally{await browser.close()}
}
play().catch(e=>{console.error("FULL_CAMPAIGN_FAILED",e.stack||e);process.exitCode=1});
