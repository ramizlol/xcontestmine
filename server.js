const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/flights", async (req, res) => {
  let browser;
  try {
    console.log("Starting scraper session...");
    
    // Launching with extra flags to save RAM on Render's 512MB/1GB plans
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process" 
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    let capturedData = null;

    // Listener to catch the background API call (gets the fresh session key automatically)
    page.on("response", async (response) => {
      const url = response.url();
      // Look for the specific XContest data API
      if (url.includes("/api/data/") && url.includes("filter[pilot]=84669")) {
        try {
          const data = await response.json();
          capturedData = data;
          console.log("✅ API Data Captured!");
        } catch (e) {
          console.log("⚠️ Found API URL but failed to parse JSON.");
        }
      }
    });

    // Navigate to the pilot page
    // Using 'domcontentloaded' to avoid 60s timeouts caused by tracking scripts
    console.log("Navigating to XContest...");
    await page.goto("https://www.xcontest.org/world/en/pilots/detail:ramizntoma", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Trigger a small scroll to ensure lazy-loaded data fires
    await page.mouse.wheel(0, 500);

    // Wait loop: Check every 500ms if data has been captured (max 15 seconds)
    let attempts = 0;
    while (!capturedData && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!capturedData) {
      console.log("❌ Failed to capture data within time limit.");
      return res.status(404).json({ error: "Timed out waiting for XContest API data" });
    }

    // Return the clean JSON data
    res.json(capturedData);

  } catch (err) {
    console.error("Scraper Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
    }
  }
});

// Use Render's default port 10000
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Scraper service running on port ${PORT}`);
});
