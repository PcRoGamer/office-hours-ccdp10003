#!/usr/bin/env node
'use strict';
// Independent, read-only first-shift browser smoke audit.
// No LLM calls, no changes to gameplay, no scores/grades/complete-E2E claims.
// Requires: npm package playwright + installed Chromium (or Google Chrome on Linux).
// Run: FIRST_SHIFT_URL=http://127.0.0.1:4173/first-shift.html node qa/first-shift-independent.audit.cjs
// Run against public deployment: FIRST_SHIFT_URL=https://example.com/first-shift.html node qa/first-shift-independent.audit.cjs
// Optional: QA_OUTPUT_DIR=qa-artifacts/independent FIRST_SHIFT_PROBE_START=1
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const url = process.env.FIRST_SHIFT_URL || process.argv.find(a => /^https?:\/\//.test(a)) ||
  'http://127.0.0.1:4173/first-shift.html';
const out = path.resolve(process.env.QA_OUTPUT_DIR || 'qa-artifacts/first-shift-independent');
const screenshots = [
  { w: 1440, h: 900, dpr: 1 },
  { w: 1366, h: 768, dpr: 1 },
  { w: 1024, h: 600, dpr: 1 },
  { w: 650, h: 800, dpr: 1 },
  { w: 1440, h: 900, dpr: 2 }
];

async function main() {
  fs.mkdirSync(out, { recursive: true });
  const report = {
    auditedAt: new Date().toISOString(),
    url,
    scope: 'EXTERNAL BROWSER SMOKE, NOT FULL GAMEPLAY OR RUBRIC PASS',
    viewports: [],
    status: 'incomplete',
    limitations: [
      'Does not assert gameplay completion, fun, correct physics, all eight microgames, score mathematics or actual Canvas submission.',
      'Screenshots require human visual inspection; the script only verifies they were captured.'
    ]
  };
  let browser;
  const fail = (where, msg) => {
    const entry = report.viewports.find(v => v.name === where);
    if (entry) entry.failures.push(msg);
    else report.failures = [...(report.failures || []), msg];
  };
  try {
    const options = { headless: true, args: ['--no-sandbox'] };
    if (fs.existsSync('/usr/bin/google-chrome')) options.executablePath = '/usr/bin/google-chrome';
    else if (process.platform === 'win32') {
      const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      const edge64 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
      if (fs.existsSync(edge)) options.executablePath = edge;
      else if (fs.existsSync(edge64)) options.executablePath = edge64;
    }
    browser = await chromium.launch(options);
    for (const { w, h, dpr } of screenshots) {
      const name = w + 'x' + h + '-dpr' + dpr;
      const sample = {
        name, pageStatus: null, title: null, canvas: [], screenshots: [],
        failures: [], warnings: [], errors: [], requestsFailed: [], httpErrors: [],
        qaSnapshot: null, startupResult: 'not-probed'
      };
      report.viewports.push(sample);
      let context;
      try {
        context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
        const page = await context.newPage();
        page.on('pageerror', error => sample.errors.push('pageerror: ' + error.message));
        page.on('crash', () => sample.errors.push('page crashed'));
        page.on('console', message => {
          if (message.type() !== 'error') return;
          const source = message.location()?.url || '';
          // Browser's implicit favicon lookup is not a game asset. Report real resource errors.
          if (/\/favicon\.ico(?:\?|$)/i.test(source) &&
              /Failed to load resource:.*404/i.test(message.text())) {
            sample.warnings.push('Nonessential browser favicon missing: ' + source);
            return;
          }
          sample.errors.push('console: ' + message.text().slice(0, 450) +
            (source ? ' [' + source + ']' : ''));
        });
        page.on('requestfailed', req => {
          sample.requestsFailed.push(req.url() + ': ' + (req.failure()?.errorText || 'failed'));
        });
        page.on('response', response => {
          if (response.status() >= 400) sample.httpErrors.push(response.status() + ': ' + response.url());
        });
        let response;
        try {
          response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
          fail(name, 'Could not open URL: ' + e.message);
          continue;
        }
        sample.pageStatus = response && response.status();
        if (sample.pageStatus !== 200) fail(name, 'HTTP status: ' + sample.pageStatus);
        await page.waitForTimeout(750);
        sample.title = await page.title();
        const state = await page.evaluate(() => {
          const vis = el => {
            const r = el.getBoundingClientRect();
            const css = getComputedStyle(el);
            return { x: r.x, y: r.y, w: r.width, h: r.height,
              visible: r.width > 2 && r.height > 2 && css.display !== 'none' &&
                css.visibility !== 'hidden' };
          };
          return {
            canvases: Array.from(document.querySelectorAll('canvas')).map(c => ({
              id: c.id, width: c.width, height: c.height, rect: vis(c)
            })),
            scrollOverflow: { x: document.documentElement.scrollWidth - innerWidth,
              y: document.documentElement.scrollHeight - innerHeight },
            bodyText: (document.body?.innerText || '').slice(0, 450),
            optionalQA: typeof window.__firstShiftQA?.snapshot === 'function'
              ? window.__firstShiftQA.snapshot() : null
          };
        });
        sample.canvas = state.canvases;
        sample.scrollOverflow = state.scrollOverflow;
        sample.qaSnapshot = state.optionalQA;
        sample.visibleTextExcerpt = state.bodyText;
        if (!state.canvases.some(c => c.rect.visible)) fail(name, 'No visible Canvas2D game canvas found');
        if (state.scrollOverflow.x > 20) sample.warnings.push('Horizontal overflow ' + state.scrollOverflow.x + 'px');
        if (/startup error|uncaught exception|failed to start/i.test(state.bodyText)) {
          fail(name, 'Visible startup error detected');
        }
        const shot = 'initial-' + name + '.png';
        await page.screenshot({ path: path.join(out, shot), fullPage: false });
        sample.screenshots.push(shot);
        // Explicit opt-in: only check start interaction on a disposable browser page.
        if (name === '1440x900-dpr1' && process.env.FIRST_SHIFT_PROBE_START === '1') {
          const candidates = page.locator(
            'button, [role="button"], a, input[type="button"], input[type="submit"]'
          );
          let clicked = false;
          const count = Math.min(await candidates.count(), 60);
          for (let n = 0; n < count; n++) {
            const el = candidates.nth(n);
            const label = ((await el.innerText().catch(() => '')) +
              ' ' + (await el.getAttribute('aria-label').catch(() => ''))).trim();
            if (/^(clock in|start|start shift|play|begin|enter shift|new game)$/i.test(label)) {
              await el.click({ timeout: 3500 });
              clicked = true;
              break;
            }
          }
          if (clicked) {
            await page.waitForTimeout(600);
            const f = 'after-start-' + name + '.png';
            await page.screenshot({ path: path.join(out, f), fullPage: false });
            sample.screenshots.push(f);
            sample.startupResult = 'clicked one visible start control (no gameplay completeness implied)';
          } else {
            sample.startupResult = 'No DOM-labelled start control; canvas-drawn start requires targeted pointer coordinates';
            sample.warnings.push(sample.startupResult);
          }
        }
        if (sample.errors.length) fail(name, 'Browser console/page errors: ' + sample.errors.length);
        if (sample.httpErrors.length) fail(name, 'HTTP asset errors: ' + sample.httpErrors.length);
        if (sample.requestsFailed.length) fail(name, 'Network requests failed: ' + sample.requestsFailed.length);
      } catch (e) {
        fail(name, 'Unexpected audit error: ' + String(e.stack || e).slice(0, 1100));
      } finally {
        if (context) await context.close().catch(() => {});
      }
    }
  } catch (e) {
    report.failures = [...(report.failures || []), 'Browser setup failure: ' + String(e.stack || e)];
  } finally {
    if (browser) await browser.close().catch(() => {});
    const totalFailures = (report.failures || []).length +
      report.viewports.reduce((n, v) => n + v.failures.length, 0);
    report.status = totalFailures ? 'BLOCKED' : 'SMOKE_PASS_ONLY';
    report.failureCount = totalFailures;
    fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
    const summary = {
      status: report.status, url: report.url,
      views: report.viewports.map(v => ({ size: v.name, status: v.pageStatus,
        screenshots: v.screenshots.length, failures: v.failures,
        pageErrors: v.errors.slice(0, 5), requestsFailed: v.requestsFailed.slice(0, 5) })),
      output: path.join(out, 'audit.json')
    };
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = totalFailures ? 1 : 0;
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
