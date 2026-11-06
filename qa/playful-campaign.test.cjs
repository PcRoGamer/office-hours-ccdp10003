const {chromium}=require("playwright");
const assert=require("node:assert/strict"),fs=require("fs");
const url=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
const operations=[
 ["*","*","*"],["*","+","-"],["+","-","/"],["*","-","+"],["+","-","/"],["*","+","-"]
],opNames={"+":"add","-":"subtract","*":"multiply","/":"divide"};
async function run(){
 const browser=await chromium.launch({headless:true,...(fs.existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{}),args:["--enable-webgl","--no-sandbox","--disable-gpu-sandbox"]});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(18000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  let res=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(res.status(),200);
  await page.getByRole("button",{name:/CLOCK IN.*START SHIFT/}).click();
  await page.getByTestId("window-mail").waitFor();
  for(let q=0;q<6;q++){
   const ad=page.getByRole("button",{name:"Close advertisement"});
   for(let tries=0;tries<3;tries++)if(await ad.count())await ad.first().click();
   await page.getByTestId("launcher-sheets").click();
   await page.getByTestId("excel-sheet").waitFor();
   if(q===0){
    for(let row=0;row<3;row++){
     await page.getByTestId("total-"+row).fill("=B"+(row+2)+"*C"+(row+2));
     await page.getByTestId("total-"+row).press("Enter");
    }
   }else{
    for(let row=0;row<3;row++){
     await page.getByTestId("total-"+row).click();
     await page.getByTestId("choose-op-"+opNames[operations[q][row]]).click();
    }
   }
   assert.match(await page.getByTestId("verified-count").innerText(),/3\/3 VERIFIED/,"Workbook report "+(q+1)+" failed");
   if(q===3)await page.getByTestId("policy-choice-protect").click();
   if(q===4)await page.getByTestId("policy-choice-disclose").click();
   await page.getByRole("button",{name:/FILE COMPLETED REPORT/}).click();
   await page.getByTestId("research-beat-"+(q+1)).waitFor();
   console.log("SHIFT_REPORT_PASS",q+1);
   if(q===2||q===5){
    await page.getByRole("button",{name:/FACE THE BOSS/}).click();
    await page.locator(".battle-panel").waitFor();
    if(q===5&&await page.getByTestId("team-intervention").count())await page.getByTestId("team-intervention").click();
    let turns=0;
    while(await page.locator(".battle-panel").count()&&turns++<25){
      const st=await page.evaluate(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")||"{}"));
      const heal=page.getByRole("button",{name:/PATCH/});
      if(st.hp<65&&st.coins>=20&&await heal.count()&&!await heal.isDisabled())await heal.click();
      else await page.getByRole("button",{name:/ATTACK/}).click();
    }
    assert.equal(await page.locator(".battle-panel").count(),0,"Could not defeat boss after report "+(q+1));
    console.log("SHIFT_BOSS_PASS",q+1,turns);
    if(q===2)await page.getByRole("button",{name:/BACK TO WORK/}).click();
   }else await page.getByRole("button",{name:/NEXT ASSIGNMENT/}).click();
  }
  await page.locator(".final-report").waitFor();
  assert.match(await page.locator(".final-report").innerText(),/SHIFT SURVIVED/);
  assert.equal(errors.length,0,"Browser errors: "+errors.join(" | "));
  console.log("FULL_PLAYFUL_CAMPAIGN_PASS",6,"reports",2,"bosses",0,"browser errors");
 }finally{await browser.close()}
}
run().catch(e=>{console.error("FULL_PLAYFUL_CAMPAIGN_FAIL",e.stack||e);process.exitCode=1});
