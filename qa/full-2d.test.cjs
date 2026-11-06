const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
fs.mkdirSync("qa-2d-screens", { recursive: true });
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4173/";

async function run() {
  const browser = await chromium.launch({ headless: true,
    ...(fs.existsSync("/usr/bin/google-chrome") ? { executablePath: "/usr/bin/google-chrome" } : {}),
    args: ["--no-sandbox", "--disable-gpu-sandbox"] });
  try {
    for (const width of [1440, 1024, 650]) {
      const p = await browser.newPage({ viewport: { width, height: width === 650 ? 820 : 900 } });
      const errors = [];
      p.on("pageerror", e => errors.push(e.message));
      const response = await p.goto(base + "2d.html", { waitUntil: "domcontentloaded", timeout: 45000 });
      assert.equal(response.status(), 200);
      await p.getByTestId("flat-clock-in").waitFor();
      assert.equal(await p.locator("canvas").count(), 0, "Title should mount no WebGL/3D canvas");
      await p.screenshot({ path: `qa-2d-screens/title-${width}.png`, animations: "disabled" });
      assert.deepEqual(errors, [], "Title has no JS errors");
      await p.close();
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(20000);
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "2d.html", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByTestId("flat-clock-in").click();
    await page.getByTestId("launcher-sheets").waitFor();
    assert.equal(await page.locator("canvas").count(), 0, "3D canvas mounted after clock-in");
    await page.screenshot({ path: "qa-2d-screens/desktop.png", animations: "disabled" });

    for (let q = 0; q < 6; q++) {
      const ads = page.getByRole("button", { name: "Close advertisement" });
      for (let n = 0; n < 4 && await ads.count(); n++) await ads.first().click();
      await page.getByTestId("launcher-sheets").click();
      await page.getByTestId("excel-sheet").waitFor();
      for (let row = 0; row < 3; row++) {
        const op = [2, 4].includes(q) ? "+" : "*";
        const cell = page.getByTestId("total-" + row);
        await cell.fill(`=B${row + 2}${op}C${row + 2}`);
        await cell.press("Enter");
      }
      assert.match(await page.getByTestId("verified-count").innerText(), /3\/3 VERIFIED/);
      if (q === 0) await page.screenshot({ path: "qa-2d-screens/report-1.png", animations: "disabled" });
      if (q === 3 || q === 4) {
        await page.getByTestId("policy-decision").waitFor();
        await page.getByTestId("policy-choice-" + (q === 3 ? "protect" : "disclose")).click();
      }
      await page.getByRole("button", { name: /FILE COMPLETED REPORT/ }).click();
      await page.getByTestId("research-beat-" + (q + 1)).waitFor();

      if (q === 2 || q === 5) {
        await page.getByRole("button", { name: /FACE THE BOSS/ }).click();
        await page.locator(".battle-panel").waitFor();
        let turns = 0;
        while (await page.locator(".battle-panel").count() && turns++ < 25) {
          if (q === 5 && await page.getByTestId("team-intervention").count())
            await page.getByTestId("team-intervention").click();
          else await page.getByRole("button", { name: /ATTACK/ }).click();
        }
        assert.equal(await page.locator(".battle-panel").count(), 0, "Boss stalled after report " + (q + 1));
        if (q === 2) {
          await page.getByRole("button", { name: /BACK TO WORK/ }).click();
          await page.locator('[data-dc="open"]').waitFor();
          await page.locator('[data-dc="open"]').click();
          await page.locator('[data-dc="accessible"]').click();
          await page.screenshot({ path: "qa-2d-screens/evidence.png", animations: "disabled" });
          await page.locator('[data-dc="staff"]').click();
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("office-hours-game-state-v3")).directorEvidence), "staff");
        }
      } else await page.getByRole("button", { name: /NEXT ASSIGNMENT/ }).click();
    }
    await page.locator(".final-report").waitFor();
    await page.locator('[data-dc="toggle-people"]').waitFor();
    const before = await page.getByTestId("director-numeric").innerText();
    await page.locator('[data-dc="toggle-people"]').click();
    const after = await page.getByTestId("director-numeric").innerText();
    assert.notEqual(before, after, "The scoring policy must meaningfully change the evaluation");
    await page.screenshot({ path: "qa-2d-screens/ending.png", animations: "disabled" });
    assert.equal(await page.locator("canvas").count(), 0, "A 3D canvas mounted during campaign");
    assert.equal(errors.length, 0, "JS errors: " + errors.join(" | "));
    console.log("FULL_2D_CAMPAIGN_PASS", { reports: 6, bosses: 2, evaluation: [before, after], errors: 0 });
    await page.close();
  } finally { await browser.close(); }
}
run().catch(e => { console.error("FULL_2D_CAMPAIGN_FAIL", e.stack || e); process.exitCode = 1; });
