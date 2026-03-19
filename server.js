const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/flights", async (req, res) => {
  let browser;
  try {
    console.log("Starting fresh session...");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    let capturedData = null;

    // This listener catches the NEW key and data automatically
    page.on("response", async (response) => {
      const url = response.url();
      // We look for the data call which contains the dynamic key
      if (url.includes("/api/data/") && url.includes("filter[pilot]=84669")) {
        try {
          capturedData = await response.json();
          console.log("Captured data using fresh session key!");
        } catch (e) {
          console.log("Detected API call but failed to parse JSON.");
        }
      }
    });

    // Visit the pilot page (this triggers the generation of the key)
    await page.goto("https://www.xcontest.org/world/en/pilots/detail:ramizntoma", {
      waitUntil: "networkidle", // Wait for all background API calls to finish
      timeout: 60000
    });

    // Short buffer to ensure the listener finished parsing
    if (!capturedData) {
      await page.waitForTimeout(5000);
    }

    if (!capturedData) {
      return res.status(404).json({ error: "Could not capture API data. Site might be blocking the bot." });
    }

    // Success! Return the fresh data
    res.json(capturedData);

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Scraper active on port ${PORT}`));
