const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const root = process.env.TEST_BASE_URL || "http://127.0.0.1:4173/";
async function main(){
  const browser = await chromium.launch({headless:true,
    ...(require("node:fs").existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{}),
    args:["--no-sandbox","--disable-gpu-sandbox"]});
  try{
    const page = await browser.newPage({viewport:{width:1366,height:768}});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(root,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForURL(/\/2d\.html$/,{timeout:45000});
    await page.getByTestId("flat-clock-in").waitFor({timeout:30000});
    assert.equal(await page.locator("canvas").count(),0,"Default game should be fully 2D");
    assert.equal(errors.length,0,errors.join("\n"));
    const legacy = await browser.newPage();
    const response = await legacy.goto(root+"legacy-3d.html",{waitUntil:"domcontentloaded"});
    assert.equal(response.status(),200,"Legacy 3D fallback must remain available");
    await legacy.close();
    console.log("CANONICAL_2D_ENTRY_AND_ROLLBACK_PASS");
  }finally{await browser.close()}
}
main().catch(e=>{console.error("CANONICAL_2D_ENTRY_FAIL",e.stack||e);process.exitCode=1});
