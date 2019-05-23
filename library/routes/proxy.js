/**
* Route that handles proxies.
*/
const imageProxy = require('../ImageProxy.js');
const config = require('../config');
const proxyConfig = config.readConfigSync('proxy.yaml');
const url = require('url');

module.exports = async (req, res, callback = null) => {
	const parsedUrl = url.parse(req.url);
	if(!parsedUrl.query) {
		res.setHeader('Content-Type', 'text/plain');
		res.writeHead(404);
		return res.end('Query not found', callback);
	}

	const urlSubject = parsedUrl.query;
	const parsedUrlSubject = url.parse(urlSubject);
	if(
		!parsedUrlSubject ||
		!parsedUrlSubject.hostname ||
		!parsedUrlSubject.protocol ||
		!parsedUrlSubject.path
	) {
		res.setHeader('Content-Type', 'text/plain');
		res.writeHead(400);
		return res.end('Bad Image URL. Must contain Hostname, protocol, and path.\n\nValid example: https://example.com/i/picture.png', callback);
	}

	if(proxyConfig.redirectOnDirectAccess) {
		const refererHeader = req.headers['referer'] || null;
		if(refererHeader) {
			const refererHeaderParsed = url.parse(refererHeader);
			if(
				!refererHeaderParsed ||
				!refererHeaderParsed.hostname ||
				!proxyConfig.refererHostnames.includes(refererHeaderParsed.hostname)
			) {
				res.setHeader('Content-Type', 'text/plain');
				res.writeHead(400);
				return res.end('Bad referer header', callback);
			}
		}
		else {
			res.setHeader('Location', urlSubject);
			res.writeHead(303);
			return res.end(callback);
		}
	}

	// imageProxy.scrape will pipe streams. So if it returns with the message
	// 'okay', we don't need to do anything.
	const scrapedImage = await imageProxy.scrape(urlSubject);
	switch (scrapedImage.message) {
		case 'bad-status': {
			res.setHeader('Content-Type', 'text/plain');
			res.setHeader('X-Status', scrapedImage.status);
			res.writeHead(403);

			const statusMember = Math.round(scrapedImage.status / 100);
			if(statusMember == 3) {
				return res.end('Image URL sent back a 3xx error (Redirction)\n\nWe were unable to process it', callback);
			}
			else if(statusMember == 4) {
				return res.end('Image URL sent back a 4xx error. (Authorization errors)', callback);
			}
			else if(statusMember == 5) {
				return res.end('Image URL sent back a 5xx error. (Internal Errors)', callback);
			}
			else {
				return res.end('Image URL sent back a unexpected HTTP status.', callback);
			}
			break;
		}

		case 'bad-content-type': {
			res.setHeader('Content-Type', 'text/plain');
			res.writeHead(403);
			return res.end(`Image URL sent back an untrsuted content type "${scrapedImage.contentType}".`, callback);
			break;
		}

		case 'okay': {
			res.setHeader('X-Cache', scrapedImage.cache || 'MISS');
			res.setHeader('Content-Type', scrapedImage.contentType);
			res.setHeader('Cache-Control', 'max-age=31556926');
			res.writeHead(200, 'Okie Dokie');
			res.write(scrapedImage.body);
			return res.end(callback);
			break;
		}

		default: {
			res.setHeader('Content-Type', 'text/plain');
			res.writeHead(400);
			return res.end(`The ImageScraper returned unprogramed response ${scrapedImage.message}`, callback);
			break;
		}
	}
};
