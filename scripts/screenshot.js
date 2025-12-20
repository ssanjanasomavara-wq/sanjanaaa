const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async ()=>{
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width:1200, height:800, deviceScaleFactor:2});

  const fileUrl = 'file://' + path.resolve(__dirname, '../mockups/presentation.html');
  await page.goto(fileUrl, {waitUntil:'networkidle0'});

  // ensure output dir
  const outDir = path.resolve(__dirname, '../mockups/screens');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});

  // full page screenshot
  const fullPath = path.join(outDir, 'presentation-full@2x.png');
  await page.screenshot({path: fullPath, fullPage:true});
  console.log('Saved', fullPath);

  // capture each frame
  const frames = await page.$$('.frame');
  for (let i=0;i<frames.length;i++){
    const el = frames[i];
    const bbox = await el.boundingBox();
    const clip = { x: Math.round(bbox.x), y: Math.round(bbox.y), width: Math.round(bbox.width), height: Math.round(bbox.height) };
    const p = path.join(outDir, `frame-${i+1}@2x.png`);
    await page.screenshot({path:p, clip});
    console.log('Saved', p);
  }

  await browser.close();
})();