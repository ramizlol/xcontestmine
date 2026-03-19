const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/flights", async (req, res) => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    let capturedData = null;

    page.on("response", async (response) => {
      const url = response.url();

      if (url.includes("/api/data/")) {
        try {
          capturedData = await response.json();
        } catch {}
      }
    });

    await page.goto(
      "https://www.xcontest.org/world/en/pilots/detail:ramizntoma",
      { waitUntil: "networkidle" }
    );

    await page.waitForTimeout(8000);

    res.json(capturedData || { error: "No data captured" });

  } catch (err) {
    res.status(500).json({ error: err.message });

  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port", PORT));
