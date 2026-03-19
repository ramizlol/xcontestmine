app.get("/flights", async (req, res) => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    let capturedData = null;

    // 1. Set up the listener BEFORE going to the page
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/data/")) { // Double-check this string in Chrome DevTools
        try {
          capturedData = await response.json();
          console.log("Successfully captured API data!");
        } catch (e) {
          console.log("Found API URL but couldn't parse JSON");
        }
      }
    });

    // 2. Go to the page
    await page.goto("https://www.xcontest.org/world/en/pilots/detail:ramizntoma", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // 3. Instead of a fixed timeout, wait for the data to actually exist
    // We'll check every 500ms for up to 15 seconds
    let attempts = 0;
    while (!capturedData && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!capturedData) {
      return res.status(404).json({ error: "Timed out waiting for API data" });
    }

    res.json(capturedData);

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});
