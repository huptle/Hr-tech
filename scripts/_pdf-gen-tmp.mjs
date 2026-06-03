
import puppeteer from 'puppeteer';
import { pathToFileURL } from 'url';
const url = pathToFileURL("C:\\Users\\aaryan.gupta\\Downloads\\Hr-tech\\Hr-tech\\docs\\HUPTLE_APPLICATION_GUIDE.html").href;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction(() => document.querySelectorAll('.mermaid svg').length >= 8, { timeout: 90000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));
await page.pdf({
  path: "C:\\Users\\aaryan.gupta\\Downloads\\Hr-tech\\Hr-tech\\docs\\HUPTLE_APPLICATION_GUIDE.pdf",
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
});
await browser.close();
console.log('PDF:', "C:\\Users\\aaryan.gupta\\Downloads\\Hr-tech\\Hr-tech\\docs\\HUPTLE_APPLICATION_GUIDE.pdf");
