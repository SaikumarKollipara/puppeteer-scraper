import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.status(200).send('Welcome to puppeteer scraper!');
});
app.get('/original-image', getOriginalImageFromBing);

app.listen(PORT, () => `Server listening on port: ${PORT}`);

// Create a global variable to hold the browser instance
let browser;

// Initialize the browser instance once when the server starts
(async () => {
  browser = await puppeteer.launch({
    args: [
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--single-process',
      '--no-zygote',
    ],
    headless: true,
    executablePath:
      process.env.NODE_ENV === 'production'
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
})();

export async function getOriginalImageFromBing(req, res) {
  const BASE_URL = 'https://www.bing.com';
  const { url } = req.query;
  let page;
  try {
    page = await browser.newPage();
    console.log('new page opened');
    // await page.goto(BASE_URL + url, { waitUntil: 'load' });
    await page.goto(BASE_URL + url);
    console.log('got the page');
    await page.waitForSelector('.imgContainer img.nofocus', { timeout: 5000 });
    const imgSrc = await page.$eval(
      '.imgContainer img.nofocus',
      (img) => img.src
    );
    console.log('image selected');
    res.status(200).json({ success: true, imgSrc });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Web scraper error' });
  } finally {
    if (page) {
      await page.close();
    }
  }
}
