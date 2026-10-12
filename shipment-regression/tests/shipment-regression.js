import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const BASE_URL = process.env.APP_URL ?? 'http://localhost:5173';
const SHIPMENT_URL = `${BASE_URL}/#/shipment`;
const API_URL = `${BASE_URL}/api/shipments`;

const DATA_PATH = join(__dirname, 'shipment-test-data.json');
const RESULTS_PATH = join(PROJECT_ROOT, 'test-results.json');
const EVIDENCE_DIR = join(PROJECT_ROOT, 'docs', 'automation-run');

const SELECTOR = {
  tracking: '#tracking-number',
  weight: '#weight',
  distance: '#distance',
  submit: 'button[type="submit"]',
  result: '#result-status',
  history: '#request-history',
};

function loadScenarios() {
  const raw = readFileSync(DATA_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.scenarios) || parsed.scenarios.length === 0) {
    throw new Error('shipment-test-data.json tidak berisi skenario apa pun.');
  }
  return parsed.scenarios;
}

async function assertAppReachable() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    throw new Error(
      `Shipment App tidak terjangkau di ${BASE_URL} (${err.message}). ` +
        'Jalankan "npm run dev" di root repo sebelum memulai regression test.',
      { cause: err }
    );
  }
}

async function fillField(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.$eval(
    selector,
    (el, next) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(el, next);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
}

async function resetHistory() {
  await fetch(API_URL, { method: 'DELETE' });
}

async function readHistoryTrackingNumbers(page) {
  return page.$$eval(`${SELECTOR.history} [data-tracking]`, (nodes) =>
    nodes.map((n) => n.getAttribute('data-tracking'))
  );
}

async function runScenario(browser, scenario, evidenceDir) {
  const page = await browser.newPage();
  // Viewport desktop agar evidence screenshot mewakili tampilan operator asli.
  await page.setViewport({ width: 1440, height: 900 });
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('Failed to load resource')) return;
    consoleErrors.push(`console.error: ${text}`);
  });

  const record = {
    scenario: scenario.name,
    type: scenario.type,
    expected: scenario.expect.status,
    actual: 'NOT_RUN',
    status: 'FAIL',
    checks: [],
    evidence: [],
    consoleErrors: [],
  };

  try {
    // Tiap skenario mulai dari riwayat kosong supaya hasil deterministik
    // saat suite dijalankan berulang kali.
    await resetHistory();
    await page.goto(SHIPMENT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(SELECTOR.tracking, { visible: true });

    await fillField(page, SELECTOR.tracking, scenario.input.trackingNumber);
    await fillField(page, SELECTOR.weight, scenario.input.weight);
    await fillField(page, SELECTOR.distance, scenario.input.distance);

    const formShot = join(evidenceDir, `${scenario.id}-form.png`);
    await page.screenshot({ path: formShot, fullPage: true });
    record.evidence.push(formShot);

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/shipments') && res.request().method() === 'POST',
      { timeout: 10000 }
    );
    await page.click(SELECTOR.submit);
    const response = await responsePromise;

    // Hasil tampil sebagai banner #result-status ber-attribute data-status.
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && el.getAttribute('data-status');
      },
      { timeout: 10000 },
      SELECTOR.result
    );

    record.httpStatus = response.status();
    record.actual = await page.$eval(SELECTOR.result, (el) => el.getAttribute('data-status'));

    const resultShot = join(evidenceDir, `${scenario.id}-result.png`);
    await page.screenshot({ path: resultShot, fullPage: true });
    record.evidence.push(resultShot);

    record.checks.push({
      name: 'Expected vs actual status',
      pass: record.actual === record.expected,
      detail: `expected=${record.expected} actual=${record.actual}`,
    });

    const expectedHttp = scenario.expect.status === 'SUCCESS' ? 201 : 400;
    record.checks.push({
      name: 'Kode HTTP respons server',
      pass: record.httpStatus === expectedHttp,
      detail: `expected=${expectedHttp} actual=${record.httpStatus}`,
    });

    if (scenario.expect.status === 'SUCCESS') {
      const history = await readHistoryTrackingNumbers(page);
      record.checks.push({
        name: 'Tracking number masuk Request History',
        pass: history.includes(scenario.expect.historyContains),
        detail: `history=[${history.join(', ')}] mencari=${scenario.expect.historyContains}`,
      });
    }

    if (scenario.expect.status === 'VALIDATION_ERROR') {
      const errorSelector = `#${scenario.expect.errorField}-error`;
      const errorVisible = await page
        .waitForSelector(errorSelector, { visible: true, timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      record.checks.push({
        name: `Field error "${scenario.expect.errorField}" ditampilkan`,
        pass: errorVisible,
        detail: errorVisible ? `${errorSelector} terlihat` : `${errorSelector} tidak ditemukan`,
      });

      const history = await readHistoryTrackingNumbers(page);
      record.checks.push({
        name: 'Shipment ditolak, tidak masuk history',
        pass: history.length === 0,
        detail: `history=[${history.join(', ')}]`,
      });
    }

    record.consoleErrors = consoleErrors;
    record.checks.push({
      name: 'Tanpa error JavaScript di browser',
      pass: consoleErrors.length === 0,
      detail: consoleErrors.length === 0 ? 'bersih' : consoleErrors.join(' | '),
    });

    record.status = record.checks.every((c) => c.pass) ? 'PASS' : 'FAIL';
  } catch (err) {
    record.status = 'FAIL';
    record.error = err.message;
    record.consoleErrors = consoleErrors;
    // Screenshot bukti kondisi gagal, asal halaman masih bisa dirender.
    try {
      const failShot = join(evidenceDir, `${scenario.id}-failure.png`);
      await page.screenshot({ path: failShot, fullPage: true });
      record.evidence.push(failShot);
    } catch {
      // Halaman mungkin sudah tidak valid; lewati tanpa menutupi error asli.
    }
  } finally {
    await page.close();
  }

  return record;
}

async function main() {
  const scenarios = loadScenarios();
  await assertAppReachable();
  mkdirSync(EVIDENCE_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const results = [];

  try {
    for (const scenario of scenarios) {
      console.log(`Testing: ${scenario.name}`);
      console.log(`Expected: ${scenario.expect.status}`);

      const record = await runScenario(browser, scenario, EVIDENCE_DIR);
      results.push(record);
      console.log(`Actual: ${record.actual}`);
      console.log(`Status: ${record.status}`);
      if (record.error) console.log(`Error: ${record.error}`);
      console.log('');
    }
  } finally {
    await browser.close();
  }

  writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`, 'utf8');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.length - passed;
  console.log('----------------------------------------');
  console.log(`Total: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  console.log(`Report: ${RESULTS_PATH}`);
  console.log(`Evidence: ${EVIDENCE_DIR}`);

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`Regression suite gagal dijalankan: ${err.message}`);
  process.exitCode = 1;
});
