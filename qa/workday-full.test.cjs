const { chromium }=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
fs.mkdirSync("qa-workday-screens",{recursive:true});
async function main(){
 const browser=await chromium.launch({headless:true,...(fs.existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{}),args:["--no-sandbox","--disable-gpu-sandbox"]});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(20000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const res=await page.goto(base+"workday.html",{waitUntil:"domcontentloaded",timeout:50000});
  assert.equal(res.status(),200);
  await page.getByTestId("flat-clock-in").click();
  await page.locator(".ow-toast").waitFor();
  assert.equal(await page.locator("canvas").count(),0,"2D release must not mount a WebGL canvas");
  assert.equal(await page.getByTestId("window-mail").count(),0,"Postbox should not be mounted");
  assert.match(await page.locator(".ow-toast").innerText(),/ACCOUNTING/);
  assert.equal(await page.locator(".ow-toast a[href^='https://']").count(),1,"Why-now research link missing from opening");
  await page.screenshot({path:"qa-workday-screens/01-notification.png",animations:"disabled",timeout:30000});
  for(let quest=0;quest<6;quest++){
   const ads=page.getByRole("button",{name:"Close advertisement"});
   for(let k=0;k<4&&await ads.count();k++)await ads.first().click({force:true});
   await page.locator(".ow-toast [data-ow=open]").click();
   if(quest===0){
    await page.getByTestId("excel-sheet").waitFor();
    for(let row=0;row<3;row++){
     const c=page.getByTestId("total-"+row);
     await c.fill("=B"+(row+2)+"*C"+(row+2));await c.press("Enter");
    }
    await page.getByRole("button",{name:/FILE COMPLETED REPORT/}).click();
   } else if(quest===1||quest===3){
    await page.locator(".ow-window[data-ow-app=word]").waitFor();
    const selections=quest===1?[["wellbeing","truth"],["delay","truth"]]:[["licences","protect"],["risk","truth"]];
    for(const [field,value] of selections){
     await page.locator('[data-ow=choose][data-field="'+field+'"][data-value="'+value+'"]').click();
    }
    await page.screenshot({path:"qa-workday-screens/0"+(quest+1)+"-writer.png",animations:"disabled",timeout:30000});
    await page.locator(".ow-window [data-ow=submit]").click();
   } else if(quest===2){
    await page.locator(".ow-window[data-ow-app=people]").waitFor();
    await page.locator("[data-ow=candidate][data-id=B]").click();
    await page.locator("[data-ow=choose][data-field=reference][data-value=verify]").click();
    await page.locator("[data-ow=choose][data-field=privacy][data-value=secure]").click();
    await page.screenshot({path:"qa-workday-screens/03-applicants.png",animations:"disabled",timeout:30000});
    await page.locator(".ow-window [data-ow=submit]").click();
   } else if(quest===4){
    await page.locator(".ow-window[data-ow-app=slides]").waitFor();
    for(const field of ["claim","proof","conclusion"]){
     await page.locator('[data-ow=slide-answer][data-field="'+field+'"][data-value=truth]').click();
    }
    assert.equal(await page.locator("[data-ow=move-slide]").count(),6,"Deck must support actual slide reordering");
    await page.locator('[data-ow=move-slide][data-dir="-1"]').nth(1).click();
    await page.locator("[data-ow=choose][data-field=policy][data-value=disclose]").click();
    await page.screenshot({path:"qa-workday-screens/05-slides.png",animations:"disabled",timeout:30000});
    await page.locator(".ow-window [data-ow=submit]").click();
   } else {
    await page.locator(".ow-window[data-ow-app=archive]").waitFor();
    for(const id of ["finance","staff","campaign"])await page.locator('[data-ow=attachment][data-id="'+id+'"]').click();
    await page.screenshot({path:"qa-workday-screens/06-board-pack.png",animations:"disabled",timeout:30000});
    await page.locator(".ow-window [data-ow=submit]").click();
   }
   await page.getByTestId("research-beat-"+(quest+1)).waitFor({timeout:15000});
   console.log("OFFICE_TASK_PASS",quest+1);
   if(quest===2||quest===5){
    await page.getByRole("button",{name:/FACE THE BOSS/}).click();
    await page.locator(".battle-panel").waitFor();
    const turns=await page.evaluate(async()=>{
     let n=0;
     while(document.querySelector(".battle-panel")&&n<40){
      let b=[...document.querySelectorAll(".battle-panel button")].find(x=>x.textContent.includes("ATTACK")&&!x.disabled);
      if(!b)b=[...document.querySelectorAll(".battle-panel button")].find(x=>x.textContent.includes("CALL THE TEAM")&&!x.disabled);
      if(!b)break;
      b.click();n++;await new Promise(r=>setTimeout(r,105));
     }
     return n;
    });
    assert.equal(await page.locator(".battle-panel").count(),0,"Boss encounter did not end");
    console.log("OFFICE_BOSS_PASS",quest+1,turns);
    if(quest===2){
     await page.getByRole("button",{name:/BACK TO WORK/}).click();
     await page.locator("[data-dc=open]").waitFor();
     await page.locator("[data-dc=open]").click();
     await page.locator("[data-dc=accessible]").click();
     await page.locator("[data-dc=staff]").click();
    }
   } else await page.getByRole("button",{name:/NEXT ASSIGNMENT/}).click();
  }
  await page.locator(".final-report").waitFor();
  const a=await page.getByTestId("director-numeric").innerText();
  await page.locator("[data-dc=toggle-people]").click();
  const b=await page.getByTestId("director-numeric").innerText();
  assert.notEqual(a,b,"Final performance score must react to decisions");
  const state=await page.evaluate(()=>({game:JSON.parse(localStorage.getItem("office-hours-game-state-v3")),work:JSON.parse(localStorage.getItem("office-hours-workday-v1"))}));
  assert.equal(state.game.quest,6);assert.equal(state.game.won,true);
  assert.equal(Object.keys(state.work.complete).length,5);
  assert.deepEqual(errors,[],"Browser JS errors");
  await page.locator("[data-dc=seal]").click();
  console.log("WORKDAY_FULL_CAMPAIGN_PASS",JSON.stringify({reports:6,completedApps:Object.keys(state.work.complete).length,bosses:2,errorCount:errors.length}));
 }finally{await browser.close()}
}
main().catch(e=>{console.error("WORKDAY_QA_FAILED",e.stack||e);process.exitCode=1});