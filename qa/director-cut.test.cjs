const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
fs.mkdirSync("qa-artifacts",{recursive:true});
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:4173/";
const browserArgs={headless:true,args:["--no-sandbox","--disable-gpu-sandbox","--enable-webgl"],...(fs.existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{})};
const saved=(quest,won=false)=>({quest,hp:100,maxHp:100,coins:250,score:1350,xp:500,adsSeen:2,adClicked:1,adsDismissed:1,teamTrust:50,kpiPressure:0,policies:{3:"protect",4:"disclose"},upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:1},inbox:[],spamDisposed:[],gameOver:false,won,combat:null});
async function setup(browser,gameState,viewport={width:1440,height:900}){
 const page=await browser.newPage({viewport});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(g=>{localStorage.setItem("office-hours-started-v3","yes");localStorage.setItem("office-hours-game-state-v3",JSON.stringify(g));localStorage.removeItem("office-hours-director-v1")},gameState);
 const r=await page.goto(base+"director.html",{waitUntil:"domcontentloaded",timeout:45000});assert.equal(r.status(),200);
 const resume=page.getByRole("button",{name:/RESUME SHIFT/});
 if(await resume.count())await resume.click();
 await page.locator("#oh-director-root").waitFor({timeout:30000});
 return {page,errors};
}
async function main(){
 const browser=await chromium.launch(browserArgs);
 try{
  const mid=await setup(browser,saved(3));
  const page=mid.page;
  await page.locator(".dc-incoming").waitFor({timeout:20000});
  await page.screenshot({path:"qa-artifacts/01-incoming.png",animations:"disabled"});
  await page.locator("[data-dc=open]").click();
  await page.locator(".dc-track").waitFor();
  await page.screenshot({path:"qa-artifacts/02-evidence-game.png",animations:"disabled"});
  const packet=page.locator(".dc-packet"),track=page.locator(".dc-track"),traps=page.locator(".dc-trap");
  const pb=await packet.boundingBox(),tb=await track.boundingBox(),p1=await traps.nth(0).boundingBox(),p2=await traps.nth(1).boundingBox();
  assert(pb&&tb&&p1&&p2,"Visible evidence course not rendered");
  const cy=pb.y+pb.height/2,xx=pb.x+pb.width/2,ybot=tb.y+tb.height-pb.height/2-6,ytop=tb.y+pb.height/2+4;
  const midlane=((p1.x+p1.width+pb.width/2)+(p2.x-pb.width/2))/2;
  await page.mouse.move(xx,cy);await page.mouse.down();
  for(const [x,y] of [[p1.x-pb.width/2-15,ybot],[midlane,ybot],[midlane,ytop],[p2.x+p2.width+pb.width/2+15,ytop],[tb.x+tb.width-65,tb.y+tb.height/2]])await page.mouse.move(x,y,{steps:13});
  await page.mouse.up();
  await page.locator("[data-dc=staff]").waitFor({timeout:5000});
  await page.screenshot({path:"qa-artifacts/03-evidence-choice.png",animations:"disabled"});
  await page.locator("[data-dc=staff]").click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")||"{}").directorEvidence==="staff");
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("office-hours-game-state-v3")));
  assert.equal(state.teamTrust,62,"The story action must change actual game mechanics");
  assert.equal(state.kpiPressure,4,"The story action must have a real cost");
  assert.equal(mid.errors.length,0,mid.errors.join(" | "));
  console.log("MIDPOINT_MOUSE_PRECISION_AND_CONSEQUENCES_PASS");
  await page.close();
  const finish=await setup(browser,saved(6,true));
  const end=finish.page;
  await end.locator(".dc-eval-grade").waitFor({timeout:20000});
  await end.screenshot({path:"qa-artifacts/04-performance-engine.png",animations:"disabled"});
  const a=await end.locator(".dc-eval-grade").innerText();
  await end.locator("[data-dc=toggle-people]").click();
  const b=await end.locator(".dc-eval-grade").innerText();
  await end.locator("[data-dc=toggle-focus]").click();
  const c=await end.locator(".dc-eval-grade").innerText();
  assert.notEqual(a,b,"Changing evaluation criteria must change the grade");
  assert.notEqual(b,c,"The focus metric must alter the score");
  await end.screenshot({path:"qa-artifacts/05-new-rules.png",animations:"disabled"});
  await end.locator("[data-dc=seal]").click();
  await end.locator(".dc-signature").waitFor();
  await end.screenshot({path:"qa-artifacts/06-policy-signed.png",animations:"disabled"});
  assert.equal(finish.errors.length,0,finish.errors.join(" | "));
  console.log("FINAL_RULE_RECALIBRATION_PASS",a,b,c);
  await end.close();
 }finally{await browser.close()}
}
main().catch(e=>{console.error("DIRECTOR_CUT_E2E_FAIL",e.stack||e);process.exitCode=1});