
// Puppeteer
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];
const iPad = devices['iPad Mini'];

// Sitemap tools
const Crawler = require("crawler");
const SitemapStreams = require('sitemap-stream-parser');
const Sitemapper = require('sitemapper');
const SitemapGenerator = require('sitemap-generator'); // https://www.npmjs.com/package/sitemap-generator

// Utilities
const Async = require('async');
const path = require('path');
const fs = require('fs');
const sanitize = require("sanitize-filename");

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
let screenshotParams;

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
  let screenshots = req.body.screenshots || false;
  
  screenshotParams = req.body.screenshots;

  dir = sanitize(projName);

  if (!fs.existsSync('screenshots/' + dir)){
    fs.mkdirSync('screenshots/' + dir);
  } else {

  }  

  let arr = {
    sites: [],
    stats: ''
  };

  const generator = SitemapGenerator(url, {
    stripQuerystring: false,
    crawlerMaxDepth: depth
  });

  generator.on('add', (url) => {
    console.log('URL added', url);
    arr.sites.push(url);
  });

  generator.on('done', (stats) => {
    arr.stats = stats;
    arr.sites.sort();
    if (screenshots) {
      createScreenshots(arr.sites);
    }
    res.send(arr);
  });

  generator.on('ignore', (url) => {
    console.log('ignored',url)
  });

  generator.start();
});

function createScreenshots(arr) {
  console.log('Current job ' + arr.length + ' screenshots to be created');
  
  Async.eachOfSeries(arr, makeScreenshot, (err,results) => {
    console.log(err);
    console.log('Created ' + arr.length + ' screenshots');
  });
} 

async function makeScreenshot(url) {
  let index;
  if (path.extname(url) === '.pdf') {

  } else {
    var c = new Crawler({
      maxConnections : 10,
      callback : function (error, res, done) {
        if(error){
          console.log(error);
        }else{
          var $ = res.$;
          index = $("title").text();
        }
        done();
      }
    });
    c.queue(url);

    await page.goto(url, {waitUntil: 'networkidle'});
    
    if(screenshotParams.includes('desktop')) {
	    if (!fs.existsSync('screenshots/' + dir + '/' + 'desktop')) {
	    	fs.mkdirSync('screenshots/' + dir + '/' + 'desktop');	
	    }
	    
	    await page.setViewport({
	      width: 1440,
	      height:700
	    });

	    await page.screenshot({
	      path: 'screenshots/' + dir + '/desktop/' + sanitize(index) +'.jpeg',
	      type: 'jpeg',
	      quality: 75,
	      fullPage: true
	    });
	}
	
	if(screenshotParams.includes('mobile')) {
	    if (!fs.existsSync('screenshots/' + dir + '/' + 'mobile')) {
	    	fs.mkdirSync('screenshots/' + dir + '/' + 'mobile');	
	    }
	    
	    await page.emulate(iPhone);
	    await page.screenshot({
	      path: 'screenshots/' + dir + '/mobile/' + sanitize(index) +'.jpeg',
	      type: 'jpeg',
	      quality: 75,
	      fullPage: true
	    });
	}
	
	if(screenshotParams.includes('tablet')) {
	    if (!fs.existsSync('screenshots/' + dir + '/' + 'tablet')) {
	    	fs.mkdirSync('screenshots/' + dir + '/' + 'tablet');	
	    }
	    
	    await page.emulate(iPad);
	    await page.screenshot({
	      path: 'screenshots/' + dir + '/tablet/' + sanitize(index) +'.jpeg',
	      type: 'jpeg',
	      quality: 75,
	      fullPage: true
	    });
	}
	
  }
}

app.post('/', function (req, res) {
  res.send('Got a POST request')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
