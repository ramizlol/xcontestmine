const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/flights", async (req, res) => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage" // CRITICAL for Docker/Render
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    let capturedData = null;

    page.on("response", async (response) => {
      const url = response.url();
      // Only attempt to parse if it's the right URL and a successful status
      if (url.includes("/api/data/") && response.status() === 200) {
        try {
          capturedData = await response.json();
        } catch (e) {
          console.error("Failed to parse JSON from:", url);
        }
      }
    });

    // Added a longer timeout (60s) for slow initial loads
    await page.goto(
      "https://www.xcontest.org/world/en/pilots/detail:ramizntoma",
      { waitUntil: "networkidle", timeout: 60000 }
    );

    // XContest sometimes loads data dynamically after idle
    await page.waitForTimeout(5000); 

    res.json(capturedData || { error: "No data captured from API" });

  } catch (err) {
    console.error("Scraping error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Render usually defaults to port 10000 for Docker, 
// so process.env.PORT is important here!
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
