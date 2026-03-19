const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/flights", async (req, res) => {
  let browser;
  try {
    console.log("Launching browser...");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage", // Fixes "out of memory" on Render
        "--disable-gpu"
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    let capturedData = null;

    // Listen for the background API response
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/data/")) {
        try {
          capturedData = await response.json();
          console.log("Successfully captured API data!");
        } catch (e) {
          console.log("Found API URL but couldn't parse JSON");
        }
      }
    });

    console.log("Navigating to XContest...");
    await page.goto("https://www.xcontest.org/world/en/pilots/detail:ramizntoma", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Wait loop for the data to arrive
    let attempts = 0;
    while (!capturedData && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!capturedData) {
      console.log("Failed to capture data within 15 seconds.");
      return res.status(404).json({ error: "Timed out waiting for API data" });
    }

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

// IMPORTANT: This starts the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Scraper service listening on port ${PORT}`);
});
