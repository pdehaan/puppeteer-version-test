import assert from "node:assert/strict";
import path from "node:path";

import axios from "axios";
import puppeteer from "puppeteer";
import uaParser from "ua-parser-js";

// Fetch live mozilla/cookie-banner-rules-list "cookie-banner-rules-list.json" from GitHub.
let { data: domains } = await axios.get("https://raw.githubusercontent.com/mozilla/cookie-banner-rules-list/main/cookie-banner-rules-list.json");
domains = domains.data.map(({ domain }) => String(domain)).sort();

const browser = await puppeteer.launch({
  headless: false,
  product: 'firefox',
  extraPrefsFirefox: {},
  // Make browser logs visible
  // dumpio: true,
});

// Make sure we're running Firefox.
const uaString = await browser.userAgent();
const ua = new uaParser(uaString).getResult();
const browserOs = `${ua.browser.name} v${ua.browser.version} (${ua.os.name} ${ua.os.version})`;
console.log(browserOs);
assert.equal(ua.browser.name, "Firefox", `Unexpected browser name: "${ua.browser.name}"`);

for (const domain of domains) {
  const page = await browser.newPage();
  console.log(`Checking ${domain}`);
  try {
    // Guess at protocol, and let Puppeteer handle redirects.
    await page.goto(`http://${domain}`, { waitUntil: 'load' });
    // HACK: Pause an arbitrary amount of time
    await pause(1_500);
    await page.screenshot({
      path: path.join("screenshots", `${domain}.png`)
    });
  } catch (err) {
    const msg = `${domain}; ${err.message}; ${page.url()}`;
    console.error(`  ${msg}`);
  }
  await page.close();
}

await browser.close();

async function pause(ms = 1_000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
