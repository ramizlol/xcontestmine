const express = require("express");
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();

chromium.use(stealth);
const app = express();

app.get("/flights", async (req, res) => {
  let browser;
  try {
    console.log("--- Launching Advanced Stealth ---");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    let capturedData = null;

    // Listen for the API
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("flights") && url.includes("84669")) {
        try {
          capturedData = await response.json();
          console.log("✅ DATA CAPTURED!");
        } catch (e) {}
      }
    });

    console.log("Navigating to XContest...");
    await page.goto("https://www.xcontest.org/world/en/pilots/detail:ramizntoma", {
      waitUntil: "load",
      timeout: 60000
    });

    // 1. Check if the Cloudflare Checkbox is there
    console.log("Checking for Cloudflare widget...");
    const cfFrame = page.frames().find(f => f.url().includes('cloudflare'));
    
    if (cfFrame) {
      console.log("Cloudflare detected. Attempting to solve...");
      // We wait for the checkbox to be visible and then click the center of it
      await page.waitForTimeout(3000); 
      // This clicks the general area where the Turnstile checkbox usually sits
      await page.click('body', { position: { x: 150, y: 150 } }).catch(() => {});
    }

    // 2. Human-like jitter
    await page.mouse.move(Math.random() * 100, Math.random() * 100);
    await page.mouse.wheel(0, 400);

    // 3. Wait for the data
    let attempts = 0;
    while (!capturedData && attempts < 40) {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Randomly jiggle the mouse every 2 seconds to look "alive"
      if (attempts % 4 === 0) await page.mouse.move(Math.random() * 500, Math.random() * 500);
      attempts++;
    }

    if (!capturedData) {
      console.log("❌ Failed to bypass checkbox.");
      return res.status(403).json({ error: "Cloudflare checkbox blocked access." });
    }

    res.json(capturedData);

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Active on ${PORT}`));
