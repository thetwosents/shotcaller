
// Puppeteer
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];
const iPad = devices['iPad Mini'];

// Sitemap tools
const SitemapStreams = require('sitemap-stream-parser');
const Sitemapper = require('sitemapper');
const SitemapGenerator = require('sitemap-generator'); // https://www.npmjs.com/package/sitemap-generator

// Utilities
const Async = require('async');
const path = require('path');
const url = require('url');
const fs = require('fs');
const sanitize = require("sanitize-filename");
const chalk = require('chalk');
const log = console.log;

// Express
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
app.use(bodyParser.json())

// Init globals
let browser;
let page;
let projName;
let dir;
let screenshots;

(async () => {
  
  browser = await puppeteer.launch({
    ignoreHTTPSErrors: true
  });

  page = await browser.newPage();

})();

app.post('/generateSitemap', (req,res) => {

  projName = req.body.name;
  let depth = parseInt(req.body.depth) || 2;
  let url = req.body.url;
  screenshots = req.body.screenshots || [];
  
  dir = sanitize(projName);

  if (!fs.existsSync('screenshots/' + dir)){
    fs.mkdirSync('screenshots/' + dir);
  } else {

  }  

  let arr = {
    urls: [],
    stats: ''
  };

  const generator = SitemapGenerator(url, {
    stripQuerystring: false,
    crawlerMaxDepth: depth
  });

  generator.on('add', (url) => {
    log(chalk.green('URL added'), url);
    arr.urls.push(url);
  });

  generator.on('done', (stats) => {
    arr.stats = stats;
    arr.urls.sort();
    if (screenshots.length > 0) {
      createScreenshots(arr.urls);
    }
    log(chalk.green('Processed ' + arr.urls.length + ' urls'));
    res.send(arr);
  });

  generator.on('ignore', (url) => {
    log(chalk.yellow('Ignored'),url)
  });

  generator.start();
});

function createScreenshots(arr) {
  log(chalk.blue('Current job ') + arr.length + ' screenshots to be created');
  
  Async.eachOfSeries(arr, makeScreenshot, (err,results) => {
    log(err);
    log(chalk.green('Created ' + arr.length + ' screenshots'));
  });
} 


app.post('/singleScreenshot', (req,res) => {
  projName = req.body.name;
  let depth = parseInt(req.body.depth) || 2;
  let url = req.body.url;
  screenshots = req.body.screenshots || [""];
  
  dir = sanitize(projName);

  if (!fs.existsSync('screenshots/' + dir)){
    fs.mkdirSync('screenshots/' + dir);
  } else {

  }  

  log(chalk.yellow('Queued url: ') + url);

  (async() => {
    try {
      await makeScreenshot(url);
      log(chalk.green('Finished url: ') + url);
      res.send('Finished');
    } catch(e) {
      log(e);
      res.send(e);
    }
  })();

});

async function makeScreenshot(url) {
  let fileName;
  if (path.extname(url) === '.pdf') {

  } else {

    await page.goto(url, {waitUntil: 'networkidle'});
    await page._client.send('Animation.setPlaybackRate', { playbackRate: 12 });
    await page.title().then((title) => {
      fileName = sanitize(title);
    });

    if(screenshots.includes('desktop')) {
  	    if (!fs.existsSync(`screenshots/${dir}/desktop`)) {
  	    	fs.mkdirSync(`screenshots/${dir}/desktop`);	
  	    }
  	    
  	    await page.setViewport({
  	      width: 1440,
  	      height:700
  	    });
  	    await page.screenshot({
  	      path: `screenshots/${dir}/desktop/${fileName}.jpeg`,
  	      type: 'jpeg',
  	      quality: 75,
  	      fullPage: true
  	    });
  	}
	
  	if(screenshots.includes('mobile')) {
  	    if (!fs.existsSync(`screenshots/${dir}/mobile`)) {
  	    	fs.mkdirSync(`screenshots/${dir}/mobile`);	
  	    }
  	    
  	    await page.emulate(iPhone);
  	    await page.screenshot({
  	      path: `screenshots/${dir}/mobile/${fileName}.jpeg`,
  	      type: 'jpeg',
  	      quality: 75,
  	      fullPage: true
  	    });
  	}
  	
  	if(screenshots.includes('tablet')) {
  	    if (!fs.existsSync(`screenshots/${dir}/tablet`)) {
  	    	fs.mkdirSync(`screenshots/${dir}/tablet`);	
  	    }
  	    
  	    await page.emulate(iPad);
  	    await page.screenshot({
  	      path: `screenshots/${dir}/tablet/${fileName}.jpeg`,
  	      type: 'jpeg',
  	      quality: 75,
  	      fullPage: true
  	    });
  	}

    log(`Screenshot ${fileName} was created successfully`);
	
  }
}

app.post('/', function (req, res) {
  res.send('Got a POST request')
})

app.listen(3000, function () {
  log('Anddddddddddd go!')
})
