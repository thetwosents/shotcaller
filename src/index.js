
// Puppeteer
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];

// Sitemap tools
const Crawler = require("crawler");
const SitemapStreams = require('sitemap-stream-parser');
import Sitemapper from 'sitemapper';
const SitemapGenerator = require('sitemap-generator'); // https://www.npmjs.com/package/sitemap-generator

// Utilities
const Async = require('async');
const path = require('path');

// Express
const express = require('express')
const app = express()

// Init globals
let browser;
let page;

(async () => {
	
	browser = await puppeteer.launch({
  	ignoreHTTPSErrors: true
  });

  page = await browser.newPage();

})();

app.post('/generateSitemap', (req,res) => {

	let arr = {
		sites: [],
		stats: ''
	};

	const generator = SitemapGenerator('http://www.ffplaw.com', {
	  stripQuerystring: false,
	  crawlerMaxDepth: 2
	});

	generator.on('add', (url) => {
		console.log('URL added', url);
		arr.sites.push(url);
	});

	generator.on('done', (stats) => {
		arr.stats = stats;
		createScreenshots(arr.sites);
	  res.send(arr);
	});

	generator.on('ignore', (url) => {
		console.log('ignored',url)
	});

	generator.start();

});

// app.post('/useSitemap', (req,res) => {

// 	let baseUrl = 'http://www.corner103.com';

// 	let arr = [];

// 	SitemapStreams.parseSitemaps('http://www.corner103.com/index.cfm?method=pages.searchEngineSiteMap', (url) => { arr.push(url)}, (err,sitemaps) => {
// 		res.send(arr);
// 	});
// });

// app.post('/getBySitemap', (req,res) => {
  
//   const Site = new Sitemapper({
// 	  url: 'http://www.corner103.com/index.cfm?method=pages.searchEngineSiteMap',
// 	  timeout: 15000, // 15 seconds
// 	});

// 	Site.fetch()
// 	  .then(data => {
// 	  		Async.eachOfSeries(data.sites, makeScreenshot, (err,results) => {
// 	  			console.log(err);
// 	  			console.log(results);
// 	  			browser.close();
// 	  			res.send(results);
// 	  		});

// 	  })
// 	  .catch(error => {
// 	  	console.log(error);
// 	  	res.send(error);
// 	  });
// })

app.post('/', function (req, res) {
  res.send('Got a POST request')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

function createScreenshots(arr) {
	console.log('Current job ' + arr.length + ' screenshots to be created');
	
	Async.eachOfSeries(arr, makeScreenshot, (err,results) => {
			console.log(err);
			console.log('Created screenshots',results);
	});
} 

async function makeScreenshot(url) {
	var index;
	console.log(path.extname(url));
	if (path.extname(url) === '.pdf') {

	} else {
		var c = new Crawler({
	    maxConnections : 10,
	    // This will be called for each crawled page 
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
	  await page.emulate(iPhone);
		await page.goto(url, {waitUntil: 'networkidle'});
		await page.screenshot({
	  	path: 'screenshots/' + index + '.png',
	  	fullPage: true
	  });
	}
}