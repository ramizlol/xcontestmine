const express = require("express");
// We switch from 'playwright' to 'playwright-extra'
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();

// Apply the stealth plugin
chromium.use(stealth);

const app = express();

app.get("/flights", async (req, res) => {
  let browser;
  try {
    console.log("--- Launching Stealth Browser ---");
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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();
    let capturedData = null;

    // Listener for the API call
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

    // Give the page 5 seconds to solve the Cloudflare challenge
    await page.waitForTimeout(5000);

    // Scroll down to look like a human reading the page
    await page.mouse.wheel(0, 600);
    
    // Wait for the data variable to fill up
    let attempts = 0;
    while (!capturedData && attempts < 40) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!capturedData) {
      console.log("❌ Still blocked or timed out.");
      return res.status(403).json({ error: "Could not bypass Cloudflare. Try again." });
    }

    res.json(capturedData);

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Stealth Scraper on ${PORT}`));
