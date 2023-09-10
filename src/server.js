import express from 'express';
import puppeteer from 'puppeteer';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 5001;

app.get('/original-image', getOriginalImageFromBing);

app.listen(PORT, () => `Server listening on port: ${PORT}`);

export async function getOriginalImageFromBing(req, res, next) {
  try {
    const BASE_URL = 'https://www.bing.com';
    const { url } = req.query;
    const browser = await puppeteer.launch({
      args: [
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--single-process',
        '--no-zygote',
      ],
      headless: 'new',
      executablePath:
        process.env.NODE_ENV === 'production'
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
    await page.goto(BASE_URL + url);
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
    next(err);
  }
}
