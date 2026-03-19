const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/flights", async (req, res) => {
  let browser;
  try {
    console.log("--- New Request Started ---");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process"]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    let capturedData = null;

    // DIAGNOSTIC LISTENER: Logs every background request to Render console
    page.on("response", async (response) => {
      const url = response.url();
      
      // Log every API-like call to see what XContest is actually doing
      if (url.includes("api")) {
        console.log(`Detected API call: ${url.substring(0, 60)}...`);
      }

      // Updated matching logic: Look for 'flights' and the pilot ID
      if (url.includes("flights") && url.includes("84669")) {
        try {
          capturedData = await response.json();
          console.log("✅ DATA MATCHED AND CAPTURED!");
        } catch (e) {
          console.log("⚠️ Found match but JSON parse failed.");
        }
      }
    });

    console.log("Navigating...");
    await page.goto("https://www.xcontest.org/world/en/pilots/detail:ramizntoma", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Interaction: Sometimes the API only fires if you scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000); 

    let attempts = 0;
    while (!capturedData && attempts < 40) { // Increased to 20 seconds total
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!capturedData) {
      console.log("❌ Timeout: The expected API URL never appeared.");
      return res.status(404).json({ error: "Timed out waiting for XContest API data" });
    }

    res.json(capturedData);

  } catch (err) {
    console.error("Critical Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      console.log("Closing browser.");
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
