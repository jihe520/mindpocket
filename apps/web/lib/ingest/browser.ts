const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar"

export async function fetchWithBrowser(url: string): Promise<string | null> {
  let browser: import("puppeteer-core").Browser | null = null

  try {
    const puppeteer = await import("puppeteer-core")
    const localPath = process.env.CHROMIUM_EXECUTABLE_PATH

    if (localPath) {
      browser = await puppeteer.launch({
        executablePath: localPath,
        headless: true,
      })
    } else {
      const chromium = (await import("@sparticuz/chromium-min")).default
      chromium.setGraphicsMode = false
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
        headless: "shell",
      })
    }

    const page = await browser.newPage()

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    )

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 })

    const html = await page.content()
    return html || null
  } catch (error) {
    console.error("[browser] Failed to fetch with browser:", error)
    return null
  } finally {
    await browser?.close()
  }
}
