import express from 'express';
import puppeteer from 'puppeteer';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.status(200).send('Welcome to puppeteer scraper!');
});
app.get('/original-image', getOriginalImageFromBing);

app.listen(PORT, () => `Server listening on port: ${PORT}`);

export async function getOriginalImageFromBing(req, res, next) {
  const BASE_URL = 'https://www.bing.com';
  const { url } = req.query;
  const browser = await puppeteer.launch({
    args: [
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--single-process',
      '--no-zygote',
    ],
    // headless: 'new',
    executablePath:
      process.env.NODE_ENV === 'production'
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const page = await browser.newPage();
    console.log(browser, page);
    await page.goto(BASE_URL + url);
    console.log('Got the page');
    await page.waitForSelector('.imgContainer img.nofocus');
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 2500);
      });
    });

    const imgSrc = await page.$eval(
      '.imgContainer img.nofocus',
      (img) => img.src
    );
    //Image url to b64
    const response = await axios.get(imgSrc, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data, 'binary');
    const base64 = imageBuffer.toString('base64');
    res
      .status(200)
      .json({ success: true, image: `data:image/png;base64,${base64}` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Web scraper error' });
  } finally {
    await browser.close();
  }
}
